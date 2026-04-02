"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { providerApi } from "@/lib/api/provider";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  User,
  Loader2,
  Star,
  Shield,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";

interface BankAccount {
  id: string;
  accountName?: string;
  accountHolderName?: string;
  accountHolder?: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: string;
  isPrimary: boolean;
  createdAt: string;
}

export default function ProviderSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [primaryAccount, setPrimaryAccount] = useState<BankAccount | null>(
    null,
  );

  // Dialog states
  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
  const [editAccountDialogOpen, setEditAccountDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "savings",
  });

  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login/provider");
      return;
    }
    loadSettings();
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load bank accounts
      const accountsResponse = await providerApi.getBankAccounts();
      const accountsData =
        (accountsResponse as any).data?.accounts ||
        (accountsResponse as any).data ||
        accountsResponse;
      const accountsArray = Array.isArray(accountsData)
        ? accountsData
        : accountsData.accounts || [];

      setBankAccounts(accountsArray);

      // Load primary account
      try {
        const primaryResponse = await providerApi.getPrimaryBankAccount();
        const primaryData = (primaryResponse as any).data || primaryResponse;
        setPrimaryAccount(primaryData);
      } catch (primaryError) {
        // No primary account set
        setPrimaryAccount(null);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (
      !formData.accountName ||
      !formData.accountNumber ||
      !formData.ifscCode ||
      !formData.bankName
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      // Transform field names to match backend expectations
      const requestData = {
        accountNumber: formData.accountNumber,
        ifsc: formData.ifscCode,
        accountHolder: formData.accountName,
        bankName: formData.bankName,
        accountType: formData.accountType,
      };
      console.log('Sending bank account data:', requestData);
      await providerApi.addBankAccount(requestData);
      toast.success("Bank account added successfully!");
      setAddAccountDialogOpen(false);
      resetForm();
      await loadSettings();
    } catch (error: any) {
      console.error("Error adding bank account:", error);
      toast.error(
        error?.response?.data?.message || "Failed to add bank account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;

    try {
      setSubmitting(true);
      // Transform field names to match backend expectations
      const requestData = {
        accountNumber: formData.accountNumber,
        ifsc: formData.ifscCode,
        accountHolder: formData.accountName,
        bankName: formData.bankName,
        accountType: formData.accountType,
      };
      console.log('Updating bank account data:', requestData);
      await providerApi.updateBankAccount(selectedAccount.id, requestData);
      toast.success("Bank account updated successfully!");
      setEditAccountDialogOpen(false);
      resetForm();
      setSelectedAccount(null);
      await loadSettings();
    } catch (error: any) {
      console.error("Error updating bank account:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update bank account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      setSubmitting(true);
      await providerApi.deleteBankAccount(selectedAccount.id);
      toast.success("Bank account deleted successfully!");
      setDeleteAccountDialogOpen(false);
      setSelectedAccount(null);
      await loadSettings();
    } catch (error: any) {
      console.error("Error deleting bank account:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete bank account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      setSubmitting(true);
      await providerApi.setPrimaryBankAccount(accountId);
      toast.success("Primary bank account updated!");
      await loadSettings();
    } catch (error: any) {
      console.error("Error setting primary account:", error);
      toast.error(
        error?.response?.data?.message || "Failed to set primary account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setSubmitting(true);
      await providerApi.deactivateAccount();
      toast.success("Account deactivated successfully");
      setDeactivateDialogOpen(false);
      router.push("/login/provider");
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      toast.error(
        error?.response?.data?.message || "Failed to deactivate account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (account: BankAccount) => {
    setSelectedAccount(account);
    // Handle both field name formats from backend
    setFormData({
      accountName: (account as any).accountHolder || (account as any).accountHolderName || account.accountName || '',
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      accountType: account.accountType,
    });
    setEditAccountDialogOpen(true);
  };

  const openDeleteDialog = (account: BankAccount) => {
    setSelectedAccount(account);
    setDeleteAccountDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      accountType: "savings",
    });
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return "XXXX XXXX " + accountNumber.slice(-4);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-9 w-56 mb-2 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-80 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Banner Skeleton */}
        <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-6 w-40 bg-white/20 rounded mb-2 animate-pulse" />
              <div className="h-4 w-60 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="h-7 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <Link
          href="/provider/dashboard"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-3 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Banner Section */}
      <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 hidden sm:block" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 hidden sm:block" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
            <SettingsIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-1">Account Settings</h2>
            <p className="text-white/90 text-xs sm:text-sm">
              Manage your bank accounts and account preferences
            </p>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-2xl sm:text-3xl font-bold">{bankAccounts.length}</p>
            <p className="text-white/90 text-xs sm:text-sm">Bank Accounts</p>
          </div>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <Card className="border-emerald-100 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-emerald-100 rounded-xl">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Bank Accounts
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Manage your payout accounts
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setAddAccountDialogOpen(true);
              }}
              className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>

          {bankAccounts.length > 0 ? (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="border-2 border-emerald-100 rounded-xl p-3 sm:p-4 hover:border-emerald-200 transition-all bg-white"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-md shrink-0">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                            {account.bankName}
                          </h3>
                          {account.isPrimary && (
                            <Badge className="bg-linear-to-r from-emerald-400 to-teal-400 text-white border-0 text-xs font-semibold shadow-md">
                              <Star className="h-3 w-3 mr-1" />
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600">Account Holder</p>
                            <p className="font-semibold text-gray-900 truncate">
                              {(account as any).accountHolder || (account as any).accountHolderName || account.accountName}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Account Number</p>
                            <p className="font-mono font-semibold text-gray-900">
                              {maskAccountNumber(account.accountNumber)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">IFSC Code</p>
                            <p className="font-mono font-semibold text-gray-900">
                              {account.ifscCode}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Account Type</p>
                            <p className="font-semibold text-gray-900 capitalize">
                              {account.accountType}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      {!account.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(account.id)}
                          disabled={submitting}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs flex-1 sm:flex-none justify-center"
                        >
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(account)}
                        className="border-teal-200 text-teal-700 hover:bg-teal-50 text-xs flex-1 sm:flex-none justify-center"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(account)}
                        className="border-red-200 text-red-700 hover:bg-red-50 text-xs flex-1 sm:flex-none justify-center"
                        disabled={account.isPrimary}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-dashed border-emerald-200">
              <Building2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No Bank Accounts
              </h3>
              <p className="text-gray-600 mb-4">
                Add a bank account to receive your payouts
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setAddAccountDialogOpen(true);
                }}
                className="bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-600 hover:via-teal-500 hover:to-cyan-600 text-white font-semibold shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-emerald-100 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-emerald-100 rounded-xl">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Account Actions
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Manage your account settings
              </p>
            </div>
          </div>

          <div className="border-2 border-red-200 rounded-xl p-4 sm:p-6 bg-linear-to-br from-red-50 to-orange-50">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-red-400 to-red-500 flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-red-900 mb-2">
                  Danger Zone
                </h3>
                <p className="text-xs sm:text-sm text-red-800 mb-3 sm:mb-4">
                  Once you deactivate your account, there is no going back.
                  Please be certain.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setDeactivateDialogOpen(true)}
                  className="border-red-300 text-red-700 hover:bg-red-100 w-full sm:w-auto"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Deactivate Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Bank Account Dialog */}
      <Dialog
        open={addAccountDialogOpen}
        onOpenChange={setAddAccountDialogOpen}
      >
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-linear-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl text-gray-900">
                  Add Bank Account
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-gray-600 pl-13">
              Add a new bank account for receiving payouts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Holder Name *</Label>
              <Input
                id="accountName"
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                placeholder="Enter account holder name"
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="e.g., State Bank of India"
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                type="text"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                placeholder="Enter account number"
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code *</Label>
              <Input
                id="ifscCode"
                value={formData.ifscCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ifscCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., SBIN0001234"
                className="border-emerald-200 focus:border-emerald-400 uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger id="accountType" className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddAccountDialogOpen(false);
                resetForm();
              }}
              disabled={submitting}
              className="border-emerald-200 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAccount}
              disabled={submitting}
              className="bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-600 hover:via-teal-500 hover:to-cyan-600 text-white w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Account Dialog */}
      <Dialog
        open={editAccountDialogOpen}
        onOpenChange={setEditAccountDialogOpen}
      >
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-linear-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shrink-0">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl text-gray-900">
                  Edit Bank Account
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-gray-600 pl-13">
              Update your bank account details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-accountName">Account Holder Name *</Label>
              <Input
                id="edit-accountName"
                value={formData.accountName}
                onChange={(e) =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                placeholder="Enter account holder name"
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bankName">Bank Name *</Label>
              <Input
                id="edit-bankName"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="e.g., State Bank of India"
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-accountNumber">Account Number *</Label>
              <Input
                id="edit-accountNumber"
                type="text"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                placeholder="Enter account number"
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ifscCode">IFSC Code *</Label>
              <Input
                id="edit-ifscCode"
                value={formData.ifscCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ifscCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., SBIN0001234"
                className="border-emerald-200 focus:border-emerald-400 uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger
                  id="edit-accountType"
                  className="border-emerald-200"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setEditAccountDialogOpen(false);
                resetForm();
                setSelectedAccount(null);
              }}
              disabled={submitting}
              className="border-emerald-200 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAccount}
              disabled={submitting}
              className="bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-600 hover:via-teal-500 hover:to-cyan-600 text-white w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bank Account Dialog */}
      <Dialog
        open={deleteAccountDialogOpen}
        onOpenChange={setDeleteAccountDialogOpen}
      >
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-linear-to-br from-red-50 to-orange-50 border-red-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-red-400 to-red-500 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl text-gray-900">
                  Delete Bank Account
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-gray-600 pl-13">
              Are you sure you want to delete this bank account?
            </DialogDescription>
          </DialogHeader>

          {selectedAccount && (
            <div className="py-4">
              <div className="bg-linear-to-br from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">
                      {selectedAccount.bankName} -{" "}
                      {maskAccountNumber(selectedAccount.accountNumber)}
                    </p>
                    <p className="text-sm text-red-800">
                      This action cannot be undone. Please confirm that you want
                      to delete this bank account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteAccountDialogOpen(false);
                setSelectedAccount(null);
              }}
              disabled={submitting}
              className="border-emerald-200 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={submitting}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Account Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-linear-to-br from-red-50 to-orange-50 border-red-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-red-400 to-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl text-gray-900">
                  Deactivate Account
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-gray-600 pl-13">
              Are you sure you want to deactivate your account?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-linear-to-br from-red-50 to-orange-50 rounded-xl p-4 border-2 border-red-200 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">
                    Warning: Account Deactivation
                  </p>
                  <p className="text-sm text-red-800">
                    Once deactivated, your account and all data will be
                    permanently deleted after a 30-day grace period. You will
                    lose access to all features immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
              <p className="text-xs text-gray-600 mb-2 font-semibold">
                Account to be deactivated:
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user?.name || "Provider"}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email || ""}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(false)}
              disabled={submitting}
              className="border-emerald-200 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeactivateAccount}
              disabled={submitting}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Deactivate Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
