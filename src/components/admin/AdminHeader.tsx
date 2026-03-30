'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import type { User as UserType } from '@/types/auth';

interface AdminHeaderProps {
  user: UserType | null;
  onMenuClick: () => void;
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  // Get initials from name (first name + last name)
  const getInitials = (name?: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login/admin');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push('/admin/settings');
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-blue-100 sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 lg:px-8 py-5">
        {/* Left: Menu button + Title */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>

          {/* Page title */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
              {user?.name ? `${user.name}'s Dashboard` : 'Admin Dashboard'}
            </h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              Manage your platform efficiently
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow">
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
                <div className="fixed left-4 right-4 sm:absolute sm:left-auto sm:right-0 sm:w-56 top-[72px] sm:mt-2 bg-white rounded-xl shadow-lg border border-blue-100 py-2 z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                        {getInitials(user?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Button */}
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </button>

                  <div className="border-t border-blue-100 my-1" />

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
