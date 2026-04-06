'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { providerApi } from '@/lib/api';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Menu, Bell, LogOut, User, ChevronDown, Check, Loader2, Briefcase, Star, Tag, Info, Wrench, Settings as SettingsIcon } from 'lucide-react';
import type { Notification } from '@/types';

interface ProviderHeaderProps {
  user: any;
  onMenuClick: () => void;
}

export function ProviderHeader({ user, onMenuClick }: ProviderHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline'>('offline');

  // Check if we're on the setup page - skip loading profile there
  const isSetupPage = pathname === '/provider/profile/setup';
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    // Skip loading availability if on setup page
    if (isSetupPage) {
      return;
    }

    const loadAvailability = async () => {
      try {
        // Fetch profile to get actual availability status from backend
        const response = await providerApi.getProfile();
        const data = (response as any).data || response;

        // Check if profile is complete
        const isComplete = !!(
          data.bio &&
          data.skills?.length >= 3 &&
          data.baseRate > 0
        );
        setProfileComplete(isComplete);

        // Backend returns availabilityStatus as "available", "offline", or "busy"
        let status = data.availabilityStatus || 'offline';

        // Check if provider has any active services
        const assignedResponse = await providerApi.getMyAssignedRequests({ status: 'in_progress', limit: 1 });
        const assignedData = (assignedResponse as any).data || assignedResponse;
        const hasActiveServices = assignedData.length > 0;

        // If provider has active services but status is not 'busy', update it
        if (hasActiveServices && status !== 'busy') {
          status = 'busy';
          // Update the backend to reflect the correct status
          await providerApi.toggleAvailability('busy');
        }

        setAvailabilityStatus(status);
        const isAvailable = status === 'available' || status === 'busy' || data.isAvailable === true;
        setIsAvailable(isAvailable);
      } catch (error) {
        console.error('Error loading availability:', error);
        setIsAvailable(false);
        setAvailabilityStatus('offline');
        setProfileComplete(false);
      }
    };
    loadAvailability();
  }, [isSetupPage]);

  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await providerApi.getNotifications({ limit: 5 });
      const data = (response as any).data || response;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleToggleAvailability = async () => {
    // Check if profile is complete before allowing availability change
    if (!profileComplete) {
      toast.error('Please complete your profile setup first before changing availability');
      return;
    }

    try {
      setToggling(true);
      const newStatus = isAvailable ? 'offline' : 'available';
      await providerApi.toggleAvailability(newStatus);
      setIsAvailable(!isAvailable);
      toast.success(
        !isAvailable
          ? 'You are now available to receive service requests'
          : 'You are no longer available for new requests'
      );
    } catch (error: any) {
      console.error('Error toggling availability:', error);
      if (error?.response?.data?.isBusy) {
        toast.error('Cannot change availability while service is in progress');
      } else if (error?.response?.data?.hasActiveServices) {
        const count = error.response.data.activeServiceCount;
        toast.error(`Cannot change availability. You have ${count} service${count > 1 ? 's' : ''} in progress. Complete the service${count > 1 ? 's' : ''} first.`);
      } else {
        toast.error(error?.response?.data?.message || 'Failed to update availability');
      }
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Note: AuthProvider handles redirect to landing page
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push('/provider/profile');
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    router.push('/provider/settings');
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await providerApi.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request_accepted':
      case 'request_started':
      case 'request_completed':
        return 'briefcase';
      case 'review_received':
      case 'customer_response':
        return 'star';
      case 'system_update':
        return 'info';
      case 'promotional':
        return 'tag';
      default:
        return 'bell';
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'request_accepted':
        return 'bg-emerald-100 text-emerald-600';
      case 'request_started':
        return 'bg-blue-100 text-blue-600';
      case 'request_completed':
        return 'bg-green-100 text-green-600';
      case 'review_received':
      case 'customer_response':
        return 'bg-yellow-100 text-yellow-600';
      case 'system_update':
        return 'bg-slate-100 text-slate-600';
      case 'promotional':
        return 'bg-pink-100 text-pink-600';
      default:
        return 'bg-sky-100 text-sky-600';
    }
  };

  // Get initials from name
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-emerald-100 sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4.5">
        {/* Left: Menu button + Title */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>

          {/* Page title */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(' ')[0] || 'Provider'}!
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              Manage your services and assignments
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Availability Toggle */}
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <div className={`w-2 h-2 rounded-full ${
              availabilityStatus === 'busy' ? 'bg-orange-500' :
              isAvailable ? 'bg-emerald-500' : 'bg-gray-400'
            }`} />
            <label htmlFor="availability" className="text-sm font-medium text-gray-700 cursor-pointer">
              {availabilityStatus === 'busy' ? 'Busy' :
               isAvailable ? 'Available' : 'Unavailable'}
            </label>
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={handleToggleAvailability}
              disabled={toggling || availabilityStatus === 'busy' || !profileComplete}
            />
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowDropdown(false);
              }}
              className="relative p-2 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-50 bg-transparent"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 sm:w-96 top-18 sm:mt-2 bg-white rounded-xl shadow-2xl border border-emerald-100 z-50 max-h-[70vh] sm:max-h-125 flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-emerald-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-gray-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="flex-1 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        {notifications.map((notification) => {
                          const iconName = getNotificationIcon(notification.type);
                          const iconColor = getNotificationIconColor(notification.type);
                          const IconComponent = {
                            briefcase: Briefcase,
                            star: Star,
                            tag: Tag,
                            info: Info,
                            bell: Bell,
                            wrench: Wrench,
                          }[iconName] || Bell;

                          return (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                !notification.isRead ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`p-2 rounded-lg ${iconColor} shrink-0 mt-0.5`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Title */}
                                  <p className="text-sm font-semibold text-gray-800 mb-1">
                                    {notification.title}
                                  </p>

                                  {/* Short Description */}
                                  <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                                    {notification.message}
                                  </p>

                                  {/* Time & Actions */}
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">
                                      {formatTime(notification.createdAt)}
                                    </p>
                                    {!notification.isRead && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(notification.id);
                                        }}
                                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 whitespace-nowrap"
                                      >
                                        <Check className="h-3 w-3" />
                                        Mark read
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Unread indicator */}
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-2" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer - View All */}
                  <div className="px-4 py-3 border-t border-emerald-100">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        router.push('/provider/notifications');
                      }}
                      className="w-full text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-2 rounded-lg transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow">
                {getInitials(user?.name)}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform hidden sm:block ${
                  showDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-50 bg-transparent"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 sm:w-56 top-18 sm:mt-2 bg-white rounded-xl shadow-lg border border-emerald-100 py-2 z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                        {getInitials(user?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Button */}
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-emerald-50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Profile</span>
                  </button>

                  {/* Settings Button */}
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-emerald-50 transition-colors"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </button>

                  <div className="border-t border-emerald-100 my-1" />

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
