'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Shield, Key, User, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangePasswordLoading(true);
      // TODO: Implement password change API
      toast.success('Password changed successfully');
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error('Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage your admin account settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-600">Update your personal details</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Admin Name"
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="admin@fixbee.com"
                  disabled
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r to-blue-50000 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Security</h2>
                <p className="text-sm text-gray-600">Manage your password</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Password</p>
                <p className="text-sm text-gray-600">Last changed recently</p>
              </div>
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and a new password to update your credentials.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password *</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordDialog(false)}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={changePasswordLoading}
                        className="bg-gradient-to-r to-blue-50000 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        {changePasswordLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-gradient-to-br to-blue-50000 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Admin Account</h3>
                <p className="text-sm text-white/80">Full access</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/80">Name:</span>
                <span className="font-semibold">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Email:</span>
                <span className="font-semibold truncate ml-2">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Notifications (Placeholder) */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-600">Coming soon</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Configure email and push notifications for admin activities.
            </p>
          </div>

          {/* Platform Stats (Placeholder) */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Platform Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-semibold text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-semibold text-emerald-600">Production</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
