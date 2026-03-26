"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { customerApi } from "@/lib/api";
import { Category } from "@/types";
import {
  calculateServicePrice,
  getAdminCommissionFromCategory,
  formatPrice,
} from "@/lib/utils/pricing";
import {
  Calendar,
  MapPin,
  FileText,
  Loader2,
  Briefcase,
  Clock,
  User,
  ArrowLeft,
  CheckCircle2,
  Wrench as FixBeeIcon,
  IndianRupee,
  Info,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from '@/components/ui/skeleton';

// Time slots
const timeSlots = [
  { value: "morning", label: "Morning (8AM - 12PM)", icon: "🌅" },
  { value: "afternoon", label: "Afternoon (12PM - 5PM)", icon: "☀️" },
  { value: "evening", label: "Evening (5PM - 8PM)", icon: "🌆" },
];

// Payment methods
const paymentMethods = [
  {
    value: "cash",
    label: "Cash",
    icon: "💵",
    description: "Pay directly to the provider after service",
  },
  {
    value: "card",
    label: "Credit/Debit Card",
    icon: "💳",
    description: "Pay via card after service completion",
  },
  {
    value: "upi",
    label: "UPI",
    icon: "📱",
    description: "Pay using UPI apps (GPay, PhonePe, etc.)",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    icon: "🏦",
    description: "Direct bank transfer to provider",
  },
];

// Validation schema
const serviceRequestSchema = z.object({
  categoryId: z.string().min(1, "Please select a service category"),
  serviceType: z.string().min(1, "Service type is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  scheduledDate: z.string().min(1, "Please select a date"),
  scheduledTimeSlot: z.string().min(1, "Please select a time slot"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().optional(),
  }),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  additionalNotes: z.string().optional(),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

export default function NewServiceRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCategoryId = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 9;

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);

  // Move to next step (no validation, let user navigate freely)
  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle previous step
  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Price estimation states
  const [priceEstimate, setPriceEstimate] = useState<{
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    providerCount: number;
    breakdown: {
      minProviderRate: number;
      maxProviderRate: number;
      adminCommission: any;
    };
  } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    mode: "onTouched", // Only validate after user interacts with field
    defaultValues: {
      categoryId: preSelectedCategoryId || "",
    },
  });

  const selectedCategoryId = watch("categoryId");
  const selectedCity = watch("address.city");

  // Get all form values for validation
  const formValues = watch();

  // Filter categories based on search query
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const startIndex = (currentPage - 1) * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    loadCategories();
    if (preSelectedCategoryId) {
      setValue("categoryId", preSelectedCategoryId);
    }
  }, [preSelectedCategoryId, setValue]);

  // Update serviceType when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const selectedCategory = categories.find(
        (cat) => cat.id === selectedCategoryId,
      );
      if (selectedCategory) {
        setValue("serviceType", selectedCategory.name);
      }
    }
  }, [selectedCategoryId, categories, setValue]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await customerApi.getCategories();
      const data: Category[] = (response as any).data || response || [];
      setCategories(data.filter((cat) => cat.isActive));
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load service categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load price estimate when category or city changes
  useEffect(() => {
    if (selectedCategoryId) {
      loadPriceEstimate(selectedCategoryId, selectedCity);
    } else {
      setPriceEstimate(null);
    }
  }, [selectedCategoryId, selectedCity]);

  const loadPriceEstimate = async (categoryId: string, city?: string) => {
    try {
      setLoadingPrice(true);

      // Get category details including admin commission
      const selectedCategory = categories.find((cat) => cat.id === categoryId);
      if (!selectedCategory) return;

      const adminCommission = getAdminCommissionFromCategory(selectedCategory);

      // Try to fetch real providers from API
      let providers: any[] = [];

      try {
        const response = await customerApi.getProvidersByCategory(
          categoryId,
          city,
        );
        const data = (response as any).data || response;
        providers = Array.isArray(data) ? data : data.providers || [];
      } catch (apiError) {
        console.log("API not available, using mock data for price estimation");
        // Use mock data if API fails
        providers = [
          { baseRate: 300, name: "Provider 1" },
          { baseRate: 500, name: "Provider 2" },
          { baseRate: 700, name: "Provider 3" },
          { baseRate: 450, name: "Provider 4" },
          { baseRate: 600, name: "Provider 5" },
        ];
      }

      // Filter providers that have baseRate set
      const providersWithRates = providers.filter(
        (p) => p.baseRate && p.baseRate > 0,
      );

      if (providersWithRates.length === 0) {
        // If no providers have rates, show a default range
        setPriceEstimate({
          minPrice: 200,
          maxPrice: 1000,
          avgPrice: 600,
          providerCount: 0,
          breakdown: {
            minProviderRate: 200,
            maxProviderRate: 1000,
            adminCommission,
          },
        });
        return;
      }

      // Calculate prices for each provider
      const prices = providersWithRates.map((provider) => {
        const providerRate =
          typeof provider.baseRate === "string"
            ? parseFloat(provider.baseRate)
            : provider.baseRate;

        const pricing = calculateServicePrice(
          providerRate,
          adminCommission,
          0, // No additional charges for estimate
        );
        return pricing.total;
      });

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      const providerRates = providersWithRates.map((p) =>
        typeof p.baseRate === "string" ? parseFloat(p.baseRate) : p.baseRate,
      );

      setPriceEstimate({
        minPrice,
        maxPrice,
        avgPrice,
        providerCount: providersWithRates.length,
        breakdown: {
          minProviderRate: Math.min(...providerRates),
          maxProviderRate: Math.max(...providerRates),
          adminCommission,
        },
      });
    } catch (error) {
      console.error("Error loading price estimate:", error);
      // Don't show toast for price estimate errors, just log them
    } finally {
      setLoadingPrice(false);
    }
  };

  const onSubmit = async (data: ServiceRequestFormData) => {
    try {
      setLoading(true);

      // Get selected category to determine service type
      const selectedCategory = categories.find(
        (cat) => cat.id === data.categoryId,
      );

      const serviceType =
        selectedCategory?.name || data.serviceType || "General";

      // Transform data to match backend expectations
      const requestData = {
        serviceType: serviceType,
        serviceCategoryId: data.categoryId,
        serviceTitle: data.title,
        serviceDescription: data.description,
        additionalNotes: data.additionalNotes,
        paymentMethod: data.paymentMethod,
        schedule: {
          date: data.scheduledDate,
          timeSlot: data.scheduledTimeSlot,
        },
        serviceAddress: {
          ...data.address,
          pincode: data.address.zipCode, // Backend expects 'pincode' not 'zipCode'
        },
      };

      const response = await customerApi.createServiceRequest(requestData);

      const newRequest: any = (response as any).data || response;

      toast.success("Service request created successfully!");
      router.push("/customer/requests");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create service request";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  // Skeleton loading state for categories
  if (categoriesLoading) {
    return (
      <div className="space-y-8 pb-8">
        {/* Hero Header Skeleton */}
        <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
          <Skeleton className="h-10 w-64 bg-white/20 mb-2" />
          <Skeleton className="h-5 w-96 bg-white/20" />
        </div>

        {/* Categories Grid Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <Skeleton className="h-7 w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="border border-sky-200 rounded-2xl p-6 hover:border-sky-400 hover:shadow-lg transition-all">
                <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hidden field for serviceType */}
      <input type="hidden" {...register("serviceType")} />

      {/* Hero Header */}
      <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 h-36 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sky-100 hover:text-white mb-4 sm:mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </button>

          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border-2 border-white/30">
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                Create Service Request
              </h1>
              <p className="text-sky-100 text-sm sm:text-base">
                Fill in the details to book a home service
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-6 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border transition-all ${
                  currentStep >= 1
                    ? "bg-white text-sky-600 border-white"
                    : "bg-white/20 backdrop-blur-sm border-white/30 text-white"
                }`}
              >
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <span
                className={`text-xs sm:text-sm ${currentStep >= 1 ? "text-white font-semibold" : "text-sky-100"}`}
              >
                Service
              </span>
            </div>
            <div
              className={`flex-1 h-0.5 transition-all ${currentStep > 1 ? "bg-white" : "bg-white/20"}`}
            />
            <div className="flex items-center gap-1 sm:gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border transition-all ${
                  currentStep >= 2
                    ? "bg-white text-sky-600 border-white"
                    : "bg-white/20 backdrop-blur-sm border-white/30 text-white"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <span
                className={`text-xs sm:text-sm ${currentStep >= 2 ? "text-white font-semibold" : "text-sky-100"}`}
              >
                Details
              </span>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
        style={{ position: "relative", zIndex: 1 }}
      >
        {currentStep === 1 && (
          <>
            {/* Service Category */}
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
              <div className="bg-linear-to-r from-sky-50 to-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-sky-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-sky-200 rounded-lg">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-sky-700" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800">
                      Service Category
                    </h2>
                    <p className="text-xs text-gray-600">
                      Select the type of service you need
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-sky-50 rounded-xl border border-sky-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
                  />
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                {/* Results Count */}
                {!categoriesLoading && filteredCategories.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredCategories.length)} of{" "}
                    {filteredCategories.length} categories
                  </p>
                )}

                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-800 font-semibold mb-2">
                      No categories found
                    </p>
                    <p className="text-gray-600 text-sm">
                      Try adjusting your search query
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {paginatedCategories.map((category) => (
                      <label
                        key={category.id}
                        className={`relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedCategoryId === category.id
                            ? "border-sky-500 bg-sky-50 shadow-md"
                            : "border-sky-100 hover:border-sky-300 hover:shadow-md"
                        }`}
                      >
                        <input
                          type="radio"
                          value={category.id}
                          {...register("categoryId")}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {category.icon && (
                              <span className="text-2xl">{category.icon}</span>
                            )}
                            <p className="font-semibold text-gray-800">
                              {category.name}
                            </p>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600">
                              {category.description}
                            </p>
                          )}
                        </div>
                        {selectedCategoryId === category.id && (
                          <CheckCircle2 className="h-5 w-5 text-sky-500 shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {filteredCategories.length > categoriesPerPage && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-sky-100">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-sky-200 text-sm font-medium text-gray-700 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                              currentPage === page
                                ? "bg-linear-to-r from-sky-400 to-blue-400 text-white shadow-md"
                                : "border border-sky-200 text-gray-700 hover:bg-sky-50"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-sky-200 text-sm font-medium text-gray-700 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}

                {errors.categoryId && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.categoryId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-sky-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800">
                      Service Details
                    </h2>
                    <p className="text-xs text-gray-600">
                      Tell us more about what you need
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Service Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Fix leaking kitchen faucet"
                    {...register("title")}
                    className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                      errors.title ? "border-red-500" : ""
                    }`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠️</span>
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder="Please describe the issue or service you need in detail. Include any relevant information that will help the provider understand the work required..."
                    {...register("description")}
                    className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl resize-none ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠️</span>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label
                    htmlFor="additionalNotes"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    rows={3}
                    placeholder="Any other information that might be helpful..."
                    {...register("additionalNotes")}
                    className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl resize-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* Step 1 Summary */}
            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
              <div className="bg-linear-to-r from-sky-50 to-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-sky-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-sky-200 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-sky-700" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800">
                      Service Selection Summary
                    </h2>
                    <p className="text-xs text-gray-600">
                      Review your chosen service
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-sky-50 rounded-xl border border-sky-200">
                  <div className="p-3 bg-sky-200 rounded-lg">
                    <Briefcase className="h-6 w-6 text-sky-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      Service Category
                    </p>
                    <p className="font-semibold text-gray-800">
                      {categories.find((c) => c.id === selectedCategoryId)
                        ?.name || "Not selected"}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Title:</span>{" "}
                      {formValues.title || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Estimation */}
            {selectedCategoryId && (
              <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
                <div className="bg-linear-to-r from-amber-50 to-orange-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-sky-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-amber-200 rounded-lg">
                      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">
                        Price Estimation
                      </h2>
                      <p className="text-xs text-gray-600">
                        Estimated cost for your service
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {loadingPrice ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                      <span className="ml-3 text-gray-600">
                        Calculating price estimate...
                      </span>
                    </div>
                  ) : priceEstimate ? (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Price Range */}
                      <div className="bg-linear-to-r from-sky-50 via-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-sky-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1 sm:mb-2">
                              Estimated Price Range
                            </p>
                            <div className="flex items-baseline gap-1 sm:gap-2">
                              <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                                {formatPrice(priceEstimate.minPrice)}
                              </span>
                              <span className="text-lg sm:text-xl text-gray-500">-</span>
                              <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                                {formatPrice(priceEstimate.maxPrice)}
                              </span>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-sm text-gray-600 mb-1">
                              Average
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-sky-600">
                              {formatPrice(priceEstimate.avgPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Info className="h-4 w-4 text-sky-500 shrink-0" />
                          <span className="wrap-break-word">
                            Based on {priceEstimate.providerCount} available
                            providers in your area
                          </span>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-sky-500" />
                          Price Breakdown
                        </h3>

                        <div className="space-y-2 sm:space-y-3">
                          {/* Provider Charge */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500 shrink-0" />
                              <span className="text-sm text-gray-700">
                                Provider's Charge
                              </span>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-sm font-semibold text-gray-800 wrap-break-word">
                                {formatPrice(
                                  priceEstimate.breakdown.minProviderRate,
                                )}{" "}
                                -{" "}
                                {formatPrice(
                                  priceEstimate.breakdown.maxProviderRate,
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                What the provider earns
                              </p>
                            </div>
                          </div>

                          {/* Admin Commission */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-sky-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-sky-500 shrink-0" />
                              <span className="text-sm text-gray-700">
                                Platform Fee
                              </span>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-sm font-semibold text-sky-700 wrap-break-word">
                                {priceEstimate.breakdown.adminCommission
                                  .type === "percentage"
                                  ? `${priceEstimate.breakdown.adminCommission.percentage || 0}%`
                                  : formatPrice(
                                      priceEstimate.breakdown.adminCommission
                                        .fixed || 0,
                                    )}
                              </p>
                              <p className="text-xs text-gray-500">
                                Service platform commission
                              </p>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-linear-to-r from-sky-100 to-blue-100 rounded-lg border-2 border-sky-300">
                            <div className="flex items-center gap-2">
                              <IndianRupee className="h-4 w-4 text-sky-600 shrink-0" />
                              <span className="text-sm font-semibold text-gray-800">
                                You Pay
                              </span>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-base sm:text-lg font-bold text-sky-700 wrap-break-word">
                                {formatPrice(priceEstimate.minPrice)} -{" "}
                                {formatPrice(priceEstimate.maxPrice)}
                              </p>
                              <p className="text-xs text-gray-600">
                                Final price after provider assignment
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info Note */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Note:</strong> This is an estimated price
                            range. The final price will be determined by the
                            assigned provider based on the actual work required.
                            Additional charges may apply for materials or urgent
                            services.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <IndianRupee className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-gray-600">
                        Unable to load price estimate
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Please try again later
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schedule, Address and Payment Method - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Schedule */}
              <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
                <div className="bg-linear-to-r from-emerald-50 to-teal-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-sky-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-emerald-200 rounded-lg">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">
                        Schedule
                      </h2>
                      <p className="text-xs text-gray-600">
                        Choose your preferred date and time
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="scheduledDate"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Preferred Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      min={today}
                      {...register("scheduledDate")}
                      className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                        errors.scheduledDate ? "border-red-500" : ""
                      }`}
                    />
                    {errors.scheduledDate && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span>⚠️</span>
                        {errors.scheduledDate.message}
                      </p>
                    )}
                  </div>

                  {/* Time Slot */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Preferred Time Slot{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {timeSlots.map((slot) => (
                        <label
                          key={slot.value}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            watch("scheduledTimeSlot") === slot.value
                              ? "border-sky-500 bg-sky-50 shadow-md"
                              : "border-sky-100 hover:border-sky-300 hover:shadow-md"
                          }`}
                        >
                          <input
                            type="radio"
                            value={slot.value}
                            {...register("scheduledTimeSlot")}
                            className="mt-1"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-2xl">{slot.icon}</span>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">
                                {slot.label.split(" ")[0]}
                              </p>
                              <p className="text-xs text-gray-600">
                                {slot.label.split(" ").slice(1).join(" ")}
                              </p>
                            </div>
                          </div>
                          {watch("scheduledTimeSlot") === slot.value && (
                            <CheckCircle2 className="h-5 w-5 text-sky-500 shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                    {errors.scheduledTimeSlot && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span>⚠️</span>
                        {errors.scheduledTimeSlot.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Address */}
              <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
                <div className="bg-linear-to-r from-violet-50 to-purple-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-sky-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-violet-200 rounded-lg">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-violet-700" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">
                        Service Address
                      </h2>
                      <p className="text-xs text-gray-600">
                        Where should the provider come?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="address.street"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address.street"
                      placeholder="123 Main Street, Apt 4B"
                      {...register("address.street")}
                      className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                        errors.address?.street ? "border-red-500" : ""
                      }`}
                    />
                    {errors.address?.street && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span>⚠️</span>
                        {errors.address.street.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="address.city"
                        className="text-sm font-semibold text-gray-700"
                      >
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address.city"
                        placeholder="New York"
                        {...register("address.city")}
                        className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                          errors.address?.city ? "border-red-500" : ""
                        }`}
                      />
                      {errors.address?.city && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span>⚠️</span>
                          {errors.address.city.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="address.state"
                        className="text-sm font-semibold text-gray-700"
                      >
                        State <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address.state"
                        placeholder="NY"
                        {...register("address.state")}
                        className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                          errors.address?.state ? "border-red-500" : ""
                        }`}
                      />
                      {errors.address?.state && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span>⚠️</span>
                          {errors.address.state.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="address.zipCode"
                        className="text-sm font-semibold text-gray-700"
                      >
                        ZIP Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address.zipCode"
                        placeholder="100001"
                        {...register("address.zipCode")}
                        className={`border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                          errors.address?.zipCode ? "border-red-500" : ""
                        }`}
                      />
                      {errors.address?.zipCode && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <span>⚠️</span>
                          {errors.address.zipCode.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="address.country"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Country (Optional)
                      </Label>
                      <Input
                        id="address.country"
                        placeholder="United States"
                        {...register("address.country")}
                        className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
                <div className="bg-linear-to-r from-rose-50 to-pink-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-sky-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-rose-200 rounded-lg">
                      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-rose-700" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">
                        Payment Method
                      </h2>
                      <p className="text-xs text-gray-600">
                        Select how you'd like to pay
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.value}
                        className={`relative flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          watch("paymentMethod") === method.value
                            ? "border-sky-500 bg-sky-50 shadow-md"
                            : "border-sky-100 hover:border-sky-300 hover:shadow-md"
                        }`}
                      >
                        <input
                          type="radio"
                          value={method.value}
                          {...register("paymentMethod")}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{method.icon}</span>
                            <p className="font-semibold text-gray-800 text-sm">
                              {method.label}
                            </p>
                          </div>
                          <p className="text-xs text-gray-600">
                            {method.description}
                          </p>
                        </div>
                        {watch("paymentMethod") === method.value && (
                          <CheckCircle2 className="h-5 w-5 text-sky-500 shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠️</span>
                      {errors.paymentMethod.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-sky-100">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {currentStep === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-sm sm:text-base"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto px-8 sm:px-10 py-3 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                >
                  Next Step
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-sm sm:text-base"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full sm:w-auto px-8 sm:px-10 py-3 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                >
                  {loading || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Create Request
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
