"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  Search,
  Shield,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Star,
  Briefcase,
  Award,
  Mail,
  Phone,
  Zap,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  isAvailable?: boolean;
  profilePicture?: string;
}

export default function AdminProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadProviders();
  }, [currentPage, itemsPerPage]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Add search and status parameters
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (statusFilter === "active") {
        params.status = "active";
      } else if (statusFilter === "suspended") {
        params.status = "suspended";
      }

      const response = await adminApi.getProviders(params);
      const apiData = (response as any).data || response;
      const providersArray = Array.isArray(apiData) ? apiData : apiData.providers || apiData.data || [];

      setProviders(providersArray);

      // Set pagination info from response
      const total = apiData.total || apiData.totalProviders || providersArray.length;
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error: any) {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
    loadProviders();
  }, [searchQuery, statusFilter]);

  // Filter providers locally by status (in case backend doesn't support it)
  const filteredProviders = providers.filter((provider) => {
    return statusFilter === "all" ||
      (statusFilter === "active" && provider.isActive && !provider.isSuspended) ||
      (statusFilter === "suspended" && provider.isSuspended);
  });

  const handleSuspend = async () => {
    if (!selectedProvider || !suspensionReason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    try {
      setProcessing(true);
      await adminApi.suspendProvider(selectedProvider.id, suspensionReason);
      toast.success("Provider suspended successfully");
      setSuspendDialogOpen(false);
      setSelectedProvider(null);
      setSuspensionReason("");
      loadProviders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to suspend provider");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnsuspend = async (provider: Provider) => {
    try {
      setProcessing(true);
      await adminApi.unsuspendProvider(provider.id);
      toast.success("Provider unsuspended successfully");
      loadProviders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to unsuspend provider");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Service Providers
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage service providers on your platform
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-violet-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-violet-200 focus:border-violet-400 focus:ring-blue-400"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48 border-violet-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:border-violet-400 focus:ring-blue-400">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-violet-200 shadow-lg">
              <SelectItem value="all" className="hover:bg-violet-50 focus:bg-violet-100 cursor-pointer">All Providers</SelectItem>
              <SelectItem value="active" className="hover:bg-violet-50 focus:bg-violet-100 cursor-pointer">Active</SelectItem>
              <SelectItem value="suspended" className="hover:bg-violet-50 focus:bg-violet-100 cursor-pointer">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Providers Grid */}
      {filteredProviders.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onViewDetails={() => router.push(`/admin/providers/${provider.id}`)}
                onSuspend={() => {
                  setSelectedProvider(provider);
                  setSuspendDialogOpen(true);
                }}
                onUnsuspend={() => handleUnsuspend(provider)}
                processing={processing}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg border border-violet-100 p-4">
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
                <span>providers</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
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
                            ? "bg-violet-600 text-white hover:bg-violet-700"
                            : "border-violet-200 text-violet-700 hover:bg-violet-50"
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
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
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
                  className="border border-violet-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="bg-white">
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
                className="border-violet-200 focus:border-violet-400 focus:ring-blue-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false);
                setSelectedProvider(null);
                setSuspensionReason("");
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
                "Suspend Provider"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Horizontal Provider Card
function ProviderCard({
  provider,
  onViewDetails,
  onSuspend,
  onUnsuspend,
  processing,
}: {
  provider: Provider;
  onViewDetails: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  processing: boolean;
}) {
  // Calculate experience percentage (max 10 years = 100%)
  const experiencePercentage = Math.min((provider.experienceYears / 10) * 100, 100);

  return (
    <div className="group bg-white rounded-2xl shadow-md border border-violet-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative">
        {/* Background with contextual image */}
        <div className="h-32 bg-white relative overflow-hidden border-b border-gray-100">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80')",
            }}
          />
          {/* Gradient overlay for better contrast */}
          <div className="absolute inset-0 bg-linear-to-br from-violet-50/30 to-fuchsia-50/30" />

          {/* View Button - Top Right */}
          <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={onViewDetails}
              className="bg-linear-to-r from-violet-600 to-fuchsia-700 hover:from-violet-700 hover:to-fuchsia-800 text-white p-2 h-9 w-9 shadow-lg"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badge - Top Left */}
          <div className="absolute top-4 left-4 z-20">
            {provider.isSuspended ? (
              <Badge className="bg-red-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm">
                <ShieldAlert className="h-3 w-3 mr-1" />
                Suspended
              </Badge>
            ) : provider.isActive ? (
              <Badge className="bg-violet-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-gray-500/90 text-white border-0 px-3 py-1 backdrop-blur-sm">
                Inactive
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Picture and Experience Bar - Overlapping the background */}
        <div className="absolute top-20 left-6 right-6 z-10 flex items-end gap-4">
          {/* Profile Picture */}
          <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-gray-100 to-gray-200 overflow-hidden border-4 border-white shadow-xl shrink-0">
            {provider.profilePicture ? (
              <img
                src={provider.profilePicture}
                alt={provider.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-violet-500 to-fuchsia-700">
                <span className="text-3xl font-bold text-white">
                  {provider.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Experience Bar - Segmented */}
          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Experience Level
              </span>
            </div>
            {/* Segmented Experience Bar */}
            <div className="flex gap-1.5">
              {[...Array(10)].map((_, index) => {
                const yearLevel = index + 1;
                const isFilled = yearLevel <= provider.experienceYears;
                // Calculate color intensity - darker as experience increases
                const intensity = isFilled ? Math.min((yearLevel / 10) * 100, 100) : 0;
                const blueValue = isFilled ? Math.max(255 - (yearLevel * 15), 100) : 226;
                const bgColor = isFilled
                  ? `rgb(37, ${blueValue}, 235)`
                  : 'rgb(229, 231, 235)';

                return (
                  <div
                    key={index}
                    className="flex-1 h-2 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: bgColor,
                      opacity: isFilled ? 0.6 + (yearLevel / 10) * 0.4 : 1,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-14 pb-5 px-6">
        {/* Provider Info */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {provider.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-violet-500" />
            <span className="truncate">{provider.email}</span>
          </div>
        </div>

        {/* Stats Row - Three Divs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Reviews */}
          <div className="bg-white rounded-xl p-3 border-2 border-amber-200 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-lg font-bold text-gray-900">
                {parseFloat(provider.averageRating || "0").toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Rating</p>
            <p className="text-xs text-gray-500">({provider.totalReviews} reviews)</p>
          </div>

          {/* Services Completed */}
          <div className="bg-white rounded-xl p-3 border-2 border-violet-200 text-center">
            <Briefcase className="h-4 w-4 text-violet-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{provider.totalJobsCompleted}</p>
            <p className="text-xs text-gray-600 font-medium">Completed</p>
          </div>

          {/* Years of Experience */}
          <div className="bg-white rounded-xl p-3 border-2 border-violet-200 text-center">
            <Award className="h-4 w-4 text-violet-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{provider.experienceYears}</p>
            <p className="text-xs text-gray-600 font-medium">Years Exp.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {provider.isSuspended ? (
            <Button
              onClick={onUnsuspend}
              disabled={processing}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-10 font-medium"
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Activate
            </Button>
          ) : (
            <Button
              onClick={onSuspend}
              disabled={processing}
              variant="outline"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 h-10 font-medium"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" />
              Suspend
            </Button>
          )}
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
      <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mb-4">
        <Search className="h-8 w-8 text-violet-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== "all" ? "No providers found" : "No providers yet"}
      </h3>
      <p className="text-sm text-gray-600">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : statusFilter !== "all"
          ? `You don't have any ${statusFilter} providers`
          : "Service providers will appear here once they register"}
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
