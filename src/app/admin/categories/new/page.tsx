'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface CommonService {
  name: string;
  typicalPrice: string;
  duration: string;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    priceRangeMin: '',
    priceRangeMax: '',
    priceRangeUnit: '',
    requiredSkills: '',
    commonServices: [] as CommonService[],
  });

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

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        priceRange:
          formData.priceRangeMin || formData.priceRangeMax
            ? {
                min: formData.priceRangeMin ? parseFloat(formData.priceRangeMin) : undefined,
                max: formData.priceRangeMax ? parseFloat(formData.priceRangeMax) : undefined,
                unit: formData.priceRangeUnit || undefined,
              }
            : undefined,
        requiredSkills: formData.requiredSkills
          ? formData.requiredSkills
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean)
          : [],
        commonServices: formData.commonServices
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name.trim(),
            typicalPrice: parseFloat(s.typicalPrice) || 0,
            duration: s.duration || 'N/A',
          })),
      };

      await adminApi.createCategory(payload);
      toast.success('Category created successfully');
      router.push('/admin/categories');
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error?.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create New Category
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Add a new service category to your platform
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Plumbing"
                required
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g., plumbing"
                required
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly version of the name (auto-generated)
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this category..."
                rows={3}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>

            {/* Icon */}
            <div>
              <Label htmlFor="icon">Icon (Optional)</Label>
              <Input
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="e.g., wrench, droplet, etc."
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Icon name from your icon library
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Price Range</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priceRangeMin">Minimum Price</Label>
              <Input
                id="priceRangeMin"
                name="priceRangeMin"
                type="number"
                value={formData.priceRangeMin}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>

            <div>
              <Label htmlFor="priceRangeMax">Maximum Price</Label>
              <Input
                id="priceRangeMax"
                name="priceRangeMax"
                type="number"
                value={formData.priceRangeMax}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>

            <div>
              <Label htmlFor="priceRangeUnit">Unit</Label>
              <Input
                id="priceRangeUnit"
                name="priceRangeUnit"
                value={formData.priceRangeUnit}
                onChange={handleChange}
                placeholder="e.g., per visit"
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h2>

          <div>
            <Label htmlFor="requiredSkills">Skills (comma-separated)</Label>
            <Textarea
              id="requiredSkills"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              placeholder="e.g., pipe fitting, leak detection, water heater repair"
              rows={2}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter skills separated by commas
            </p>
          </div>
        </div>

        {/* Common Services */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Common Services</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCommonService}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Service
            </Button>
          </div>

          {formData.commonServices.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No common services added yet. Click "Add Service" to add one.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.commonServices.map((service, index) => (
                <div key={index} className="border border-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900">
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
                      <Label>Service Name</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => updateCommonService(index, 'name', e.target.value)}
                        placeholder="e.g., Faucet Repair"
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>

                    <div>
                      <Label>Typical Price (₹)</Label>
                      <Input
                        type="number"
                        value={service.typicalPrice}
                        onChange={(e) => updateCommonService(index, 'typicalPrice', e.target.value)}
                        placeholder="500"
                        min="0"
                        step="0.01"
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>

                    <div>
                      <Label>Duration</Label>
                      <Input
                        value={service.duration}
                        onChange={(e) => updateCommonService(index, 'duration', e.target.value)}
                        placeholder="e.g., 1-2 hours"
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/categories">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Category'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
