"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

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
  updatedAt: string;
  totalServices?: number;
  totalRequests?: number;
  profilePicture?: string;
  pendingServices?: string;
  inProgressServices?: string;
  completedServices?: string;
  cancelledServices?: string;
}

export default function AdminCustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCustomer(customerId);
      const data = (response as any).data || response;

      // Transform API response to match frontend expectations
      const transformedData = {
        ...data,
        totalRequests: data.totalServices || data.totalRequests || 0,
      };

      setCustomer(transformedData);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load customer");
      router.push("/admin/customers");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";

    let date: Date;
    if (typeof dateString === "string") {
      date = new Date(dateString);
    } else {
      date = dateString;
    }

    if (isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Customer Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The customer you're looking for doesn't exist.
        </p>
        <Link href="/admin/customers">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Customer Details
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            View customer information and activity
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {customer.isActive ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800 border-gray-200 px-3 sm:px-4 py-2 text-xs sm:text-sm">
              Inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Profile Picture */}
          <div className="relative shrink-0">
            {customer.profilePicture ? (
              <img
                src={customer.profilePicture}
                alt={customer.name}
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30">
                <User className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-white/80" />
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="flex-1 text-center sm:text-left w-full">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
              {customer.name}
            </h2>
            <div className="flex flex-col items-center sm:items-start gap-1.5 sm:gap-2 text-blue-100 mb-2 sm:mb-3">
              <span className="flex items-center gap-1.5 text-sm sm:text-base">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="break-all">{customer.email}</span>
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1.5 text-sm sm:text-base">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  {customer.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={FileText}
          label="Total Requests"
          value={customer.totalRequests?.toString() || "0"}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="Joined Date"
          value={formatDate(customer.createdAt)}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="Last Updated"
          value={formatDate(customer.updatedAt)}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Status"
          value={customer.isActive ? "Active" : "Inactive"}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-linear-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Contact Information
                </h3>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Email Address
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 break-all">
                    {customer.email}
                  </p>
                </div>
              </div>

              {customer.phone && (
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Phone Number
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {customer.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="bg-linear-to-r from-purple-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-linear-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Account Information
                </h3>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Member Since
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {formatDate(customer.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Last Updated
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {formatDate(customer.updatedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Total Service Requests
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {customer.totalRequests || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Account Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="bg-linear-to-r from-emerald-50 to-teal-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-emerald-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Account Status
                </h3>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <Badge
                  className={
                    customer.isActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-2"
                      : "bg-gray-100 text-gray-800 border-gray-200 px-4 py-2"
                  }
                >
                  {customer.isActive ? "Active Account" : "Inactive Account"}
                </Badge>
                <p className="text-xs text-gray-600 mt-3">
                  {customer.isActive
                    ? "This customer can actively use the platform"
                    : "This customer account is currently inactive"}
                </p>
              </div>
            </div>
          </div>

          {/* Services Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="bg-linear-to-r from-purple-50 to-violet-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-linear-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Services Distribution
                </h3>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              {[
                {
                  name: "Completed",
                  value: parseInt(customer?.completedServices || "0"),
                  color: "#10b981",
                },
                {
                  name: "Pending",
                  value: parseInt(customer?.pendingServices || "0"),
                  color: "#f59e0b",
                },
                {
                  name: "In Progress",
                  value: parseInt(customer?.inProgressServices || "0"),
                  color: "#3b82f6",
                },
                {
                  name: "Cancelled",
                  value: parseInt(customer?.cancelledServices || "0"),
                  color: "#ef4444",
                },
              ].some((item) => item.value > 0) ? (
                <HighchartsReact
                  highcharts={Highcharts}
                  options={{
                    chart: {
                      type: "pie",
                      style: {
                        fontFamily: "system-ui, sans-serif",
                      },
                      height: typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 280,
                    },
                    credits: { enabled: false },
                    title: {
                      text: undefined,
                    },
                    plotOptions: {
                      pie: {
                        innerSize: "65%",
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: "#fff",
                        dataLabels: {
                          enabled: true,
                          format: "{point.name}",
                          distance: 30,
                          style: {
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#6b7280",
                            textOutline: "none",
                          },
                          connectorWidth: 2,
                          connectorPadding: 5,
                          softConnector: true,
                        },
                        showInLegend: false,
                        states: {
                          hover: {
                            brightness: 0.1,
                          },
                        },
                      },
                    },
                    tooltip: {
                      backgroundColor: "#fff",
                      borderColor: "#e5e7eb",
                      borderRadius: 8,
                      shadow: {
                        color: "rgba(0, 0, 0, 0.1)",
                        offsetX: 0,
                        offsetY: 4,
                        opacity: 0.5,
                        width: 4,
                      },
                      style: {
                        fontSize: "12px",
                        color: "#6b7280",
                      },
                      pointFormat:
                        '<span style="color:{point.color}">●</span> <b>{point.name}</b><br/><span style="font-size: 11px;">{point.y} services</span>',
                      useHTML: true,
                    },
                    series: [
                      {
                        name: "Services",
                        colorByPoint: true,
                        data: [
                          {
                            name: "Completed",
                            y: parseInt(customer?.completedServices || "0"),
                            color: "#10b981",
                          },
                          {
                            name: "Pending",
                            y: parseInt(customer?.pendingServices || "0"),
                            color: "#f59e0b",
                          },
                          {
                            name: "In Progress",
                            y: parseInt(customer?.inProgressServices || "0"),
                            color: "#3b82f6",
                          },
                          {
                            name: "Cancelled",
                            y: parseInt(customer?.cancelledServices || "0"),
                            color: "#ef4444",
                          },
                        ].filter((item) => item.y > 0),
                      },
                    ],
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No services data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: "blue" | "emerald" | "purple" | "yellow";
}) {
  const colorClasses = {
    yellow: "from-yellow-50 to-amber-50 border-yellow-200",
    blue: "from-blue-50 to-indigo-50 border-blue-200",
    emerald: "from-emerald-50 to-teal-50 border-emerald-200",
    purple: "from-violet-50 to-purple-50 border-violet-200",
  };

  const iconClasses = {
    yellow: "from-yellow-400 to-amber-500",
    blue: "from-blue-400 to-indigo-500",
    emerald: "from-emerald-400 to-teal-500",
    purple: "from-violet-400 to-purple-500",
  };

  return (
    <div
      className={`bg-linear-to-br ${colorClasses[color]} border rounded-2xl p-3 sm:p-4 lg:p-5`}
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-2">
        <div
          className={`h-8 w-8 sm:h-10 sm:w-10 bg-linear-to-br ${iconClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <p className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-wide font-medium">
          {label}
        </p>
      </div>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-4">
      <Skeleton className="h-10 sm:h-12 w-48 sm:w-64" />
      <Skeleton className="h-40 sm:h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Skeleton className="h-56 sm:h-64 w-full rounded-2xl lg:col-span-2" />
        <Skeleton className="h-56 sm:h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
