'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Briefcase,
  FileText,
  Wrench as FixBeeIcon,
  X,
  MessageCircle,
  Settings,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface ProviderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/provider/dashboard', icon: Home },
  { name: 'Available Requests', href: '/provider/requests/available', icon: Briefcase },
  { name: 'My Assignments', href: '/provider/assignments', icon: FileText },
  { name: 'Reviews', href: '/provider/reviews', icon: MessageCircle },
  { name: 'Profile', href: '/provider/profile', icon: User },
  { name: 'Settings', href: '/provider/settings', icon: Settings },
];

export function ProviderSidebar({ isOpen, onClose }: ProviderSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Check if account is deactivated
  const isDeactivated = (user?.isActive === false) || (!!user?.deactivatedAt);

  // Get initials from name (first name + last name)
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isDeactivated && href !== '/provider/dashboard') {
      e.preventDefault();
      alert('Your account is deactivated. Please reactivate your account to access this feature.');
    }
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo & Close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100">
            <Link href="/" className="flex items-center gap-3" onClick={onClose}>
              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <FixBeeIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                FixBee
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const isDisabled = isDeactivated && item.href !== '/provider/dashboard';
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(e, item.href);
                    onClose();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isActive
                      ? 'bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-emerald-100 p-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl">
              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:block">
        <div className="flex h-full flex-col bg-white/80 backdrop-blur-xl shadow-xl border-r border-emerald-100">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 border-b border-emerald-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <FixBeeIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                FixBee
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const isDisabled = isDeactivated && item.href !== '/provider/dashboard';
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isActive
                      ? 'bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-emerald-100 p-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl">
              <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
