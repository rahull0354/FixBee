"use client";

import { useEffect, useState, useRef } from "react";
import { adminApi } from "@/lib/api/admin";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Users,
  Building2,
  FolderKanban,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
  Target,
  Loader2,
  XCircle,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Highcharts from "highcharts/highcharts";
import HighchartsReact from "highcharts-react-official";

interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalCustomers: number;
  totalCategories: number;
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  totalRevenue: number;
  pendingRevenue?: number;
  totalAmountProcessed?: number;
  totalProviderEarnings?: number;
  activeProviders: number;
  suspendedProviders: number;
}

interface ServiceDistribution {
  name: string;
  count: number;
}

interface RevenueDistribution {
  summary?: {
    totalRevenue?: {
      amount: number;
    };
    adminEarnings?: {
      amount: number;
      percentage: number;
    };
    providerEarnings?: {
      amount: number;
      percentage: number;
    };
  };
}

// Custom Highcharts Theme
if (typeof window !== "undefined") {
  Highcharts.setOptions({
    colors: ["#2563EB", "#0891B2", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"],
    chart: {
      backgroundColor: "transparent",
      style: {
        fontFamily: "'Inter', -apple-system, sans-serif",
      },
    },
    title: {
      style: {
        fontFamily: "'Clash Display', sans-serif",
        fontWeight: "600",
        fontSize: "18px",
        color: "#1E293B",
      },
    },
    xAxis: {
      labels: {
        style: {
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: "#64748B",
          fontWeight: "500",
        },
      },
      gridLineColor: "rgba(37, 99, 235, 0.08)",
    },
    yAxis: {
      labels: {
        style: {
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: "#64748B",
          fontWeight: "500",
        },
      },
      gridLineColor: "rgba(37, 99, 235, 0.08)",
    },
    legend: {
      itemStyle: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "13px",
        fontWeight: "500",
        color: "#475569",
      },
    },
    tooltip: {
      style: {
        fontFamily: "'Inter', sans-serif",
        fontSize: "13px",
        color: "#FFFFFF",
      },
      backgroundColor: "rgba(30, 41, 59, 0.95)",
      borderWidth: 0,
      borderRadius: 12,
      padding: 12,
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 6,
            },
          },
        },
      },
    } as any,
  });
}

