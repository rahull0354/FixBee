'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { customerApi } from '@/lib/api';
import { ServiceRequest } from '@/types';
import {
  FileText,
  Filter,
  Loader2,
  Calendar,
  User,
  Briefcase,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const statusFilters = [
  { value: '', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let filtered = requests;

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchQuery]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getMyServiceRequests();
      const rawRequests: any[] = (response as any).data || response || [];

      // Map backend data to ServiceRequest type (same as dashboard)
      const data: ServiceRequest[] = rawRequests.map((req) => ({
        id: req.id,
        customerId: req.customerId,
        providerId: req.serviceProviderId,
        categoryId: req.serviceCategoryId,
        serviceType: req.serviceType,
        title: req.serviceTitle || req.title || 'Service Request',
        description: req.serviceDescription || req.description || '',
        address: req.serviceAddress || req.address,
        scheduledDate: req.schedule?.date || req.createdAt,
        scheduledTimeSlot: req.schedule?.timeSlot || req.timeSlot || 'morning',
        status: req.status === 'requested' ? 'pending' : req.status,
        estimatedPrice: req.estimatedPrice ? parseFloat(req.estimatedPrice) : undefined,
        finalPrice: req.finalPrice && req.finalPrice !== "0.00" ? parseFloat(req.finalPrice) : undefined,
        beforeImages: req.beforeImages || [],
        afterImages: req.afterImages || [],
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      }));

      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load service requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatusText = (status: string | any) => {
    const statusStr = String(status || 'unknown');
    return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';

    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

      // Check if date is invalid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto" />
          <p className="text-gray-600 font-medium">Loading your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Service Requests</h1>
          <p className="text-gray-600">Track and manage all your service requests</p>
        </div>
        <Link href="/customer/requests/new">
          <Button className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white">
            <Briefcase className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-sky-50 rounded-xl border border-sky-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-sky-50 rounded-xl border border-sky-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusFilters.slice(1).map((filter) => {
          const count = requests.filter((req) => req.status === filter.value).length;
          return (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(statusFilter === filter.value ? '' : filter.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                statusFilter === filter.value
                  ? getStatusColor(filter.value)
                  : 'bg-white border-sky-100 hover:border-sky-300'
              }`}
            >
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600">{filter.label}</p>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {statusFilter || searchQuery ? 'No matching requests found' : 'No service requests yet'}
          </h2>
          <p className="text-gray-600 mb-6">
            {statusFilter || searchQuery
              ? 'Try adjusting your filters or search query'
              : "You haven't created any service requests yet."}
          </p>
          {!statusFilter && !searchQuery && (
            <Link
              href="/customer/requests/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
            >
              <Briefcase className="h-5 w-5" />
              Create Your First Request
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Request Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{request.title}</h3>
                      <p className="text-sm text-gray-600">{request.serviceType}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {formatStatusText(request.status)}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(request.scheduledDate)}</span>
                    </div>
                    {(request.status === 'assigned' || request.status === 'in-progress' || request.status === 'completed') ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="text-sky-600 font-medium">Provider Assigned</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="h-4 w-4" />
                        <span>Waiting for assignment</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action */}
                <Link
                  href={`/customer/requests/${request.id}`}
                  className="flex items-center justify-center px-6 py-3 bg-sky-50 text-sky-600 rounded-xl font-semibold hover:bg-sky-100 transition-colors whitespace-nowrap"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
