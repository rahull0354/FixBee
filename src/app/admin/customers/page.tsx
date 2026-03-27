'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  isActive: boolean;
  createdAt: string;
  totalRequests?: number;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCustomers();
      const apiData = (response as any).data || response;
      const customersArray = Array.isArray(apiData) ? apiData : apiData.customers || [];
      setCustomers(customersArray);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      searchQuery === '' ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && customer.isActive) ||
      (statusFilter === 'inactive' && !customer.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    const parts = [address.street, address.city, address.state, address.pincode].filter(Boolean);
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

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Customers
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          View and manage customer accounts
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-purple-400 bg-white"
          >
            <option value="all">All Customers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 space-y-2">
                  {/* Name & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      {customer.name}
                    </span>
                    {customer.isActive ? (
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

                  {/* Email */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-purple-500" />
                    <span>{customer.email}</span>
                  </div>

                  {/* Phone */}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-purple-500" />
                      <span>{customer.phone}</span>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{formatAddress(customer.address)}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
                    <span>Joined {formatDate(customer.createdAt)}</span>
                    {customer.totalRequests !== undefined && (
                      <span>• {customer.totalRequests} requests</span>
                    )}
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex sm:flex-col items-start sm:items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
      )}
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
        <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== 'all' ? 'No customers found' : 'No customers yet'}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
        {searchQuery
          ? 'Try adjusting your search terms or filters'
          : statusFilter !== 'all'
          ? `You don't have any ${statusFilter} customers`
          : 'Customers will appear here once they register'}
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
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
