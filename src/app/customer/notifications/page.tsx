"use client";

import { useEffect, useState } from "react";
import { customerApi } from "@/lib/api";
import { Notification } from "@/types";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Briefcase,
  Star,
  MessageSquare,
  Info,
  Tag,
  X,
  Loader2,
  Settings,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    requestUpdates: true,
    reviewUpdates: true,
    promotional: false,
    systemUpdates: true,
  });
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [filter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getNotifications({
        unreadOnly: filter === "unread",
      });
      const data = (response as any).data || response;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load notifications";
      toast.error(message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await customerApi.getNotificationPreferences();
      const data = (response as any).data || response;
      setPreferences(data);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await customerApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await customerApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customerApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      await customerApi.updateNotificationPreferences(preferences);
      toast.success("Preferences saved");
      setPreferencesDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_assigned":
      case "request_started":
      case "request_completed":
      case "request_cancelled":
        return Briefcase;
      case "review_received":
      case "provider_response":
        return Star;
      case "system_update":
        return Info;
      case "promotional":
        return Tag;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") {
      return "bg-red-100 border-red-200 text-red-700";
    }

    switch (type) {
      case "request_assigned":
        return "bg-blue-100 border-blue-200 text-blue-700";
      case "request_started":
        return "bg-purple-100 border-purple-200 text-purple-700";
      case "request_completed":
        return "bg-green-100 border-green-200 text-green-700";
      case "request_cancelled":
        return "bg-orange-100 border-orange-200 text-orange-700";
      case "review_received":
      case "provider_response":
        return "bg-yellow-100 border-yellow-200 text-yellow-700";
      case "system_update":
        return "bg-slate-100 border-slate-200 text-slate-700";
      case "promotional":
        return "bg-pink-100 border-pink-200 text-pink-700";
      default:
        return "bg-sky-100 border-sky-200 text-sky-700";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Calculate paginated items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotifications = notifications.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Calculate total pages
  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  // Pagination controls
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of list
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Notifications List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-sky-200 p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-sky-500 text-white"
                  : "text-gray-600 hover:bg-sky-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === "unread"
                  ? "bg-sky-500 text-white"
                  : "text-gray-600 hover:bg-sky-50"
              }`}
            >
              Unread
            </button>
          </div>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              {markingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All Read
                </>
              )}
            </Button>
          )}

          {/* Preferences */}
          <Button
            variant="outline"
            onClick={() => setPreferencesDialogOpen(true)}
            className="border-sky-200 text-sky-700 hover:bg-sky-50"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 rounded-xl">
              <Bell className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
              <p className="text-sm text-gray-600">Total Notifications</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{unreadCount}</p>
              <p className="text-sm text-gray-600">Unread</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {notifications.length - unreadCount}
              </p>
              <p className="text-sm text-gray-600">Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Notifications</h2>
          <p className="text-gray-600">
            {filter === "unread"
              ? "You have no unread notifications"
              : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(
              notification.type,
              notification.priority
            );

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${
                  notification.isRead ? "border-gray-100" : "border-sky-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl border ${colorClass} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {notification.message}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <Badge className="bg-sky-500 text-white shrink-0">
                          New
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                      </p>

                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {notifications.length > itemsPerPage && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-sky-100 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Page Info */}
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing{" "}
                <span className="font-semibold text-sky-700">
                  {indexOfFirstItem + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-sky-700">
                  {Math.min(indexOfLastItem, notifications.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-sky-700">
                  {notifications.length}
                </span>{" "}
                notifications
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!hasPrevPage}
                  className="border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and adjacent pages
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      // Show ellipsis for gaps
                      const prevPage = page - 1;
                      const nextPage = page + 1;
                      if (
                        (prevPage === currentPage - 2 && prevPage > 1) ||
                        (nextPage === currentPage + 2 && nextPage < totalPages)
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-2 py-1 text-gray-400 text-sm"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          currentPage === page
                            ? "h-8 w-8 p-0 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold"
                            : "h-8 w-8 p-0 border-sky-200 text-sky-700 hover:bg-sky-50 text-sm font-semibold"
                        }
                      >
                        {page}
                      </Button>
                    );
                  }
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                  className="border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {/* Preferences Dialog */}
      <Dialog open={preferencesDialogOpen} onOpenChange={setPreferencesDialogOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-w-[95vw] p-0 overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 px-6 py-4 border-b border-sky-100">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-sky-600" />
                Notification Settings
              </DialogTitle>
              <DialogDescription>
                Manage how you want to receive notifications
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email" className="text-base font-semibold">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, email: checked })
                }
              />
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push" className="text-base font-semibold">
                  Push Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Receive notifications in browser
                </p>
              </div>
              <Switch
                id="push"
                checked={preferences.push}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, push: checked })
                }
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Notification Types
              </p>

              {/* Request Updates */}
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-0.5">
                  <Label htmlFor="requestUpdates" className="text-base font-semibold">
                    Request Updates
                  </Label>
                  <p className="text-sm text-gray-500">
                    Updates on your service requests
                  </p>
                </div>
                <Switch
                  id="requestUpdates"
                  checked={preferences.requestUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, requestUpdates: checked })
                  }
                />
              </div>

              {/* Review Updates */}
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-0.5">
                  <Label htmlFor="reviewUpdates" className="text-base font-semibold">
                    Review Updates
                  </Label>
                  <p className="text-sm text-gray-500">
                    Responses to your reviews
                  </p>
                </div>
                <Switch
                  id="reviewUpdates"
                  checked={preferences.reviewUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, reviewUpdates: checked })
                  }
                />
              </div>

              {/* System Updates */}
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-0.5">
                  <Label htmlFor="systemUpdates" className="text-base font-semibold">
                    System Updates
                  </Label>
                  <p className="text-sm text-gray-500">
                    Important system announcements
                  </p>
                </div>
                <Switch
                  id="systemUpdates"
                  checked={preferences.systemUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, systemUpdates: checked })
                  }
                />
              </div>

              {/* Promotional */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="promotional" className="text-base font-semibold">
                    Promotional
                  </Label>
                  <p className="text-sm text-gray-500">
                    Offers and promotional content
                  </p>
                </div>
                <Switch
                  id="promotional"
                  checked={preferences.promotional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, promotional: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setPreferencesDialogOpen(false)}
                disabled={savingPreferences}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePreferences}
                disabled={savingPreferences}
                className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white"
              >
                {savingPreferences ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
