'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Eye,
  CheckCircle,
  PlayCircle,
  MoreHorizontal,
  Briefcase,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { providerApi } from '@/lib/api';
import { ServiceRequest } from '@/types';

type RequestStatus = 'all' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export default function MyAssignmentsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus>('all');

  // Search and Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadMyAssignments();
  }, []);

  useEffect(() => {
    filterRequests();
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [requests, statusFilter, searchQuery]);

  const loadMyAssignments = async () => {
    try {
      setLoading(true);

      const response = await providerApi.getMyAssignedRequests();
      const data = (response as any).data || response;
      const requestsArray = Array.isArray(data) ? data : [];

      // Transform backend data and fetch missing customer details
      const transformedRequests = await Promise.all(
        requestsArray.map(async (req: any) => {
          let customerData = req.customer;

          // If customer is not populated, fetch it separately
          if (!customerData && req.customerId) {
            try {
              const customerResponse = await providerApi.getCustomerById(req.customerId);
              const customerInfo = (customerResponse as any).data || customerResponse;

              customerData = {
                id: customerInfo.id,
                name: customerInfo.name,
                email: customerInfo.email,
                phone: customerInfo.phone,
              };
            } catch (error) {
              console.error('Error fetching customer:', error);
              // Still include the request even if customer fetch fails
              customerData = null;
            }
          } else if (req.customerId && typeof req.customerId === 'object') {
            // If customerId is populated as object, use that
            customerData = {
              id: req.customerId.id,
              name: req.customerId.name,
              email: req.customerId.email,
              phone: req.customerId.phone,
            };
          }

          const transformed = {
            id: req.id,
            customerId: req.customerId,
            providerId: req.serviceProviderId,
            categoryId: req.serviceCategoryId,
            serviceType: req.serviceType || '',
            title: req.serviceTitle || req.title || '',
            description: req.serviceDescription || req.description || '',
            address: req.serviceAddress || req.address || {},
            scheduledDate: req.schedule?.date || req.scheduledDate || '',
            scheduledTimeSlot: req.schedule?.timeSlot || req.scheduledTimeSlot || '',
            status: req.status,
            estimatedPrice: req.estimatedPrice ? parseFloat(req.estimatedPrice) : undefined,
            finalPrice: req.finalPrice ? parseFloat(req.finalPrice) : undefined,
            beforeImages: req.beforeImages || [],
            afterImages: req.afterImages || [],
            additionalNotes: req.additionalNotes || '',
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            customer: customerData,
            provider: req.provider,
            category: req.category,
          };

          return transformed;
        })
      );

      setRequests(transformedRequests);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      toast.error(error?.response?.data?.message || 'Failed to load assignments');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.title?.toLowerCase().includes(query) ||
          req.description?.toLowerCase().includes(query) ||
          req.serviceType?.toLowerCase().includes(query) ||
          req.customer?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
  const showPagination = totalPages > 1;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'assigned':
        return 'Assigned';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const getStatusCount = (status: RequestStatus) => {
    if (status === 'all') return requests.length;
    return requests.filter((req) => req.status === status).length;
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-emerald-100">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-emerald-100">
              <CardContent className="p-6">
                <Skeleton className="h-7 w-3/4 mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-2/3 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
                <Skeleton className="h-11 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Assignments</h1>
          <p className="text-gray-600">
            Manage your assigned service requests and track progress
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* All */}
        <Card
          className={`border-emerald-100 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            statusFilter === 'all' ? 'ring-2 ring-emerald-500 shadow-lg bg-linear-to-br from-emerald-50 to-teal-50' : 'bg-white'
          }`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusFilter === 'all' ? 'bg-emerald-500' : 'bg-emerald-100'} transition-colors`}>
                <Briefcase className={`h-5 w-5 ${statusFilter === 'all' ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              {statusFilter === 'all' && (
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total</p>
            <p className={`text-3xl font-bold ${statusFilter === 'all' ? 'text-emerald-700' : 'text-gray-800'}`}>
              {getStatusCount('all')}
            </p>
          </CardContent>
        </Card>

        {/* Assigned */}
        <Card
          className={`border-blue-100 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            statusFilter === 'assigned' ? 'ring-2 ring-blue-500 shadow-lg bg-linear-to-br from-blue-50 to-indigo-50' : 'bg-white'
          }`}
          onClick={() => setStatusFilter('assigned')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusFilter === 'assigned' ? 'bg-blue-500' : 'bg-blue-100'} transition-colors`}>
                <User className={`h-5 w-5 ${statusFilter === 'assigned' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              {statusFilter === 'assigned' && (
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Assigned</p>
            <p className={`text-3xl font-bold ${statusFilter === 'assigned' ? 'text-blue-700' : 'text-gray-800'}`}>
              {getStatusCount('assigned')}
            </p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card
          className={`border-purple-100 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            statusFilter === 'in-progress' ? 'ring-2 ring-purple-500 shadow-lg bg-linear-to-br from-purple-50 to-pink-50' : 'bg-white'
          }`}
          onClick={() => setStatusFilter('in-progress')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusFilter === 'in-progress' ? 'bg-purple-500' : 'bg-purple-100'} transition-colors`}>
                <PlayCircle className={`h-5 w-5 ${statusFilter === 'in-progress' ? 'text-white' : 'text-purple-600'}`} />
              </div>
              {statusFilter === 'in-progress' && (
                <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">In Progress</p>
            <p className={`text-3xl font-bold ${statusFilter === 'in-progress' ? 'text-purple-700' : 'text-gray-800'}`}>
              {getStatusCount('in-progress')}
            </p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card
          className={`border-green-100 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            statusFilter === 'completed' ? 'ring-2 ring-green-500 shadow-lg bg-linear-to-br from-green-50 to-emerald-50' : 'bg-white'
          }`}
          onClick={() => setStatusFilter('completed')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusFilter === 'completed' ? 'bg-green-500' : 'bg-green-100'} transition-colors`}>
                <CheckCircle className={`h-5 w-5 ${statusFilter === 'completed' ? 'text-white' : 'text-green-600'}`} />
              </div>
              {statusFilter === 'completed' && (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Completed</p>
            <p className={`text-3xl font-bold ${statusFilter === 'completed' ? 'text-green-700' : 'text-gray-800'}`}>
              {getStatusCount('completed')}
            </p>
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card
          className={`border-red-100 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            statusFilter === 'cancelled' ? 'ring-2 ring-red-500 shadow-lg bg-linear-to-br from-red-50 to-orange-50' : 'bg-white'
          }`}
          onClick={() => setStatusFilter('cancelled')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusFilter === 'cancelled' ? 'bg-red-500' : 'bg-red-100'} transition-colors`}>
                <MoreHorizontal className={`h-5 w-5 ${statusFilter === 'cancelled' ? 'text-white' : 'text-red-600'}`} />
              </div>
              {statusFilter === 'cancelled' && (
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cancelled</p>
            <p className={`text-3xl font-bold ${statusFilter === 'cancelled' ? 'text-red-700' : 'text-gray-800'}`}>
              {getStatusCount('cancelled')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-800">
              {filteredRequests.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredRequests.length)}
            </span> of <span className="font-semibold text-gray-800">{filteredRequests.length}</span> assignment
            {filteredRequests.length !== 1 ? 's' : ''}
          </p>
          {showPagination && (
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-800">{currentPage}</span> of {totalPages}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-400 w-64"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus)}>
            <SelectTrigger className="w-48 border-emerald-200" style={{ backgroundColor: 'white' }}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-emerald-200 shadow-lg">
              <SelectItem value="all" className="hover:bg-emerald-50 focus:bg-emerald-100">All Status</SelectItem>
              <SelectItem value="assigned" className="hover:bg-emerald-50 focus:bg-emerald-100">Assigned</SelectItem>
              <SelectItem value="in-progress" className="hover:bg-emerald-50 focus:bg-emerald-100">In Progress</SelectItem>
              <SelectItem value="completed" className="hover:bg-emerald-50 focus:bg-emerald-100">Completed</SelectItem>
              <SelectItem value="cancelled" className="hover:bg-emerald-50 focus:bg-emerald-100">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignments Grid */}
      {filteredRequests.length === 0 ? (
        <Card className="border-emerald-100">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {requests.length === 0 ? 'No Assignments Yet' : 'No Matching Assignments'}
            </h3>
            <p className="text-gray-600 mb-6">
              {requests.length === 0
                ? 'You haven\'t accepted any service requests yet. Browse available requests to get started!'
                : 'Try adjusting the status filter to see more results.'}
            </p>
            {requests.length === 0 && (
              <Link href="/provider/requests/available">
                <Button className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white">
                  Browse Available Requests
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paginatedRequests.map((request) => (
            <Card
              key={request.id}
              className="border-emerald-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Badge className={`mb-2 ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{request.title}</h3>
                    <p className="text-sm text-gray-500">{request.category?.name || request.serviceType}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{request.description}</p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{request.customer?.name || 'Customer'}</span>
                    {request.customer?.phone && (
                      <span className="text-gray-500">• {request.customer.phone}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {request.address?.street && `${request.address.street}, `}
                      {request.address?.city}
                      {request.address?.state && `, ${request.address.state}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{formatDate(request.scheduledDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="capitalize">
                      {request.scheduledTimeSlot || 'Time not specified'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      const storageKey = `assignment_${request.id}`;
                      sessionStorage.setItem(storageKey, JSON.stringify({
                        ...request,
                        timestamp: Date.now(),
                      }));
                      window.location.href = `/provider/assignments/${request.id}`;
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>

                  {request.status === 'assigned' && (
                    <>
                      <Button
                        className="flex-1 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white"
                        onClick={() => {
                          const storageKey = `assignment_${request.id}`;
                          sessionStorage.setItem(storageKey, JSON.stringify({
                            ...request,
                            timestamp: Date.now(),
                          }));
                          window.location.href = `/provider/assignments/${request.id}`;
                        }}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Service
                      </Button>
                    </>
                  )}

                  {request.status === 'in_progress' && (
                    <>
                      <Button
                        className="flex-1 bg-linear-to-r from-green-400 via-emerald-400 to-teal-400 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white"
                        onClick={() => {
                          const storageKey = `assignment_${request.id}`;
                          sessionStorage.setItem(storageKey, JSON.stringify({
                            ...request,
                            timestamp: Date.now(),
                          }));
                          window.location.href = `/provider/assignments/${request.id}`;
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Service
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {showPagination && (
          <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current page
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Show ellipsis for skipped pages
                  const prevPage = page - 1;
                  const showEllipsis = !Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(Math.max(0, currentPage - 2), currentPage + 1)
                    .includes(prevPage);

                  if (showEllipsis) {
                    return (
                      <span key={page} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={
                      currentPage === page
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
