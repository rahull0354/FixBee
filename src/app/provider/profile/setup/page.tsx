'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/components/auth/AuthProvider';
import { providerApi } from '@/lib/api';
import { Certification, ServiceArea } from '@/types';
import {
  User,
  Briefcase,
  Award,
  IndianRupee,
  Clock,
  MapPin,
  Camera,
  Plus,
  Trash2,
  Loader2,
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Validation schemas for each step
const basicInfoSchema = z.object({
  bio: z.string().min(20, 'Bio must be at least 20 characters').optional(),
  experience: z.number().min(0, 'Experience must be 0 or more').max(50, 'Experience cannot exceed 50 years').optional(),
});

const skillsSchema = z.object({
  skills: z.array(z.string()).min(3, 'Add at least 3 skills').optional(),
});

const certificationsSchema = z.object({
  certifications: z.array(z.object({
    name: z.string().min(1, 'Certification name is required'),
    issuer: z.string().min(1, 'Issuer is required'),
    year: z.string().min(4, 'Valid year required').max(4, 'Valid year required'),
    url: z.string().optional(),
  })).optional(),
});

const pricingSchema = z.object({
  pricingType: z.enum(['per-visit', 'per-hour']).optional(),
  baseRate: z.number().min(1, 'Base rate must be at least 1').optional(),
});

const availabilitySchema = z.object({
  workingHours: z.object({
    start: z.string().min(1, 'Start time is required'),
    end: z.string().min(1, 'End time is required'),
  }).optional(),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day').optional(),
});

const serviceAreaSchema = z.object({
  serviceAreas: z.array(z.object({
    city: z.string().min(1, 'City is required'),
    areas: z.array(z.string()).min(1, 'Add at least one area'),
  })).min(1, 'Add at least one service area').optional(),
});

type SetupFormData = z.infer<typeof basicInfoSchema> & {
  skills: string[];
  certifications?: Certification[];
  pricingType: 'per-visit' | 'per-hour';
  baseRate: number;
  workingHours: { start: string; end: string };
  workingDays: string[];
  serviceAreas: ServiceArea[];
};

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Skills', icon: Briefcase },
  { id: 3, title: 'Certifications', icon: Award },
  { id: 4, title: 'Pricing', icon: IndianRupee },
  { id: 5, title: 'Availability', icon: Clock },
  { id: 6, title: 'Service Area', icon: MapPin },
];