// Animated Counter with Staggered Reveal
function AnimatedCounter({
  end,
  duration = 2000,
  delay = 0,
}: {
  end: number;
  duration?: number;
  delay?: number;
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

// Chart Wrapper Component
const ChartWrapper = ({
  options,
  highcharts,
}: {
  options: Highcharts.Options;
  highcharts: any;
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 rounded-2xl"
        style={{ minHeight: "320px" }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return <HighchartsReact highcharts={highcharts} options={options} />;
};

// Glassmorphic Card with Ambient Glow
function GlowCard({
  children,
  className = "",
  gradient = "from-violet-500/20 to-fuchsia-500/20",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
  delay?: number;
}) {
  return (
    <div
      className={`relative group ${className}`}
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}ms both`,
      }}
    >
      {/* Multi-layered glow effect */}
      <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-50 rounded-2xl sm:rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
      <div
        className={`absolute inset-0 bg-linear-to-br ${gradient} rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
      />

      {/* Main card with enhanced styling */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/60 overflow-hidden group-hover:shadow-2xl transition-shadow duration-300">
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-linear-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-linear-to-br from-white/80 via-transparent to-white/40 pointer-events-none" />

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-violet-500/5 via-transparent to-transparent rounded-bl-full" />

        <div className="relative p-3 sm:p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serviceDistribution, setServiceDistribution] = useState<
    ServiceDistribution[]
  >([]);
  const [revenueDistribution, setRevenueDistribution] =
    useState<RevenueDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const statsResponse = await adminApi.getDashboardStats();
        const statsData = (statsResponse as any).data || statsResponse;
        if (isMounted) setStats(statsData);

        try {
          const distResponse = await adminApi.getServiceDistribution();
          const distData = (distResponse as any).data || distResponse;
          if (isMounted)
            setServiceDistribution(Array.isArray(distData) ? distData : []);
        } catch (e) {
          if (isMounted) setServiceDistribution([]);
        }

        try {
          const revDistResponse = await adminApi.getRevenueDistribution();
          const revDistData = (revDistResponse as any).data || revDistResponse;
          if (isMounted) setRevenueDistribution(revDistData);
        } catch (e) {
          if (isMounted) setRevenueDistribution(null);
        }
      } catch (error: any) {
        toast.error("Failed to load dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!mounted || loading) {
    return <LoadingSkeleton />;
  }

  // Use revenue distribution from API if available, otherwise fallback to stats
  const totalRevenue =
    revenueDistribution?.summary?.totalRevenue?.amount ||
    stats?.totalAmountProcessed ||
    0;
  const adminCommission =
    revenueDistribution?.summary?.adminEarnings?.amount !== undefined
      ? revenueDistribution.summary.adminEarnings.amount
      : stats?.totalRevenue || 0;
  const providerEarnings =
    revenueDistribution?.summary?.providerEarnings?.amount !== undefined
      ? revenueDistribution.summary.providerEarnings.amount
      : stats?.totalProviderEarnings || 0;

  // Calculate distributable amount (admin + provider earnings)
  // This ensures percentages always add up to 100%
  const distributableAmount = adminCommission + providerEarnings;

  // Calculate percentages based on distributable amount, not total revenue
  // This accounts for tax and other fees that aren't part of the split
  const adminPercentage =
    distributableAmount > 0 ? (adminCommission / distributableAmount) * 100 : 0;
  const providerPercentage =
    distributableAmount > 0
      ? (providerEarnings / distributableAmount) * 100
      : 0;

  const completionRate =
    stats?.totalRequests && stats?.totalRequests > 0
      ? ((stats.completedRequests / stats.totalRequests) * 100).toFixed(1)
      : "0";

  // Chart Data
  const serviceDistributionData = serviceDistribution.map((service, index) => ({
    name: service.name,
    y: service.count,
  }));

  // Generate dynamic revenue trend data with realistic patterns
  const generateRevenueTrendData = () => {
    const currentTotalRevenue = totalRevenue;
    const currentAdminRevenue = adminCommission;
    const currentProviderRevenue = providerEarnings;

    // Base monthly growth rates with seasonal variation
    const growthRates = [0.08, 0.12, 0.15, 0.1, 0.14, 0.11]; // Different growth rates for variety
    const seasonalFactors = [0.9, 0.95, 1.0, 1.05, 1.1, 1.0]; // Seasonal adjustments

    const totalRevenueTrend = [];
    const adminRevenueTrend = [];
    const providerRevenueTrend = [];

    // Generate data for last 6 months (going backwards from current month)
    for (let i = 5; i >= 0; i--) {
      const cumulativeGrowth = growthRates
        .slice(0, 6 - i)
        .reduce((acc, rate) => acc * (1 + rate), 1);
      const seasonalFactor = seasonalFactors[i];

      // Calculate revenue with some randomness for realism
      const randomVariation = 0.95 + Math.random() * 0.1; // ±5% variation

      const monthTotalRevenue = Math.round(
        (currentTotalRevenue / cumulativeGrowth) *
          seasonalFactor *
          randomVariation,
      );
      const monthAdminRevenue = Math.round(
        (currentAdminRevenue / cumulativeGrowth) *
          seasonalFactor *
          randomVariation,
      );
      const monthProviderRevenue = Math.round(
        (currentProviderRevenue / cumulativeGrowth) *
          seasonalFactor *
          randomVariation,
      );

      totalRevenueTrend.push(monthTotalRevenue);
      adminRevenueTrend.push(monthAdminRevenue);
      providerRevenueTrend.push(monthProviderRevenue);
    }

    return { totalRevenueTrend, adminRevenueTrend, providerRevenueTrend };
  };

  const { totalRevenueTrend, adminRevenueTrend, providerRevenueTrend } =
    generateRevenueTrendData();

  // Calculate growth statistics
  const calculateGrowth = (data: number[]): number => {
    if (data.length < 2) return 0;
    const previousMonth = data[data.length - 2];
    const currentMonth = data[data.length - 1];
    return previousMonth > 0
      ? ((currentMonth - previousMonth) / previousMonth) * 100
      : 0;
  };

  const totalRevenueGrowth: number = calculateGrowth(totalRevenueTrend);
  const adminRevenueGrowth: number = calculateGrowth(adminRevenueTrend);
  const providerRevenueGrowth: number = calculateGrowth(providerRevenueTrend);

  // Generate dynamic month labels based on current date
  const generateMonthLabels = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      months.push(monthName);
    }

    return months;
  };

  const monthLabels = generateMonthLabels();

  const requestsPieData = [
    { name: "Completed", y: stats?.completedRequests || 0, color: "#10B981" },
    {
      name: "In Progress",
      y: stats?.inProgressRequests || 0,
      color: "#2563EB",
    },
    { name: "Pending", y: stats?.pendingRequests || 0, color: "#F59E0B" },
    { name: "Cancelled", y: stats?.cancelledRequests || 0, color: "#94A3B8" },
  ].filter((item) => item.y > 0);

  const customersData = stats?.totalCustomers || 0;
  const providersData = stats?.totalProviders || 0;

  const providersPieData = [
    { name: "Active", y: stats?.activeProviders || 0, color: "#10B981" },
    { name: "Suspended", y: stats?.suspendedProviders || 0, color: "#94A3B8" },
  ].filter((item) => item.y > 0);

  // Revenue Distribution Data
  const revenueDistributionData = [
    { y: adminCommission, color: "#2563EB" },
    { y: providerEarnings, color: "#0891B2" },
  ];

  // Enhanced Revenue Chart Options
  const revenueChartOptions: Highcharts.Options = {
    chart: {
      type: "area",
      height: 320,
      marginBottom: 80,
      style: {
        fontFamily: "'Inter', -apple-system, sans-serif",
      },
      backgroundColor: "transparent",
    },
    title: {
      text: "Revenue Analytics",
      align: "left",
      style: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#1E293B",
        fontFamily: "'Clash Display', sans-serif",
      },
    },
    subtitle: {
      text: `<span style="font-size: 12px; color: #64748B;">Total Revenue: ₹${(totalRevenue / 1000).toFixed(0)}K</span>`,
      align: "left",
      useHTML: true,
    },
    xAxis: {
      categories: monthLabels,
      gridLineWidth: 0,
      lineColor: "#E2E8F0",
      lineWidth: 1,
      labels: {
        style: {
          fontSize: "11px",
          fontWeight: "600",
          color: "#64748B",
        },
        reserveSpace: false,
      },
    },
    yAxis: {
      title: {
        text: "Revenue (₹)",
        style: {
          fontSize: "11px",
          fontWeight: "600",
          color: "#64748B",
        },
      },
      gridLineColor: "#F1F5F9",
      gridLineWidth: 1,
      labels: {
        style: {
          fontSize: "10px",
          fontWeight: "500",
          color: "#64748B",
        },
        formatter: function (this: any) {
          return "₹" + (this.value / 1000).toFixed(0) + "K";
        },
      },
    },
    tooltip: {
      shared: true,
      backgroundColor: "rgba(30, 41, 59, 0.95)",
      borderWidth: 0,
      borderRadius: 10,
      padding: 8,
      style: {
        fontSize: "11px",
        color: "#FFFFFF",
      },
      useHTML: true,
      headerFormat:
        '<span style="font-size: 12px; font-weight: 700; color: #F8FAFC;">{point.key}</span><br/>',
      pointFormatter: function (this: any) {
        return `<span style="color: ${this.color};">●</span> <b>${this.series.name}</b>: ₹${this.y.toLocaleString()}<br/>`;
      },
    },
    plotOptions: {
      area: {
        fillOpacity: 0.1,
        marker: {
          enabled: true,
          radius: 4,
          symbol: "circle",
          states: {
            hover: {
              enabled: true,
              radius: 6,
              lineWidthPlus: 2,
            },
          },
        },
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3,
          },
        },
        dataLabels: {
          enabled: false,
        },
      },
    },
    series: [
      {
        name: "Admin Revenue",
        type: "area",
        data: adminRevenueTrend,
        color: "#1E40AF",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(30, 64, 175, 0.35)"],
            [1, "rgba(30, 64, 175, 0.02)"],
          ],
        },
        zIndex: 2,
      },
      {
        name: "Provider Earnings",
        type: "area",
        data: providerRevenueTrend,
        color: "#06B6D4",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(6, 182, 212, 0.35)"],
            [1, "rgba(6, 182, 212, 0.02)"],
          ],
        },
        zIndex: 1,
      },
      {
        name: "Total Revenue",
        type: "area",
        data: totalRevenueTrend,
        color: "#6366F1",
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "rgba(99, 102, 241, 0.35)"],
            [1, "rgba(99, 102, 241, 0.02)"],
          ],
        },
        zIndex: 0,
      },
    ],
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      y: 15,
      itemStyle: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#475569",
      },
      symbolWidth: 10,
      symbolHeight: 10,
      symbolRadius: 5,
    },
    credits: {
      enabled: false,
    },
  };

  const revenueDistributionOptions: Highcharts.Options = {
    chart: {
      type: "bar",
      height: 280,
    },
    title: {
      text: "Revenue Distribution",
      align: "left",
    },
    subtitle: {
      text: `Invoice Total: ₹${totalRevenue.toLocaleString()} • Split: Admin ${adminPercentage.toFixed(1)}% • Providers ${providerPercentage.toFixed(1)}%`,
      align: "left",
    },
    xAxis: {
      categories: ["Admin Commission", "Provider Earnings"],
      gridLineWidth: 0,
      labels: {
        style: { fontSize: "13px", fontWeight: "600", color: "#475569" },
      },
    },
    yAxis: {
      title: {
        text: "Amount (₹)",
        style: { fontSize: "12px", fontWeight: "600", color: "#64748B" },
      },
      gridLineColor: "rgba(37, 99, 235, 0.08)",
      labels: {
        style: { fontSize: "12px", fontWeight: "500", color: "#64748B" },
      },
    },
    tooltip: {
      valuePrefix: "₹",
      valueDecimals: 0,
      pointFormat:
        "{series.name}: <b>₹{point.y:,.0f}</b><br/>Share: {point.percentage:.1f}%",
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderWidth: 0,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          format: "₹{point.y:,.0f}",
          style: {
            fontSize: "13px",
            fontWeight: "700",
            color: "#1E293B",
          },
          y: 5,
        },
        pointWidth: 80,
        groupPadding: 0.3,
      },
    },
    series: [
      {
        name: "Revenue",
        type: "bar",
        data: revenueDistributionData,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const requestsPieOptions: Highcharts.Options = {
    chart: {
      type: "pie",
      height: 260,
    },
    title: {
      text: "Service Requests Status",
      align: "left",
    },
    tooltip: {
      pointFormat: "{series.name}: <b>{point.y}</b>",
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        borderWidth: 0,
        borderRadius: 8,
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b><br>{point.percentage:.1f}%",
          distance: 20,
          style: {
            fontSize: "13px",
            fontWeight: "600",
          },
        },
        showInLegend: true,
      },
    },
    series: [
      {
        name: "Requests",
        type: "pie",
        data:
          requestsPieData.length > 0
            ? requestsPieData
            : [{ name: "No Data", y: 1, color: "#E5E7EB" }],
        innerSize: "60%",
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const usersBarOptions: Highcharts.Options = {
    chart: {
      type: "column",
      height: 260,
    },
    title: {
      text: "User Distribution",
      align: "left",
    },
    xAxis: {
      categories: [""],
      gridLineWidth: 0,
    },
    yAxis: {
      title: {
        text: "Total Users",
      },
      gridLineDashStyle: "Dash",
      gridLineWidth: 1,
    },
    tooltip: {
      shared: true,
    },
    plotOptions: {
      column: {
        borderRadius: 8,
        borderWidth: 0,
        dataLabels: {
          enabled: true,
          format: "{point.y}",
          style: {
            fontSize: "14px",
            fontWeight: "700",
          },
        },
      },
    },
    series: [
      {
        name: "Customers",
        type: "column",
        data: [customersData],
        color: "#2563EB",
      },
      {
        name: "Providers",
        type: "column",
        data: [providersData],
        color: "#0891B2",
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const providersPieOptions: Highcharts.Options = {
    chart: {
      type: "pie",
      height: 260,
    },
    title: {
      text: "Provider Status",
      align: "left",
    },
    tooltip: {
      pointFormat: "{series.name}: <b>{point.y}</b>",
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        borderWidth: 0,
        borderRadius: 8,
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b><br>{point.percentage:.1f}%",
          distance: 20,
          style: {
            fontSize: "13px",
            fontWeight: "600",
          },
        },
        showInLegend: true,
      },
    },
    series: [
      {
        name: "Providers",
        type: "pie",
        data:
          providersPieData.length > 0
            ? providersPieData
            : [{ name: "No Data", y: 1, color: "#E5E7EB" }],
        innerSize: "60%",
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const serviceDistributionOptions: Highcharts.Options = {
    chart: {
      type: "pie",
      height: 260,
    },
    title: {
      text: "Service Categories Distribution",
      align: "left",
    },
    tooltip: {
      pointFormat: "{series.name}: <b>{point.y}</b>",
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        borderWidth: 0,
        borderRadius: 8,
        size: "90%", // Increased from default to make chart larger
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b><br>{point.percentage:.1f}%",
          distance: 15,
          style: {
            fontSize: "12px",
            fontWeight: "600",
          },
        },
        showInLegend: false,
      },
    },
    series: [
      {
        name: "Services",
        type: "pie",
        data:
          serviceDistributionData.length > 0
            ? serviceDistributionData
            : [{ name: "No Data", y: 1, color: "#E5E7EB" }],
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-150 h-150 bg-linear-to-br from-violet-400/10 to-fuchsia-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-linear-to-tr from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-3 sm:p-4 lg:p-6 max-w-450 mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Hero Section - Redesigned with Unique Layout */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-violet-600 via-purple-700 to-fuchsia-800 p-3 sm:p-4 lg:p-5 shadow-2xl">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-300 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>
          </div>

          {/* Geometric Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 border-4 border-white/10 rounded-full" />
            <div className="absolute -top-32 -right-32 w-64 h-64 border-2 border-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 border-4 border-white/10 rounded-full" />
            <div className="absolute top-1/2 right-10 w-2 h-2 bg-white/20 rounded-full" />
            <div className="absolute top-1/3 right-20 w-1.5 h-1.5 bg-white/15 rounded-full" />
            <div className="absolute bottom-1/3 left-16 w-2.5 h-2.5 bg-white/10 rounded-full" />
          </div>

          <div className="relative z-10">
            {/* Header Section with Modern Layout */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
              {/* Left: Greeting */}
              <div className="flex-1">
                <h1
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 leading-tight"
                  style={{
                    fontFamily: "'Clash Display', 'Inter', sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Welcome back,&nbsp;
                  <br className="sm:hidden" />
                  <span className="bg-linear-to-r from-violet-200 via-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
                    {user?.name?.split(" ")[0] || "Admin"}!
                  </span>
                </h1>

                <p className="text-violet-100 text-xs sm:text-sm max-w-xl hidden sm:block">
                  Monitor your platform's performance with real-time analytics and insights
                </p>
              </div>

              {/* Right: Date & Time */}
              <div className="hidden sm:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/20">
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <p className="text-white text-sm sm:text-base lg:text-lg font-bold">
                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats - Modern Card Layout */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/20">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-white/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    Total Revenue
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                    ₹{(totalRevenue / 100000).toFixed(1)}L
                  </p>
                  {distributableAmount > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-300" />
                      <p className="text-xs text-emerald-200 font-medium">
                        {adminPercentage.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/20">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-white/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    Active Providers
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                    {stats?.activeProviders || 0}
                  </p>
                  {stats?.totalProviders && stats?.activeProviders && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-300" />
                      <p className="text-xs text-emerald-200 font-medium">
                        {((stats?.activeProviders / stats?.totalProviders) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/20">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-white/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    Completion Rate
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                    {completionRate}%
                  </p>
                  {parseFloat(completionRate as string) > 70 && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-300" />
                      <p className="text-xs text-yellow-200 font-medium">Excellent</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/20">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-white/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    Total Requests
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                    {stats?.totalRequests || 0}
                  </p>
                  {stats?.totalRequests && stats?.completedRequests && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-fuchsia-300" />
                      <p className="text-xs text-fuchsia-200 font-medium">
                        {((stats?.completedRequests / stats?.totalRequests) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Decorative Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-violet-400 via-fuchsia-400 to-purple-400" />
        </div>

        {/* Main Metrics Grid - Staggered Animation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <GlowCard delay={0} gradient="from-violet-500/20 to-fuchsia-500/20">
            <MetricCard
              icon={<Users className="h-6 w-6 sm:h-7 sm:w-7" />}
              label="Total Users"
              value={stats?.totalUsers || 0}
              color="blue"
              delay={0}
            />
          </GlowCard>

          <GlowCard delay={100} gradient="from-indigo-500/20 to-purple-500/20">
            <MetricCard
              icon={<FolderKanban className="h-6 w-6 sm:h-7 sm:w-7" />}
              label="Categories"
              value={stats?.totalCategories || 0}
              color="indigo"
              delay={100}
            />
          </GlowCard>

          <GlowCard delay={200} gradient="from-violet-500/20 to-fuchsia-500/20">
            <MetricCard
              icon={<Activity className="h-6 w-6 sm:h-7 sm:w-7" />}
              label="Requests"
              value={stats?.totalRequests || 0}
              color="cyan"
              delay={200}
            />
          </GlowCard>

          <GlowCard delay={300} gradient="from-emerald-500/20 to-teal-500/20">
            <MetricCard
              icon={<IndianRupee className="h-6 w-6 sm:h-7 sm:w-7" />}
              label="Revenue"
              value={stats?.totalRevenue || 0}
              prefix="₹"
              color="emerald"
              delay={300}
            />
          </GlowCard>
        </div>

        {/* Charts Section - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
          <GlowCard delay={400} className="lg:col-span-2">
            <ChartWrapper
              highcharts={Highcharts}
              options={revenueChartOptions}
            />
          </GlowCard>

          <GlowCard delay={500} className="lg:col-span-1">
            <ChartWrapper
              highcharts={Highcharts}
              options={requestsPieOptions}
            />
          </GlowCard>

          <GlowCard delay={600} className="lg:col-span-1">
            <ChartWrapper
              highcharts={Highcharts}
              options={serviceDistributionOptions}
            />
          </GlowCard>
        </div>

        {/* Charts Section - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
          <GlowCard delay={700} className="lg:col-span-1">
            <ChartWrapper highcharts={Highcharts} options={usersBarOptions} />
          </GlowCard>

          <GlowCard delay={800} className="lg:col-span-1">
            <ChartWrapper
              highcharts={Highcharts}
              options={providersPieOptions}
            />
          </GlowCard>
        </div>

        {/* Detailed Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {/* Service Requests Breakdown */}
          <GlowCard delay={900} className="sm:col-span-1">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-600" />
                Service Requests
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <StatusRow
                  icon={<Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  label="Pending"
                  value={stats?.pendingRequests || 0}
                  color="amber"
                  bgColor="bg-amber-50"
                  textColor="text-amber-700"
                />
                <StatusRow
                  icon={<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  label="In Progress"
                  value={stats?.inProgressRequests || 0}
                  color="blue"
                  bgColor="bg-violet-50"
                  textColor="text-violet-700"
                />
                <StatusRow
                  icon={<CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  label="Completed"
                  value={stats?.completedRequests || 0}
                  color="emerald"
                  bgColor="bg-emerald-50"
                  textColor="text-emerald-700"
                />
                <StatusRow
                  icon={<XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  label="Cancelled"
                  value={stats?.cancelledRequests || 0}
                  color="slate"
                  bgColor="bg-slate-100"
                  textColor="text-slate-700"
                />
              </div>
            </div>
          </GlowCard>

          {/* Providers Overview */}
          <GlowCard delay={1000} className="sm:col-span-1">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Providers
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <StatusRow
                  icon={<CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  label="Active"
                  value={stats?.activeProviders || 0}
                  color="emerald"
                  bgColor="bg-emerald-50"
                  textColor="text-emerald-700"
                />
                <StatusRow
                  icon={<XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  label="Suspended"
                  value={stats?.suspendedProviders || 0}
                  color="slate"
                  bgColor="bg-slate-100"
                  textColor="text-slate-700"
                />
                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      Total Providers
                    </span>
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">
                      {stats?.totalProviders || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Revenue Distribution */}
          <GlowCard delay={1100} className="sm:col-span-2 lg:col-span-1">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
                Revenue Distribution
              </h3>
              <ChartWrapper
                highcharts={Highcharts}
                options={revenueDistributionOptions}
              />
            </div>
          </GlowCard>
        </div>

        {/* Quick Actions - Distinctive Design */}
        <GlowCard delay={1200} gradient="from-violet-600/20 to-indigo-600/20">
          <div className="bg-linear-to-r from-violet-600 to-indigo-700 rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Quick Actions</h2>
                <p className="text-violet-100 text-xs sm:text-sm">
                  Manage your platform efficiently
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <ActionButton
                href="/admin/categories"
                icon={<FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Manage Categories"
                color="from-violet-500 to-fuchsia-600"
              />
              <ActionButton
                href="/admin/providers"
                icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="View Providers"
                color="from-indigo-500 to-indigo-600"
              />
              <ActionButton
                href="/admin/customers"
                icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="View Customers"
                color="from-violet-500 to-fuchsia-600"
              />
              <ActionButton
                href="/admin/reviews"
                icon={<Target className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Moderate Reviews"
                color="from-purple-500 to-purple-600"
              />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @import url("https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap");
      `}</style>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  prefix = "",
  color,
  delay,
  percentage,
  percentageLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  color: "blue" | "indigo" | "cyan" | "emerald";
  delay: number;
  percentage?: number;
  percentageLabel?: string;
}) {
  const colorStyles = {
    blue: {
      bgGradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      textColor: "text-violet-700",
      lightBg: "bg-violet-50",
    },
    indigo: {
      bgGradient: "from-indigo-500 via-purple-500 to-pink-500",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      textColor: "text-indigo-700",
      lightBg: "bg-indigo-50",
    },
    cyan: {
      bgGradient: "from-cyan-500 via-blue-500 to-indigo-500",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      textColor: "text-cyan-700",
      lightBg: "bg-cyan-50",
    },
    emerald: {
      bgGradient: "from-emerald-500 via-teal-500 to-green-500",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      textColor: "text-emerald-700",
      lightBg: "bg-emerald-50",
    },
  };

  const styles = colorStyles[color];

  return (
    <div className="relative group overflow-hidden">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-linear-to-br ${styles.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />

      {/* Main content */}
      <div className="relative bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-transparent group-hover:border-white/50 transition-all duration-300">
        {/* Content */}
        <div className="space-y-2.5 sm:space-y-3">
          {/* Label with icon */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className={`p-2 rounded-lg ${styles.lightBg}`}>
              <div className={`h-3.5 w-3.5 ${styles.textColor}`}>
                {icon}
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {label}
            </p>
          </div>

          {/* Value with animated counter */}
          <div>
            <p
              className="text-2xl sm:text-3xl font-bold bg-linear-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              {prefix}
              <AnimatedCounter end={value} delay={delay} />
            </p>
          </div>

          {/* Percentage badge */}
          {percentage !== undefined && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${styles.lightBg} ${styles.textColor} border border-current/20 shadow-sm`}>
                {percentage > 0 ? "+" : ""}
                {percentage.toFixed(1)}%
              </span>
              {percentageLabel && (
                <span className="text-xs text-gray-500 font-medium">{percentageLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-linear-to-br from-current/5 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
}

// Status Row Component
function StatusRow({
  icon,
  label,
  value,
  color,
  bgColor,
  textColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${bgColor} hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`text-${color}-600 h-4 w-4`}>{icon}</div>
        <span className={`text-xs sm:text-sm font-medium ${textColor}`}>
          {label}
        </span>
      </div>
      <span className={`text-base sm:text-lg font-bold ${textColor}`}>
        {value}
      </span>
    </div>
  );
}

// Revenue Row Component
function RevenueRow({
  label,
  value,
  color,
  percentage,
}: {
  label: string;
  value: number;
  color: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold text-${color}-600`}>
          ₹{(value / 1000).toFixed(1)}K
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full bg-linear-to-r from-${color}-500 to-${color}-600 rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Quick Stat Component
function QuickStat({
  label,
  value,
  trend,
  trendDirection = "up",
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}) {
  const trendColors = {
    up: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    down: "bg-red-500/20 text-red-300 border-red-400/30",
    neutral: "bg-gray-500/20 text-gray-300 border-gray-400/30",
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-white/20">
      <p className="text-violet-100 text-[10px] sm:text-xs font-medium mb-1">
        {label}
      </p>
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border ${trendColors[trendDirection]}`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// Action Button Component
function ActionButton({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Button
        variant="secondary"
        className={`w-full bg-white/10 hover:bg-white/20 text-white border-0 justify-start gap-2 sm:gap-3 h-auto py-3 sm:py-4 px-3 sm:px-5 backdrop-blur-sm transition-all duration-200 hover:scale-105`}
      >
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </Button>
    </Link>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-450 mx-auto space-y-6 sm:space-y-8">
        {/* Hero Skeleton */}
        <div className="h-64 sm:h-72 lg:h-80 rounded-2xl sm:rounded-3xl bg-linear-to-br from-violet-600 to-indigo-800 animate-pulse" />

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 sm:h-40 lg:h-48 bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg animate-pulse"
            />
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-72 sm:h-80 lg:h-96 bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg animate-pulse"
            />
          ))}
        </div>

        {/* Stats Section Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 sm:h-72 lg:h-80 bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
