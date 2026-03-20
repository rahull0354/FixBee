"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { customerApi } from "@/lib/api";
import { User } from "@/types/auth";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Edit,
  Loader2,
  Shield,
  Save,
  X,
  Award,
  Clock,
  CheckCircle,
  TrendingUp,
  Settings,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomerProfilePage() {
  const { user: authUser, logout, updateUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deactivate dialog
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [requestingReactivation, setRequestingReactivation] = useState(false);

  // Profile image load error state
  const [imageError, setImageError] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    profilePicture: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // Profile picture upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result as string });
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      let userData: User = authUser || {
        id: "",
        name: "",
        email: "",
        role: "customer",
      };

      try {
        const response = await customerApi.getProfile();
        if (response) {
          const responseData = (response as any).data || response;
          if (responseData && typeof responseData === "object") {
            userData = responseData as User;
          }
        }
      } catch (apiError) {
        console.warn("API call failed, using auth user data:", apiError);
      }

      setUser(userData);

      setFormData({
        name: userData.name || "",
        phone: userData.phone || "",
        profilePicture: userData.profilePicture || "",
        address: {
          street: userData.address?.street || "",
          city: userData.address?.city || "",
          state: userData.address?.state || "",
          zipCode: userData.address?.zipCode || "",
          country: userData.address?.country || "",
        },
      });

      setImageError(false);
    } catch (error) {
      console.error("Error loading profile:", error);
      if (authUser) {
        setUser(authUser);
        setFormData({
          name: authUser.name || "",
          phone: authUser.phone || "",
          profilePicture: authUser.profilePicture || "",
          address: {
            street: authUser.address?.street || "",
            city: authUser.address?.city || "",
            state: authUser.address?.state || "",
            zipCode: authUser.address?.zipCode || "",
            country: authUser.address?.country || "",
          },
        });
      }
      toast.error("Using offline profile data");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await customerApi.updateProfile(formData);

      updateUser({
        name: formData.name,
        phone: formData.phone,
        profilePicture: formData.profilePicture,
        address: formData.address,
      });

      toast.success("Profile updated successfully");
      setEditMode(false);
      await loadProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        profilePicture: user.profilePicture || "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await customerApi.deactivateAccount();
      toast.success("Account deactivated successfully");
      await logout();
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to deactivate account";
      toast.error(message);
    }
  };

  const handleRequestReactivation = async () => {
    try {
      setRequestingReactivation(true);
      await customerApi.requestReactivation(user?.email);
      toast.success("Reactivation link sent to your email. Please check your inbox.");
    } catch (error: any) {
      console.error("Error requesting reactivation:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to request reactivation";
      toast.error(message);
    } finally {
      setRequestingReactivation(false);
    }
  };

  // Check if account is deactivated and calculate grace period
  const isDeactivated = (user?.isActive === false) || (!!user?.deactivatedAt);
  const daysUntilDeletion = user?.deactivatedAt
    ? 30 - Math.floor((Date.now() - new Date(user.deactivatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Calculate member since
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : user?.id
    ? "Member"
    : "Unknown";

  // Calculate account age
  const accountAge = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Deactivated Account Banner */}
      {isDeactivated && (
        <div className="bg-linear-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-200 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-1">Account Deactivated</h3>
                <p className="text-sm text-amber-800 mb-2">
                  Your account is currently deactivated. You have <span className="font-bold">{Math.max(0, daysUntilDeletion)} days</span> remaining to reactivate it before permanent deletion.
                </p>
                <p className="text-xs text-amber-700">
                  Reactivate your account to restore full access to your service history, requests, and reviews.
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                onClick={handleRequestReactivation}
                disabled={requestingReactivation}
                className="bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
              >
                {requestingReactivation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Reactivate Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Profile Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30">
                  {user?.profilePicture && !imageError ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-full h-full rounded-xl object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-3xl font-bold">{getInitials(user?.name)}</span>
                  )}
                </div>
                {editMode && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-2.5 bg-white text-sky-600 rounded-full shadow-lg hover:bg-sky-50 transition-all hover:scale-110"
                      type="button"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* User Info */}
              <div>
                <h1 className="text-3xl font-bold mb-1">{user?.name || "User"}</h1>
                <p className="text-sky-100 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                    Customer
                  </span>
                  <span className="text-sky-200 text-sm">
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!editMode && (
              <Button
                onClick={() => {
                  setEditMode(true);
                  setImageError(false);
                }}
                className="bg-white text-sky-600 hover:bg-sky-50 font-semibold shadow-lg px-6 py-3"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{accountAge}</p>
                  <p className="text-xs text-sky-100">Days Active</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Active</p>
                  <p className="text-xs text-sky-100">Account Status</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold truncate">{user?.address?.city || "Not set"}</p>
                  <p className="text-xs text-sky-100">Location</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
            <div className="bg-linear-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-sky-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-sky-600" />
                Personal Information
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                  {editMode ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                    />
                  ) : (
                    <div className="p-4 bg-linear-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-100">
                      <p className="text-gray-800 font-semibold">{user?.name || "-"}</p>
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                  {editMode ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                    />
                  ) : (
                    <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-200 rounded-lg">
                          <Phone className="h-4 w-4 text-emerald-700" />
                        </div>
                        <span className="font-semibold text-gray-800">{user?.phone || "Not provided"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-200 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{user?.email || "-"}</p>
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-600" />
                  Address
                </h4>

                {editMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value },
                        })
                      }
                      placeholder="123 Main St"
                      className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, city: e.target.value },
                          })
                        }
                        placeholder="Bangalore"
                        className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                      />
                      <Input
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, state: e.target.value },
                          })
                        }
                        placeholder="Karnataka"
                        className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        value={formData.address.zipCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, zipCode: e.target.value },
                          })
                        }
                        placeholder="560001"
                        className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                      />
                      <Input
                        value={formData.address.country}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: { ...formData.address, country: e.target.value },
                          })
                        }
                        placeholder="India"
                        className="border-sky-200 focus:border-sky-400 focus:ring-sky-400 rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-linear-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-violet-200 rounded-lg mt-1">
                        <MapPin className="h-4 w-4 text-violet-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-semibold">{user?.address?.street || "Not provided"}</p>
                        <p className="text-gray-600 text-sm">
                          {[user?.address?.city, user?.address?.state, user?.address?.zipCode, user?.address?.country]
                            .filter(Boolean)
                            .join(", ") || "No address details"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {editMode && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-sky-100">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="border-gray-200 text-gray-700 hover:bg-gray-100 px-6"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all px-6"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
              <div className="bg-linear-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-sky-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-violet-600" />
                  Quick Actions
                </h3>
              </div>

              <div className="p-4 space-y-3">
                {/* Reactivate Account - Only show if deactivated */}
                {isDeactivated && (
                  <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-200 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-emerald-700" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">Request Reactivation</p>
                        <p className="text-xs text-gray-600">{Math.max(0, daysUntilDeletion)} days remaining</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleRequestReactivation}
                      disabled={requestingReactivation}
                      className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs"
                    >
                      {requestingReactivation ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Sending Email...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-3 w-3" />
                          Send Reactivation Link
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Change Password */}
                <div className="p-4 bg-linear-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-200 rounded-lg">
                      <Shield className="h-4 w-4 text-sky-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">Change Password</p>
                      <p className="text-xs text-gray-600">Secure your account</p>
                    </div>
                  </div>
                  <Button variant="outline" disabled className="w-full border-sky-200 text-sky-700 text-xs mt-2">
                    Coming Soon
                  </Button>
                </div>

              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
              <div className="bg-linear-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Danger Zone
                </h3>
              </div>

              <div className="p-4">
                <div className="p-4 bg-linear-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-200 rounded-lg">
                      <Shield className="h-4 w-4 text-red-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">Deactivate Account</p>
                      <p className="text-xs text-gray-600">Permanently delete all data</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setDeactivateDialogOpen(true)}
                    className="w-full bg-white text-red-600 hover:bg-red-50 hover:border-red-300 border-red-200 font-semibold text-sm"
                  >
                    Deactivate Account
                  </Button>
                </div>
              </div>
            </div>

            
        </div>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="max-w-[85vw] sm:max-w-2xl w-[85vw] p-0 overflow-hidden bg-white">
          {/* Header with Muted Warning Gradient */}
          <div className="bg-linear-to-r from-gray-700 via-slate-700 to-zinc-800 px-6 py-4 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Deactivate Account
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-base">
                This action is permanent and cannot be undone
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Warning Alert */}
            <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-200 rounded-xl shrink-0">
                  <AlertCircle className="h-6 w-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-900 mb-3">
                    Important Notice
                  </p>
                  <p className="text-sm text-slate-700 mb-4">
                    Once deactivated, your account and all data will be permanently deleted after a 30-day grace period.
                  </p>

                  <div className="bg-white rounded-xl p-4 border-4 border-red-500 w-full shadow-lg">
                    <p className="text-base font-bold text-red-700 mb-3">This action will:</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-800 flex-1">Delete your account and all personal information</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-800 flex-1">Remove all service request history and data</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-800 flex-1">Cancel any pending service requests</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-800 flex-1">Delete all your reviews and ratings</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-800 flex-1">30-day grace period before permanent deletion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info Summary */}
            {user && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Account to be deactivated:</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setDeactivateDialogOpen(false)}
                className="w-full sm:w-auto h-11 text-base font-semibold border-2 hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Keep Account
              </Button>
              <Button
                onClick={handleDeactivate}
                className="w-full sm:w-auto h-11 text-base font-semibold bg-linear-to-r from-slate-600 via-gray-700 to-zinc-800 hover:from-slate-700 hover:via-gray-800 hover:to-zinc-900 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Shield className="mr-2 h-4 w-4" />
                Deactivate Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
