import Link from 'next/link';
import { User, Wrench, ArrowRight, Wrench as FixBeeIcon, Home, Star, CheckCircle2, Zap, TrendingUp, Users, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const roles = [
    {
      name: 'Customer',
      href: '/register/customer',
      icon: User,
      gradient: 'from-sky-400 via-blue-400 to-indigo-400',
      hoverGradient: 'from-sky-500 via-blue-500 to-indigo-500',
      bgGradient: 'from-sky-50 to-blue-50',
      textColor: 'text-sky-900',
      borderColor: 'border-sky-200',
      description: 'Book home services from verified providers',
      features: ['Instant booking', 'Verified professionals', 'Best prices', '24/7 support'],
      stats: { icon: Home, text: '10,000+ Bookings' },
    },
    {
      name: 'Service Provider',
      href: '/register/provider',
      icon: Wrench,
      gradient: 'from-emerald-400 via-green-400 to-teal-400',
      hoverGradient: 'from-emerald-500 via-green-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-green-50',
      textColor: 'text-emerald-900',
      borderColor: 'border-emerald-200',
      description: 'Grow your business with our platform',
      features: ['More customers', 'Flexible schedule', 'Secure payments', 'Business tools'],
      stats: { icon: TrendingUp, text: '5,000+ Providers' },
    },
  ];

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-linear-to-br from-sky-500 via-blue-500 to-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-linear-to-br from-emerald-500 via-green-500 to-teal-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-linear-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-2000" />
        </div>

        {/* Floating 3D elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-32 left-16 w-20 h-20 bg-linear-to-br from-sky-400 to-sky-500 rounded-3xl shadow-2xl transform rotate-12 animate-float" />
          <div className="absolute top-48 right-24 w-16 h-16 bg-linear-to-br from-blue-400 to-blue-500 rounded-2xl shadow-2xl transform -rotate-12 animate-float-delay-1" />
          <div className="absolute bottom-32 right-32 w-18 h-18 bg-linear-to-br from-emerald-400 to-emerald-500 rounded-3xl shadow-2xl transform rotate-6 animate-float-delay-2" />
          <div className="absolute bottom-48 left-24 w-14 h-14 bg-linear-to-br from-teal-400 to-teal-500 rounded-2xl shadow-2xl transform -rotate-6 animate-float-delay-3" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12 h-full">
          <Link href="/" className="flex items-center gap-3 mb-12 group">
            <div className="w-14 h-14 bg-linear-to-br from-sky-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <FixBeeIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">FixBee</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                Join Our Community
              </h1>
              <p className="text-xl text-gray-300">Choose your path and get started</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-br from-sky-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">15,000+ Users</p>
                  <p className="text-sm text-gray-400">Trust our platform</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">4.9/5 Rating</p>
                  <p className="text-sm text-gray-400">Customer satisfaction</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">100% Secure</p>
                  <p className="text-sm text-gray-400">Safe & verified</p>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full bg-linear-to-br from-sky-400 to-blue-500 border-2 border-gray-800 shadow-lg"
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
                  <span className="text-sm text-gray-300">Trusted by thousands</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Role Selection */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center px-4 py-12 bg-linear-to-br from-sky-50 via-white to-blue-50 relative overflow-y-auto">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-linear-to-br from-sky-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-linear-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="w-full max-w-4xl relative z-10 my-auto">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-8 group">
            <div className="w-12 h-12 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <FixBeeIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              FixBee
            </span>
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-3">
              Create Your Account
            </h2>
            <p className="text-gray-600 text-lg">Choose how you want to use FixBee</p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Link
                  key={role.name}
                  href={role.href}
                  className="group block"
                >
                  <div className={`backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl border-2 ${role.borderColor} overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 h-full`}>
                    {/* Card Header */}
                    <div className={`bg-linear-to-br ${role.bgGradient} px-6 py-8 text-center`}>
                      <div className={`w-24 h-24 bg-linear-to-br ${role.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                        <Icon className="h-12 w-12 text-white" />
                      </div>
                      <h3 className={`text-3xl font-bold ${role.textColor} mb-3`}>{role.name}</h3>
                      <p className="text-base text-gray-600">{role.description}</p>
                    </div>

                    {/* Features */}
                    <div className="px-6 py-6 space-y-3">
                      {role.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-base text-gray-700">
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${role.textColor.replace('900', '500')}`} />
                          <span className="font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="px-6 pb-6">
                      <div className={`flex items-center justify-center gap-3 p-4 bg-linear-to-r ${role.bgGradient} rounded-2xl mb-6`}>
                        <div className={`w-10 h-10 bg-linear-to-br ${role.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                          <role.stats.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className={`font-semibold ${role.textColor}`}>{role.stats.text}</span>
                      </div>

                      {/* Button */}
                      <button className={`w-full h-14 bg-linear-to-r ${role.gradient} hover:${role.hoverGradient} text-white font-semibold text-lg shadow-xl hover:shadow-2xl transition-all rounded-2xl flex items-center justify-center gap-2`}>
                        Join as {role.name}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
