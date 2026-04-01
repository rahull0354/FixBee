"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { customerApi } from "@/lib/api";
import { Category } from "@/types";
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  Loader2,
  IndianRupee,
  ChevronRight,
  X,
} from "lucide-react";
import { IconRenderer } from "@/components/ui/icon-renderer";
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function BrowseServicesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchQuery, maxPrice, categories]);

  const filterCategories = () => {
    let filtered = categories;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.commonServices.some((service) => {
            // Handle both string and object formats
            const serviceName =
              typeof service === "string" ? service : service.name;
            return serviceName
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          }),
      );
    }

    // Apply price filter
    if (maxPrice < 10000) {
      filtered = filtered.filter((cat) => {
        if (!cat.priceRange) return false;
        return cat.priceRange.min <= maxPrice;
      });
    }

    setFilteredCategories(filtered);
    setHasActiveFilters(searchQuery !== "" || maxPrice < 10000);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMaxPrice(10000);
    setFilterDialogOpen(false);
  };

  const applyFilters = () => {
    setFilterDialogOpen(false);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCategories();
      const data: Category[] = (response as any).data || response || [];
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load service categories");
    } finally {
      setLoading(false);
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="flex-1 h-12" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>

        {/* Categories Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
              <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Browse Services
        </h1>
        <p className="text-gray-600">Explore our wide range of home services</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-sky-50 rounded-xl border border-sky-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setFilterDialogOpen(true)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow ${
              hasActiveFilters
                ? "bg-linear-to-r from-amber-400 via-orange-400 to-red-400 text-white"
                : "bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white"
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
          <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-10 w-10 text-sky-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No services found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/customer/services/${category.slug}`}
              className="group bg-white rounded-2xl shadow-lg border border-sky-100 p-6 hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <IconRenderer
                  iconName={category.icon}
                  className="h-8 w-8 text-white"
                  fallback={<Briefcase className="h-8 w-8 text-white" />}
                />
              </div>

              {/* Name */}
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-sky-600 transition-colors">
                {category.name}
              </h3>

              {/* Description */}
              {category.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}

              {/* Price Range */}
              {category.priceRange && (
                <div className="flex items-center gap-2 mb-4">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-gray-700 font-medium">
                    {category.priceRange.min} - {category.priceRange.max}{" "}
                    {category.priceRange.unit}
                  </span>
                </div>
              )}

              {/* Common Services */}
              {category.commonServices.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Common services:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.commonServices
                      .slice(0, 3)
                      .map((service, index) => {
                        // Handle both string and object formats
                        const serviceName =
                          typeof service === "string" ? service : service.name;
                        return (
                          <span
                            key={
                              typeof service === "string"
                                ? index
                                : service._id || index
                            }
                            className="px-3 py-1 bg-sky-50 text-sky-700 text-xs rounded-full border border-sky-200"
                          >
                            {serviceName}
                          </span>
                        );
                      })}
                    {category.commonServices.length > 3 && (
                      <span className="px-3 py-1 bg-sky-50 text-sky-700 text-xs rounded-full border border-sky-200">
                        +{category.commonServices.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* View Details Link */}
              <div className="flex items-center text-sky-600 font-medium text-sm group-hover:text-sky-700">
                View details <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-137.5 p-0 overflow-hidden bg-white">
          {/* Header with Gradient */}
          <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 px-6 py-5 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-6 w-6" />
                Filter Services
              </DialogTitle>
              <DialogDescription className="text-sky-100 text-base">
                Customize your search to find the perfect service
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Max Price Filter */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="maxPrice"
                  className="text-lg font-bold text-gray-800 flex items-center gap-2"
                >
                  <IndianRupee className="h-5 w-5 text-emerald-600" />
                  Maximum Price
                </Label>
                <span
                  className={`px-4 py-2 rounded-xl font-bold text-lg ${
                    maxPrice >= 10000
                      ? "bg-gray-100 text-gray-600"
                      : "bg-linear-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {maxPrice >= 10000
                    ? "Any Price"
                    : `$${maxPrice.toLocaleString()}`}
                </span>
              </div>

              {/* Custom Range Slider */}
              <div className="relative pt-2">
                <input
                  id="maxPrice"
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-3 bg-linear-to-r from-sky-100 via-blue-100 to-indigo-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-linear-to-br [&::-webkit-slider-thumb]:from-sky-400 [&::-webkit-slider-thumb]:to-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-linear-to-br [&::-moz-range-thumb]:from-sky-400 [&::-moz-range-thumb]:to-blue-500 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-3 font-medium">
                  <span>₹0</span>
                  <span>₹2.5K</span>
                  <span>₹5K</span>
                  <span>₹7.5K</span>
                  <span>₹10K+</span>
                </div>
              </div>

              {/* Price Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Under ₹500", value: 500 },
                  { label: "₹500 - ₹1K", value: 1000 },
                  { label: "₹1K - ₹2.5K", value: 2500 },
                  { label: "₹2.5K - ₹5K", value: 5000 },
                  { label: "Any Price", value: 10000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setMaxPrice(preset.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      maxPrice === preset.value
                        ? "bg-linear-to-r from-sky-400 to-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-sky-200">
                <p className="text-base font-bold text-sky-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                  Active Filters
                </p>
                <div className="space-y-2">
                  {searchQuery && (
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-sky-100">
                      <div className="p-2 bg-sky-100 rounded-lg">
                        <Search className="h-4 w-4 text-sky-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">
                          Search Query
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          "{searchQuery}"
                        </p>
                      </div>
                    </div>
                  )}
                  {maxPrice < 10000 && (
                    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-emerald-100">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">
                          Maximum Price
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          ${maxPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
              <Briefcase className="h-4 w-4" />
              <span className="font-medium">
                Showing{" "}
                <strong className="text-sky-600">
                  {filteredCategories.length}
                </strong>{" "}
                of {categories.length} services
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full sm:w-auto h-11 text-base font-semibold border-2 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              <Button
                onClick={applyFilters}
                className="w-full sm:w-auto h-11 text-base font-semibold bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Apply Filters
                {filteredCategories.length !== categories.length && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {categories.length - filteredCategories.length} filtered
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

