'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle2, Wrench as FixBeeIcon, Shield, Lock, Clock, MailOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      // await authApi.forgotPassword(data.email);
      console.log('Password reset requested for:', data.email);
      setIsSuccess(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const sideGradient = 'from-violet-500 via-purple-500 to-fuchsia-500';
  const primaryGradient = 'from-violet-400 via-purple-400 to-fuchsia-400';
  const hoverGradient = 'from-violet-500 via-purple-500 to-fuchsia-500';

  const features = [
    { icon: Lock, text: 'Secure password reset' },
    { icon: Clock, text: 'Quick recovery process' },
    { icon: Shield, text: 'Protected account access' },
    { icon: MailOpen, text: 'Email verification' },
  ];

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Side - Image/3D Design */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-20 right-20 w-96 h-96 bg-linear-to-br ${sideGradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
          <div className={`absolute bottom-20 left-20 w-80 h-80 bg-linear-to-br ${sideGradient} rounded-full blur-3xl opacity-20 animate-pulse delay-1000`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-linear-to-br ${sideGradient} rounded-full blur-3xl opacity-20 animate-pulse delay-2000`} />
        </div>

        {/* Floating 3D elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-32 left-16 w-20 h-20 bg-linear-to-br from-violet-400 to-violet-500 rounded-3xl shadow-2xl transform rotate-12 animate-float" />
          <div className="absolute top-48 right-24 w-16 h-16 bg-linear-to-br from-purple-400 to-purple-500 rounded-2xl shadow-2xl transform -rotate-12 animate-float-delay-1" />
          <div className="absolute bottom-32 right-32 w-18 h-18 bg-linear-to-br from-fuchsia-400 to-fuchsia-500 rounded-3xl shadow-2xl transform rotate-6 animate-float-delay-2" />
          <div className="absolute bottom-48 left-24 w-14 h-14 bg-linear-to-br from-pink-400 to-pink-500 rounded-2xl shadow-2xl transform -rotate-6 animate-float-delay-3" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12 h-full">
          <Link href="/" className="flex items-center gap-3 mb-12 group">
            <div className={`w-14 h-14 bg-linear-to-br ${sideGradient} rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
              <FixBeeIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">FixBee</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className={`text-5xl font-bold bg-linear-to-r ${sideGradient} bg-clip-text text-transparent mb-4`}>
                Forgot Password?
              </h1>
              <p className="text-xl text-gray-300">No worries, we'll help you recover it</p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-linear-to-br ${sideGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-lg text-gray-200">{feature.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-8">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className={`w-12 h-12 bg-linear-to-br ${sideGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Secure Recovery</p>
                  <p className="text-sm text-gray-400">Your account is protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center px-4 py-12 bg-linear-to-br from-sky-50 via-white to-blue-50 relative overflow-y-auto">
        {/* Animated background for form side */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-linear-to-br from-violet-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-linear-to-br from-purple-200/20 to-fuchsia-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="w-full max-w-md relative z-10 my-auto">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-8 group">
            <div className="w-12 h-12 bg-linear-to-br from-violet-400 via-purple-400 to-fuchsia-400 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <FixBeeIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              FixBee
            </span>
          </Link>

          {/* Form Card */}
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 px-8 pt-8 pb-6 text-center">
              {!isSuccess ? (
                <>
                  <div className="w-16 h-16 bg-linear-to-br from-violet-400 via-purple-400 to-fuchsia-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-linear-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent mb-1">
                    Forgot Password?
                  </h2>
                  <p className="text-gray-600 font-medium">No worries, it happens!</p>
                  <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a reset link</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-linear-to-br from-emerald-400 via-green-400 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-linear-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent mb-1">
                    Check Your Email
                  </h2>
                  <p className="text-gray-600 font-medium">Reset link sent!</p>
                  <p className="text-sm text-gray-500 mt-1">We've sent a password reset link to your email</p>
                </>
              )}
            </div>

            {/* Form Content */}
            <div className="px-8 py-6">
              {!isSuccess ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-600" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="h-12 pl-10 border-gray-200 focus:border-violet-500 focus:ring-violet-500/20 bg-white"
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

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-900">Password Recovery</p>
                        <p className="text-blue-800 mt-1">
                          Make sure to check your spam folder if you don't see the email within a few minutes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-linear-to-r from-violet-400 via-purple-400 to-fuchsia-400 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] hover:-translate-y-0.5"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-emerald-900">Email Sent Successfully</p>
                        <p className="text-emerald-800 mt-1">
                          Please check your email inbox and spam folder for the password reset link.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-gray-200 hover:border-violet-500 hover:bg-violet-50 text-gray-700 font-semibold transition-all"
                    onClick={() => setIsSuccess(false)}
                  >
                    Try Another Email
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 font-semibold transition-all"
                    onClick={() => {
                      toast.success('Resending reset email...');
                      // In real app, you would call the API again here
                    }}
                  >
                    Resend Email
                  </Button>
                </div>
              )}

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
