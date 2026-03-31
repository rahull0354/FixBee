'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { ArrowLeft, Plus, X, Loader2, FolderKanban, DollarSign, Wrench, Zap, FileText, Percent, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { Category, UpdateCategoryData } from '@/types';

interface CommonService {
  name: string;
  typicalPrice: string;
  duration: string;
}

export default function UpdateCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    priceRangeMin: '',
    priceRangeMax: '',
    priceRangeUnit: '',
    commissionType: '',
    commissionValue: '',
    hybridFixed: '',
    hybridPercentage: '',
    hybridMinCommission: '',
    hybridMaxCommission: '',
    requiredSkills: [] as string[],
    commonServices: [] as CommonService[],
  });

  const [newSkill, setNewSkill] = useState('');

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getCategory(categoryId);
        setCategory(data);

        // Populate form with existing data
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          icon: data.icon || '',
          priceRangeMin: data.priceRange?.min?.toString() || '',
          priceRangeMax: data.priceRange?.max?.toString() || '',
          priceRangeUnit: data.priceRange?.unit || '',
          commissionType: data.adminCommission?.type === 'hybrid' ? 'tiered' : data.adminCommission?.type || '',
          commissionValue: data.adminCommission?.fixed?.toString() || data.adminCommission?.percentage?.toString() || '',
          hybridFixed: data.adminCommission?.fixed?.toString() || '',
          hybridPercentage: data.adminCommission?.percentage?.toString() || '',
          hybridMinCommission: data.adminCommission?.minCommission?.toString() || '',
          hybridMaxCommission: data.adminCommission?.maxCommission?.toString() || '',
          requiredSkills: data.requiredSkills || [],
          commonServices: (data.commonServices || []).map((service: any) => ({
            name: typeof service === 'string' ? service : service.name || '',
            typicalPrice: typeof service === 'string' ? '' : service.typicalPrice || '',
            duration: typeof service === 'string' ? '' : service.duration || '',
          })),
        });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load category');
        router.push('/admin/categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Skill handlers
  const addSkill = () => {
    if (newSkill.trim() && !formData.requiredSkills?.includes(newSkill.trim())) {
      setFormData({ ...formData, requiredSkills: [...(formData.requiredSkills || []), newSkill.trim().toLowerCase()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, requiredSkills: formData.requiredSkills?.filter((s) => s !== skill) || [] });
  };

  const addCommonService = () => {
    setFormData((prev) => ({
      ...prev,
      commonServices: [
        ...prev.commonServices,
        { name: '', typicalPrice: '', duration: '' },
      ],
    }));
  };

  const updateCommonService = (index: number, field: keyof CommonService, value: string) => {
    setFormData((prev) => ({
      ...prev,
      commonServices: prev.commonServices.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      ),
    }));
  };

  const removeCommonService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      commonServices: prev.commonServices.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    if (formData.commissionType === 'fixed' && !formData.commissionValue) {
      toast.error('Please enter the fixed commission amount');
      return;
    }

    if (formData.commissionType === 'percentage' && !formData.commissionValue) {
      toast.error('Please enter the commission percentage');
      return;
    }

    if (formData.commissionType === 'tiered' && (!formData.hybridFixed || !formData.hybridPercentage)) {
      toast.error('Please enter both fixed amount and percentage for hybrid commission');
      return;
    }

    try {
      setSubmitting(true);

      const payload: UpdateCategoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        priceRange:
          formData.priceRangeMin && formData.priceRangeMax && formData.priceRangeUnit
            ? {
                min: parseFloat(formData.priceRangeMin),
                max: parseFloat(formData.priceRangeMax),
                unit: formData.priceRangeUnit,
              }
            : undefined,
        adminCommission: formData.commissionType ? {
          type: (formData.commissionType === 'tiered' ? 'hybrid' : formData.commissionType) as 'fixed' | 'percentage' | 'hybrid',
          ...(formData.commissionType === 'fixed' && {
            fixed: formData.commissionValue ? parseFloat(formData.commissionValue) : undefined,
          }),
          ...(formData.commissionType === 'percentage' && {
            percentage: formData.commissionValue ? parseFloat(formData.commissionValue) : undefined,
          }),
          ...(formData.commissionType === 'tiered' && {
            fixed: formData.hybridFixed ? parseFloat(formData.hybridFixed) : undefined,
            percentage: formData.hybridPercentage ? parseFloat(formData.hybridPercentage) : undefined,
            minCommission: formData.hybridMinCommission ? parseFloat(formData.hybridMinCommission) : undefined,
            maxCommission: formData.hybridMaxCommission ? parseFloat(formData.hybridMaxCommission) : undefined,
          }),
        } : undefined,
        requiredSkills: formData.requiredSkills || [],
        commonServices: formData.commonServices
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name.trim(),
            typicalPrice: s.typicalPrice || undefined,
            duration: s.duration || undefined,
          })),
      };

      await adminApi.updateCategory(categoryId, payload);
      toast.success('Category updated successfully');
      router.push('/admin/categories');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await adminApi.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      router.push('/admin/categories');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>

        {/* Form Skeletons */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-blue-100">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Category not found
  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <FolderKanban className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
        <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
        <Link href="/admin/categories">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Back to Categories
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Update Category
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Edit category details and settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge isActive={category.isActive} />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-linear-to-r from-blue-50 to-blue-50 px-6 py-4 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-4">
            {/* Name and Icon on same line */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-gray-700 font-medium">Category Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Plumbing"
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-12"
                />
              </div>

              {/* Icon */}
              <div className="space-y-1.5">
                <Label htmlFor="icon" className="text-gray-700 font-medium">Icon (Optional)</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(value) => handleSelectChange('icon', value)}
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-gray-700 font-medium">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g., plumbing"
                required
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 font-mono h-12"
              />
              <p className="text-xs text-gray-500">
                URL-friendly version of the name (auto-generated)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this category..."
                rows={3}
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-linear-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Price Range</h2>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priceRangeMin" className="text-gray-700 font-medium">Minimum Price</Label>
                <Input
                  id="priceRangeMin"
                  name="priceRangeMin"
                  type="number"
                  value={formData.priceRangeMin}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                />
              </div>

              <div>
                <Label htmlFor="priceRangeMax" className="text-gray-700 font-medium">Maximum Price</Label>
                <Input
                  id="priceRangeMax"
                  name="priceRangeMax"
                  type="number"
                  value={formData.priceRangeMax}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                />
              </div>

              <div>
                <Label htmlFor="priceRangeUnit" className="text-gray-700 font-medium">Unit</Label>
                <Input
                  id="priceRangeUnit"
                  name="priceRangeUnit"
                  value={formData.priceRangeUnit}
                  onChange={handleChange}
                  placeholder="e.g., per visit"
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Commission Type */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-linear-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Percent className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Commission Type</h2>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="commissionType" className="text-gray-700 font-medium">Commission Calculation Type</Label>
              <Select
                value={formData.commissionType}
                onValueChange={(value) => handleSelectChange('commissionType', value)}
              >
                <SelectTrigger className="w-full border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:border-blue-400 focus:ring-blue-400 h-12 mt-1.5">
                  <SelectValue placeholder="Select commission type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-blue-200 shadow-lg">
                  <SelectItem value="percentage" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Percentage Based</SelectItem>
                  <SelectItem value="fixed" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Fixed Amount</SelectItem>
                  <SelectItem value="tiered" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Tiered Commission</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1.5">
                Choose how admin commission is calculated for this category
              </p>
            </div>

            {/* Conditional Commission Value Fields */}
            {formData.commissionType === 'percentage' && (
              <div>
                <Label htmlFor="commissionValue" className="text-gray-700 font-medium">
                  Commission Percentage *
                </Label>
                <Input
                  id="commissionValue"
                  name="commissionValue"
                  type="number"
                  value={formData.commissionValue}
                  onChange={handleChange}
                  placeholder="e.g., 20"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter the percentage commission (e.g., 20 for 20%)
                </p>
              </div>
            )}

            {formData.commissionType === 'fixed' && (
              <div>
                <Label htmlFor="commissionValue" className="text-gray-700 font-medium">
                  Fixed Commission Amount (₹) *
                </Label>
                <Input
                  id="commissionValue"
                  name="commissionValue"
                  type="number"
                  value={formData.commissionValue}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                  min="0"
                  step="0.01"
                  required
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter the fixed commission amount in rupees
                </p>
              </div>
            )}

            {formData.commissionType === 'tiered' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <span className="font-semibold text-blue-900">Hybrid Commission:</span> Combines a fixed amount with a percentage of the provider rate.
                  Formula: <span className="font-mono text-blue-700">Fixed Amount + (Provider Rate × Percentage %)</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hybridFixed" className="text-gray-700 font-medium">
                      Fixed Amount (₹) *
                    </Label>
                    <Input
                      id="hybridFixed"
                      name="hybridFixed"
                      type="number"
                      value={formData.hybridFixed}
                      onChange={handleChange}
                      placeholder="e.g., 100"
                      min="0"
                      step="0.01"
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Base fixed commission amount
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="hybridPercentage" className="text-gray-700 font-medium">
                      Additional Percentage (%) *
                    </Label>
                    <Input
                      id="hybridPercentage"
                      name="hybridPercentage"
                      type="number"
                      value={formData.hybridPercentage}
                      onChange={handleChange}
                      placeholder="e.g., 10"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Percentage of provider rate to add
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hybridMinCommission" className="text-gray-700 font-medium">
                      Min Commission (₹)
                    </Label>
                    <Input
                      id="hybridMinCommission"
                      name="hybridMinCommission"
                      type="number"
                      value={formData.hybridMinCommission}
                      onChange={handleChange}
                      placeholder="e.g., 50"
                      min="0"
                      step="0.01"
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Minimum commission to charge (optional)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="hybridMaxCommission" className="text-gray-700 font-medium">
                      Max Commission (₹)
                    </Label>
                    <Input
                      id="hybridMaxCommission"
                      name="hybridMaxCommission"
                      type="number"
                      value={formData.hybridMaxCommission}
                      onChange={handleChange}
                      placeholder="e.g., 500"
                      min="0"
                      step="0.01"
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Maximum commission to charge (optional)
                    </p>
                  </div>
                </div>

                {/* Example Calculation */}
                {(formData.hybridFixed || formData.hybridPercentage) && (
                  <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-emerald-900 mb-2">Example Calculation</p>
                    <p className="text-xs text-emerald-700">
                      If provider rate is <span className="font-semibold">₹1,000</span>:
                    </p>
                    <p className="text-xs text-emerald-800 mt-1 font-mono">
                      Commission = ₹{formData.hybridFixed || '0'} + (₹1,000 × {formData.hybridPercentage || '0'}%) = ₹{(parseFloat(formData.hybridFixed || '0') + (1000 * parseFloat(formData.hybridPercentage || '0') / 100)).toFixed(2)}
                    </p>
                    {formData.hybridMinCommission && (
                      <p className="text-xs text-emerald-700 mt-1">
                        Min: ₹{formData.hybridMinCommission} {parseFloat(formData.hybridMinCommission) > (parseFloat(formData.hybridFixed || '0') + (1000 * parseFloat(formData.hybridPercentage || '0') / 100)) && <span className="text-amber-600">(would be applied)</span>}
                      </p>
                    )}
                    {formData.hybridMaxCommission && (
                      <p className="text-xs text-emerald-700 mt-1">
                        Max: ₹{formData.hybridMaxCommission} {parseFloat(formData.hybridMaxCommission) < (parseFloat(formData.hybridFixed || '0') + (1000 * parseFloat(formData.hybridPercentage || '0') / 100)) && <span className="text-amber-600">(would be applied)</span>}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Required Skills */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-linear-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-violet-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-linear-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Required Skills</h2>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div>
              <Label className="text-gray-700 font-medium mb-2 block">
                Skills Required for this Category
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Add skills that providers should have to offer services in this category
              </p>

              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Enter a skill (e.g., Plumbing)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="flex-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 h-12"
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 h-12"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.requiredSkills?.map((skill) => (
                  <div
                    key={skill}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-full text-violet-700 font-medium"
                  >
                    <span className="capitalize">{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-violet-500 hover:text-violet-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">{formData.requiredSkills?.length || 0} skills added</p>
            </div>
          </div>
        </div>

        {/* Common Services */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-linear-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Common Services</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCommonService}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {formData.commonServices.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-amber-500" />
                </div>
                <p className="text-sm text-gray-500">
                  No common services added yet. Click "Add Service" to add one.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.commonServices.map((service, index) => (
                  <div key={index} className="border border-blue-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1 rounded-full">
                        Service #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCommonService(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-gray-700 font-medium">Service Name</Label>
                        <Input
                          value={service.name}
                          onChange={(e) => updateCommonService(index, 'name', e.target.value)}
                          placeholder="e.g., Faucet Repair"
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-700 font-medium">Typical Price (₹)</Label>
                        <Input
                          type="number"
                          value={service.typicalPrice}
                          onChange={(e) => updateCommonService(index, 'typicalPrice', e.target.value)}
                          placeholder="500"
                          min="0"
                          step="0.01"
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-700 font-medium">Duration</Label>
                        <Input
                          value={service.duration}
                          onChange={(e) => updateCommonService(index, 'duration', e.target.value)}
                          placeholder="e.g., 1-2 hours"
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 mt-1.5 h-12"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={submitting || deleting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Category
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Delete Category
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-700">
                  Are you sure you want to delete <span className="font-semibold">"{category.name}"</span>? This action cannot be undone.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This will permanently delete the category and all associated data.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Category'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-4">
            <Link href="/admin/categories">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-200"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Category'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Badge Component
function Badge({ isActive }: { isActive: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
      isActive
        ? 'bg-green-100 text-green-700 border border-green-200'
        : 'bg-gray-100 text-gray-700 border border-gray-200'
    }`}>
      <div className={`h-2.5 w-2.5 rounded-full ${
        isActive ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      {isActive ? 'Active' : 'Inactive'}
    </div>
  );
}

// Icon Picker Component
interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Common icon names for service categories
  const commonIcons = [
    'Wrench', 'Hammer', 'Drill', 'Screwdriver', 'PaintBucket', 'Brush',
    'Droplet', 'Water', 'Wind', 'Zap', 'Lightbulb', 'Lamp',
    'Flame', 'Snowflake', 'Fan', 'AirVent', 'Thermometer', 'Gauge',
    'Home', 'Building', 'Building2', 'Warehouse', 'Store', 'Shop',
    'DoorOpen', 'Window', 'Frame', 'Layers', 'Blocks', 'BrickWall',
    'Tree', 'Flower', 'Flower2', 'Leaf', 'Trees', 'Sprout',
    'Car', 'Truck', 'Cog', 'Cogs', 'Settings',
    'Phone', 'Mail', 'Message', 'Send', 'Wifi', 'Signal',
    'Tv', 'Radio', 'Monitor', 'Laptop', 'Smartphone', 'Tablet',
    'Camera', 'Video', 'Mic', 'Speaker', 'Headphones', 'Bell',
    'Book', 'FileText', 'Files', 'Folder', 'FolderOpen', 'FolderKanban',
    'Calendar', 'Clock', 'Timer', 'AlarmClock', 'Watch', 'Hourglass',
    'MapPin', 'Navigation', 'Compass', 'Globe', 'Earth', 'Map',
    'Star', 'Heart', 'Diamond', 'Sparkles', 'Sun', 'Moon',
    'Umbrella', 'Cloud', 'CloudRain',
    'Pizza', 'Coffee', 'Cookie', 'Cake', 'Cherry', 'Apple',
    'Dumbbell', 'Bicycle', 'Football', 'Basketball', 'Tennis', 'Golf',
    'Stethoscope', 'Pill', 'Syringe', 'Activity', 'Scales',
    'Shield', 'Lock', 'Key', 'Fingerprint', 'Eye', 'EyeOff',
    'Trash2', 'Recycle', 'Clean', 'Wand', 'Magic',
    'Package', 'Box', 'ShoppingCart', 'ShoppingBag', 'Tag', 'Labels',
  ];

  const filteredIcons = search
    ? commonIcons.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
      )
    : commonIcons;

  const SelectedIcon = value ? (LucideIcons as any)[value] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow h-12 px-3 py-2"
        >
          {SelectedIcon ? (
            <div className="flex items-center gap-2 truncate">
              <SelectedIcon className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="text-sm truncate">{value}</span>
            </div>
          ) : (
            <span className="text-gray-500">Select an icon...</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Select an Icon
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
          <Input
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto mt-4">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = (LucideIcons as any)[iconName];
              if (!IconComponent) return null;

              const isSelected = value === iconName;

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`
                    flex items-center justify-center p-3 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }
                  `}
                  title={iconName}
                >
                  <IconComponent className="h-5 w-5 text-blue-600" />
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No icons found matching "{search}"</p>
            </div>
          )}
        </div>

        {/* Selected Icon Display */}
        {value && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              {SelectedIcon && <SelectedIcon className="h-6 w-6 text-blue-600" />}
              <div>
                <p className="text-sm font-medium text-gray-900">Selected Icon</p>
                <p className="text-xs text-gray-600">{value}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
