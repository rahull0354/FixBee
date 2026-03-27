'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import {
  Search,
  Shield,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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

interface Provider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  averageRating: string;
  totalReviews: number;
  totalJobsCompleted: number;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  skills: string[];
  experienceYears: number;
  bio?: string;
}

export default function AdminProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getProviders();
      const apiData = (response as any).data || response;
      const providersArray = Array.isArray(apiData) ? apiData : apiData.providers || [];
      setProviders(providersArray);
    } catch (error: any) {
      console.error('Error loading providers:', error);
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      searchQuery === '' ||
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.phone?.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && provider.isActive && !provider.isSuspended) ||
      (statusFilter === 'suspended' && provider.isSuspended);

    return matchesSearch && matchesStatus;
  });

  const handleSuspend = async () => {
    if (!selectedProvider || !suspensionReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    try {
      setProcessing(true);
      await adminApi.suspendProvider(selectedProvider.id, suspensionReason);
      toast.success('Provider suspended successfully');
      setSuspendDialogOpen(false);
      setSelectedProvider(null);
      setSuspensionReason('');
      loadProviders();
    } catch (error: any) {
      console.error('Error suspending provider:', error);
      toast.error(error?.response?.data?.message || 'Failed to suspend provider');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsuspend = async (provider: Provider) => {
    try {
      setProcessing(true);
      await adminApi.unsuspendProvider(provider.id);
      toast.success('Provider unsuspended successfully');
      loadProviders();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Service Providers
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage service providers on your platform
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48 border-purple-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Providers List */}
      {filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-2">
                  {/* Name, Rating & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      {provider.name}
                    </span>
                    {provider.isSuspended ? (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        Suspended
                      </Badge>
                    ) : provider.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {/* Email & Phone */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{provider.email}</p>
                    {provider.phone && <p>{provider.phone}</p>}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
                    <span>⭐ {provider.averageRating || '0'} rating</span>
                    <span>• {provider.totalReviews} reviews</span>
                    <span>• {provider.totalJobsCompleted} jobs completed</span>
                    {provider.experienceYears > 0 && (
                      <span>• {provider.experienceYears} years experience</span>
                    )}
                  </div>

                  {/* Skills */}
                  {provider.skills && provider.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {provider.skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {provider.skills.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                          +{provider.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Suspension Reason */}
                  {provider.isSuspended && provider.suspensionReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-800">
                        <span className="font-semibold">Reason:</span> {provider.suspensionReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Section - Actions */}
                <div className="flex sm:flex-col items-start sm:items-end gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/providers/${provider.id}`)}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {provider.isSuspended ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnsuspend(provider)}
                        disabled={processing}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Unsuspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setSuspendDialogOpen(true);
                        }}
                        disabled={processing}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <ShieldAlert className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
      )}

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedProvider?.name}? Please provide a reason for this action.
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
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false);
                setSelectedProvider(null);
                setSuspensionReason('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={processing || !suspensionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
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

function EmptyState({
  searchQuery,
  statusFilter,
}: {
  searchQuery: string;
  statusFilter: string;
}) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full mb-4 sm:mb-6">
        <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== 'all' ? 'No providers found' : 'No providers yet'}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
        {searchQuery
          ? 'Try adjusting your search terms or filters'
          : statusFilter !== 'all'
          ? `You don't have any ${statusFilter} providers`
          : 'Service providers will appear here once they register'}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="bg-white rounded-2xl p-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
