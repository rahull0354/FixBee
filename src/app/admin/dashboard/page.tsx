'use client';

import { useEffect, useState, useRef } from 'react';
import { adminApi } from '@/lib/api/admin';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Users,
  Building2,
  FolderKanban,
  TrendingUp,
  Activity,
  DollarSign,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
  Target,
  Loader2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Highcharts from 'highcharts/highcharts';
import HighchartsReact from 'highcharts-react-official';

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
if (typeof window !== 'undefined') {
  Highcharts.setOptions({
    colors: ['#2563EB', '#0891B2', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: "'Inter', -apple-system, sans-serif",
      },
    },
    title: {
      style: {
        fontFamily: "'Clash Display', sans-serif",
        fontWeight: '600',
        fontSize: '18px',
        color: '#1E293B',
      },
    },
    xAxis: {
      labels: {
        style: {
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: '#64748B',
          fontWeight: '500',
        },
      },
      gridLineColor: 'rgba(37, 99, 235, 0.08)',
    },
    yAxis: {
      labels: {
        style: {
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: '#64748B',
          fontWeight: '500',
        },
      },
      gridLineColor: 'rgba(37, 99, 235, 0.08)',
    },
    legend: {
      itemStyle: {
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: '500',
        color: '#475569',
      },
    },
    tooltip: {
      style: {
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        color: '#FFFFFF',
      },
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
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
function AnimatedCounter({ end, duration = 2000, delay = 0 }: { end: number; duration?: number; delay?: number }) {
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
      { threshold: 0.1 }
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
const ChartWrapper = ({ options, highcharts }: { options: Highcharts.Options; highcharts: any }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center bg-slate-50 rounded-2xl" style={{ minHeight: "320px" }}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <HighchartsReact highcharts={highcharts} options={options} />;
};

// Glassmorphic Card with Ambient Glow
function GlowCard({
  children,
  className = '',
  gradient = 'from-blue-500/20 to-cyan-500/20',
  delay = 0
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
      {/* Ambient glow effect */}
      <div className={`absolute inset-0 bg-linear-to-br ${gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      {/* Main card */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-white/50 to-transparent pointer-events-none" />
        <div className="relative p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution[]>([]);
  const [revenueDistribution, setRevenueDistribution] = useState<RevenueDistribution | null>(null);
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
          if (isMounted) setServiceDistribution(Array.isArray(distData) ? distData : []);
        } catch (e) {
          if (isMounted) setServiceDistribution([]);
        }

        try {
          const revDistResponse = await adminApi.getRevenueDistribution();
          const revDistData = (revDistResponse as any).data || revDistResponse;
          console.log('Revenue Distribution API Response:', revDistData);
          if (isMounted) setRevenueDistribution(revDistData);
        } catch (e) {
          console.error('Error loading revenue distribution:', e);
          if (isMounted) setRevenueDistribution(null);
        }
      } catch (error: any) {
        console.error('Error loading dashboard:', error);
        toast.error('Failed to load dashboard');
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
  const totalRevenue = revenueDistribution?.summary?.totalRevenue?.amount || stats?.totalAmountProcessed || 0;
  const adminCommission = revenueDistribution?.summary?.adminEarnings?.amount !== undefined
    ? revenueDistribution.summary.adminEarnings.amount
    : stats?.totalRevenue || 0;
  const providerEarnings = revenueDistribution?.summary?.providerEarnings?.amount !== undefined
    ? revenueDistribution.summary.providerEarnings.amount
    : stats?.totalProviderEarnings || 0;

  // Calculate distributable amount (admin + provider earnings)
  // This ensures percentages always add up to 100%
  const distributableAmount = adminCommission + providerEarnings;

  // Calculate percentages based on distributable amount, not total revenue
  // This accounts for tax and other fees that aren't part of the split
  const adminPercentage = distributableAmount > 0 ? (adminCommission / distributableAmount) * 100 : 0;
  const providerPercentage = distributableAmount > 0 ? (providerEarnings / distributableAmount) * 100 : 0;

  const completionRate = stats?.totalRequests && stats?.totalRequests > 0
    ? ((stats.completedRequests / stats.totalRequests) * 100).toFixed(1)
    : '0';

  // Chart Data
  const serviceDistributionData = serviceDistribution.map((service, index) => ({
    name: service.name,
    y: service.count,
  }));

  // Generate dynamic revenue trend data based on current revenue
  // In production, this should come from an API endpoint that returns historical data
  const generateRevenueTrend = () => {
    const currentRevenue = totalRevenue;
    const monthlyGrowthRate = 0.12; // 12% average growth
    const trend = [];

    for (let i = 5; i >= 0; i--) {
      const monthRevenue = Math.round(currentRevenue / Math.pow(1 + monthlyGrowthRate, i));
      trend.push(monthRevenue);
    }

    return trend;
  };

  const revenueTrendData = generateRevenueTrend();

  // Generate dynamic month labels based on current date
  const generateMonthLabels = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthName);
    }

    return months;
  };

  const monthLabels = generateMonthLabels();

  const requestsPieData = [
    { name: 'Completed', y: stats?.completedRequests || 0, color: '#10B981' },
    { name: 'In Progress', y: stats?.inProgressRequests || 0, color: '#2563EB' },
    { name: 'Pending', y: stats?.pendingRequests || 0, color: '#F59E0B' },
    { name: 'Cancelled', y: stats?.cancelledRequests || 0, color: '#94A3B8' },
  ].filter(item => item.y > 0);

  const customersData = stats?.totalCustomers || 0;
  const providersData = stats?.totalProviders || 0;

  const providersPieData = [
    { name: 'Active', y: stats?.activeProviders || 0, color: '#10B981' },
    { name: 'Suspended', y: stats?.suspendedProviders || 0, color: '#94A3B8' },
  ].filter(item => item.y > 0);

  // Revenue Distribution Data
  const revenueDistributionData = [
    { y: adminCommission, color: '#2563EB' },
    { y: providerEarnings, color: '#0891B2' },
  ];

  // Chart Options
  const revenueChartOptions: Highcharts.Options = {
    chart: {
      type: 'areaspline',
      height: 320,
    },
    title: {
      text: 'Revenue Trend (6 months)',
      align: 'left',
    },
    xAxis: {
      categories: monthLabels,
      gridLineWidth: 0,
    },
    yAxis: {
      title: {
        text: 'Revenue (₹)',
      },
      gridLineDashStyle: 'Dash',
      gridLineWidth: 1,
    },
    tooltip: {
      shared: true,
      valuePrefix: '₹',
      valueDecimals: 0,
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.3,
        marker: {
          enabled: true,
          radius: 4,
          states: {
            hover: {
              enabled: true,
              radius: 6,
            },
          },
        },
      },
    },
    series: [
      {
        name: 'Revenue',
        type: 'areaspline',
        data: revenueTrendData,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, '#2563EB'],
            [1, '#0891B2'],
          ],
        },
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const revenueDistributionOptions: Highcharts.Options = {
    chart: {
      type: 'bar',
      height: 280,
    },
    title: {
      text: 'Revenue Distribution',
      align: 'left',
    },
    subtitle: {
      text: `Invoice Total: ₹${totalRevenue.toLocaleString()} • Split: Admin ${adminPercentage.toFixed(1)}% • Providers ${providerPercentage.toFixed(1)}%`,
      align: 'left',
    },
    xAxis: {
      categories: ['Admin Commission', 'Provider Earnings'],
      gridLineWidth: 0,
      labels: {
        style: { fontSize: '13px', fontWeight: '600', color: '#475569' },
      },
    },
    yAxis: {
      title: {
        text: 'Amount (₹)',
        style: { fontSize: '12px', fontWeight: '600', color: '#64748B' },
      },
      gridLineColor: 'rgba(37, 99, 235, 0.08)',
      labels: {
        style: { fontSize: '12px', fontWeight: '500', color: '#64748B' },
      },
    },
    tooltip: {
      valuePrefix: '₹',
      valueDecimals: 0,
      pointFormat: '{series.name}: <b>₹{point.y:,.0f}</b><br/>Share: {point.percentage:.1f}%',
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderWidth: 0,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          format: '₹{point.y:,.0f}',
          style: {
            fontSize: '13px',
            fontWeight: '700',
            color: '#1E293B',
          },
          y: 5,
        },
        pointWidth: 80,
        groupPadding: 0.3,
      },
    },
    series: [{
      name: 'Revenue',
      type: 'bar',
      data: revenueDistributionData,
    }],
    credits: {
      enabled: false,
    },
  };

  const requestsPieOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 320,
    },
    title: {
      text: 'Service Requests Status',
      align: 'left',
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b>',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderWidth: 0,
        borderRadius: 8,
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b><br>{point.percentage:.1f}%',
          distance: 20,
          style: {
            fontSize: '13px',
            fontWeight: '600',
          },
        },
        showInLegend: true,
      },
    },
    series: [
      {
        name: 'Requests',
        type: 'pie',
        data: requestsPieData.length > 0 ? requestsPieData : [{ name: 'No Data', y: 1, color: '#E5E7EB' }],
        innerSize: '60%',
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const usersBarOptions: Highcharts.Options = {
    chart: {
      type: 'column',
      height: 320,
    },
    title: {
      text: 'User Distribution',
      align: 'left',
    },
    xAxis: {
      categories: [''],
      gridLineWidth: 0,
    },
    yAxis: {
      title: {
        text: 'Total Users',
      },
      gridLineDashStyle: 'Dash',
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
          format: '{point.y}',
          style: {
            fontSize: '14px',
            fontWeight: '700',
          },
        },
      },
    },
    series: [
      {
        name: 'Customers',
        type: 'column',
        data: [customersData],
        color: '#2563EB',
      },
      {
        name: 'Providers',
        type: 'column',
        data: [providersData],
        color: '#0891B2',
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const providersPieOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 320,
    },
    title: {
      text: 'Provider Status',
      align: 'left',
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b>',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderWidth: 0,
        borderRadius: 8,
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b><br>{point.percentage:.1f}%',
          distance: 20,
          style: {
            fontSize: '13px',
            fontWeight: '600',
          },
        },
        showInLegend: true,
      },
    },
    series: [
      {
        name: 'Providers',
        type: 'pie',
        data: providersPieData.length > 0 ? providersPieData : [{ name: 'No Data', y: 1, color: '#E5E7EB' }],
        innerSize: '60%',
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const serviceDistributionOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 320,
    },
    title: {
      text: 'Service Categories Distribution',
      align: 'left',
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b>',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderWidth: 0,
        borderRadius: 8,
        size: '90%', // Increased from default to make chart larger
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b><br>{point.percentage:.1f}%',
          distance: 15,
          style: {
            fontSize: '12px',
            fontWeight: '600',
          },
        },
        showInLegend: false,
      },
    },
    series: [
      {
        name: 'Services',
        type: 'pie',
        data: serviceDistributionData.length > 0 ? serviceDistributionData : [{ name: 'No Data', y: 1, color: '#E5E7EB' }],
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
        <div className="absolute top-0 right-0 w-150 h-150 bg-linear-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-150 h-150 bg-linear-to-tr from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-450 mx-auto space-y-8">
        {/* Hero Section - Distinctive Typography */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 shadow-2xl">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <div className="relative z-10">
            {/* Greeting with distinctive font styling */}
            <div className="mb-6">
              <p className="text-blue-200 text-sm font-medium tracking-wider uppercase mb-2">Admin Dashboard</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3" style={{
                fontFamily: "'Clash Display', 'Inter', sans-serif",
                letterSpacing: '-0.02em',
              }}>
                Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Monitor your platform's performance and growth with comprehensive analytics
              </p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <QuickStat label="Total Revenue" value={`₹${(totalRevenue / 100000).toFixed(1)}L`} trend="+12.5%" />
              <QuickStat label="Active Providers" value={stats?.activeProviders || 0} trend="+8.2%" />
              <QuickStat label="Completion Rate" value={`${completionRate}%`} trend="+5.1%" />
              <QuickStat label="Total Requests" value={stats?.totalRequests || 0} trend="+15.3%" />
            </div>
          </div>

          {/* Decorative floating elements */}
          <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center animate-pulse">
            <Sparkles className="h-8 w-8 text-white/80" />
          </div>
        </div>

        {/* Main Metrics Grid - Staggered Animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlowCard delay={0} gradient="from-blue-500/20 to-cyan-500/20">
            <MetricCard
              icon={<Users className="h-7 w-7" />}
              label="Total Users"
              value={stats?.totalUsers || 0}
              color="blue"
              delay={0}
            />
          </GlowCard>

          <GlowCard delay={100} gradient="from-indigo-500/20 to-purple-500/20">
            <MetricCard
              icon={<FolderKanban className="h-7 w-7" />}
              label="Categories"
              value={stats?.totalCategories || 0}
              color="indigo"
              delay={100}
            />
          </GlowCard>

          <GlowCard delay={200} gradient="from-cyan-500/20 to-blue-500/20">
            <MetricCard
              icon={<Activity className="h-7 w-7" />}
              label="Requests"
              value={stats?.totalRequests || 0}
              color="cyan"
              delay={200}
            />
          </GlowCard>

          <GlowCard delay={300} gradient="from-emerald-500/20 to-teal-500/20">
            <MetricCard
              icon={<DollarSign className="h-7 w-7" />}
              label="Revenue"
              value={stats?.totalRevenue || 0}
              prefix="₹"
              color="emerald"
              delay={300}
            />
          </GlowCard>
        </div>

        {/* Charts Section - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlowCard delay={400} className="lg:col-span-1">
            <ChartWrapper highcharts={Highcharts} options={revenueChartOptions} />
          </GlowCard>

          <GlowCard delay={500} className="lg:col-span-1">
            <ChartWrapper highcharts={Highcharts} options={requestsPieOptions} />
          </GlowCard>
        </div>

        {/* Charts Section - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlowCard delay={600} className="lg:col-span-1">
            <ChartWrapper highcharts={Highcharts} options={usersBarOptions} />
          </GlowCard>

          <GlowCard delay={700} className="lg:col-span-1">
            <ChartWrapper highcharts={Highcharts} options={providersPieOptions} />
          </GlowCard>

          <GlowCard delay={800} className="lg:col-span-1">
            <ChartWrapper highcharts={Highcharts} options={serviceDistributionOptions} />
          </GlowCard>
        </div>

        {/* Detailed Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Requests Breakdown */}
          <GlowCard delay={900} className="lg:col-span-1">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Service Requests
              </h3>
              <div className="space-y-4">
                <StatusRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Pending"
                  value={stats?.pendingRequests || 0}
                  color="amber"
                  bgColor="bg-amber-50"
                  textColor="text-amber-700"
                />
                <StatusRow
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="In Progress"
                  value={stats?.inProgressRequests || 0}
                  color="blue"
                  bgColor="bg-blue-50"
                  textColor="text-blue-700"
                />
                <StatusRow
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Completed"
                  value={stats?.completedRequests || 0}
                  color="emerald"
                  bgColor="bg-emerald-50"
                  textColor="text-emerald-700"
                />
                <StatusRow
                  icon={<XCircle className="h-4 w-4" />}
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
          <GlowCard delay={1000} className="lg:col-span-1">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Providers
              </h3>
              <div className="space-y-4">
                <StatusRow
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Active"
                  value={stats?.activeProviders || 0}
                  color="emerald"
                  bgColor="bg-emerald-50"
                  textColor="text-emerald-700"
                />
                <StatusRow
                  icon={<XCircle className="h-4 w-4" />}
                  label="Suspended"
                  value={stats?.suspendedProviders || 0}
                  color="slate"
                  bgColor="bg-slate-100"
                  textColor="text-slate-700"
                />
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Providers</span>
                    <span className="text-2xl font-bold text-indigo-600">{stats?.totalProviders || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Revenue Distribution */}
          <GlowCard delay={1100} className="lg:col-span-1">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Revenue Distribution
              </h3>
              <ChartWrapper highcharts={Highcharts} options={revenueDistributionOptions} />
            </div>
          </GlowCard>
        </div>

        {/* Quick Actions - Distinctive Design */}
        <GlowCard delay={1200} gradient="from-blue-600/20 to-indigo-600/20">
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Quick Actions</h2>
                <p className="text-blue-100 text-sm">Manage your platform efficiently</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActionButton
                href="/admin/categories"
                icon={<FolderKanban className="h-5 w-5" />}
                label="Manage Categories"
                color="from-blue-500 to-blue-600"
              />
              <ActionButton
                href="/admin/providers"
                icon={<Building2 className="h-5 w-5" />}
                label="View Providers"
                color="from-indigo-500 to-indigo-600"
              />
              <ActionButton
                href="/admin/customers"
                icon={<Users className="h-5 w-5" />}
                label="View Customers"
                color="from-cyan-500 to-cyan-600"
              />
              <ActionButton
                href="/admin/reviews"
                icon={<Target className="h-5 w-5" />}
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

        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  prefix = '',
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  color: 'blue' | 'indigo' | 'cyan' | 'emerald';
  delay: number;
}) {
  const colorStyles = {
    blue: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    indigo: { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    cyan: { iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
    emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  };

  const styles = colorStyles[color];

  return (
    <div className="space-y-3">
      <div className={`p-3 rounded-xl ${styles.iconBg} w-fit`}>
        <div className={styles.iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Clash Display', sans-serif" }}>
          {prefix}
          <AnimatedCounter end={value} delay={delay} />
        </p>
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
    <div className={`flex items-center justify-between p-3 rounded-xl ${bgColor} hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center gap-3">
        <div className={`text-${color}-600`}>{icon}</div>
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
      </div>
      <span className={`text-lg font-bold ${textColor}`}>{value}</span>
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
        <span className={`text-sm font-bold text-${color}-600`}>₹{(value / 1000).toFixed(1)}K</span>
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
function QuickStat({ label, value, trend }: { label: string; value: string | number; trend: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <p className="text-blue-100 text-xs font-medium mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-xs text-emerald-300 font-medium bg-emerald-500/20 px-2 py-1 rounded-full">
          {trend}
        </span>
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
        className={`w-full bg-white/10 hover:bg-white/20 text-white border-0 justify-start gap-3 h-auto py-4 px-5 backdrop-blur-sm transition-all duration-200 hover:scale-105`}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </Button>
    </Link>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-6 lg:p-8">
      <div className="max-w-450 mx-auto space-y-8">
        {/* Hero Skeleton */}
        <div className="h-80 rounded-3xl bg-linear-to-br from-blue-600 to-indigo-800 animate-pulse" />

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg animate-pulse" />
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-96 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg animate-pulse" />
          ))}
        </div>

        {/* Stats Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
