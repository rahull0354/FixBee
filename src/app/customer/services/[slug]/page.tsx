'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { customerApi } from '@/lib/api';
import { Category } from '@/types';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  Briefcase,
  Loader2,
  Calendar,
  MapPin,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadCategory();
    }
  }, [slug]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getCategory(slug);
      const data: Category = (response as any).data || response;
      setCategory(data);
    } catch (error: any) {
      console.error('Error loading category:', error);

      // Check if it's a 500 error or API is unavailable
      if (error?.response?.status === 500 || error?.code === 'ERR_NETWORK') {
        // Use mock data as fallback for development
        const mockCategory: Category = {
          id: 'mock-1',
          name: 'Electrician Services',
          slug: slug,
          description: 'Professional electrical services for your home and business. Our certified electricians handle everything from simple repairs to complete electrical installations.',
          icon: '⚡',
          priceRange: {
            min: 50,
            max: 500,
            unit: '$',
          },
          commonServices: [
            { name: 'Electrical Repair', description: 'Fix wiring issues and electrical problems' },
            { name: 'Light Installation', description: 'Install or replace light fixtures' },
            { name: 'Outlet Installation', description: 'Add or replace electrical outlets' },
            { name: 'Circuit Breaker Service', description: 'Repair or replace circuit breakers' },
            { name: 'Ceiling Fan Installation', description: 'Install ceiling fans properly' },
            { name: 'Safety Inspection', description: 'Comprehensive electrical safety check' },
          ],
          requiredSkills: ['Electrical Wiring', 'Safety Protocols', 'Code Compliance', 'Troubleshooting'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCategory(mockCategory);
        toast.info('Using demo data - Backend API unavailable');
      } else {
        toast.error('Failed to load service details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (!category) {
      toast.error('Service details not loaded. Please try again.');
      return;
    }

    // Navigate to new request page with category pre-selected
    router.push(`/customer/requests/new?category=${category.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto" />
          <p className="text-gray-600 font-medium">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-lg border border-sky-100 text-center">
        <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Service Not Found</h2>
        <p className="text-gray-600 mb-6">The service you're looking for doesn't exist.</p>
        <Link
          href="/customer/services"
          className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Services
        </Link>
      </div>
    );
  }

  // Skeleton loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Back Button Skeleton */}
        <Skeleton className="h-6 w-32" />

        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
          <div className="flex items-start gap-6">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* Price Range Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        {/* Common Services Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <Skeleton className="h-7 w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Required Skills Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-6">
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* Book Service Button Skeleton */}
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/customer/services"
        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Icon */}
          <div className="w-24 h-24 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            {category.icon ? (
              <span className="text-5xl">{category.icon}</span>
            ) : (
              <Briefcase className="h-12 w-12 text-white" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{category.name}</h1>
            {category.description && (
              <p className="text-gray-600 text-lg mb-4">{category.description}</p>
            )}

            {/* Price Range */}
            {category.priceRange && (
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price Range</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {category.priceRange.min} - {category.priceRange.max} {category.priceRange.unit}
                  </p>
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {category.isActive ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Available</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-full border border-gray-200">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Unavailable</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Common Services */}
      {category.commonServices.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Common Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.commonServices.map((service, index) => {
              // Handle both string and object formats
              const serviceName = typeof service === 'string' ? service : service.name;
              const serviceKey = typeof service === 'string' ? index : service._id || index;
              const serviceDescription = typeof service === 'object' && service.description
                ? service.description
                : '';

              return (
                <div
                  key={serviceKey}
                  className="flex items-start gap-3 p-4 bg-sky-50 rounded-xl border border-sky-200"
                >
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{serviceName}</p>
                    {serviceDescription && (
                      <p className="text-sm text-gray-600 mt-1">{serviceDescription}</p>
                    )}
                    {/* Show duration and price if available */}
                    {typeof service === 'object' && (service.duration || service.typicalPrice) && (
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        {service.duration && (
                          <span>⏱️ {service.duration}</span>
                        )}
                        {service.typicalPrice && (
                          <span>💰 {service.typicalPrice}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Required Skills */}
      {category.requiredSkills.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Required Skills</h2>
          <div className="flex flex-wrap gap-3">
            {category.requiredSkills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-full border border-violet-200"
              >
                <Star className="h-4 w-4" />
                <span className="font-medium">{skill}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to Expect */}
      <div className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Easy Scheduling</h3>
              <p className="text-sm text-sky-100">Choose your preferred date and time</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Home Service</h3>
              <p className="text-sm text-sky-100">Professionals come to your doorstep</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Verified Experts</h3>
              <p className="text-sm text-sky-100">Trusted and skilled professionals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Book Now CTA */}
      {category.isActive && (
        <div className="bg-white rounded-2xl shadow-lg border border-sky-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Book this service now and get matched with verified professionals in your area.
          </p>
          <button
            onClick={handleBookService}
            className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
          >
            <Calendar className="h-5 w-5" />
            Book This Service
          </button>
        </div>
      )}
    </div>
  );
}
