'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Search,
  Filter,
  Briefcase,
  Sparkles,
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
import { CalendarFilter } from '@/components/provider/CalendarFilter';

export default function AvailableRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [cities, setCities] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadAvailableRequests();
  }, []);

  useEffect(() => {
    filterRequests();
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [requests, searchQuery, selectedCity, selectedDate]);

  const loadAvailableRequests = async () => {
    try {
      setLoading(true);
      const response = await providerApi.getAvailableRequests();
      const data = (response as any).data || response;

      console.log('🔍 Available Requests Response:', response);
      console.log('📦 Data:', data);

      const requestsArray = Array.isArray(data) ? data : [];

      console.log(`📋 Found ${requestsArray.length} requests`);

      // Transform backend data to match frontend expectations
      const transformedRequests = requestsArray.map((req: any) => {
        console.log('🔄 Transforming request:', req);
        return {
          id: req.id,
          customerId: req.customerId?.id || req.customerId,
          providerId: req.serviceProviderId,
          categoryId: req.serviceCategoryId?.id || req.serviceCategoryId,
          serviceType: req.serviceCategoryId?.name || req.serviceType || '',
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
          customer: req.customerId && typeof req.customerId === 'object' ? {
            id: req.customerId.id,
            name: req.customerId.name,
            email: req.customerId.email,
            phone: req.customerId.phone,
          } : undefined,
          category: req.serviceCategoryId && typeof req.serviceCategoryId === 'object' ? {
            id: req.serviceCategoryId.id,
            name: req.serviceCategoryId.name,
            slug: req.serviceCategoryId.slug,
          } : undefined,
        };
      });

      console.log(`✅ Transformed ${transformedRequests.length} requests`);
      console.log('📝 Transformed data:', transformedRequests);

      setRequests(transformedRequests);

      // Extract unique cities for filter
      const uniqueCities = Array.from(
        new Set(transformedRequests.map((req: ServiceRequest) => req.address?.city).filter(Boolean))
      ) as string[];
      setCities(uniqueCities);
    } catch (error: any) {
      console.error('❌ Error loading available requests:', error);

      // If error is "No available requests found", just show empty state
      const errorMessage = error?.response?.data?.message;
      if (errorMessage && errorMessage.toLowerCase().includes('no available requests')) {
        console.log('ℹ️ No available requests found (expected behavior)');
        setRequests([]);
      } else {
        toast.error(errorMessage || 'Failed to load available requests');
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.title?.toLowerCase().includes(query) ||
          req.description?.toLowerCase().includes(query) ||
          req.serviceType?.toLowerCase().includes(query)
      );
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter((req) => req.address?.city === selectedCity);
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter((req) => req.scheduledDate === selectedDate);
    }

    setFilteredRequests(filtered);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
  const showPagination = totalPages > 1;

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setAccepting(requestId);
      await providerApi.acceptRequest(requestId);
      toast.success('Request accepted successfully!');

      // Remove the accepted request from the list
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error(error?.response?.data?.message || 'Failed to accept request');
    } finally {
      setAccepting(null);
    }
  };

  const formatDate = (dateString: string) => {
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

  const formatPrice = (price?: number) => {
    if (!price) return 'Est. Price: TBD';
    return `Est. Price: $${price.toLocaleString()}`;
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Available Requests</h1>
          <p className="text-gray-600">
            Browse and accept service requests that match your skills and location
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-emerald-100 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-800">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-400"
              />
            </div>

            {/* City Filter */}
            <Select value={selectedCity || 'all'} onValueChange={(value) => setSelectedCity(value === 'all' ? '' : value)}>
              <SelectTrigger className="border-emerald-200" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-emerald-200 shadow-lg">
                <SelectItem value="all" className="hover:bg-emerald-50 focus:bg-emerald-100">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city} className="hover:bg-emerald-50 focus:bg-emerald-100">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <CalendarFilter
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Filter by date"
            />
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCity || selectedDate) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCity && (
                <Badge variant="secondary" className="gap-1">
                  City: {selectedCity}
                  <button
                    onClick={() => setSelectedCity('')}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedDate && (
                <Badge variant="secondary" className="gap-1">
                  Date: {formatDate(selectedDate)}
                  <button
                    onClick={() => setSelectedDate('')}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                  setSelectedDate('');
                }}
                className="text-emerald-600 hover:text-emerald-700"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-gray-800">
            {filteredRequests.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredRequests.length)}
          </span> of <span className="font-semibold text-gray-800">{filteredRequests.length}</span> available
          request{filteredRequests.length !== 1 ? 's' : ''}
        </p>
        {showPagination && (
          <p className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-800">{currentPage}</span> of {totalPages}
          </p>
        )}
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <Card className="border-emerald-100">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {requests.length === 0 ? 'No Available Requests' : 'No Matching Requests'}
            </h3>
            <p className="text-gray-600 mb-6">
              {requests.length === 0
                ? 'There are currently no service requests available. Check back later!'
                : 'Try adjusting your filters to see more results.'}
            </p>
            {(searchQuery || selectedCity || selectedDate) && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                  setSelectedDate('');
                }}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Clear Filters
              </Button>
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
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                        {request.category?.name || request.serviceType || 'Service'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{request.title}</h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{request.description}</p>

                {/* Details */}
                <div className="space-y-2 mb-4">
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

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">
                      {formatPrice(request.estimatedPrice)}
                    </span>
                  </div>
                </div>

                {/* Additional Notes */}
                {request.additionalNotes && (
                  <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-700 line-clamp-2">
                      <span className="font-semibold">Note:</span> {request.additionalNotes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptRequest(request.id)}
                    disabled={accepting === request.id}
                    className="flex-1 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-medium"
                  >
                    {accepting === request.id ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-4 w-4 mr-2" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Store request data in sessionStorage for details page
                      const storageKey = `request_${request.id}`;
                      console.log('💾 Storing request data in sessionStorage:', storageKey);
                      console.log('📦 Request data:', request);
                      sessionStorage.setItem(storageKey, JSON.stringify({
                        ...request,
                        timestamp: Date.now(), // Add timestamp for cleanup
                      }));
                      console.log('✅ Data stored, navigating to:', `/provider/requests/available/${request.id}`);
                      window.location.href = `/provider/requests/available/${request.id}`;
                    }}
                    className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    View Details
                  </Button>
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
