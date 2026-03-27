'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Star,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  isActive: boolean;
  profilePicture?: string;
  createdAt: string;
  totalRequests?: number;
  completedRequests?: number;
  cancelledRequests?: number;
  averageRating?: number;
  totalReviewsGiven?: number;
  serviceRequests?: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    scheduledDate?: string;
    category?: string;
    serviceProvider?: {
      name: string;
    };
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    serviceProvider: {
      name: string;
    };
    createdAt: string;
  }>;
}

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadCustomerDetail(params.id as string);
    }
  }, [params.id]);

  const loadCustomerDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await adminApi.getCustomer(id);
      const apiData = (response as any).data || response;
      setCustomer(apiData);
    } catch (error: any) {
      console.error('Error loading customer detail:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    const parts = [address.street, address.city, address.state, address.pincode, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, label: 'Pending' },
      assigned: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Activity, label: 'Assigned' },
      'in-progress': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp, label: 'In Progress' },
      completed: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Customer not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      </div>

      {/* Profile Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl sm:text-4xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-blue-100">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                {customer.isActive ? (
                  <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/50">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-100 border-gray-400/50">
                    <XCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Member Since</p>
            <p className="text-lg font-semibold">{formatDate(customer.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Requests</span>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{customer.totalRequests || 0}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Completed</span>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{customer.completedRequests || 0}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Cancelled</span>
            <XCircle className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{customer.cancelledRequests || 0}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Reviews Given</span>
            <Star className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{customer.totalReviewsGiven || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{customer.email}</p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{customer.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm font-semibold text-gray-900">{formatAddress(customer.address)}</p>
                </div>
              </div>
            </div>
          </div>

          {customer.averageRating !== undefined && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Average Rating</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-50 px-4 py-2 rounded-xl">
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                  <span className="text-2xl font-bold text-amber-900">
                    {customer.averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Based on {customer.totalReviewsGiven || 0} reviews
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Service Requests & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Requests */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Service Requests</h2>
            {customer.serviceRequests && customer.serviceRequests.length > 0 ? (
              <div className="space-y-3">
                {customer.serviceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{request.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                          {request.category && (
                            <>
                              <span className="font-medium">{request.category}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatDate(request.createdAt)}</span>
                          {request.scheduledDate && (
                            <>
                              <span>•</span>
                              <span>Scheduled: {formatDate(request.scheduledDate)}</span>
                            </>
                          )}
                        </div>
                        {request.serviceProvider && (
                          <p className="text-sm text-gray-600 mt-1">
                            Provider: <span className="font-medium">{request.serviceProvider.name}</span>
                          </p>
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No service requests yet</p>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reviews Given</h2>
            {customer.reviews && customer.reviews.length > 0 ? (
              <div className="space-y-4">
                {customer.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-bold text-amber-900">{review.rating}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {review.serviceProvider.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No reviews given yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
