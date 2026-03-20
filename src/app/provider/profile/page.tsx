'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { providerApi } from '@/lib/api';
import { ProviderProfile, Certification, ServiceArea } from '@/types';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  DollarSign,
  Clock,
  Edit2,
  Check,
  X,
  Camera,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Shield,
  XCircle,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProviderProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ProviderProfile>>({});

  // Temporary states for dynamic fields
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState<Certification>({
    name: '',
    issuer: '',
    year: '',
  });
  const [newServiceArea, setNewServiceArea] = useState<ServiceArea>({
    city: '',
    areas: [],
  });
  const [newArea, setNewArea] = useState('');

  // Deactivation dialog state
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [requestingReactivation, setRequestingReactivation] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await providerApi.getProfile();
      const apiData = (response as any).data || response;

      // Map backend field names to frontend types
      const mappedData: ProviderProfile = {
        id: apiData.id,
        userId: apiData.id,
        name: apiData.name,
        email: apiData.email,
        phone: apiData.phone,
        bio: apiData.bio,
        profilePicture: apiData.profilePicture,
        skills: apiData.skills || [],
        certifications: apiData.certifications || [],
        pricingType: (apiData.rateUnit && apiData.rateUnit !== 'per-job' ? apiData.rateUnit : (apiData.pricingType === 'per-job' ? 'per-visit' : (apiData.pricingType || 'per-visit'))),
        baseRate: parseFloat(apiData.baseRate) || 0,
        experience: apiData.experienceYears || 0,
        availability: [],
        // Handle both old flat format and new nested format
        serviceAreas: apiData.serviceArea
          ? Array.isArray(apiData.serviceArea)
            ? apiData.serviceArea // New nested format: [{city, areas}]
            : apiData.serviceArea.cities?.map((city: string) => ({
                city,
                areas: apiData.serviceArea.areas || []
              })) // Old flat format
          : [],
        isAvailable: apiData.availabilityStatus === 'available',
        rating: parseFloat(apiData.averageRating) || 0,
        reviewCount: apiData.totalReviews || 0,
        completedJobs: apiData.totalJobsCompleted || 0,
        totalEarnings: apiData.totalEarnings,
        isActive: apiData.isActive ?? true,
        isSuspended: apiData.isSuspended,
        createdAt: apiData.createdAt,
        updatedAt: apiData.updatedAt,
      };

      setProfile(mappedData);
      setFormData(mappedData);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData(profile || {});
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData(profile || {});
    setNewSkill('');
    setNewCertification({ name: '', issuer: '', year: '' });
    setNewServiceArea({ city: '', areas: [] });
    setNewArea('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Map frontend types back to backend field names
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        experienceYears: formData.experience,
        skills: formData.skills,
        certifications: formData.certifications?.map(cert => ({
          name: cert.name,
          issuedBy: cert.issuer,
          year: cert.year,
          certificateUrl: cert.url || ''
        })),
        pricingType: formData.pricingType === 'per-visit' ? 'per-job' : formData.pricingType,
        baseRate: formData.baseRate || 0,
        rateUnit: formData.pricingType || 'per-visit',
        // Send service area in new nested format
        ...(formData.serviceAreas && formData.serviceAreas.length > 0 ? {
          serviceArea: formData.serviceAreas
        } : {})
      };

      await providerApi.updateProfile(updateData as any);

      // Reload from server to get fresh data with correct structure
      await loadProfile();
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await providerApi.deactivateAccount();
      toast.success('Account deactivated successfully');
      setDeactivateDialogOpen(false);
      // Logout and redirect to home
      await logout();
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error deactivating account:', error);
      toast.error(error?.response?.data?.message || 'Failed to deactivate account');
    }
  };

  const handleRequestReactivation = async () => {
    try {
      setRequestingReactivation(true);
      await providerApi.requestReactivation(profile?.email);
      toast.success('Reactivation link sent to your email. Please check your inbox.');
    } catch (error: any) {
      console.error('Error requesting reactivation:', error);
      toast.error(error?.response?.data?.message || 'Failed to request reactivation');
    } finally {
      setRequestingReactivation(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills?.filter((s) => s !== skill) || [],
    });
  };

  const addCertification = () => {
    if (newCertification.name && newCertification.issuer && newCertification.year) {
      setFormData({
        ...formData,
        certifications: [
          ...(formData.certifications || []),
          { ...newCertification, id: Date.now().toString() },
        ],
      });
      setNewCertification({ name: '', issuer: '', year: '' });
    }
  };

  const removeCertification = (id: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications?.filter((c) => c.id !== id) || [],
    });
  };

  const addServiceArea = () => {
    if (newServiceArea.city.trim()) {
      setFormData({
        ...formData,
        serviceAreas: [
          ...(formData.serviceAreas || []),
          {
            city: newServiceArea.city.trim(),
            areas: newServiceArea.areas?.filter((a) => a.trim()) || [],
          },
        ],
      });
      setNewServiceArea({ city: '', areas: [] });
    }
  };

  const removeServiceArea = (city: string) => {
    setFormData({
      ...formData,
      serviceAreas: formData.serviceAreas?.filter((sa) => sa.city !== city) || [],
    });
  };

  const addAreaToCity = () => {
    if (newArea.trim() && newServiceArea.city.trim()) {
      setNewServiceArea({
        ...newServiceArea,
        areas: [...(newServiceArea.areas || []), newArea.trim()],
      });
      setNewArea('');
    }
  };

  const removeAreaFromCity = (area: string) => {
    setNewServiceArea({
      ...newServiceArea,
      areas: newServiceArea.areas?.filter((a) => a !== area) || [],
    });
  };

  // Skeleton loading state - check this FIRST before !profile
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Profile Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
          <div className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 h-32" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
              <Skeleton className="w-32 h-32 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-5 w-full max-w-md" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                  <Skeleton className="h-6 w-6 mx-auto mb-2" />
                  <Skeleton className="h-7 w-12 mx-auto mb-1" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-24 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Certifications Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Areas Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Profile Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
          <div className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 h-32" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
              <Skeleton className="w-32 h-32 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-5 w-full max-w-md" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                  <Skeleton className="h-6 w-6 mx-auto mb-2" />
                  <Skeleton className="h-7 w-12 mx-auto mb-1" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-24 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Certifications Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-36 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Areas Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <Skeleton className="h-7 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600">Manage your professional information</p>
        </div>
        {!editing && (
          <Button
            onClick={handleEdit}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {editing ? (
        <>
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email || ''}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience || 0}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                  className="mt-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                  rows={3}
                  placeholder="Tell customers about your experience and expertise..."
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Skills</h2>
            <div className="flex gap-2 mb-4">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill (e.g., Plumbing, Electrical)"
                className="flex-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
              />
              <Button onClick={addSkill} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-emerald-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Certifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
              <Input
                value={newCertification.name}
                onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                placeholder="Certification name"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
              />
              <Input
                value={newCertification.issuer}
                onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                placeholder="Issuing organization"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
              />
              <Input
                value={newCertification.year}
                onChange={(e) => setNewCertification({ ...newCertification, year: e.target.value })}
                placeholder="Year"
                type="number"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
              />
              <Button onClick={addCertification} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.certifications?.map((cert, index) => (
                <div
                  key={cert.id || `cert-edit-${index}-${cert.name}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{cert.name}</p>
                    <p className="text-sm text-gray-600">{cert.issuer} - {cert.year}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCertification(cert.id!)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricingType">Pricing Type</Label>
                <Select
                  value={formData.pricingType}
                  onValueChange={(value: 'per-visit' | 'per-hour') =>
                    setFormData({ ...formData, pricingType: value })
                  }
                >
                  <SelectTrigger
                    className="mt-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                    style={{ backgroundColor: 'white' }}
                  >
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-emerald-200 shadow-lg">
                    <SelectItem value="per-visit" className="hover:bg-emerald-50 focus:bg-emerald-100">Per Visit</SelectItem>
                    <SelectItem value="per-hour" className="hover:bg-emerald-50 focus:bg-emerald-100">Per Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="baseRate">Base Rate ($)</Label>
                <Input
                  id="baseRate"
                  value={formData.baseRate || 0}
                  onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                  className="mt-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                  placeholder="Enter your base rate"
                />
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Service Areas</h2>
            <div className="space-y-4 mb-4">
              <div className="flex gap-2">
                <Input
                  value={newServiceArea.city}
                  onChange={(e) => setNewServiceArea({ ...newServiceArea, city: e.target.value })}
                  placeholder="City name"
                  className="flex-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                />
                <Button onClick={addServiceArea} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add City
                </Button>
              </div>
              {newServiceArea.city && (
                <div className="pl-4 border-l-2 border-emerald-200">
                  <p className="text-sm text-gray-600 mb-2">Areas in {newServiceArea.city}:</p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAreaToCity()}
                      placeholder="Add area within city"
                      className="flex-1 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 rounded-xl"
                    />
                    <Button onClick={addAreaToCity} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newServiceArea.areas?.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {area}
                        <button
                          onClick={() => removeAreaFromCity(area)}
                          className="hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {formData.serviceAreas?.map((serviceArea) => (
                <div
                  key={serviceArea.city}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{serviceArea.city}</p>
                    {serviceArea.areas && serviceArea.areas.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Areas: {serviceArea.areas.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeServiceArea(serviceArea.city)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Deactivated Account Banner */}
          {!profile?.isActive && (
            <div className="bg-linear-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-200 rounded-xl">
                    <AlertCircle  className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 mb-1">Account Deactivated</h3>
                    <p className="text-sm text-amber-800 mb-2">
                      Your account is currently deactivated. You can reactivate it to restore full access.
                    </p>
                    <p className="text-xs text-amber-700">
                      Reactivate your account to continue receiving service requests and managing your profile.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRequestReactivation}
                  disabled={requestingReactivation}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {requestingReactivation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Reactivate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Profile Display */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
            {/* Header with background */}
            <div className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 h-32" />
            <div className="px-6 pb-6">
              {/* Profile picture and basic info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
                <div className="w-32 h-32 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile?.name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, replace with initial
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-bold ${
                      profile.profilePicture ? 'hidden' : ''
                    }`}
                  >
                    {profile?.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-800">{profile?.name || 'Provider'}</h2>
                  <p className="text-gray-600">{profile?.bio || 'No bio added yet'}</p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="flex items-center justify-center sm:justify-end gap-1 text-emerald-600 font-semibold">
                    <Award className="h-5 w-5" />
                    <span>{(profile.rating || 0).toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{profile.reviewCount || 0} reviews</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <Briefcase className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{profile.completedJobs || 0}</p>
                  <p className="text-sm text-gray-600">Completed Jobs</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">${profile.baseRate || 0}</p>
                  <p className="text-sm text-gray-600">{profile.pricingType === 'per-hour' ? 'Per Hour' : 'Per Visit'}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{profile.experience || 0}</p>
                  <p className="text-sm text-gray-600">Years Experience</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <User className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{profile.isAvailable ? 'Active' : 'Inactive'}</p>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Mail className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-800">{profile.email}</p>
                </div>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Phone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-800">{profile.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile.certifications && profile.certifications.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Certifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.certifications.map((cert, index) => (
                  <div key={cert.id || `cert-${index}-${cert.name}`} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{cert.name}</p>
                        <p className="text-sm text-gray-600">{cert.issuer}</p>
                        <p className="text-sm text-gray-500">{cert.year}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Areas */}
          {profile.serviceAreas && profile.serviceAreas.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Service Areas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.serviceAreas.map((area) => (
                  <div key={area.city} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{area.city}</p>
                        {area.areas && area.areas.length > 0 && (
                          <p className="text-sm text-gray-600">Areas: {area.areas.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
            <div className="bg-linear-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
              <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Danger Zone
              </h3>
            </div>

            <div className="p-4">
              <div className="p-4 bg-linear-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-200 rounded-lg">
                    <Shield className="h-4 w-4 text-red-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">Deactivate Account</p>
                    <p className="text-xs text-gray-600">Permanently delete all data</p>
                  </div>
                </div>
                <Button
                  onClick={() => setDeactivateDialogOpen(true)}
                  className="w-full bg-white text-red-600 hover:bg-red-50 hover:border-red-300 border-red-200 font-semibold text-sm"
                >
                  Deactivate Account
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl w-[95vw] sm:w-auto p-0 overflow-hidden bg-white max-h-[90vh] overflow-y-auto">
        {/* Header with Muted Warning Gradient */}
        <div className="bg-linear-to-r from-stone-700 via-stone-600 to-stone-800 px-4 sm:px-6 py-3 sm:py-4 text-white">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
              Deactivate Account
            </DialogTitle>
            <DialogDescription className="text-stone-300 text-sm sm:text-base">
              This action is permanent and cannot be undone
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
          {/* Warning Alert */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-stone-200 rounded-lg sm:rounded-xl shrink-0">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-stone-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-bold text-stone-900 mb-2 sm:mb-3">
                  Important Notice
                </p>
                <p className="text-xs sm:text-sm text-stone-700 mb-3 sm:mb-4">
                  Once deactivated, your account and all data will be permanently deleted after a 30-day grace period.
                </p>

                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-stone-200 w-full shadow">
                  <p className="text-sm sm:text-base font-bold text-stone-800 mb-2 sm:mb-3">This action will:</p>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-stone-500 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-800 flex-1">Delete your account and all personal information</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-stone-500 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-800 flex-1">Remove all service history and completed jobs</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-stone-500 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-800 flex-1">Cancel any pending service requests</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-stone-500 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-800 flex-1">Delete all your reviews and ratings</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-800 flex-1">30-day grace period before permanent deletion</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info Summary */}
          {profile && (
            <div className="bg-stone-50 rounded-xl p-3 sm:p-4 border border-stone-200">
              <p className="text-xs text-stone-600 mb-2 font-semibold">Account to be deactivated:</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
                  {profile.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{profile?.name || 'Provider'}</p>
                  <p className="text-xs text-gray-600 truncate">{profile?.email || ''}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-50 px-4 sm:px-6 py-3 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(false)}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base font-semibold border-2 border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              <X className="mr-2 h-4 w-4" />
              Keep Account
            </Button>
            <Button
              onClick={handleDeactivate}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base font-semibold bg-linear-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Shield className="mr-2 h-4 w-4" />
              Deactivate Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
