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
  Building2,
  CreditCard,
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

// Bank Account Interface
interface BankAccount {
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
  bankName: string;
  accountType: 'savings' | 'current';
  upiId?: string;
  branchName?: string;
}

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

const bankAccountSchema = z.object({
  bankAccount: z.object({
    accountNumber: z.string().min(1, 'Account number is required'),
    ifsc: z.string().min(1, 'IFSC code is required'),
    accountHolder: z.string().min(1, 'Account holder name is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    accountType: z.enum(['savings', 'current']),
  }),
});

type SetupFormData = z.infer<typeof basicInfoSchema> & {
  skills: string[];
  certifications?: Certification[];
  pricingType: 'per-visit' | 'per-hour';
  baseRate: number;
  workingHours: { start: string; end: string };
  workingDays: string[];
  serviceAreas: ServiceArea[];
  bankAccount: BankAccount;
};

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Skills', icon: Briefcase },
  { id: 3, title: 'Certifications', icon: Award },
  { id: 4, title: 'Pricing', icon: IndianRupee },
  { id: 5, title: 'Availability', icon: Clock },
  { id: 6, title: 'Service Area', icon: MapPin },
  { id: 7, title: 'Bank Account', icon: Building2 },
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
    bankAccount: {
      accountNumber: '',
      ifsc: '',
      accountHolder: '',
      bankName: '',
      accountType: 'savings',
      upiId: '',
      branchName: '',
    },
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
      case 7:
        // Validate bank account
        if (!formData.bankAccount) {
          toast.error('Please add your bank account details');
          return false;
        }
        if (!formData.bankAccount.accountNumber || formData.bankAccount.accountNumber.length < 9) {
          toast.error('Please enter a valid account number');
          return false;
        }
        if (!formData.bankAccount.ifsc || formData.bankAccount.ifsc.length < 11) {
          toast.error('Please enter a valid IFSC code');
          return false;
        }
        if (!formData.bankAccount.accountHolder || formData.bankAccount.accountHolder.trim().length < 2) {
          toast.error('Please enter the account holder name');
          return false;
        }
        if (!formData.bankAccount.bankName || formData.bankAccount.bankName.trim().length < 2) {
          toast.error('Please enter the bank name');
          return false;
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
        bankAccount: formData.bankAccount!,
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 sm:h-8 sm:w-72 mb-2" />
            <Skeleton className="h-4 w-32 sm:h-5 sm:w-48" />
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-emerald-100 p-4 sm:p-6 lg:p-8">
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-6 w-36 sm:h-8 sm:w-48" />
            <Skeleton className="h-24 sm:h-32 w-full" />
            <Skeleton className="h-10 w-28 sm:h-12 sm:w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-2 sm:p-3 bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl sm:rounded-2xl shrink-0">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-xs sm:text-sm text-gray-600">Let's set up your professional profile in just a few steps</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between overflow-x-auto overflow-y-visible pb-4 -mx-3 px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                        : isCurrent
                          ? 'bg-linear-to-r from-emerald-400 to-teal-400 text-white shadow-lg scale-105 sm:scale-110'
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 sm:h-6 sm:w-6" /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium mt-1.5 sm:mt-2 ${
                      isCurrent ? 'text-emerald-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-4 sm:w-8 md:w-12 lg:w-16 h-0.5 sm:h-1 bg-gray-200 mx-1 sm:mx-2 md:mx-4 rounded shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-emerald-100 overflow-hidden">
        {/* Step Header */}
        <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl shrink-0">
              {React.createElement(STEPS[currentStep - 1].icon, {
                className: 'h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white',
              })}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{STEPS[currentStep - 1].title}</h2>
              <p className="text-emerald-100 text-xs sm:text-sm">
                Step {currentStep} of {STEPS.length}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="bio" className="text-base sm:text-lg font-semibold text-gray-900 mb-2 block">
                  Professional Bio
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  Tell customers about your experience, expertise, and what makes you special
                </p>
                <Textarea
                  id="bio"
                  rows={5}
                  placeholder="Ex: Professional plumber with 10+ years of experience specializing in residential and commercial plumbing. I take pride in delivering quality workmanship and excellent customer service..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="text-sm sm:text-base resize-none rounded-lg sm:rounded-xl border-emerald-200 focus:border-emerald-400"
                />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2">{formData.bio?.length || 0} / 20 minimum characters</p>
              </div>

              <div>
                <Label htmlFor="experience" className="text-base sm:text-lg font-semibold text-gray-900 mb-2 block">
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
                  className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label className="text-base sm:text-lg font-semibold text-gray-900 mb-2 block">
                  Your Skills
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  Add at least 3 skills that best describe your expertise (e.g., "Plumbing", "Electrical", "HVAC")
                </p>

                <div className="flex gap-2 mb-3 sm:mb-4">
                  <Input
                    type="text"
                    placeholder="Enter a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 sm:px-6 rounded-lg sm:rounded-xl shrink-0"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {formData.skills?.map((skill) => (
                    <div
                      key={skill}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full text-emerald-700 font-medium text-xs sm:text-sm"
                    >
                      <span className="truncate max-w-30 sm:max-w-none">{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-emerald-500 hover:text-emerald-700 shrink-0"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2">{formData.skills?.length || 0} skills added</p>
              </div>
            </div>
          )}

          {/* Step 3: Certifications */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label className="text-base sm:text-lg font-semibold text-gray-900 mb-2 block">
                  Certifications (Optional)
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Add any professional certifications to build trust with customers
                </p>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div>
                    <Input
                      type="text"
                      placeholder="Certification name (e.g., Certified Electrician)"
                      value={newCertification.name}
                      onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Issuing organization"
                      value={newCertification.issuer}
                      onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Year (e.g., 2020)"
                      value={newCertification.year}
                      onChange={(e) => setNewCertification({ ...newCertification, year: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addCertification}
                    disabled={!newCertification.name || !newCertification.issuer || !newCertification.year}
                    className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Add Certification
                  </Button>
                </div>

                {formData.certifications && formData.certifications.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Added Certifications</h3>
                    {formData.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 sm:p-4 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg sm:rounded-xl"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{cert.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {cert.issuer} • {cert.year}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
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
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="pricingType" className="text-base sm:text-lg font-semibold text-gray-900 mb-2 block">
                  Pricing Type
                </Label>
                <Select
                  value={formData.pricingType}
                  onValueChange={(value: 'per-visit' | 'per-hour') =>
                    setFormData({ ...formData, pricingType: value })
                  }
                >
                  <SelectTrigger className="w-full h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-sm sm:text-base">
                    <SelectValue placeholder="Select pricing type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-emerald-200">
                    <SelectItem value="per-visit" className="hover:bg-emerald-50 focus:bg-emerald-100 text-sm sm:text-base">
                      Per Visit (fixed rate per job)
                    </SelectItem>
                    <SelectItem value="per-hour" className="hover:bg-emerald-50 focus:bg-emerald-100 text-sm sm:text-base">
                      Per Hour (hourly rate)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="baseRate" className="text-base sm:text-lg font-semibold text-gray-900 mb-2 block">
                  Base Rate (₹)
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  Set your starting rate. You can adjust this per job based on complexity.
                </p>
                <div className="relative">
                  <IndianRupee className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <Input
                    id="baseRate"
                    type="number"
                    min="1"
                    placeholder="50"
                    value={formData.baseRate || ''}
                    onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                    className="pl-9 sm:pl-12 pr-3 sm:pr-4 text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2">
                  {formData.pricingType === 'per-visit'
                    ? 'This is your base rate per service visit'
                    : 'This is your hourly rate'}
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Availability */}
          {currentStep === 5 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 block">
                  Working Hours
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
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
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
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
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 block">
                  Working Days
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Select the days you're available for work</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
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
                      className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-[10px] sm:text-sm transition-all ${
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
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label className="text-base sm:text-lg font-semibold text-gray-900 mb-2 block">
                  Service Areas
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Add the cities and specific areas where you provide services
                </p>

                {/* Add new service area */}
                <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg sm:rounded-xl mb-4 sm:mb-6">
                  <div>
                    <Label htmlFor="city" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      City
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="e.g., New York"
                      value={newServiceArea.city}
                      onChange={(e) => setNewServiceArea({ ...newServiceArea, city: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      Areas within {newServiceArea.city || 'this city'}
                    </Label>
                    <div className="flex gap-2 mb-2 sm:mb-3">
                      <Input
                        type="text"
                        placeholder="e.g., Manhattan, Brooklyn..."
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAreaToServiceArea())}
                        className="flex-1 text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                      />
                      <Button
                        type="button"
                        onClick={addAreaToServiceArea}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 sm:px-4 rounded-lg sm:rounded-xl shrink-0"
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>

                    {newServiceArea.areas && newServiceArea.areas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        {newServiceArea.areas.map((area) => (
                          <div
                            key={area}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-white border border-emerald-200 rounded-full text-xs sm:text-sm text-emerald-700"
                          >
                            <span className="truncate max-w-25 sm:max-w-none">{area}</span>
                            <button
                              type="button"
                              onClick={() => removeAreaFromServiceArea(area)}
                              className="text-emerald-500 hover:text-emerald-700 shrink-0"
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
                      className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
                    >
                      <Plus className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">Add Service Area</span>
                      <span className="sm:hidden">Add Area</span>
                    </Button>
                  </div>
                </div>

                {/* Added service areas */}
                {formData.serviceAreas && formData.serviceAreas.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Your Service Areas</h3>
                    {formData.serviceAreas.map((area, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 sm:p-4 bg-white border border-emerald-200 rounded-lg sm:rounded-xl"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{area.city}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {area.areas?.join(', ') || 'All areas'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeServiceArea(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
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

          {/* Step 7: Bank Account */}
          {currentStep === 7 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-linear-to-r from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl shrink-0">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Label className="text-base sm:text-lg font-semibold text-gray-900">
                      Bank Account Details
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Add your bank account to receive payments from customers
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg sm:rounded-xl">
                  <div>
                    <Label htmlFor="accountHolder" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      Account Holder Name *
                    </Label>
                    <Input
                      id="accountHolder"
                      type="text"
                      placeholder="Enter account holder name"
                      value={formData.bankAccount?.accountHolder || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: {
                            ...formData.bankAccount!,
                            accountHolder: e.target.value,
                          },
                        })
                      }
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankName" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      Bank Name *
                    </Label>
                    <Input
                      id="bankName"
                      type="text"
                      placeholder="e.g., State Bank of India"
                      value={formData.bankAccount?.bankName || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: {
                            ...formData.bankAccount!,
                            bankName: e.target.value,
                          },
                        })
                      }
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountNumber" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      Account Number *
                    </Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      placeholder="Enter account number"
                      value={formData.bankAccount?.accountNumber || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: {
                            ...formData.bankAccount!,
                            accountNumber: e.target.value,
                          },
                        })
                      }
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ifsc" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      IFSC Code *
                    </Label>
                    <Input
                      id="ifsc"
                      type="text"
                      placeholder="e.g., SBIN0001234"
                      value={formData.bankAccount?.ifsc || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: {
                            ...formData.bankAccount!,
                            ifsc: e.target.value.toUpperCase(),
                          },
                        })
                      }
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div>
                    <Label htmlFor="accountType" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      Account Type
                    </Label>
                    <Select
                      value={formData.bankAccount?.accountType || 'savings'}
                      onValueChange={(value: 'savings' | 'current') =>
                        setFormData({
                          ...formData,
                          bankAccount: {
                            ...formData.bankAccount!,
                            accountType: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-emerald-200">
                        <SelectItem value="savings" className="hover:bg-emerald-50 focus:bg-emerald-100 text-sm sm:text-base">
                          Savings Account
                        </SelectItem>
                        <SelectItem value="current" className="hover:bg-emerald-50 focus:bg-emerald-100 text-sm sm:text-base">
                          Current Account
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="branchName" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      Branch Name
                    </Label>
                    <Input
                      id="branchName"
                      type="text"
                      placeholder="e.g., Main Branch"
                      value={formData.bankAccount?.branchName || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: {
                            ...formData.bankAccount!,
                            branchName: e.target.value,
                          },
                        })
                      }
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="upiId" className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                      UPI ID (Optional)
                    </Label>
                    <Input
                      id="upiId"
                      type="text"
                      placeholder="e.g., yourname@upi"
                      value={formData.bankAccount?.upiId || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: {
                            ...formData.bankAccount!,
                            upiId: e.target.value,
                          },
                        })
                      }
                      className="text-sm sm:text-base h-10 sm:h-12 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl"
                    />
                  </div>
                </div>

                {/* Bank Account Preview */}
                {formData.bankAccount && (
                  <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg sm:rounded-xl">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-linear-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-md shrink-0">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Bank Account Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600">Account Holder</p>
                            <p className="font-semibold text-gray-900 truncate">
                              {formData.bankAccount.accountHolder || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Bank Name</p>
                            <p className="font-semibold text-gray-900 truncate">
                              {formData.bankAccount.bankName || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Account Number</p>
                            <p className="font-mono font-semibold text-gray-900 text-xs sm:text-sm">
                              {formData.bankAccount.accountNumber
                                ? `XXXX XXXX ${formData.bankAccount.accountNumber.slice(-4)}`
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">IFSC Code</p>
                            <p className="font-mono font-semibold text-gray-900 text-xs sm:text-sm">
                              {formData.bankAccount.ifsc || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Account Type</p>
                            <p className="font-semibold text-gray-900 capitalize text-xs sm:text-sm">
                              {formData.bankAccount.accountType || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Branch Name</p>
                            <p className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                              {formData.bankAccount.branchName || '-'}
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-gray-600">UPI ID</p>
                            <p className="font-mono font-semibold text-gray-900 text-xs sm:text-sm">
                              {formData.bankAccount.upiId || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-4 sm:px-6 py-2.5 sm:py-3 h-auto text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl border-2 disabled:opacity-50 flex-1 sm:flex-none"
            >
              <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </Button>

            {currentStep === STEPS.length ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 h-auto text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Saving</span>
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Complete Setup</span>
                    <span className="sm:hidden">Complete</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white px-4 sm:px-8 py-2.5 sm:py-3 h-auto text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
