'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  Award,
  Clock,
  DollarSign,
  Shield,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Calendar,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ProviderProfile } from '@/types';

export default function AdminProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProvider();
  }, [providerId]);

  const loadProvider = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getProvider(providerId);
      setProvider(data);
    } catch (error: any) {
      console.error('Error loading provider:', error);
      toast.error(error?.response?.data?.message || 'Failed to load provider');
      router.push('/admin/providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    try {
      setProcessing(true);
      await adminApi.suspendProvider(providerId, suspensionReason);
      toast.success('Provider suspended successfully');
      setSuspendDialogOpen(false);
      setSuspensionReason('');
      loadProvider();
    } catch (error: any) {
      console.error('Error suspending provider:', error);
      toast.error(error?.response?.data?.message || 'Failed to suspend provider');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    try {
      setProcessing(true);
      await adminApi.unsuspendProvider(providerId);
      toast.success('Provider unsuspended successfully');
      loadProvider();
    } catch (error: any) {
      console.error('Error unsuspending provider:', error);
      toast.error(error?.response?.data?.message || 'Failed to unsuspend provider');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Not Found</h2>
        <p className="text-gray-600 mb-6">The provider you're looking for doesn't exist.</p>
        <Link href="/admin/providers">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Back to Providers
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
            href="/admin/providers"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Providers
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Provider Details
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage provider information
          </p>
        </div>
        <div className="flex items-center gap-3">
          {provider.isSuspended ? (
            <Badge className="bg-red-100 text-red-800 border-red-200 px-4 py-2">
              <ShieldAlert className="h-4 w-4 mr-1" />
              Suspended
            </Badge>
          ) : provider.isActive ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800 border-gray-200 px-4 py-2">
              <XCircle className="h-4 w-4 mr-1" />
              Inactive
            </Badge>
          )}
          <Badge className={provider.isAvailable ? "bg-green-100 text-green-800 border-green-200 px-4 py-2" : "bg-gray-100 text-gray-800 border-gray-200 px-4 py-2"}>
            {provider.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Profile Picture */}
          <div className="relative">
            {provider.profilePicture ? (
              <img
                src={provider.profilePicture}
                alt={provider.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30">
                <User className="h-12 w-12 sm:h-16 sm:w-16 text-white/80" />
              </div>
            )}
            {provider.isAvailable && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-blue-600" />
            )}
          </div>

          {/* Provider Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{provider.name}</h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-blue-100 mb-3">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {provider.email}
              </span>
              {provider.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {provider.phone}
                </span>
              )}
            </div>
            {provider.bio && (
              <p className="text-blue-100 text-sm sm:text-base max-w-2xl line-clamp-2">{provider.bio}</p>
            )}
          </div>

          {/* Rating & Stats */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-bold">{provider.rating?.toFixed(1) || '0.0'}</span>
              <span className="text-blue-100">({provider.reviewCount} reviews)</span>
            </div>
            <div className="text-sm text-blue-100">
              {provider.completedJobs} jobs completed
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Star}
          label="Rating"
          value={provider.rating?.toFixed(1) || '0.0'}
          color="yellow"
        />
        <StatCard
          icon={Briefcase}
          label="Completed Jobs"
          value={provider.completedJobs?.toString() || '0'}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="Experience"
          value={`${provider.experience} years`}
          color="emerald"
        />
        <StatCard
          icon={Shield}
          label="Reviews"
          value={provider.reviewCount?.toString() || '0'}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills */}
          {provider.skills && provider.skills.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-violet-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Skills</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {provider.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-full text-violet-700 font-medium capitalize"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Certifications */}
          {provider.certifications && provider.certifications.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Certifications</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {provider.certifications.map((cert, index) => (
                    <div key={index} className="border border-blue-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{cert.year}</span>
                      </div>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                        >
                          View Certificate →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Service Areas */}
          {provider.serviceAreas && provider.serviceAreas.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Service Areas</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {provider.serviceAreas.map((area, index) => (
                    <div key={index} className="border border-blue-100 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{area.city}</h4>
                      {area.areas && area.areas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {area.areas.map((areaName, i) => (
                            <span key={i} className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                              {areaName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Pricing</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Base Rate</p>
                  <p className="text-2xl font-bold text-gray-900">₹{provider.baseRate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Pricing Type</p>
                  <p className="text-lg font-semibold text-gray-700 capitalize">{provider.pricingType}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Availability</h3>
              </div>
            </div>
            <div className="p-6">
              {provider.workingHours && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Working Hours</p>
                  <p className="text-sm text-gray-700">
                    {provider.workingHours.start} - {provider.workingHours.end}
                  </p>
                </div>
              )}
              {provider.workingDays && provider.workingDays.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Working Days</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.workingDays.map((day, index) => (
                      <span key={index} className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Status</p>
                <Badge className={provider.isAvailable ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                  {provider.isAvailable ? 'Available for new jobs' : 'Not available'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {provider.isSuspended ? (
                <Button
                  onClick={handleUnsuspend}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Unsuspend Provider
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setSuspendDialogOpen(true)}
                  disabled={processing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Suspend Provider
                </Button>
              )}
            </div>
          </div>

          {/* Suspension Notice */}
          {provider.isSuspended && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Provider Suspended</h4>
                  <p className="text-sm text-red-700">
                    This provider has been suspended and cannot accept new service requests.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Suspend Provider
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to suspend <span className="font-semibold">{provider.name}</span>? Please provide a reason for this action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Suspension Reason *</Label>
              <Textarea
                id="reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="e.g., Violation of service terms, multiple customer complaints, etc."
                rows={3}
                className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false);
                setSuspensionReason('');
              }}
              disabled={processing}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={processing || !suspensionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suspending...
                </>
              ) : (
                'Suspend Provider'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: 'yellow' | 'blue' | 'emerald' | 'purple';
}) {
  const colorClasses = {
    yellow: 'from-yellow-50 to-amber-50 border-yellow-200',
    blue: 'from-blue-50 to-indigo-50 border-blue-200',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200',
    purple: 'from-violet-50 to-purple-50 border-violet-200',
  };

  const iconClasses = {
    yellow: 'from-yellow-400 to-amber-500',
    blue: 'from-blue-400 to-indigo-500',
    emerald: 'from-emerald-400 to-teal-500',
    purple: 'from-violet-400 to-purple-500',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-4 sm:p-5`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`h-10 w-10 bg-gradient-to-br ${iconClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
