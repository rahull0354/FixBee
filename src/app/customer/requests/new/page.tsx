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
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Sunrise,
  Sun,
  Sunset,
  ChevronRight,
} from "lucide-react";
import { IconRenderer } from "@/components/ui/icon-renderer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CalendarFilter } from "@/components/customer/CalendarFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Time slots
const timeSlots = [
  { value: "morning", label: "Morning (8AM - 12PM)", icon: "Sunrise" },
  { value: "afternoon", label: "Afternoon (12PM - 5PM)", icon: "Sun" },
  { value: "evening", label: "Evening (5PM - 8PM)", icon: "Sunset" },
];

// Payment methods
const paymentMethods = [
  {
    value: "cash",
    label: "Cash",
    icon: "Banknote",
    description: "Pay directly to the provider after service",
  },
  {
    value: "card",
    label: "Credit/Debit Card",
    icon: "CreditCard",
    description: "Pay via card after service completion",
  },
  {
    value: "upi",
    label: "UPI",
    icon: "Smartphone",
    description: "Pay using UPI apps (GPay, PhonePe, etc.)",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    icon: "Building",
    description: "Direct bank transfer to provider",
  },
];

// Validation schema
const serviceRequestSchema = z.object({
  categoryId: z.string().min(1, "Please select a service category"),
  serviceType: z.string().min(1, "Service type is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  scheduledDate: z
    .string()
    .min(1, "Please select a preferred date for your service"),
  scheduledTimeSlot: z
    .string()
    .min(1, "Please select your preferred time slot"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().optional(),
  }),
  paymentMethod: z
    .any()
    .refine(
      (val) =>
        val !== null &&
        val !== undefined &&
        typeof val === "string" &&
        val.length > 0,
      {
        message: "Please select your preferred payment method",
      },
    )
    .transform((val) => String(val ?? "")),
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

  // Tab state
  const [activeTab, setActiveTab] = useState(1);

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
    setError,
    clearErrors,
    getValues,
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    mode: "onSubmit",
    defaultValues: {
      categoryId: preSelectedCategoryId || "",
      scheduledDate: "",
      scheduledTimeSlot: "",
      paymentMethod: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
      },
    },
  });

  const selectedCategoryId = watch("categoryId");
  const selectedCity = watch("address.city");

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
        loadPriceEstimate(selectedCategory.id, selectedCity);
      }
    }
  }, [selectedCategoryId, categories, selectedCity, setValue]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await customerApi.getCategories();
      const data: Category[] = (response as any).data || response || [];
      setCategories(data.filter((cat) => cat.isActive));
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load service categories");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadPriceEstimate = async (categoryId: string, city?: string) => {
    if (!categoryId) return;

    try {
      setLoadingPrice(true);

      // Get admin commission from category
      const category = categories.find((cat) => cat.id === categoryId);
      const adminCommission = getAdminCommissionFromCategory(category);

      // Mock API call for providers in the service area
      // In production, this would be: await customerApi.getServiceProviders({ categoryId, city });
      const mockProviders = Array.from(
        { length: Math.floor(Math.random() * 8) + 3 },
        () => ({
          hourlyRate: Math.floor(Math.random() * 500) + 200, // Random rate between 200-700
        }),
      );

      if (mockProviders.length === 0) {
        setPriceEstimate(null);
        return;
      }

      const providerRates = mockProviders.map((p) => p.hourlyRate);
      const minProviderRate = Math.min(...providerRates);
      const maxProviderRate = Math.max(...providerRates);
      const avgProviderRate =
        providerRates.reduce((sum, rate) => sum + rate, 0) /
        providerRates.length;

      // Calculate price range (estimated 2-4 hours)
      const minPriceResult = calculateServicePrice(
        minProviderRate,
        adminCommission,
        0, // No additional charge
      );
      const maxPriceResult = calculateServicePrice(
        maxProviderRate,
        adminCommission,
        0, // No additional charge
      );
      const avgPriceResult = calculateServicePrice(
        avgProviderRate,
        adminCommission,
        0, // No additional charge
      );

      const minPrice = minPriceResult.total * 2; // 2 hours minimum
      const maxPrice = maxPriceResult.total * 4; // 4 hours maximum
      const avgPrice = avgPriceResult.total * 3; // 3 hours average

      setPriceEstimate({
        minPrice,
        maxPrice,
        avgPrice,
        providerCount: mockProviders.length,
        breakdown: {
          minProviderRate,
          maxProviderRate,
          adminCommission,
        },
      });
    } catch (error) {
      console.error("Error loading price estimate:", error);
    } finally {
      setLoadingPrice(false);
    }
  };

  // Validation functions for each tab
  const isTab1Valid = () => {
    const values = getValues();
    return !!(
      values.categoryId &&
      values.title &&
      values.title.length >= 5 &&
      values.description &&
      values.description.length >= 20
    );
  };

  const isTab2Valid = () => {
    const values = getValues();
    return !!(values.scheduledDate && values.scheduledTimeSlot);
  };

  const isTab3Valid = () => {
    const values = getValues();
    return !!(
      values.address?.street &&
      values.address?.city &&
      values.address?.state &&
      values.address?.zipCode
    );
  };

  const canAccessTab = (tabId: number) => {
    if (tabId === 1) return true;
    if (tabId === 2) return isTab1Valid();
    if (tabId === 3) return isTab1Valid() && isTab2Valid();
    if (tabId === 4) return isTab1Valid() && isTab2Valid() && isTab3Valid();
    return false;
  };

  // Clear errors when fields become valid
  useEffect(() => {
    if (watch("categoryId") && errors.categoryId) {
      clearErrors("categoryId");
    }
  }, [watch("categoryId"), errors.categoryId, clearErrors]);

  useEffect(() => {
    if (watch("title") && watch("title").length >= 5 && errors.title) {
      clearErrors("title");
    }
  }, [watch("title"), errors.title, clearErrors]);

  useEffect(() => {
    if (
      watch("description") &&
      watch("description").length >= 20 &&
      errors.description
    ) {
      clearErrors("description");
    }
  }, [watch("description"), errors.description, clearErrors]);

  useEffect(() => {
    if (watch("scheduledDate") && errors.scheduledDate) {
      clearErrors("scheduledDate");
    }
  }, [watch("scheduledDate"), errors.scheduledDate, clearErrors]);

  useEffect(() => {
    if (watch("scheduledTimeSlot") && errors.scheduledTimeSlot) {
      clearErrors("scheduledTimeSlot");
    }
  }, [watch("scheduledTimeSlot"), errors.scheduledTimeSlot, clearErrors]);

  useEffect(() => {
    if (watch("address.street") && errors.address?.street) {
      clearErrors("address.street");
    }
  }, [watch("address.street"), errors.address?.street, clearErrors]);

  useEffect(() => {
    if (watch("address.city") && errors.address?.city) {
      clearErrors("address.city");
    }
  }, [watch("address.city"), errors.address?.city, clearErrors]);

  useEffect(() => {
    if (watch("address.state") && errors.address?.state) {
      clearErrors("address.state");
    }
  }, [watch("address.state"), errors.address?.state, clearErrors]);

  useEffect(() => {
    if (watch("address.zipCode") && errors.address?.zipCode) {
      clearErrors("address.zipCode");
    }
  }, [watch("address.zipCode"), errors.address?.zipCode, clearErrors]);

  const onSubmit = async (data: ServiceRequestFormData) => {
    try {
      setLoading(true);

      const selectedCategory = categories.find(
        (cat) => cat.id === data.categoryId,
      );

      const serviceType =
        selectedCategory?.name || data.serviceType || "General";

      const requestData = {
        serviceType: serviceType,
        serviceCategoryId: String(data.categoryId),
        serviceTitle: String(data.title),
        serviceDescription: String(data.description),
        additionalNotes: data.additionalNotes
          ? String(data.additionalNotes)
          : undefined,
        paymentMethod: String(data.paymentMethod),
        schedule: {
          date: String(data.scheduledDate),
          timeSlot: String(data.scheduledTimeSlot),
        },
        serviceAddress: {
          street: String(data.address.street),
          city: String(data.address.city),
          state: String(data.address.state),
          pincode: String(data.address.zipCode),
          country: data.address.country
            ? String(data.address.country)
            : "India",
        },
      };

      const response = await customerApi.createServiceRequest(requestData);

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

  const today = new Date().toISOString().split("T")[0];

  // Tab navigation
  const tabs = [
    { id: 1, label: "Service Details", icon: Briefcase },
    { id: 2, label: "Schedule", icon: Calendar },
    { id: 3, label: "Location", icon: MapPin },
    { id: 4, label: "Payment", icon: CreditCard },
  ];

  // Skeleton loading
  if (categoriesLoading) {
    return (
      <div className="space-y-8 pb-8">
        {/* Header Skeleton */}
        <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
          <Skeleton className="h-10 w-64 bg-white/20 mb-2" />
          <Skeleton className="h-5 w-96 bg-white/20" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <Skeleton className="h-7 w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <Link
          href="/customer/requests"
          className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Requests
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Create Service Request
        </h1>
        <p className="text-gray-600">
          Fill in the details to book your service
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Progress Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-4 sm:p-6">
          <div className="flex items-center justify-between overflow-x-auto">
            {tabs.map((tab, index) => {
              const canAccess = canAccessTab(tab.id);
              const isAccessible = canAccess || activeTab >= tab.id;

              return (
                <div key={tab.id} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => isAccessible && setActiveTab(tab.id)}
                    disabled={!isAccessible}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === tab.id
                        ? "bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white shadow-lg"
                        : isAccessible
                          ? "bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="hidden sm:inline text-sm">
                      {tab.label}
                    </span>
                    <span className="sm:hidden text-xs">
                      {tab.label.split(" ")[0]}
                    </span>
                  </button>
                  {index < tabs.length - 1 && (
                    <ChevronRight
                      className={`h-5 w-5 mx-2 shrink-0 ${isAccessible ? "text-gray-300" : "text-gray-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6 sm:p-8">
          {/* Tab 1: Service Details */}
          {activeTab === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Select Service Category
                    </h2>
                    <p className="text-gray-600">
                      Choose the type of service you need
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 h-12 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent shadow-sm"
                    />
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedCategories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => setValue("categoryId", category.id)}
                      className={`cursor-pointer rounded-2xl p-6 border-2 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                        selectedCategoryId === category.id
                          ? "border-sky-500 bg-sky-50 shadow-xl"
                          : "border-sky-100 bg-white hover:border-sky-300 shadow-lg"
                      }`}
                    >
                      <input
                        type="radio"
                        value={category.id}
                        {...register("categoryId")}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                            selectedCategoryId === category.id
                              ? "bg-linear-to-br from-sky-400 to-blue-500"
                              : "bg-sky-100"
                          }`}
                        >
                          <IconRenderer
                            iconName={category.icon}
                            className={`h-8 w-8 ${
                              selectedCategoryId === category.id
                                ? "text-white"
                                : "text-sky-600"
                            }`}
                          />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="title"
                    className="text-base font-semibold text-gray-900"
                  >
                    Service Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Fix leaking kitchen faucet"
                    {...register("title")}
                    className={`mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                      errors.title ? "border-red-500" : ""
                    }`}
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold text-gray-900"
                  >
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder="Please describe the issue or service you need in detail. Include any relevant information that will help the provider understand the work required..."
                    {...register("description")}
                    className={`mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl resize-none ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="additionalNotes"
                    className="text-base font-semibold text-gray-900"
                  >
                    Additional Notes{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    rows={3}
                    placeholder="Any other information that might be helpful..."
                    {...register("additionalNotes")}
                    className="mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Schedule */}
          {activeTab === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Select Date & Time
                </h2>
                <p className="text-gray-600">
                  Choose when you'd like the service to be scheduled
                </p>
              </div>

              {/* Calendar Filter */}
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-4 block">
                  Preferred Date <span className="text-red-500">*</span>
                </Label>
                <CalendarFilter
                  value={watch("scheduledDate")}
                  onChange={(date) => setValue("scheduledDate", date)}
                  minDate={today}
                />
                {errors.scheduledDate && (
                  <p className="text-red-600 text-sm mt-2">
                    {errors.scheduledDate.message}
                  </p>
                )}
              </div>

              {/* Time Slots */}
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-4 block">
                  Preferred Time Slot <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.value}
                      onClick={() => setValue("scheduledTimeSlot", slot.value)}
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                        watch("scheduledTimeSlot") === slot.value
                          ? "border-sky-500 bg-sky-50 shadow-xl"
                          : "border-sky-100 bg-white hover:border-sky-300 shadow-lg"
                      }`}
                    >
                      <input
                        type="radio"
                        value={slot.value}
                        {...register("scheduledTimeSlot")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            watch("scheduledTimeSlot") === slot.value
                              ? "bg-linear-to-br from-sky-400 to-blue-500"
                              : "bg-sky-100"
                          }`}
                        >
                          <IconRenderer
                            iconName={slot.icon}
                            className={`h-5 w-5 ${
                              watch("scheduledTimeSlot") === slot.value
                                ? "text-white"
                                : "text-sky-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            {slot.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.scheduledTimeSlot && (
                  <p className="text-red-600 text-sm mt-2">
                    {errors.scheduledTimeSlot.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Location */}
          {activeTab === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Service Location
                </h2>
                <p className="text-gray-600">
                  Provide the address where the service will be performed
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="address.street"
                    className="text-base font-semibold text-gray-900"
                  >
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address.street"
                    placeholder="123 Main Street, Apt 4B"
                    {...register("address.street")}
                    className={`mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                      errors.address?.street ? "border-red-500" : ""
                    }`}
                  />
                  {errors.address?.street && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.address?.street.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="address.city"
                      className="text-base font-semibold text-gray-900"
                    >
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address.city"
                      placeholder="New York"
                      {...register("address.city")}
                      className={`mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                        errors.address?.city ? "border-red-500" : ""
                      }`}
                    />
                    {errors.address?.city && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.address?.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="address.state"
                      className="text-base font-semibold text-gray-900"
                    >
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address.state"
                      placeholder="NY"
                      {...register("address.state")}
                      className={`mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                        errors.address?.state ? "border-red-500" : ""
                      }`}
                    />
                    {errors.address?.state && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.address?.state.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="address.zipCode"
                      className="text-base font-semibold text-gray-900"
                    >
                      ZIP Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address.zipCode"
                      placeholder="100001"
                      {...register("address.zipCode")}
                      className={`mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl ${
                        errors.address?.zipCode ? "border-red-500" : ""
                      }`}
                    />
                    {errors.address?.zipCode && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.address?.zipCode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="address.country"
                      className="text-base font-semibold text-gray-900"
                    >
                      Country <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="address.country"
                      placeholder="India"
                      {...register("address.country")}
                      className="mt-2 border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Price Estimate */}
              {priceEstimate && !loadingPrice && (
                <div className="bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-sky-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-linear-to-br from-sky-400 to-blue-500 rounded-xl">
                      <IndianRupee className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Estimated Price Range
                      </h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-sky-600">
                          {formatPrice(priceEstimate.minPrice)}
                        </span>
                        <span className="text-gray-600">to</span>
                        <span className="text-3xl font-bold text-sky-600">
                          {formatPrice(priceEstimate.maxPrice)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Based on {priceEstimate.providerCount} available
                        providers in your area
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Info className="h-4 w-4" />
                        <span>
                          Final price may vary based on actual work required
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Payment */}
          {activeTab === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Method
                </h2>
                <p className="text-gray-600">
                  Select how you would like to pay for this service
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.value}
                    onClick={() => setValue("paymentMethod", method.value)}
                    className={`cursor-pointer rounded-xl p-6 border-2 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                      watch("paymentMethod") === method.value
                        ? "border-sky-500 bg-sky-50 shadow-xl"
                        : "border-sky-100 bg-white hover:border-sky-300 shadow-lg"
                    }`}
                  >
                    <input
                      type="radio"
                      value={method.value}
                      {...register("paymentMethod")}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          watch("paymentMethod") === method.value
                            ? "bg-linear-to-br from-sky-400 to-blue-500"
                            : "bg-sky-100"
                        }`}
                      >
                        <IconRenderer
                          iconName={method.icon}
                          className={`h-6 w-6 ${
                            watch("paymentMethod") === method.value
                              ? "text-white"
                              : "text-sky-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {method.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {method.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.paymentMethod && (
                <p className="text-red-600 text-sm">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            onClick={() => setActiveTab((prev) => Math.max(prev - 1, 1))}
            disabled={activeTab === 1}
            className="px-8 py-3 border-sky-200 text-sky-700 hover:bg-sky-50 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </Button>

          {activeTab < 4 ? (
            <Button
              type="button"
              onClick={() => {
                // Validate current tab before moving next
                let isValid = false;
                if (activeTab === 1 && isTab1Valid()) isValid = true;
                else if (activeTab === 2 && isTab2Valid()) isValid = true;
                else if (activeTab === 3 && isTab3Valid()) isValid = true;

                if (isValid) {
                  setActiveTab((prev) => prev + 1);
                } else {
                  // Show validation errors for current tab
                  if (activeTab === 1) {
                    if (!watch("categoryId")) {
                      setError("categoryId", {
                        type: "manual",
                        message: "Please select a service category",
                      });
                    }
                    if (!watch("title") || watch("title").length < 5) {
                      setError("title", {
                        type: "manual",
                        message: "Title must be at least 5 characters",
                      });
                    }
                    if (
                      !watch("description") ||
                      watch("description").length < 20
                    ) {
                      setError("description", {
                        type: "manual",
                        message: "Description must be at least 20 characters",
                      });
                    }
                  } else if (activeTab === 2) {
                    if (!watch("scheduledDate")) {
                      setError("scheduledDate", {
                        type: "manual",
                        message: "Please select a date",
                      });
                    }
                    if (!watch("scheduledTimeSlot")) {
                      setError("scheduledTimeSlot", {
                        type: "manual",
                        message: "Please select a time slot",
                      });
                    }
                  } else if (activeTab === 3) {
                    if (!watch("address.street")) {
                      setError("address.street", {
                        type: "manual",
                        message: "Street address is required",
                      });
                    }
                    if (!watch("address.city")) {
                      setError("address.city", {
                        type: "manual",
                        message: "City is required",
                      });
                    }
                    if (!watch("address.state")) {
                      setError("address.state", {
                        type: "manual",
                        message: "State is required",
                      });
                    }
                    if (!watch("address.zipCode")) {
                      setError("address.zipCode", {
                        type: "manual",
                        message: "ZIP code is required",
                      });
                    }
                  }
                  toast.error("Please fill in all required fields");
                }
              }}
              className="px-8 py-3 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="px-8 py-3 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Request
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
