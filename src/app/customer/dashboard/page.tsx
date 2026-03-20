"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerApi } from "@/lib/api";
import { ServiceRequest, ServiceRequestStatus } from "@/types";
import {
  Home,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
  Calendar,
  FileText,
  User,
  Loader2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface DashboardStats {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalSpent: number;
}

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalSpent: 0,
  });
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [backendNotReady, setBackendNotReady] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setBackendNotReady(false);

      // Fetch all service requests
      const response = await customerApi.getMyServiceRequests();
      const rawRequests: any[] = (response as any).data || response || [];

      // Map backend data to ServiceRequest type
      const requests: ServiceRequest[] = rawRequests.map((req) => ({
        id: req.id,
        customerId: req.customerId,
        providerId: req.serviceProviderId,
        categoryId: req.serviceCategoryId,
        serviceType: req.serviceType,
        title: req.serviceTitle || req.title || "Service Request",
        description: req.serviceDescription || req.description || "",
        address: req.serviceAddress || req.address,
        scheduledDate: req.schedule?.date || req.createdAt,
        scheduledTimeSlot: req.schedule?.timeSlot || req.timeSlot || "morning",
        status:
          req.status === "requested"
            ? "pending"
            : (req.status as ServiceRequestStatus),
        estimatedPrice: req.estimatedPrice
          ? parseFloat(req.estimatedPrice)
          : undefined,
        finalPrice:
          req.finalPrice && req.finalPrice !== "0.00"
            ? parseFloat(req.finalPrice)
            : undefined,
        beforeImages: req.beforeImages || [],
        afterImages: req.afterImages || [],
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      }));

      // Calculate stats
      const total = requests.length;
      const active = requests.filter(
        (r) =>
          r.status === "pending" ||
          r.status === "assigned" ||
          r.status === "in-progress",
      ).length;
      const completed = requests.filter((r) => r.status === "completed").length;
      const spent = requests
        .filter(
          (r) => r.status === "completed" && r.finalPrice && r.finalPrice > 0,
        )
        .reduce((sum, r) => sum + (r.finalPrice || 0), 0);

      setStats({
        totalRequests: total,
        activeRequests: active,
        completedRequests: completed,
        totalSpent: spent,
      });

      // Store all requests for charts
      setAllRequests(requests);

      // Get recent 5 requests for table
      setRecentRequests(requests.slice(0, 5));
    } catch (error: any) {
      console.error("Error loading dashboard:", error);

      // Set default stats on error
      setStats({
        totalRequests: 0,
        activeRequests: 0,
        completedRequests: 0,
        totalSpent: 0,
      });
      setAllRequests([]);
      setRecentRequests([]);

      // Handle 501 (Not Implemented) gracefully
      if (error?.response?.status === 501) {
        setBackendNotReady(true);
        toast.error("Dashboard feature is not yet implemented in the backend", {
          description:
            "The endpoint /request/requests/my-services is not available.",
        });
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load dashboard data";
        toast.error(message);
      }
    }
  };

  const statCards = [
    {
      title: "Total Requests",
      value: stats.totalRequests,
      icon: FileText,
      color: "text-sky-500",
      bgColor: "bg-sky-50",
    },
    {
      title: "Active Requests",
      value: stats.activeRequests,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      title: "Completed",
      value: stats.completedRequests,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Total Spent",
      value: `$${typeof stats.totalSpent === "number" ? stats.totalSpent.toFixed(2) : "0.00"}`,
      icon: DollarSign,
      color: "text-violet-500",
      bgColor: "bg-violet-50",
    },
  ];

  const quickActions = [
    {
      title: "Book New Service",
      description: "Create a new service request",
      href: "/customer/requests/new",
      icon: Briefcase,
      color: "from-sky-400 to-blue-500",
    },
    {
      title: "Browse Services",
      description: "Explore service categories",
      href: "/customer/services",
      icon: Home,
      color: "from-emerald-400 to-green-500",
    },
    {
      title: "View Profile",
      description: "Manage your account",
      href: "/customer/profile",
      icon: User,
      color: "from-violet-400 to-purple-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";

    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;

      // Check if date is invalid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error, dateString);
      return "Invalid Date";
    }
  };

  // Chart data preparation - Memoized to prevent lag
  const statusData = useMemo(() => {
    const statusCounts = {
      pending: allRequests.filter((r) => r.status === "pending").length,
      assigned: allRequests.filter((r) => r.status === "assigned").length,
      inProgress: allRequests.filter((r) => r.status === "in-progress").length,
      completed: allRequests.filter((r) => r.status === "completed").length,
      cancelled: allRequests.filter((r) => r.status === "cancelled").length,
    };

    return [
      { name: "Pending", value: statusCounts.pending, color: "#fbbf24" },
      { name: "Assigned", value: statusCounts.assigned, color: "#3b82f6" },
      { name: "In Progress", value: statusCounts.inProgress, color: "#8b5cf6" },
      { name: "Completed", value: statusCounts.completed, color: "#10b981" },
      { name: "Cancelled", value: statusCounts.cancelled, color: "#6b7280" },
    ].filter((item) => item.value > 0);
  }, [allRequests]);

  const spendingData = useMemo(() => {
    const monthlySpending: { [key: string]: number } = {};

    allRequests
      .filter((r) => {
        // Check if request is completed, has final price greater than 0
        if (r.status !== "completed") return false;
        if (r.finalPrice === undefined || r.finalPrice === null) return false;
        if (typeof r.finalPrice === "number" && r.finalPrice <= 0) return false;
        if (typeof r.finalPrice === "string" && parseFloat(r.finalPrice) <= 0)
          return false;

        // Check if scheduledDate exists and is valid
        if (!r.scheduledDate) return false;

        const date = new Date(r.scheduledDate);
        return !isNaN(date.getTime());
      })
      .forEach((request) => {
        // Use scheduledDate (now properly mapped)
        if (!request.scheduledDate) return;

        const date = new Date(request.scheduledDate);

        // Verify date is valid before proceeding
        if (isNaN(date.getTime())) return;

        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        // Convert finalPrice to number and validate
        const price =
          typeof request.finalPrice === "string"
            ? parseFloat(request.finalPrice)
            : request.finalPrice;

        // Only add if price is a valid number
        if (typeof price === "number" && !isNaN(price) && price > 0) {
          monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + price;
        }
      });

    return Object.entries(monthlySpending)
      .map(([month, amount]) => ({
        month,
        amount: Math.round(amount * 100) / 100,
      }))
      .slice(-6); // Last 6 months
  }, [allRequests]);

  return (
    <div className="space-y-8">
      {/* Backend Not Ready Warning */}
      {backendNotReady && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-800 mb-1">
                Backend Feature Not Implemented
              </h3>
              <p className="text-amber-700 text-sm mb-3">
                The dashboard endpoint (
                <code className="bg-amber-100 px-2 py-1 rounded">
                  /request/requests/my-services
                </code>
                ) is not yet implemented in the backend.
              </p>
              <p className="text-amber-600 text-xs">
                Please implement this endpoint in your backend server to load
                service request data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-3xl p-8 text-white shadow-2xl">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          Welcome back, {user?.name?.split(" ")[0] || "User"}!
        </h1>
        <p className="text-sky-100 text-lg">
          Ready to get your home services done? Let's make it happen.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-2xl p-6 shadow-lg border border-sky-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 rounded-xl ${stat.bgColor} shrink-0`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">
                {stat.value}
              </h3>
            </div>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Status Distribution - Pie Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-sky-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Request Status
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Distribution of your service requests
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-sky-50 rounded-xl self-start sm:self-auto">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500" />
            </div>
          </div>

          {statusData.length > 0 ? (
            <div className="space-y-4">
              <div
                className="relative w-full"
                style={{ height: "220px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={false}
                      isAnimationActive={true}
                      animationBegin={100}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e0f2fe",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value: any) => `${value} requests`}
                      isAnimationActive={true}
                      animationDuration={300}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend - Better for mobile */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                {statusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.value} requests
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-70 flex items-center justify-center text-gray-400">
              <p className="text-center text-sm">No data available</p>
            </div>
          )}
        </div>

        {/* Monthly Spending - Bar Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-sky-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Spending Overview
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Your spending over the last 6 months
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-violet-50 rounded-xl self-start sm:self-auto">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
            </div>
          </div>

          {spendingData.length > 0 ? (
            <div className="relative w-full" style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={spendingData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e0f2fe"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    style={{ fontSize: "11px" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "11px" }}
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e0f2fe",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  <Bar
                    dataKey="amount"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationBegin={200}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-70 flex flex-col items-center justify-center text-gray-400">
              <DollarSign className="h-12 w-12 mb-2 text-gray-300" />
              <p className="text-center text-sm">No spending data yet</p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Complete some requests with final prices to see your spending
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group bg-white rounded-2xl p-6 shadow-lg border border-sky-100 hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              <div
                className={`p-4 rounded-xl bg-linear-to-br ${action.color} w-fit mb-4`}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-sky-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{action.description}</p>
              <div className="flex items-center text-sky-600 font-medium text-sm">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Requests</h2>
          <Link
            href="/customer/requests"
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium text-sm"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
            <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-sky-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No requests yet
            </h3>
            <p className="text-gray-500 mb-6">
              You haven't created any service requests. Start by booking your
              first service!
            </p>
            <Link
              href="/customer/requests/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
            >
              <Briefcase className="h-5 w-5" />
              Book Your First Service
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sky-50 border-b border-sky-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Service
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {recentRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-sky-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {request.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.serviceType}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            request.status,
                          )}`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                        {formatDate(
                          request.scheduledDate ||
                            (request as any).createdAt ||
                            (request as any).updatedAt,
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/customer/requests/${request.id}`}
                          className="text-sky-600 hover:text-sky-700 font-medium text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
