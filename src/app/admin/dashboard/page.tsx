'use client';

import { useEffect, useState } from 'react';
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
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
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
  activeProviders: number;
  suspendedProviders: number;
}

// Client-only chart wrapper to prevent SSR issues
const ChartWrapper = ({ options, highcharts }: { options: Highcharts.Options; highcharts: any }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="flex items-center justify-center" style={{ minHeight: "280px" }}><Loader2 className="h-8 w-8 animate-spin text-rose-500" /></div>;
  }

  return <HighchartsReact highcharts={highcharts} options={options} />;
};

// Custom Highcharts theme
if (typeof window !== 'undefined') {
  Highcharts.setOptions({
    colors: ['#F43F5E', '#E11D48', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Inter, sans-serif',
      },
    },
    title: {
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: '700',
        fontSize: '18px',
      },
    },
    xAxis: {
      labels: {
        style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
        },
      },
    },
    yAxis: {
      labels: {
        style: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
        },
      },
    },
    legend: {
      itemStyle: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontWeight: '500',
      },
    },
    tooltip: {
      style: {
        fontFamily: 'Inter, sans-serif',
      },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderWidth: 0,
      borderRadius: 8,
      shadow: true,
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
    },
  });
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadDashboardStats();
  }, []);


  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      const apiData = (response as any).data || response;
      setStats(apiData);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return <LoadingSkeleton />;
  }

  // Prepare chart data
  const requestsPieData = [
    {
      name: 'Completed',
      y: stats?.completedRequests || 0,
      color: '#10B981',
    },
    {
      name: 'In Progress',
      y: stats?.inProgressRequests || 0,
      color: '#3B82F6',
    },
    {
      name: 'Pending',
      y: stats?.pendingRequests || 0,
      color: '#F59E0B',
    },
    {
      name: 'Cancelled',
      y: stats?.cancelledRequests || 0,
      color: '#94A3B8',
    },
  ];

  const usersBarData = [
    {
      name: 'Customers',
      y: stats?.totalCustomers || 0,
      color: '#F43F5E',
    },
    {
      name: 'Providers',
      y: stats?.totalProviders || 0,
      color: '#E11D48',
    },
  ];

  const providersPieData = [
    {
      name: 'Active',
      y: stats?.activeProviders || 0,
      color: '#0891B2',
    },
    {
      name: 'Suspended',
      y: stats?.suspendedProviders || 0,
      color: '#94A3B8',
    },
  ];

  // Revenue trend chart options
  const revenueChartOptions: Highcharts.Options = {
    chart: {
      type: 'areaspline',
      height: 280,
    },
    title: {
      text: 'Revenue Trend',
      align: 'left',
    },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      gridLineWidth: 0,
    },
    yAxis: {
      title: {
        text: 'Revenue (₹)',
      },
      gridLineDashStyle: 'Dash',
      gridLineWidth: 1,
      gridLineColor: 'rgba(244, 63, 94, 0.1)',
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
        data: [45000, 52000, 48000, 61000, 55000, stats?.totalRevenue || 67000],
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, '#F43F5E'],
            [1, '#E11D48'],
          ],
        },
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const requestsPieOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 280,
    },
    title: {
      text: 'Service Requests',
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
        data: requestsPieData,
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
      height: 280,
    },
    title: {
      text: 'User Distribution',
      align: 'left',
    },
    xAxis: {
      categories: ['Customers', 'Providers'],
      gridLineWidth: 0,
    },
    yAxis: {
      title: {
        text: 'Total Users',
      },
      gridLineDashStyle: 'Dash',
      gridLineWidth: 1,
      gridLineColor: 'rgba(244, 63, 94, 0.1)',
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
        name: 'Users',
        type: 'column',
        data: usersBarData,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  const providersPieOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 280,
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
        data: providersPieData,
        innerSize: '60%',
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-blue-900 p-8 sm:p-10 shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome back, {user?.name || 'Admin'}!
          </h1>
          <p className="text-base sm:text-lg text-blue-100">
            Monitor your platform's performance and growth
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          icon={<Users className="h-6 w-6" />}
          label="Total Users"
          value={stats?.totalUsers || 0}
          change="+12%"
          changePositive={true}
          color="blue"
          delay={0}
        />

        <MetricCard
          icon={<FolderKanban className="h-6 w-6" />}
          label="Categories"
          value={stats?.totalCategories || 0}
          change="+8%"
          changePositive={true}
          color="indigo"
          delay={100}
        />

        <MetricCard
          icon={<Activity className="h-6 w-6" />}
          label="Total Requests"
          value={stats?.totalRequests || 0}
          change="+24%"
          changePositive={true}
          color="cyan"
          delay={200}
        />

        <MetricCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Revenue"
          value={stats?.totalRevenue || 0}
          prefix="₹"
          change="+18%"
          changePositive={true}
          color="emerald"
          delay={300}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div style={{ minHeight: "280px" }}>
            <ChartWrapper highcharts={Highcharts} options={revenueChartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div style={{ minHeight: "280px" }}>
            <ChartWrapper highcharts={Highcharts} options={requestsPieOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div style={{ minHeight: "280px" }}>
            <ChartWrapper highcharts={Highcharts} options={usersBarOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
          <div style={{ minHeight: "280px" }}>
            <ChartWrapper highcharts={Highcharts} options={providersPieOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Service Requests
          </h2>
          <div className="space-y-3">
            <StatusRow icon={<Clock className="h-4 w-4 text-amber-500" />} label="Pending" value={stats?.pendingRequests || 0} color="text-amber-700" bgColor="bg-amber-50" />
            <StatusRow icon={<TrendingUp className="h-4 w-4 text-blue-500" />} label="In Progress" value={stats?.inProgressRequests || 0} color="text-blue-700" bgColor="bg-blue-50" />
            <StatusRow icon={<CheckCircle className="h-4 w-4 text-emerald-500" />} label="Completed" value={stats?.completedRequests || 0} color="text-emerald-700" bgColor="bg-emerald-50" />
            <StatusRow icon={<XCircle className="h-4 w-4 text-slate-500" />} label="Cancelled" value={stats?.cancelledRequests || 0} color="text-slate-700" bgColor="bg-slate-100" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Service Providers
          </h2>
          <div className="space-y-3">
            <StatusRow icon={<CheckCircle className="h-4 w-4 text-emerald-500" />} label="Active" value={stats?.activeProviders || 0} color="text-emerald-700" bgColor="bg-emerald-50" />
            <StatusRow icon={<XCircle className="h-4 w-4 text-slate-500" />} label="Suspended" value={stats?.suspendedProviders || 0} color="text-slate-700" bgColor="bg-slate-100" />
            <div className="pt-3 border-t border-slate-200 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Total Providers</span>
                <span className="text-lg font-bold text-indigo-600">{stats?.totalProviders || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/categories">
            <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
              <FolderKanban className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
          </Link>
          <Link href="/admin/providers">
            <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
              <Building2 className="h-4 w-4 mr-2" />
              View Providers
            </Button>
          </Link>
          <Link href="/admin/customers">
            <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
              <Users className="h-4 w-4 mr-2" />
              View Customers
            </Button>
          </Link>
          <Link href="/admin/reviews">
            <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0">
              <Activity className="h-4 w-4 mr-2" />
              Moderate Reviews
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  prefix,
  change,
  changePositive,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  change?: string;
  changePositive?: boolean;
  color: 'blue' | 'indigo' | 'cyan' | 'emerald';
  delay: number;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);

  const colorClasses = {
    blue: { bg: 'bg-blue-500', gradient: 'from-blue-600 to-blue-700', iconBg: 'bg-blue-100', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-500', gradient: 'from-indigo-600 to-indigo-700', iconBg: 'bg-indigo-100', text: 'text-indigo-600' },
    cyan: { bg: 'bg-cyan-500', gradient: 'from-cyan-600 to-cyan-700', iconBg: 'bg-cyan-100', text: 'text-cyan-600' },
    emerald: { bg: 'bg-emerald-500', gradient: 'from-emerald-600 to-emerald-700', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
  };

  const classes = colorClasses[color];

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const counter = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(counter);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div
      className="relative group overflow-hidden bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ animation: `fadeInUp 0.6s ease-out ${delay}ms both` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${classes.iconBg}`}>
          <div className={classes.text}>{icon}</div>
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${changePositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {changePositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">
        {prefix}
        {animatedValue.toLocaleString('en-IN')}
      </p>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${bgColor} hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-900 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-white rounded-2xl shadow-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-80 bg-white rounded-2xl shadow-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-white rounded-2xl shadow-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Add custom CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
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
  `;
  document.head.appendChild(style);
}
