'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  CheckCircle,
  Clock,
  IndianRupee,
  Star,
  TrendingUp,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { providerApi } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-more';
import 'highcharts/modules/accessibility';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalAssignments: number;
  completedServices: number;
  inProgressServices: number;
  assignedServices: number;
  averageRating: number;
  totalEarnings: number;
  isAvailable: boolean;
}

export default function ProviderDashboardPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssignments: 0,
    completedServices: 0,
    inProgressServices: 0,
    assignedServices: 0,
    averageRating: 0,
    totalEarnings: 0,
    isAvailable: false,
  });

  // Chart data - will be populated from API
  const [servicesData, setServicesData] = useState([
    { name: 'Completed', value: 0, color: '#10b981' },
    { name: 'In Progress', value: 0, color: '#3b82f6' },
    { name: 'Pending', value: 0, color: '#f59e0b' },
  ]);

  // Track hidden categories for toggle functionality
  const [hiddenServices, setHiddenServices] = useState<Set<string>>(new Set());
  const [hiddenRatings, setHiddenRatings] = useState<Set<string>>(new Set());

  const [earningsData, setEarningsData] = useState<Array<{ month: string; earnings: number }>>([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState<Array<{ month: string; completed: number; earnings: number }>>([]);
  const [ratingDistribution, setRatingDistribution] = useState<Array<{ rating: string; count: number; color: string }>>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggle functions for legend clicks
  const toggleServiceCategory = (categoryName: string) => {
    setHiddenServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleRatingCategory = (rating: string) => {
    setHiddenRatings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rating)) {
        newSet.delete(rating);
      } else {
        newSet.add(rating);
      }
      return newSet;
    });
  };

  useEffect(() => {
    checkProfileAndLoadData();
  }, []);

  const checkProfileAndLoadData = async () => {
    try {
      // First check if profile is complete
      const profileResponse = await providerApi.getProfile();
      const profileData = (profileResponse as any).data || profileResponse;

      // Check if profile is incomplete
      const isProfileIncomplete =
        !profileData.bio ||
        !profileData.skills ||
        profileData.skills.length === 0 ||
        !profileData.baseRate ||
        profileData.baseRate === 0;

      if (isProfileIncomplete) {
        toast.info('Please complete your profile setup first');
        router.push('/provider/profile/setup');
        return;
      }

      // Profile is complete, load dashboard data
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error checking profile:', error);
      // If profile check fails, still try to load dashboard
      await loadDashboardData();
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

  const handleViewAssignment = (service: any) => {
    // Store assignment data in sessionStorage before navigation
    const storageKey = `assignment_${service.id}`;
    sessionStorage.setItem(storageKey, JSON.stringify({
      ...service,
      timestamp: Date.now(),
    }));
    router.push(`/provider/assignments/${service.id}`);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load provider profile to get latest suspension status
      try {
        const profileResponse = await providerApi.getProfile();
        const profileData = (profileResponse as any).data || profileResponse;
        // Update user context with latest profile data including suspension reason
        updateUser({
          isSuspended: profileData.isSuspended,
          isActive: profileData.isActive,
          suspensionReason: profileData.suspensionReason,
        });
      } catch (err) {
        console.error('Error loading profile for suspension status:', err);
      }

      // Load dashboard stats
      const statsResponse = await providerApi.getDashboardStats();
      const data = (statsResponse as any).data || statsResponse;

      setStats({
        totalAssignments: data.totalAssignments || 0,
        completedServices: data.completedServices || 0,
        inProgressServices: data.inProgressServices || 0,
        assignedServices: data.assignedServices || 0,
        averageRating: data.averageRating || 0,
        totalEarnings: data.totalEarnings || 0,
        isAvailable: data.isAvailable || false,
      });

      // Update services distribution based on real data
      setServicesData([
        { name: 'Completed', value: data.completedServices || 0, color: '#10b981' },
        { name: 'In Progress', value: data.inProgressServices || 0, color: '#3b82f6' },
        { name: 'Pending', value: data.assignedServices || 0, color: '#f59e0b' },
      ]);

      // Process rating distribution
      if (data.ratingDistribution) {
        const ratingColors: { [key: number]: string } = {
          5: '#10b981',
          4: '#3b82f6',
          3: '#f59e0b',
          2: '#f97316',
          1: '#ef4444',
        };

        // Handle object format { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 }
        const distributionObj = data.ratingDistribution as { [key: string]: number | string };
        const processedRatings = Object.entries(distributionObj)
          .map(([rating, count]) => ({
            rating: `${rating} Stars`,
            count: Number(count) || 0,
            color: ratingColors[parseInt(rating)] || '#6b7280',
          }))
          .filter((item) => item.count > 0);
        setRatingDistribution(processedRatings);
      }

      // Load monthly earnings
      try {
        const earningsResponse = await providerApi.getMonthlyEarnings(6);
        const earningsData = (earningsResponse as any).data || earningsResponse;
        setEarningsData(Array.isArray(earningsData) ? earningsData : []);
      } catch (err) {
        console.error('Error loading monthly earnings:', err);
        setEarningsData([]);
      }

      // Load monthly performance
      try {
        const performanceResponse = await providerApi.getMonthlyPerformance(6);
        const performanceData = (performanceResponse as any).data || performanceResponse;
        setMonthlyPerformance(Array.isArray(performanceData) ? performanceData : []);
      } catch (err) {
        console.error('Error loading monthly performance:', err);
        setMonthlyPerformance([]);
      }

      // Load recent services
      try {
        const servicesResponse = await providerApi.getMyAssignedRequests({ limit: 5 });
        const servicesData = (servicesResponse as any).data || servicesResponse;
        setRecentServices(Array.isArray(servicesData) ? servicesData.slice(0, 5) : []);
      } catch (err) {
        console.error('Error loading recent services:', err);
        setRecentServices([]);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error(error?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-56 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Earnings Card Skeleton */}
        <div className="bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-32 mb-2 bg-white/20" />
              <Skeleton className="h-10 w-40 bg-white/20" />
            </div>
            <Skeleton className="w-16 h-16 rounded-xl bg-white/20" />
          </div>
        </div>

        {/* Charts Grid - Row 1 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="w-full h-64 rounded-lg" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="w-full h-64 rounded-lg" />
          </div>
        </div>

        {/* Charts Grid - Row 2 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="w-full h-56 rounded-lg" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="w-full h-56 rounded-lg" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <Skeleton className="h-7 w-36 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Suspension Banner */}
      {(!user?.isActive || user?.isSuspended) && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">
                Account Suspended
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Your account has been suspended by the admin. You have limited access to your dashboard.
              </p>
              <div className="flex items-center gap-3 text-sm text-red-600">
                <p className="font-semibold">
                  Reason: {user?.suspensionReason || 'Contact admin for details'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome {user?.name || 'Provider'}!</h1>
          <p className="text-gray-600">
            {stats.isAvailable
              ? 'You are currently available to receive new service requests'
              : 'You are currently unavailable for new requests'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/provider/requests/available">
            <Button className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white">
              Browse Requests
            </Button>
          </Link>
          <Link href="/provider/assignments">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              My Assignments
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assignments */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-emerald-100 rounded-xl shrink-0">
              <Briefcase className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.totalAssignments}</h3>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Assignments</p>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>+12%</span>
            </div>
          </div>
        </div>

        {/* Completed Services */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-100 rounded-xl shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.completedServices}</h3>
          </div>
          <p className="text-sm text-gray-600">Completed Services</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-xl shrink-0">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.inProgressServices}</h3>
          </div>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-yellow-100 rounded-xl shrink-0">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.averageRating}</h3>
          </div>
          <p className="text-sm text-gray-600">Average Rating</p>
        </div>
      </div>

      {/* Earnings Card */}
      <div className="bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-2">Total Earnings</p>
            <h2 className="text-4xl font-bold mb-1">₹{stats.totalEarnings.toLocaleString()}</h2>
            <p className="text-emerald-100 text-sm">From all completed services</p>
          </div>
          <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
            <IndianRupee className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Earnings Trend</h2>
              <p className="text-sm text-gray-500">Monthly earnings over time</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={earningsData}>
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 0.1)',
                }}
                formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Earnings']}
                labelStyle={{ color: '#6b7280' }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#10b981"
                fill="url(#earningsGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Performance Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Monthly Performance</h2>
              <p className="text-sm text-gray-500">Completed services & earnings</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPerformance}>
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                yAxisId="left"
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 0.1)',
                }}
                labelStyle={{ color: '#6b7280' }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="completed"
                name="Completed"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="earnings"
                name="Earnings (₹)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Status Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Service Status</h2>
              <p className="text-sm text-gray-500">Current distribution</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-xl">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          {servicesData.some(item => item.value > 0) ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={{
                chart: {
                  type: 'pie',
                  style: {
                    fontFamily: 'system-ui, sans-serif',
                  },
                  height: 280,
                },
                credits: { enabled: false },
                title: {
                  text: undefined,
                },
                plotOptions: {
                  pie: {
                    innerSize: '65%',
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#fff',
                    dataLabels: {
                      enabled: true,
                      format: '{point.name}',
                      distance: 30,
                      style: {
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textOutline: 'none',
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
                  backgroundColor: '#fff',
                  borderColor: '#e5e7eb',
                  borderRadius: 8,
                  shadow: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    offsetX: 0,
                    offsetY: 4,
                    opacity: 0.5,
                    width: 4,
                  },
                  style: {
                    fontSize: '12px',
                    color: '#6b7280',
                  },
                  pointFormat: '<span style="color:{point.color}">●</span> <b>{point.name}</b><br/><span style="font-size: 11px;">{point.y} services</span>',
                  useHTML: true,
                },
                series: [{
                  name: 'Services',
                  colorByPoint: true,
                  data: servicesData
                    .filter(item => item.value > 0 && !hiddenServices.has(item.name))
                    .map(item => ({
                      name: item.name,
                      y: item.value,
                      color: item.color,
                    })),
                }],
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No services yet</p>
              <p className="text-xs text-gray-400 mt-1">Start accepting requests to see your service distribution</p>
            </div>
          )}
          {servicesData.some(item => item.value > 0) && (
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {servicesData.filter(item => item.value > 0).map((item) => (
                <button
                  key={item.name}
                  onClick={() => toggleServiceCategory(item.name)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all ${
                    hiddenServices.has(item.name)
                      ? 'bg-gray-100 opacity-50'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  style={{
                    border: hiddenServices.has(item.name) ? '1px dashed #d1d5db' : '1px solid transparent',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-gray-700">{item.name}: {item.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rating Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Rating Distribution</h2>
              <p className="text-sm text-gray-500">Customer reviews</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-xl">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          {ratingDistribution.length > 0 ? (
            <>
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: {
                    type: 'pie',
                    style: {
                      fontFamily: 'system-ui, sans-serif',
                    },
                    height: 280,
                  },
                  credits: { enabled: false },
                  title: {
                    text: undefined,
                  },
                  plotOptions: {
                    pie: {
                      innerSize: '65%',
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: '#fff',
                      dataLabels: {
                        enabled: true,
                        format: '{point.name}',
                        distance: 30,
                        style: {
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textOutline: 'none',
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
                    backgroundColor: '#fff',
                    borderColor: '#e5e7eb',
                    borderRadius: 8,
                    shadow: {
                      color: 'rgba(0, 0, 0, 0.1)',
                      offsetX: 0,
                      offsetY: 4,
                      opacity: 0.5,
                      width: 4,
                    },
                    style: {
                      fontSize: '12px',
                      color: '#6b7280',
                    },
                    pointFormat: '<span style="color:{point.color}">●</span> <b>{point.name}</b><br/><span style="font-size: 11px;">{point.y} reviews</span>',
                    useHTML: true,
                  },
                  series: [{
                    name: 'Ratings',
                    colorByPoint: true,
                    data: ratingDistribution
                      .filter(item => !hiddenRatings.has(item.rating))
                      .map(item => ({
                        name: item.rating,
                        y: item.count,
                        color: item.color,
                      })),
                  }],
                }}
              />
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {ratingDistribution.map((item) => (
                  <button
                    key={item.rating}
                    onClick={() => toggleRatingCategory(item.rating)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all ${
                      hiddenRatings.has(item.rating)
                        ? 'bg-gray-100 opacity-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={{
                      border: hiddenRatings.has(item.rating) ? '1px dashed #d1d5db' : '1px solid transparent',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-gray-700">{item.rating}: {item.count}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Complete services to get reviews</p>
            </div>
          )}
        </div>

        {/* Recent Services */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Services</h2>
            <Link href="/provider/assignments" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All
            </Link>
          </div>
          {recentServices.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No services yet</p>
              <Link href="/provider/requests/available">
                <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600">
                  Browse Requests
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Service</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentServices.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleViewAssignment(service)}
                          className="block text-left w-full hover:text-emerald-600 transition-colors"
                        >
                          <p className="font-medium text-gray-800 text-sm">
                            {service.serviceTitle || service.title || 'Service Request'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {service.serviceAddress?.city || 'Location'}
                          </p>
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          service.status === 'completed' ? 'bg-green-100 text-green-800' :
                          service.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                          service.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {service.status === 'completed' ? 'Completed' :
                           service.status === 'in_progress' ? 'In Progress' :
                           service.status === 'assigned' ? 'Assigned' :
                           service.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {formatDate(
                          service.preferredDate ||
                          service.scheduledDate ||
                          service.createdAt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
