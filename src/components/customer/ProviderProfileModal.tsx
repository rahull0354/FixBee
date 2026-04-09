"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { customerApi } from "@/lib/api/customer";
import {
  X,
  User,
  Mail,
  Star,
  MapPin,
  Briefcase,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ProviderProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  bio?: string;
  skills: string[];
  experience?: number;
  certifications?: Array<{
    name: string;
    issuer: string;
    year: number;
    credentialUrl?: string;
  }>;
  totalJobsCompleted?: number;
  averageRating?: number;
  totalReviews?: number;
  serviceArea?: string[];
  pricing?: {
    type: "per-visit" | "per-hour";
    baseRate: number;
  };
  availability?: {
    status: "available" | "busy" | "unavailable";
    workingHours?: {
      from: string;
      to: string;
    };
  };
  joinedDate?: string;
}

interface ProviderProfileModalProps {
  providerId: string;
  open: boolean;
  onClose: () => void;
}

export function ProviderProfileModal({
  providerId,
  open,
  onClose,
}: ProviderProfileModalProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && providerId) {
      loadProviderProfile();
    }
  }, [open, providerId]);

  const loadProviderProfile = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getProvider(providerId);
      const data = (response as any).data || response;
      setProvider(data);
    } catch (error: any) {
      console.error("Error loading provider profile:", error);
      toast.error("Failed to load provider profile");
    } finally {
      setLoading(false);
    }
  };

  const ratingValue =
    typeof provider?.averageRating === "number"
      ? provider.averageRating
      : parseFloat(provider?.averageRating || "0");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-linear-to-br from-sky-50 via-white to-blue-50 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
            Service Provider Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingSkeleton />
        ) : !provider ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Provider Not Found
            </h2>
            <p className="text-gray-600">
              The service provider profile you're looking for doesn't exist.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Header */}
            <div className="bg-linear-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {/* Profile Photo */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30 shrink-0 mx-auto sm:mx-0">
                    {provider.profilePhoto ? (
                      <img
                        src={provider.profilePhoto}
                        alt={provider.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-bold">
                        {provider.name?.charAt(0).toUpperCase() || "P"}
                      </span>
                    )}
                  </div>

                  {/* Name & Rating */}
                  <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                      {provider.name}
                    </h2>

                    {provider.averageRating && (
                      <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                                i < Math.floor(ratingValue)
                                  ? "fill-yellow-300 text-yellow-300"
                                  : "fill-white/30 text-white/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sky-100 font-semibold text-xs sm:text-sm">
                          {ratingValue.toFixed(1)}
                        </span>
                        <span className="text-sky-200 text-xs sm:text-sm">
                          ({provider.totalReviews || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Availability Badge */}
                    {provider.availability?.status && (
                      <Badge className="text-xs w-fit mx-auto sm:mx-0">
                        {provider.availability.status === "available" && (
                          <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                        )}
                        {provider.availability.status.charAt(0).toUpperCase() +
                          provider.availability.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {(() => {
              const stats = [];

              // Jobs Done
              if (provider.totalJobsCompleted && Number(provider.totalJobsCompleted) > 0) {
                stats.push(
                  <div key="jobs" className="p-2 sm:p-3 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 text-center">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {provider.totalJobsCompleted}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Jobs Done</p>
                  </div>
                );
              }

              // Rating - always show
              stats.push(
                <div key="rating" className="p-2 sm:p-3 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {ratingValue.toFixed(1)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600">Rating</p>
                </div>
              );

              // Experience
              if (provider.experience && Number(provider.experience) > 0) {
                stats.push(
                  <div key="experience" className="p-2 sm:p-3 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-center">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {provider.experience}+
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Years Exp.</p>
                  </div>
                );
              }

              // Reviews
              if (provider.totalReviews && Number(provider.totalReviews) > 0) {
                stats.push(
                  <div key="reviews" className="p-2 sm:p-3 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 text-center">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {provider.totalReviews}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Reviews</p>
                  </div>
                );
              }

              // Calculate grid columns based on number of stats
              const gridCols = stats.length <= 2 ? 'grid-cols-2' : 'sm:grid-cols-4 grid-cols-2';

              return (
                <div className={`grid ${gridCols} gap-2 sm:gap-3 max-w-2xl mx-auto`}>
                  {stats}
                </div>
              );
            })()}

            {/* Contact Information */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
                Contact Information
              </h3>
              <div className="space-y-2">
                {/* Email */}
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-sky-50 rounded-xl border border-sky-100">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-gray-500">Email</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                      {provider.email}
                    </p>
                  </div>
                </div>

                {/* Service Area */}
                {provider.serviceArea && provider.serviceArea.length > 0 && (
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">Service Area</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                        {provider.serviceArea.map((area, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-violet-100 text-violet-700 text-[10px] sm:text-xs font-medium rounded-lg"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {provider.skills && provider.skills.length > 0 && (
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {provider.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 sm:px-3 sm:py-1 bg-linear-to-r from-violet-100 to-purple-100 text-violet-700 text-[10px] sm:text-xs font-medium rounded-full border border-violet-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            {provider.pricing && (
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
                  Pricing
                </h3>
                <div className="p-2 sm:p-3 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        {provider.pricing.type === "per-hour"
                          ? "Per Hour"
                          : "Per Visit"}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        ₹{provider.pricing.baseRate.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Badge className="bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs">
                      Transparent Pricing
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {provider.certifications && provider.certifications.length > 0 && (
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
                  Certifications
                </h3>
                <div className="space-y-2">
                  {provider.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="p-2 sm:p-3 bg-linear-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 flex items-start gap-2 sm:gap-3"
                    >
                      <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {cert.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-600">
                          {cert.issuer} • {cert.year}
                        </p>
                      </div>
                      {cert.credentialUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(cert.credentialUrl, "_blank")}
                          className="shrink-0 h-7 sm:h-8 text-[10px] sm:text-xs px-2"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {provider.bio && (
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
                  About
                </h3>
                <div className="p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
                    {provider.bio}
                  </p>
                </div>
              </div>
            )}

            {/* Availability */}
            {provider.availability?.workingHours && (
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600" />
                  Working Hours
                </h3>
                <div className="p-2 sm:p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-semibold">From:</span>{" "}
                    {provider.availability.workingHours.from} •{" "}
                    <span className="font-semibold">To:</span>{" "}
                    {provider.availability.workingHours.to}
                  </p>
                </div>
              </div>
            )}

            {/* Joined Date */}
            {provider.joinedDate && (
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                <p className="text-xs sm:text-sm text-gray-600">
                  Member since{" "}
                  {new Date(provider.joinedDate).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <Skeleton className="h-24 sm:h-32 w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Skeleton className="h-14 sm:h-16 w-full" />
        <Skeleton className="h-14 sm:h-16 w-full" />
        <Skeleton className="h-14 sm:h-16 w-full" />
        <Skeleton className="h-14 sm:h-16 w-full" />
      </div>
      <Skeleton className="h-16 sm:h-20 w-full" />
      <Skeleton className="h-20 sm:h-24 w-full" />
    </div>
  );
}
