'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, User, Wrench, Shield, Wrench as FixBeeIcon, Home, Star, CheckCircle2, Zap, ShieldCheck, Mail, Lock } from 'lucide-react';

interface LoginFormProps {
  role: 'customer' | 'provider' | 'admin';
}

const roleConfig = {
  customer: {
    title: 'Welcome Back!',
    subtitle: 'Customer Login',
    description: 'Login to book home services',
    icon: User,
    primaryGradient: 'from-sky-400 via-blue-400 to-indigo-400',
    hoverGradient: 'from-sky-500 via-blue-500 to-indigo-500',
    accentColor: 'text-sky-600',
    linkColor: 'text-sky-600 hover:text-sky-700',
    redirectPath: '/customer/dashboard',
    features: [
      { icon: Home, text: 'Book verified professionals' },
      { icon: Star, text: '4.9/5 average rating' },
      { icon: CheckCircle2, text: '100% satisfaction guarantee' },
      { icon: Zap, text: 'Instant booking confirmed' },
    ],
    sideGradient: 'from-sky-500 via-blue-500 to-indigo-500',
  },
  provider: {
    title: 'Welcome Back!',
    subtitle: 'Service Provider Login',
    description: 'Login to manage your services',
    icon: Wrench,
    primaryGradient: 'from-emerald-400 via-green-400 to-teal-400',
    hoverGradient: 'from-emerald-500 via-green-500 to-teal-500',
    accentColor: 'text-emerald-600',
    linkColor: 'text-emerald-600 hover:text-emerald-700',
    redirectPath: '/provider/dashboard',
    features: [
      { icon: CheckCircle2, text: 'Grow your business' },
      { icon: Star, text: 'Get more customers' },
      { icon: Zap, text: 'Flexible schedule' },
      { icon: ShieldCheck, text: 'Secure payments' },
    ],
    sideGradient: 'from-emerald-500 via-green-500 to-teal-500',
  },
  admin: {
    title: 'Welcome Back!',
    subtitle: 'Admin Login',
    description: 'Secure admin access',
    icon: Shield,
    primaryGradient: 'from-violet-400 via-purple-400 to-fuchsia-400',
    hoverGradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    accentColor: 'text-violet-600',
    linkColor: 'text-violet-600 hover:text-violet-700',
    redirectPath: '/admin/dashboard',
    features: [
      { icon: ShieldCheck, text: 'Platform management' },
      { icon: User, text: 'User oversight' },
      { icon: CheckCircle2, text: 'Analytics dashboard' },
      { icon: Zap, text: 'Real-time monitoring' },
    ],
    sideGradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
  },
};

export function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const config = roleConfig[role];
  const Icon = config.icon;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, role);

      // Use window.location.href for full navigation to ensure cookies are set
      // and middleware runs on the new page
      window.location.href = config.redirectPath;
    } catch (error) {
      // Error is handled by the login function
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Side - Image/3D Design */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-20 right-20 w-96 h-96 bg-linear-to-br ${config.sideGradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
          <div className={`absolute bottom-20 left-20 w-80 h-80 bg-linear-to-br ${config.sideGradient} rounded-full blur-3xl opacity-20 animate-pulse delay-1000`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-linear-to-br ${config.sideGradient} rounded-full blur-3xl opacity-20 animate-pulse delay-2000`} />
        </div>

        {/* Floating 3D elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 left-16 w-20 h-20 bg-linear-to-br from-sky-400 to-sky-500 rounded-3xl shadow-2xl transform rotate-12 animate-float" />
          <div className="absolute top-48 right-24 w-16 h-16 bg-linear-to-br from-blue-400 to-blue-500 rounded-2xl shadow-2xl transform -rotate-12 animate-float-delay-1" />
          <div className="absolute bottom-32 right-32 w-18 h-18 bg-linear-to-br from-teal-400 to-teal-500 rounded-3xl shadow-2xl transform rotate-6 animate-float-delay-2" />
          <div className="absolute bottom-48 left-24 w-14 h-14 bg-linear-to-br from-indigo-400 to-indigo-500 rounded-2xl shadow-2xl transform -rotate-6 animate-float-delay-3" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-16 h-full">
          {/* Back Button */}
          <Link href="/login" className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-colors group">
            <svg className="w-5 h-5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </Link>

          <Link href="/" className="flex items-center gap-3 mb-12 group">
            <div className={`w-14 h-14 bg-linear-to-br ${config.sideGradient} rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
              <FixBeeIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">FixBee</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className={`text-5xl font-bold bg-linear-to-r ${config.sideGradient} bg-clip-text text-transparent mb-4`}>
                {config.title}
              </h1>
              <p className="text-xl text-gray-300">{config.subtitle}</p>
            </div>

            <div className="space-y-4">
              {config.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-linear-to-br ${config.sideGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-lg text-gray-200">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Banner positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-16 pb-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full bg-linear-to-br ${config.sideGradient} border-2 border-gray-800 shadow-lg`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-300">10,000+ users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center px-4 py-12 bg-linear-to-br from-sky-50 via-white to-blue-50 relative overflow-y-auto">
        {/* Animated background for form side */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-linear-to-br from-sky-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-linear-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="w-full max-w-md relative z-10 my-auto">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-8 group">
            <div className="w-12 h-12 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <FixBeeIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              FixBee
            </span>
          </Link>

          {/* Form Card */}
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 px-8 pt-8 pb-6 text-center">
              <div className={`w-16 h-16 bg-linear-to-br ${config.primaryGradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h2 className={`text-3xl font-bold bg-linear-to-r ${config.primaryGradient} bg-clip-text text-transparent mb-1`}>
                {config.title}
              </h2>
              <p className="text-gray-600 font-medium">{config.subtitle}</p>
              <p className="text-sm text-gray-500 mt-1">{config.description}</p>
            </div>

            {/* Form */}
            <div className="px-8 py-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-600" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="h-12 pl-10 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 bg-white"
                      {...register('email')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>•</span> {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-sm text-sky-600 hover:text-sky-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-600" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-12 pl-10 border-gray-200 focus:border-sky-500 focus:ring-sky-500/20 bg-white"
                      {...register('password')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>•</span> {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-gray-300 data-[state=checked]:bg-sky-500" />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-gray-600">
                    Remember me for 30 days
                  </Label>
                </div>

                <Button
                  type="submit"
                  className={`w-full h-12 bg-linear-to-r ${config.primaryGradient} hover:${config.hoverGradient} text-white font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] hover:-translate-y-0.5`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login to Continue'
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link
                    href={`/register/${role}`}
                    className={`${config.linkColor} font-semibold hover:underline`}
                  >
                    Create one now
                  </Link>
                </p>
              </div>

              {/* Back to Home */}
              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