export default function ProviderProfileSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<SetupFormData>>({
    bio: '',
    experience: 0,
    skills: [],
    certifications: [],
    pricingType: 'per-visit',
    baseRate: 0,
    workingHours: { start: '09:00', end: '17:00' },
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    serviceAreas: [],
  });

  // Temporary states
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

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      setLoading(true);
      const response = await providerApi.getProfile();
      const apiData = (response as any).data || response;

      // Check if profile is already complete
      if (apiData.bio && apiData.skills?.length > 0 && apiData.baseRate > 0) {
        toast.info('Your profile is already set up!');
        router.push('/provider/dashboard');
      }
    } catch (error: any) {
      // 501 means profile doesn't exist yet, which is expected for new providers
      if (error?.response?.status === 501) {
        console.log('Profile not created yet, proceeding with setup');
      } else {
        console.error('Error checking profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        // Validate bio and experience
        if (!formData.bio || formData.bio.length < 20) {
          toast.error('Bio must be at least 20 characters');
          return false;
        }
        if (formData.experience === undefined || formData.experience === null || formData.experience < 0) {
          toast.error('Please enter valid years of experience');
          return false;
        }
        if (formData.experience > 50) {
          toast.error('Experience cannot exceed 50 years');
          return false;
        }
        return true;
      case 2:
        // Validate skills
        if (!formData.skills || formData.skills.length < 3) {
          toast.error('Add at least 3 skills');
          return false;
        }
        return true;
      case 3:
        // Certifications are optional
        return true;
      case 4:
        // Validate pricing
        if (!formData.pricingType) {
          toast.error('Please select a pricing type');
          return false;
        }
        if (!formData.baseRate || formData.baseRate < 1) {
          toast.error('Base rate must be at least 1');
          return false;
        }
        return true;
      case 5:
        // Validate availability
        if (!formData.workingHours?.start || !formData.workingHours?.end) {
          toast.error('Please set your working hours');
          return false;
        }
        if (!formData.workingDays || formData.workingDays.length < 1) {
          toast.error('Select at least one working day');
          return false;
        }
        return true;
      case 6:
        // Validate service areas
        if (!formData.serviceAreas || formData.serviceAreas.length < 1) {
          toast.error('Add at least one service area');
          return false;
        }
        // Validate each service area has city and areas
        for (const area of formData.serviceAreas) {
          if (!area.city) {
            toast.error('All service areas must have a city');
            return false;
          }
          if (!area.areas || area.areas.length < 1) {
            toast.error(`Add at least one area in ${area.city}`);
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      setSubmitting(true);

      // Map frontend pricing type to backend pricing type
      // Frontend: per-visit, per-hour
      // Backend: hourly, fixed, per-job, per-visit, quote
      const pricingTypeMap = {
        'per-visit': 'per-visit',
        'per-hour': 'hourly'
      };

      // Map frontend field names to backend field names
      const updateData: any = {
        bio: formData.bio!,
        experienceYears: formData.experience!,
        skills: formData.skills!,
        certifications: (formData.certifications || []).map(cert => ({
          name: cert.name,
          issuedBy: cert.issuer,
          year: cert.year,
          certificateUrl: cert.url || ''
        })),
        pricingType: pricingTypeMap[formData.pricingType as keyof typeof pricingTypeMap],
        baseRate: formData.baseRate!,
        workingHours: formData.workingHours!,
        workingDays: formData.workingDays!,
        serviceArea: formData.serviceAreas!,
      };

      console.log('Submitting profile setup data:', updateData);

      await providerApi.updateProfile(updateData);

      toast.success('Profile setup complete! Welcome to FixBee! 🎉');
      router.push('/provider/dashboard');
    } catch (error: any) {
      console.error('Error setting up profile:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);

      const message = error?.response?.data?.message || error?.message || 'Failed to complete profile setup';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Skill handlers
  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...(formData.skills || []), newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills?.filter((s) => s !== skill) || [] });
  };

  // Certification handlers
  const addCertification = () => {
    if (newCertification.name && newCertification.issuer && newCertification.year) {
      setFormData({
        ...formData,
        certifications: [...(formData.certifications || []), { ...newCertification }],
      });
      setNewCertification({ name: '', issuer: '', year: '' });
    }
  };

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications?.filter((_, i) => i !== index),
    });
  };

  // Service area handlers
  const addServiceArea = () => {
    if (newServiceArea.city && newServiceArea.areas?.length) {
      setFormData({
        ...formData,
        serviceAreas: [...(formData.serviceAreas || []), { ...newServiceArea }],
      });
      setNewServiceArea({ city: '', areas: [] });
      setNewArea('');
    }
  };

  const addAreaToServiceArea = () => {
    if (newArea.trim() && !newServiceArea.areas?.includes(newArea.trim())) {
      setNewServiceArea({
        ...newServiceArea,
        areas: [...(newServiceArea.areas || []), newArea.trim()],
      });
      setNewArea('');
    }
  };

  const removeAreaFromServiceArea = (area: string) => {
    setNewServiceArea({
      ...newServiceArea,
      areas: newServiceArea.areas?.filter((a) => a !== area) || [],
    });
  };

  const removeServiceArea = (index: number) => {
    setFormData({
      ...formData,
      serviceAreas: formData.serviceAreas?.filter((_, i) => i !== index),
    });
  };

  // Skeleton loading
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-14 w-72" />
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-linear-to-r from-emerald-500 to-teal-500 rounded-2xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600">Let's set up your professional profile in just a few steps</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between overflow-x-auto pb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                        : isCurrent
                          ? 'bg-linear-to-r from-emerald-400 to-teal-400 text-white shadow-lg scale-110'
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs font-medium mt-2 hidden sm:block ${
                      isCurrent ? 'text-emerald-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-8 sm:w-16 h-1 bg-gray-200 mx-2 sm:mx-4 rounded hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
        {/* Step Header */}
        <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              {React.createElement(STEPS[currentStep - 1].icon, {
                className: 'h-8 w-8 text-white',
              })}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{STEPS[currentStep - 1].title}</h2>
              <p className="text-emerald-100 text-sm">
                Step {currentStep} of {STEPS.length}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="bio" className="text-lg font-semibold text-gray-900 mb-2 block">
                  Professional Bio
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Tell customers about your experience, expertise, and what makes you special
                </p>
                <Textarea
                  id="bio"
                  rows={6}
                  placeholder="Ex: Professional plumber with 10+ years of experience specializing in residential and commercial plumbing. I take pride in delivering quality workmanship and excellent customer service..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="text-base resize-none rounded-xl border-emerald-200 focus:border-emerald-400"
                />
                <p className="text-xs text-gray-500 mt-2">{formData.bio?.length || 0} / 20 minimum characters</p>
              </div>

              <div>
                <Label htmlFor="experience" className="text-lg font-semibold text-gray-900 mb-2 block">
                  Years of Experience
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="e.g., 5"
                  value={formData.experience || ''}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                  className="text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold text-gray-900 mb-2 block">
                  Your Skills
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Add at least 3 skills that best describe your expertise (e.g., "Plumbing", "Electrical", "HVAC")
                </p>

                <div className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Enter a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 rounded-xl"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.skills?.map((skill) => (
                    <div
                      key={skill}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full text-emerald-700 font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-emerald-500 hover:text-emerald-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">{formData.skills?.length || 0} skills added</p>
              </div>
            </div>
          )}

          {/* Step 3: Certifications */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold text-gray-900 mb-2 block">
                  Certifications (Optional)
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Add any professional certifications to build trust with customers
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <Input
                      type="text"
                      placeholder="Certification name (e.g., Certified Electrician)"
                      value={newCertification.name}
                      onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                      className="text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Issuing organization (e.g., National Electrical Contractors Association)"
                      value={newCertification.issuer}
                      onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                      className="text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Year (e.g., 2020)"
                      value={newCertification.year}
                      onChange={(e) => setNewCertification({ ...newCertification, year: e.target.value })}
                      className="text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addCertification}
                    disabled={!newCertification.name || !newCertification.issuer || !newCertification.year}
                    className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 rounded-xl"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Certification
                  </Button>
                </div>

                {formData.certifications && formData.certifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Added Certifications</h3>
                    {formData.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{cert.name}</p>
                          <p className="text-sm text-gray-600">
                            {cert.issuer} • {cert.year}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="pricingType" className="text-lg font-semibold text-gray-900 mb-2 block">
                  Pricing Type
                </Label>
                <Select
                  value={formData.pricingType}
                  onValueChange={(value: 'per-visit' | 'per-hour') =>
                    setFormData({ ...formData, pricingType: value })
                  }
                >
                  <SelectTrigger className="w-full h-12 border-emerald-200 focus:border-emerald-400 rounded-xl">
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-emerald-200">
                    <SelectItem value="per-visit" className="hover:bg-emerald-50 focus:bg-emerald-100">
                      Per Visit (fixed rate per job)
                    </SelectItem>
                    <SelectItem value="per-hour" className="hover:bg-emerald-50 focus:bg-emerald-100">
                      Per Hour (hourly rate)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="baseRate" className="text-lg font-semibold text-gray-900 mb-2 block">
                  Base Rate (₹)
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Set your starting rate. You can adjust this per job based on complexity.
                </p>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="baseRate"
                    type="number"
                    min="1"
                    placeholder="50"
                    value={formData.baseRate || ''}
                    onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                    className="pl-12 pr-4 text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.pricingType === 'per-visit'
                    ? 'This is your base rate per service visit'
                    : 'This is your hourly rate'}
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Availability */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold text-gray-900 mb-3 block">
                  Working Hours
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-2 block">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.workingHours?.start || '09:00'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: { ...formData.workingHours!, start: e.target.value },
                        })
                      }
                      className="text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-2 block">
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.workingHours?.end || '17:00'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: { ...formData.workingHours!, end: e.target.value },
                        })
                      }
                      className="text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-lg font-semibold text-gray-900 mb-3 block">
                  Working Days
                </Label>
                <p className="text-sm text-gray-600 mb-3">Select the days you're available for work</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = formData.workingDays?.includes(day)
                          ? formData.workingDays.filter((d) => d !== day)
                          : [...(formData.workingDays || []), day];
                        setFormData({ ...formData, workingDays: newDays });
                      }}
                      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        formData.workingDays?.includes(day)
                          ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Service Area */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold text-gray-900 mb-2 block">
                  Service Areas
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Add the cities and specific areas where you provide services
                </p>

                {/* Add new service area */}
                <div className="space-y-4 p-6 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl mb-6">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                      City
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="e.g., New York"
                      value={newServiceArea.city}
                      onChange={(e) => setNewServiceArea({ ...newServiceArea, city: e.target.value })}
                      className="text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Areas within {newServiceArea.city || 'this city'}
                    </Label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        type="text"
                        placeholder="e.g., Manhattan, Brooklyn..."
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAreaToServiceArea())}
                        className="flex-1 text-base h-12 border-emerald-200 focus:border-emerald-400 rounded-xl"
                      />
                      <Button
                        type="button"
                        onClick={addAreaToServiceArea}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-xl"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>

                    {newServiceArea.areas && newServiceArea.areas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {newServiceArea.areas.map((area) => (
                          <div
                            key={area}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700"
                          >
                            <span>{area}</span>
                            <button
                              type="button"
                              onClick={() => removeAreaFromServiceArea(area)}
                              className="text-emerald-500 hover:text-emerald-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={addServiceArea}
                      disabled={!newServiceArea.city || !newServiceArea.areas?.length}
                      className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 rounded-xl"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Add Service Area
                    </Button>
                  </div>
                </div>

                {/* Added service areas */}
                {formData.serviceAreas && formData.serviceAreas.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Your Service Areas</h3>
                    {formData.serviceAreas.map((area, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-white border border-emerald-200 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{area.city}</p>
                          <p className="text-sm text-gray-600">
                            {area.areas?.join(', ') || 'All areas'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeServiceArea(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 h-auto text-base font-semibold rounded-xl border-2 disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep === STEPS.length ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white px-8 py-3 h-auto text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white px-8 py-3 h-auto text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
