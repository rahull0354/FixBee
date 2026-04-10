"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, User, LogOut, ChevronDown, Check, Loader2, Briefcase, Star, Tag, Info, Settings } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerApi } from "@/lib/api";
import { toast } from "sonner";
import type { User as UserType } from "@/types/auth";
import type { Notification } from "@/types";

interface CustomerHeaderProps {
  user: UserType | null;
  onMenuClick: () => void;
  pusherUnreadCount?: number;
}

export function CustomerHeader({ user, onMenuClick, pusherUnreadCount = 0 }: CustomerHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { logout } = useAuth();
  const router = useRouter();

  // Store the initial database unread count
  const [databaseUnreadCount, setDatabaseUnreadCount] = useState(0);

  // Update unread count when Pusher notifications arrive (ADD to database count)
  useEffect(() => {
    if (databaseUnreadCount > 0 || pusherUnreadCount > 0) {
      setUnreadCount(databaseUnreadCount + pusherUnreadCount);
    }
  }, [pusherUnreadCount, databaseUnreadCount]);

  useEffect(() => {
    // Initial load of unread count (Pusher handles real-time updates)
    if (user?.id) {
      loadUnreadCount();
    }
  }, [user?.id]);

  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await customerApi.getNotifications({ limit: 5 });
      const data = (response as any).data || response;
      setLocalNotifications(data.notifications || []);
      const dbUnreadCount = data.unreadCount || 0;
      setDatabaseUnreadCount(dbUnreadCount);
      setUnreadCount(dbUnreadCount + pusherUnreadCount);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await customerApi.getNotifications({ limit: 1 });
      const data = (response as any).data || response;
      const dbUnreadCount = data.unreadCount || 0;
      setDatabaseUnreadCount(dbUnreadCount);
      setUnreadCount(dbUnreadCount + pusherUnreadCount);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await customerApi.markAsRead(id);
      setLocalNotifications((prev: Notification[]) =>
        prev.map((n: Notification) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setDatabaseUnreadCount((prev: number) => Math.max(0, prev - 1));
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_assigned":
      case "request_started":
      case "request_completed":
      case "request_cancelled":
        return "briefcase";
      case "review_received":
      case "provider_response":
        return "star";
      case "system_update":
        return "info";
      case "promotional":
        return "tag";
      default:
        return "bell";
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "request_assigned":
        return "bg-blue-100 text-blue-600";
      case "request_started":
        return "bg-purple-100 text-purple-600";
      case "request_completed":
        return "bg-green-100 text-green-600";
      case "request_cancelled":
        return "bg-orange-100 text-orange-600";
      case "review_received":
      case "provider_response":
        return "bg-yellow-100 text-yellow-600";
      case "system_update":
        return "bg-slate-100 text-slate-600";
      case "promotional":
        return "bg-pink-100 text-pink-600";
      default:
        return "bg-sky-100 text-sky-600";
    }
  };

  // Get initials from name (first name + last name)
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Note: AuthProvider handles redirect to landing page
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push("/customer/profile");
  };

  const handleSettingsClick = () => {
    setShowDropdown(false);
    router.push("/customer/settings");
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-sky-100 sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4.5">
        {/* Left: Menu button + Title */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-sky-50 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>

          {/* Page title */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(" ")[0] || "User"}!
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              Here's what's happening with your service requests today.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-xl border border-sky-200">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-40"
            />
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">

            {/* Original Notification Bell */}
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowDropdown(false);
              }}
              className="relative p-2 rounded-xl hover:bg-sky-50 transition-colors ml-2"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-50 bg-transparent"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 sm:w-96 top-18 sm:mt-2 bg-white rounded-xl shadow-2xl border border-sky-100 z-50 max-h-[70vh] sm:max-h-125 flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-sky-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-gray-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="flex-1 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                      </div>
                    ) : localNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        {localNotifications.map((notification) => {
                          const iconName = getNotificationIcon(notification.type);
                          const iconColor = getNotificationIconColor(notification.type);
                          const IconComponent = {
                            briefcase: Briefcase,
                            star: Star,
                            tag: Tag,
                            info: Info,
                            bell: Bell,
                          }[iconName] || Bell;

                          return (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-sky-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                !notification.isRead ? 'bg-sky-50/50' : ''
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
                                        className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 whitespace-nowrap"
                                      >
                                        <Check className="h-3 w-3" />
                                        Mark read
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Unread indicator */}
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-sky-500 rounded-full shrink-0 mt-2" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer - View All */}
                  <div className="px-4 py-3 border-t border-sky-100">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        router.push('/customer/notifications');
                      }}
                      className="w-full text-center text-sm font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 py-2 rounded-lg transition-colors"
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
              <div className="w-10 h-10 bg-linear-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow">
                {getInitials(user?.name)}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform hidden sm:block ${
                  showDropdown ? "rotate-180" : ""
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
                <div className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 sm:w-56 top-18 sm:mt-2 bg-white rounded-xl shadow-lg border border-sky-100 py-2 z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-sky-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-linear-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
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
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-sky-50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Profile</span>
                  </button>

                  {/* Settings Button */}
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-sky-50 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </button>

                  <div className="border-t border-sky-100 my-1" />

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
