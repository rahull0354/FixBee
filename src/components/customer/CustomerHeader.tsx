"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bell, Search, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import type { User as UserType } from "@/types/auth";

interface CustomerHeaderProps {
  user: UserType | null;
  onMenuClick: () => void;
}

export function CustomerHeader({ user, onMenuClick }: CustomerHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

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
      toast.success("Logged out successfully");
      router.push("/login/customer");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push("/customer/profile");
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-sky-100 sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
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

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-sky-50 transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-10 h-10 bg-linear-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow">
                {getInitials(user?.name)}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-sky-100 py-2 z-20">
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
