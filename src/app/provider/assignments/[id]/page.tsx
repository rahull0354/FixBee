"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  Image as ImageIcon,
  IndianRupee,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { providerApi } from "@/lib/api";
import { ServiceRequest } from "@/types";
import { RescheduleDialog } from "@/components/provider/RescheduleDialog";

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Complete service dialog state
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [materialCost, setMaterialCost] = useState<string>("");
  const [materialDescription, setMaterialDescription] = useState<string>("");

  // Reschedule dialog state
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  useEffect(() => {
    // Fetch request details directly from backend
    const fetchRequestDetails = async () => {
      try {
        setLoading(true);

        const response = await providerApi.getRequestDetails(requestId);
        const requestData = (response as any).data || response;

        if (!requestData || !requestData.id) {
          throw new Error("Invalid request data received from API");
        }

        setRequest(requestData);

        // Set initial final price from estimated price
        if (requestData.estimatedPrice) {
          setFinalPrice(requestData.estimatedPrice.toString());
        }
      } catch (error: any) {
        console.error("Error fetching request details:", error);
        toast.error("Failed to load service request details");
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  const handleStartService = async () => {
    if (!request) return;

    try {
      setActionLoading(true);
      await providerApi.startService(requestId);
      toast.success("Service started successfully!");

      // Update local state
      setRequest({ ...request, status: "in_progress" as any });

      // Redirect back to assignments after a short delay
      setTimeout(() => {
        router.push("/provider/assignments");
      }, 1000);
    } catch (error: any) {
      console.error("Error starting service:", error);
      toast.error(error?.response?.data?.message || "Failed to start service");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSuccess = async () => {
    // Refetch request details to get updated schedule
    try {
      setLoading(true);
      const response = await providerApi.getRequestDetails(requestId);
      const requestData = (response as any).data || response;
      setRequest(requestData);
      toast.success("Schedule updated successfully");
    } catch (error: any) {
      console.error("Error fetching updated request:", error);
      toast.error("Failed to load updated request details");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteService = async () => {
    if (!finalPrice || Number(finalPrice) <= 0) {
      toast.error("Please enter a valid final price");
      return;
    }

    // If material cost is provided, description is required
    if (
      materialCost &&
      Number(materialCost) > 0 &&
      !materialDescription.trim()
    ) {
      toast.error("Please describe the materials purchased");
      return;
    }

    try {
      setActionLoading(true);

      const completionData = {
        afterImages: afterImages.length > 0 ? afterImages : undefined,
        finalPrice: Number(finalPrice),
        materialCost:
          materialCost && Number(materialCost) > 0
            ? Number(materialCost)
            : undefined,
        materialDescription:
          materialCost && Number(materialCost) > 0
            ? materialDescription
            : undefined,
      };

      await providerApi.completeService(requestId, completionData);

      // Update sessionStorage with completion data so it persists for viewing
      const storageKey = `assignment_${requestId}`;
      if (request) {
        const updatedRequest = {
          ...request,
          status: "completed",
          finalPrice: completionData.finalPrice,
          materialCost: completionData.materialCost,
          materialDescription: completionData.materialDescription,
          afterImages: completionData.afterImages || request.afterImages,
          completedAt: new Date().toISOString(),
        };

        // Store the updated request data with completion information
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            ...updatedRequest,
            timestamp: Date.now(),
          }),
        );
      }

      toast.success("Service completed successfully!");
      setShowCompleteDialog(false);

      // Redirect back to assignments after a short delay
      setTimeout(() => {
        router.push("/provider/assignments");
      }, 1000);
    } catch (error: any) {
      console.error("Error completing service:", error);
      toast.error(
        error?.response?.data?.message || "Failed to complete service",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      setAfterImages([...afterImages, url]);
    }
  };

  const removeImageUrl = (index: number) => {
    setAfterImages(afterImages.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "assigned":
        return "Assigned";
      case "cancelled":
        return "Cancelled";
      default:
        return "Pending";
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-48" />

        {/* Banner Skeleton */}
        <div className="h-32 rounded-2xl bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400" />

        {/* Service Title Card Skeleton */}
        <div className="h-24 rounded-2xl border border-emerald-200" />

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-emerald-100">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions Skeleton */}
        <Card className="border-emerald-100">
          <CardContent className="p-6">
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Assignment Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The assignment you're looking for doesn't exist.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/provider/assignments")}
        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Assignments
      </button>

      {/* Status Banner */}
      <div
        className={`rounded-2xl p-6 text-white shadow-lg ${
          request.status === "completed"
            ? "bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400"
            : request.status === "in_progress"
              ? "bg-linear-to-r from-teal-400 via-cyan-400 to-sky-400"
              : request.status === "cancelled"
                ? "bg-linear-to-r from-gray-400 via-slate-400 to-zinc-400"
                : "bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              {request.status === "completed" && (
                <CheckCircle className="h-6 w-6" />
              )}
              {request.status === "in_progress" && (
                <PlayCircle className="h-6 w-6" />
              )}
              {request.status === "cancelled" && (
                <CheckCircle className="h-6 w-6" />
              )}
              {request.status === "assigned" && <User className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {request.status === "completed" && "Service Completed"}
                {request.status === "in_progress" && "Service In Progress"}
                {request.status === "cancelled" && "Service Cancelled"}
                {request.status === "assigned" && "Service Assigned"}
              </h2>
              <p className="text-sm opacity-90">
                {request.status === "completed" &&
                  "Great job! You have successfully completed this service."}
                {request.status === "in_progress" &&
                  "You are currently working on this service request."}
                {request.status === "cancelled" &&
                  "This service request has been cancelled."}
                {request.status === "assigned" &&
                  "Service request has been assigned to you."}
              </p>
            </div>
          </div>
          <div className="text-sm font-mono px-4 py-2 rounded-lg bg-white/20 border-2 border-white/30">
            <span className="text-xs opacity-75">Request ID: </span>
            {request.id}
          </div>
        </div>
      </div>

      {/* Service Title Card */}
      <div className="bg-linear-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-linear-to-br from-emerald-400 to-teal-400 rounded-xl shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {request.serviceTitle || request.title}
              </h1>
              <Badge className={getStatusColor(request.status)}>
                {getStatusLabel(request.status)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Details */}
        <Card className="border-emerald-100 lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Service Details
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Description
                </h3>
                <p className="text-gray-600">
                  {request.serviceDescription || request.description}
                </p>
              </div>

              {request.additionalNotes && (
                <div className="bg-emerald-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Additional Notes
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {request.additionalNotes}
                  </p>
                </div>
              )}

              {/* Before Images */}
              {request.beforeImages && request.beforeImages.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    Before Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {request.beforeImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Before ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* After Images (if completed) */}
              {request.status === "completed" &&
                request.afterImages &&
                request.afterImages.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-emerald-600" />
                      After Images
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {request.afterImages.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`After ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-emerald-100">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Customer Information
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">
                    {request.customer?.name || "N/A"}
                  </p>
                </div>

                {request.customer?.phone && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </p>
                    <p className="font-medium text-gray-800">
                      {request.customer.phone}
                    </p>
                  </div>
                )}

                {request.customer?.email && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="font-medium text-gray-800 text-sm break-all">
                      {request.customer.email}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Location */}
          <Card className="border-emerald-100">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Schedule & Location
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(
                        request.schedule?.date || request.scheduledDate || null,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Time Slot</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {request.schedule?.timeSlot ||
                        request.scheduledTimeSlot ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Service Address</p>
                    <p className="font-medium text-gray-800">
                      {(request.serviceAddress?.street ||
                        request.address?.street) &&
                        `${request.serviceAddress?.street || request.address?.street}, `}
                      {request.serviceAddress?.city || request.address?.city}
                      {(request.serviceAddress?.state ||
                        request.address?.state) &&
                        `, ${request.serviceAddress?.state || request.address?.state}`}
                      {(request.serviceAddress?.pincode ||
                        request.address?.zipCode) &&
                        ` ${request.serviceAddress?.pincode || request.address?.zipCode}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-emerald-100">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                Pricing
              </h2>

              <div className="space-y-3">
                {request.status !== "completed" && request.estimatedPrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Price</span>
                    <span className="font-semibold text-gray-800">
                      ₹
                      {typeof request.estimatedPrice === "number"
                        ? request.estimatedPrice.toLocaleString()
                        : request.estimatedPrice}
                    </span>
                  </div>
                )}

                {request.status === "completed" && (
                  <>
                    {request.finalPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Price</span>
                        <span className="font-semibold text-gray-800">
                          ₹
                          {typeof request.finalPrice === "number"
                            ? request.finalPrice.toLocaleString()
                            : request.finalPrice}
                        </span>
                      </div>
                    )}

                    {/* Check for material cost in multiple possible locations */}
                    {(request.materialCost ||
                      request.pricingDetails?.materialCost) && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Material Cost</span>
                          <span className="font-semibold text-gray-800">
                            ₹
                            {typeof (
                              request.materialCost ||
                              request.pricingDetails?.materialCost
                            ) === "number"
                              ? (
                                  request.materialCost ||
                                  request.pricingDetails?.materialCost
                                ).toLocaleString()
                              : request.materialCost ||
                                request.pricingDetails?.materialCost}
                          </span>
                        </div>
                        {(request.materialDescription ||
                          request.pricingDetails?.materialDescription) && (
                          <div className="bg-gray-50 rounded p-2 mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Materials:
                            </p>
                            <p className="text-sm text-gray-700">
                              {request.materialDescription ||
                                request.pricingDetails?.materialDescription}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between border-t-2 border-emerald-200 pt-3 mt-2">
                      <span className="text-gray-800 font-semibold">
                        Total Bill
                      </span>
                      <span className="font-bold text-emerald-600 text-lg">
                        ₹
                        {(
                          (typeof request.finalPrice === "number"
                            ? request.finalPrice
                            : parseFloat(request.finalPrice || "0")) +
                          (typeof (
                            request.materialCost ||
                            request.pricingDetails?.materialCost
                          ) === "number"
                            ? request.materialCost ||
                              request.pricingDetails?.materialCost ||
                              0
                            : parseFloat(
                                (
                                  request.materialCost ||
                                  request.pricingDetails?.materialCost ||
                                  "0"
                                ).toString(),
                              ))
                        ).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="border-emerald-100">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {request.status === "assigned" && (
              <>
                <Button
                  onClick={handleStartService}
                  disabled={actionLoading}
                  className="flex-1 bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-medium"
                >
                  {actionLoading ? (
                    "Starting..."
                  ) : (
                    <>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start Service
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRescheduleDialog(true)}
                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Reschedule
                </Button>
              </>
            )}

            {request.status === "in_progress" && (
              <>
                <Button
                  onClick={() => setShowCompleteDialog(true)}
                  className="flex-1 bg-linear-to-r from-green-400 via-emerald-400 to-teal-400 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white font-medium"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Service
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRescheduleDialog(true)}
                  className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Reschedule
                </Button>
              </>
            )}

            {request.status === "completed" && (
              <div className="flex-1 text-center py-3">
                <p className="text-green-600 font-semibold">
                  This service has been completed
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complete Service Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg md:max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[70vh]">
          {/* Header with Gradient */}
          <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 px-3 sm:p-4 md:px-6 py-2.5 sm:py-3 md:py-4 text-white shrink-0">
            <DialogHeader className="space-y-1 sm:space-y-1.5 md:space-y-2">
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                Complete Service
              </DialogTitle>
              <DialogDescription className="text-emerald-100 text-[10px] sm:text-xs md:text-sm">
                Add after photos, set the final price, and include any material
                costs.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex-1 min-h-0">
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              {/* After Images */}
              <div className="space-y-1.5 sm:space-y-2 md:space-y-2">
                <Label className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">
                  After Photos{" "}
                  <span className="text-gray-400 text-[9px] sm:text-[10px]">
                    (Optional)
                  </span>
                </Label>
                <p className="text-[9px] sm:text-[10px] sm:text-xs text-gray-500">
                  Add URLs of photos showing the completed work
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 sm:h-9 md:h-10 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm"
                >
                  <ImageIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5" />
                  Add Image URL
                </Button>

                {afterImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                    {afterImages.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`After ${index + 1}`}
                          className="w-full h-16 sm:h-20 md:h-24 object-cover rounded-lg sm:rounded-xl border border-emerald-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6"
                          onClick={() => removeImageUrl(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Final Price */}
              <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="finalPrice"
                  className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700"
                >
                  Final Service Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="finalPrice"
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="Enter final service price"
                  min="0"
                  step="0.01"
                  className="h-8 sm:h-9 md:h-10 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm"
                />
                {request.estimatedPrice && (
                  <p className="text-[9px] sm:text-[10px] sm:text-xs text-gray-500">
                    Estimated: ₹{request.estimatedPrice.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Material Cost */}
              <div className="p-2.5 sm:p-3 md:p-4 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-2.5 md:mb-3">
                  <div className="p-1 sm:p-1.5 md:p-2 bg-linear-to-r from-emerald-100 to-teal-100 rounded-lg sm:rounded-xl">
                    <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] sm:text-xs md:text-sm font-semibold text-emerald-900">
                      Additional Material Cost
                    </Label>
                    <p className="text-[8px] sm:text-[10px] text-emerald-600">
                      If you purchased materials for this service
                    </p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                  <div className="space-y-0.5 sm:space-y-1">
                    <Label
                      htmlFor="materialCost"
                      className="text-[9px] sm:text-[10px] sm:text-xs font-medium text-gray-700"
                    >
                      Material Cost
                    </Label>
                    <Input
                      id="materialCost"
                      type="number"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(e.target.value)}
                      placeholder="Enter material cost"
                      min="0"
                      step="0.01"
                      className="h-8 sm:h-9 md:h-10 border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl bg-white text-[10px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <Label
                      htmlFor="materialDescription"
                      className="text-[9px] sm:text-[10px] sm:text-xs font-medium text-gray-700"
                    >
                      Material Description
                    </Label>
                    <Textarea
                      id="materialDescription"
                      value={materialDescription}
                      onChange={(e) => setMaterialDescription(e.target.value)}
                      placeholder="Describe the materials purchased (e.g., 2 liters of paint, 5 steel pipes...)"
                      rows={2}
                      className="resize-none border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl bg-white text-[10px] sm:text-xs md:text-sm min-h-12.5 sm:min-h-15 md:min-h-17.5"
                    />
                    <p className="text-[8px] sm:text-[10px] text-emerald-600">
                      This will be added to the final bill and shown to the
                      customer
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Price Preview */}
              {materialCost && Number(materialCost) > 0 && (
                <div className="p-2.5 sm:p-3 md:p-4 bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg sm:rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] sm:text-xs text-emerald-800">
                      Service Price:
                    </span>
                    <span className="font-semibold text-[10px] sm:text-xs md:text-sm text-emerald-900">
                      ₹{finalPrice || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5 sm:mt-1 md:mt-1.5">
                    <span className="text-[9px] sm:text-[10px] sm:text-xs text-emerald-800">
                      Material Cost:
                    </span>
                    <span className="font-semibold text-[10px] sm:text-xs md:text-sm text-emerald-900">
                      ₹{materialCost}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5 sm:mt-2 md:mt-2.5 pt-1.5 sm:pt-2 md:pt-2.5 border-t border-emerald-300">
                    <span className="font-semibold text-[10px] sm:text-xs md:text-sm text-emerald-900">
                      Total Bill:
                    </span>
                    <span className="font-bold text-sm sm:text-base md:text-lg text-emerald-600">
                      ₹
                      {(
                        (Number(finalPrice) || 0) + (Number(materialCost) || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700"
                >
                  Completion Notes{" "}
                  <span className="text-gray-400 text-[9px] sm:text-[10px]">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the completed service..."
                  rows={3}
                  className="resize-none border-emerald-200 focus:border-emerald-400 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm min-h-15 sm:min-h-17.5 md:min-h-20"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2.5 md:gap-3 p-2.5 sm:p-3 md:p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              className="h-8 sm:h-9 md:h-10 rounded-lg sm:rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] sm:text-xs md:text-sm font-medium flex-1 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteService}
              disabled={actionLoading || !finalPrice || Number(finalPrice) <= 0}
              className="h-8 sm:h-9 md:h-10 rounded-lg sm:rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-medium flex-1 w-full sm:w-auto text-[10px] sm:text-xs md:text-sm shadow-lg hover:shadow-xl transition-all"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 mr-0.5 sm:mr-1 md:mr-1.5 animate-spin" />
                  <span className="text-[10px] sm:text-xs md:text-sm">
                    Completing...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 mr-0.5 sm:mr-1 md:mr-1.5" />
                  <span className="text-[10px] sm:text-xs md:text-sm">
                    Complete
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        requestId={requestId}
        currentSchedule={request?.schedule}
        status={request?.status || ""}
        onRescheduleSuccess={handleRescheduleSuccess}
      />
    </div>
  );
}
