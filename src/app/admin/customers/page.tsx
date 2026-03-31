"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { Search, Mail, Phone, CheckCircle, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

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
  isSuspended?: boolean;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
  totalServices?: number;
  totalRequests?: number;
  profilePicture?: string;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, [currentPage, itemsPerPage]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add search parameter if there's a search query
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await adminApi.getCustomers(params);
      const apiData = (response as any).data || response;

      // Handle paginated response
      const customersArray = Array.isArray(apiData)
        ? apiData
        : apiData.customers || apiData.data || [];

      // Transform API data to match frontend expectations
      const transformedCustomers = customersArray.map((customer: any) => ({
        ...customer,
        isSuspended: false,
        suspensionReason: null,
        totalRequests: customer.totalServices || customer.totalRequests || 0,
      }));

      setCustomers(transformedCustomers);

      // Set pagination info from response
      const total = apiData.total || apiData.totalCustomers || customersArray.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error: any) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
    loadCustomers();
  }, [searchQuery, statusFilter]);

  // Filter customers locally by status (since backend doesn't support status filter)
  const filteredCustomers = customers.filter((customer) => {
    return statusFilter === "all" ||
      (statusFilter === "active" && customer.isActive) ||
      (statusFilter === "inactive" && !customer.isActive);
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Customers
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage customer accounts on your platform
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-48 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:border-blue-400 focus:ring-blue-400">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-blue-200 shadow-lg">
              <SelectItem value="all" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">All Customers</SelectItem>
              <SelectItem value="active" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Active</SelectItem>
              <SelectItem value="inactive" className="hover:bg-blue-50 focus:bg-blue-100 cursor-pointer">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onViewDetails={() =>
                  router.push(`/admin/customers/${customer.id}`)
                }
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-blue-100 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing</span>
                <span className="font-semibold text-gray-900">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                </span>
                <span>to</span>
                <span className="font-semibold text-gray-900">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>
                <span>of</span>
                <span className="font-semibold text-gray-900">{totalItems}</span>
                <span>customers</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border-blue-200 text-blue-700 hover:bg-blue-50"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
      )}
    </div>
  );
}

// Helper function to format dates
const formatDate = (dateString: string | Date) => {
  if (!dateString) return "N/A";

  let date: Date;
  if (typeof dateString === "string") {
    // Handle ISO date strings
    date = new Date(dateString);
  } else {
    date = dateString;
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Customer Card Component
function CustomerCard({
  customer,
  onViewDetails,
}: {
  customer: Customer;
  onViewDetails: () => void;
}) {
  return (
    <div className="group bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative">
        {/* Background with contextual image */}
        <div className="h-32 bg-white relative overflow-hidden border-b border-gray-100">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80')",
            }}
          />
          {/* Gradient overlay for better contrast */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 to-indigo-50/30" />

          {/* View Button - Top Right */}
          <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={onViewDetails}
              className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-2 h-9 w-9 shadow-lg"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badge - Top Left */}
          <div className="absolute top-4 left-4 z-20">
            {customer.isActive ? (
              <Badge className="bg-emerald-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm hover:bg-emerald-600/95 transition-all duration-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm hover:bg-gray-600/95 transition-all duration-200">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Picture - Overlapping the background */}
        <div className="absolute top-20 left-6 z-10">
          <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 overflow-hidden border-4 border-white shadow-xl">
            {customer.profilePicture ? (
              <img
                src={customer.profilePicture}
                alt={customer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-indigo-600">
                <span className="text-3xl font-bold text-white">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-5 px-6">
        {/* Customer Info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {customer.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-blue-500" />
            <span className="truncate">{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Phone className="h-4 w-4 text-blue-500" />
              <span className="truncate">{customer.phone}</span>
            </div>
          )}
        </div>

        {/* Stats Row - Three Divs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Account Status */}
          <div className="bg-white rounded-xl p-3 border-2 border-blue-200 text-center">
            <CheckCircle
              className={`h-4 w-4 mx-auto mb-1 ${customer.isActive ? "text-emerald-600" : "text-gray-400"}`}
            />
            <p className="text-xs font-bold text-gray-900">
              {customer.isActive ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-gray-600 font-medium">Status</p>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-xl p-3 border-2 border-cyan-200 text-center">
            <Phone className="h-4 w-4 text-cyan-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900 truncate">
              {customer.phone || "N/A"}
            </p>
            <p className="text-xs text-gray-600 font-medium">Phone</p>
          </div>

          {/* Joined Date */}
          <div className="bg-white rounded-xl p-3 border-2 border-indigo-200 text-center">
            <Calendar className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">
              {formatDate(customer.createdAt)}
            </p>
            <p className="text-xs text-gray-600 font-medium">Joined</p>
          </div>
        </div>
      </div>
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
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <Search className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== "all"
          ? "No customers found"
          : "No customers yet"}
      </h3>
      <p className="text-sm text-gray-600">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : statusFilter !== "all"
            ? `You don't have any ${statusFilter} customers`
            : "Customers will appear here once they register"}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
