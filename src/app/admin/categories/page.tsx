"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  Loader2,
  FolderKanban,
  CheckCircle,
  XCircle,
  TrendingUp,
  Layers,
  Zap,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { IconRenderer } from "@/components/ui/icon-renderer";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  priceRange?: {
    min?: number;
    max?: number;
    unit?: string;
  };
  commonServices?: Array<{
    name: string;
    typicalPrice: number;
    duration: string;
  }>;
  requiredSkills?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCategories();
      const apiData = Array.isArray(response)
        ? response
        : (response as any).data || [];
      setCategories(apiData);
    } catch (error: any) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      searchQuery === "" ||
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && category.isActive) ||
      (statusFilter === "inactive" && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const handleToggleStatus = async (category: Category) => {
    try {
      setProcessing(true);
      await adminApi.toggleCategoryStatus(category.id);
      toast.success(
        `Category ${category.isActive ? "deactivated" : "activated"} successfully`,
      );
      loadCategories();
    } catch (error: any) {
      toast.error("Failed to toggle category status");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setProcessing(true);
      await adminApi.deleteCategory(categoryToDelete.id);
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete category",
      );
    } finally {
      setProcessing(false);
    }
  };

  // Calculate stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const inactiveCategories = categories.filter((c) => !c.isActive).length;
  const totalServices = categories.reduce(
    (acc, cat) => acc + (cat.commonServices?.length || 0),
    0,
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Categories
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage service categories on your platform
          </p>
        </div>
        <Button
          onClick={() => router.push("/admin/categories/new")}
          className="bg-linear-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white shadow-lg shadow-blue-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Categories */}
        <div className="bg-linear-to-br from-violet-50 to-fuchsia-100 border border-violet-200 rounded-2xl p-5 shadow-lg shadow-blue-100/50 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-violet-700">
                Total Categories
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-violet-800">
                {totalCategories}
              </p>
            </div>
            <div className="h-12 w-12 bg-linear-to-br from-violet-400 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
              <FolderKanban className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Active Categories */}
        <div className="bg-linear-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5 shadow-lg shadow-emerald-100/50 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-emerald-700">Active</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-800">
                {activeCategories}
              </p>
            </div>
            <div className="h-12 w-12 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Inactive Categories */}
        <div className="bg-linear-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-2xl p-5 shadow-lg shadow-violet-100/50 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-violet-700">Inactive</p>
              <p className="text-2xl sm:text-3xl font-bold text-violet-800">
                {inactiveCategories}
              </p>
            </div>
            <div className="h-12 w-12 bg-linear-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Total Services */}
        <div className="bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5 shadow-lg shadow-slate-100/50 hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">
                Total Services
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                {totalServices}
              </p>
            </div>
            <div className="h-12 w-12 bg-linear-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-violet-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500" />
            <Input
              type="text"
              placeholder="Search by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-violet-200 focus:border-violet-400 focus:ring-blue-400"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-48 border-violet-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories List */}
      {paginatedCategories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {paginatedCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-2xl shadow-lg border border-violet-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Gradient Header */}
                <div className="bg-linear-to-r from-violet-50 to-fuchsia-100 px-6 py-4 border-b border-violet-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 bg-linear-to-br from-violet-400 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <IconRenderer
                          iconName={category.icon}
                          className="h-5 w-5 text-white"
                          fallback={<FolderKanban className="h-5 w-5 text-white" />}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {category.name}
                          </h3>
                          {category.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 border-gray-200 shrink-0">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-violet-600 font-mono font-medium">
                          /{category.slug}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Description */}
                  {category.description && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Price Range */}
                    {category.priceRange && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                          <TrendingUp className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Price Range</p>
                          <p className="font-medium text-gray-800">
                            ₹{category.priceRange.min} - ₹
                            {category.priceRange.max}
                            {category.priceRange.unit &&
                              `/${category.priceRange.unit}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Skills Count */}
                    {category.requiredSkills &&
                      category.requiredSkills.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                            <Shield className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Required Skills
                            </p>
                            <p className="font-medium text-gray-800">
                              {category.requiredSkills.length} skills
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Services Count */}
                    {category.commonServices &&
                      category.commonServices.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="h-8 w-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                            <Layers className="h-4 w-4 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">
                              Common Services
                            </p>
                            <p className="font-medium text-gray-800">
                              {category.commonServices.length} services
                            </p>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/categories/${category.id}`)
                      }
                      className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(category)}
                      disabled={processing}
                      className={
                        category.isActive
                          ? "border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                      }
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {category.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={processing}
                      className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCategories.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </>
      ) : (
        <EmptyState searchQuery={searchQuery} statusFilter={statusFilter} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-violet-100 to-fuchsia-100 rounded-full mb-4 sm:mb-6">
        <FolderKanban className="h-8 w-8 sm:h-10 sm:w-10 text-violet-600" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
        {searchQuery || statusFilter !== "all"
          ? "No categories found"
          : "No categories yet"}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
        {searchQuery
          ? "Try adjusting your search terms or filters"
          : statusFilter !== "all"
            ? `You don't have any ${statusFilter} categories`
            : "Get started by creating your first service category"}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>

      {/* Search Skeleton */}
      <div className="bg-white rounded-2xl p-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationControlsProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-violet-100 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Items Info */}
        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">{startItem}</span> to{" "}
          <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
          <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
          categories
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) =>
              typeof page === "number" ? (
                <Button
                  key={index}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={
                    currentPage === page
                      ? "bg-linear-to-r from-violet-500 to-fuchsia-600 text-white border-0"
                      : "border-violet-200 text-violet-700 hover:bg-violet-50"
                  }
                >
                  {page}
                </Button>
              ) : (
                <span key={index} className="px-2 text-gray-500">
                  {page}
                </span>
              ),
            )}
          </div>

          {/* Mobile Page Indicator */}
          <div className="sm:hidden text-sm font-medium text-violet-700 px-3">
            Page {currentPage} of {totalPages}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
