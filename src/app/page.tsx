"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Wrench,
  User,
  Shield,
  CheckCircle2,
  Star,
  ArrowRight,
  TrendingUp,
  Users,
  Award,
  Zap,
  Clock,
  MapPin,
  Mail,
  Phone,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Search,
  Calendar,
  MessageCircle,
  DollarSign,
  Home as HomeIcon,
  Hammer,
  Sparkles,
  Droplets,
  Lightbulb,
  Leaf,
  ChevronRight,
  Quote,
  MessageSquare,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user?.role) return "/login";
    switch (user.role) {
      case "customer":
        return "/customer/dashboard";
      case "provider":
        return "/provider/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/login";
    }
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-blue-50">
      {/* Animated 3D Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-linear-to-br from-sky-200/20 sm:from-sky-200/30 to-blue-200/20 sm:to-blue-200/30 rounded-full blur-3xl animate-pulse -z-10 sm:z-0" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-linear-to-br from-blue-200/20 sm:from-blue-200/30 to-indigo-200/20 sm:to-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000 -z-10 sm:z-0" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-linear-to-br from-teal-200/20 sm:from-teal-200/30 to-cyan-200/20 sm:to-cyan-200/30 rounded-full blur-3xl animate-pulse delay-2000 -z-10 sm:z-0" />
      </div>

      {/* 3D Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-40 left-10 w-16 h-16 bg-linear-to-br from-sky-400/80 sm:from-sky-400 to-sky-500/80 sm:to-sky-500 rounded-2xl shadow-2xl transform rotate-12 animate-float -z-10 sm:z-0" />
        <div className="absolute top-60 right-20 w-12 h-12 bg-linear-to-br from-blue-400/80 sm:from-blue-400 to-blue-500/80 sm:to-blue-500 rounded-xl shadow-2xl transform -rotate-12 animate-float-delay-1 -z-10 sm:z-0" />
        <div className="absolute bottom-40 right-40 w-14 h-14 bg-linear-to-br from-teal-400/80 sm:from-teal-400 to-teal-500/80 sm:to-teal-500 rounded-2xl shadow-2xl transform rotate-6 animate-float-delay-2 -z-10 sm:z-0" />
        <div className="absolute bottom-60 left-32 w-10 h-10 bg-linear-to-br from-indigo-400/80 sm:from-indigo-400 to-indigo-500/80 sm:to-indigo-500 rounded-xl shadow-2xl transform -rotate-6 animate-float-delay-3 -z-10 sm:z-0" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/70 shadow-lg border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform group-hover:shadow-2xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                FixBee
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated && user ? (
                <>
                  <span className="text-xs sm:text-sm text-gray-600 hidden xs:inline-block">
                    Welcome, <span className="font-semibold text-sky-600">{user.name?.split(" ")[0]}</span>
                  </span>
                  <Button
                    size="sm"
                    className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
                    asChild
                  >
                    <Link href={getDashboardUrl()}>
                      <HomeIcon className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                      <span className="sm:hidden">Go</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-sky-600 transition-colors font-medium text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Login</span>
                    <span className="sm:hidden">Sign In</span>
                  </Link>
                  <Button
                    size="sm"
                    className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5"
                    asChild
                  >
                    <Link href="/register">
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Start</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Cards */}
      <section className="relative pt-50 pb-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-sky-100 to-blue-100 rounded-full border border-sky-200 shadow-md">
                <span className="w-2.5 h-2.5 bg-linear-to-r from-sky-400 to-blue-400 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">
                  Trusted by 10,000+ homeowners
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-gray-900">
                Your Home&apos;s
                <br />
                <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent relative">
                  Perfect Match
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    height="8"
                    viewBox="0 0 200 8"
                    fill="none"
                  >
                    <path
                      d="M2 6C50 2 150 2 198 6"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <br />
                for Services
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Connect with verified, skilled professionals for all your home
                needs. Quality service, transparent pricing, complete peace of
                mind.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white px-10 py-7 text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105 hover:-translate-y-1"
                  asChild
                >
                  <Link
                    href="/register/customer"
                    className="flex items-center gap-2"
                  >
                    Book a Service
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-sky-500 px-10 py-7 text-lg transition-all hover:scale-105 hover:-translate-y-1"
                  asChild
                >
                  <Link href="/register/provider">Become a Provider</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full bg-linear-to-br from-sky-400 to-blue-500 border-4 border-white shadow-lg"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      4.9/5 Rating
                    </span>
                    <span className="text-xs text-gray-500">
                      From 10,000+ reviews
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - 3D Feature Cards */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-162.5">
                {/* Main Feature Card */}
                <div className="absolute top-8 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 transform hover:scale-105 transition-all hover:shadow-3xl hover:-translate-y-2">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-linear-to-br from-sky-400 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Wrench className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        Plumbing Service
                      </h3>
                      <p className="text-sm text-gray-500">
                        Completed • 2hrs ago
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">5.0</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          $150
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Feature Card */}
                <div className="absolute top-48 right-20 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 transform hover:scale-105 transition-all hover:shadow-3xl hover:-translate-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-linear-to-br from-teal-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        Electrical Repair
                      </h3>
                      <p className="text-sm text-gray-500">In Progress</p>
                      <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-linear-to-r from-teal-400 to-teal-300 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Third Feature Card */}
                <div className="absolute bottom-8 right-10 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 transform hover:scale-105 transition-all hover:shadow-3xl hover:-translate-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-linear-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">Home Cleaning</h3>
                      <p className="text-sm text-gray-500">Tomorrow 10AM</p>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-gray-600">
                          Verified Provider
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-6 left-0 bg-linear-to-br from-amber-300 to-orange-400 rounded-2xl p-5 shadow-2xl animate-bounce">
                  <div className="text-center">
                    <Star className="h-7 w-7 fill-white text-white mx-auto" />
                    <p className="text-white font-bold text-2xl mt-1">4.9</p>
                    <p className="text-white/90 text-xs">Average Rating</p>
                  </div>
                </div>

                {/* Stats Badge */}
                <div className="absolute bottom-20 left-0 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-sky-400 to-blue-400 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">50K+</p>
                      <p className="text-xs text-gray-500">Active Providers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with 3D Cards */}
      <section className="py-20 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-6 relative">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                value: "50K+",
                label: "Active Providers",
                color: "from-sky-300 to-sky-400",
              },
              {
                icon: CheckCircle2,
                value: "200K+",
                label: "Jobs Completed",
                color: "from-teal-300 to-teal-400",
              },
              {
                icon: Star,
                value: "4.9",
                label: "Average Rating",
                color: "from-amber-300 to-orange-400",
              },
              {
                icon: TrendingUp,
                value: "98%",
                label: "Satisfaction",
                color: "from-blue-300 to-indigo-400",
              },
            ].map((stat, i) => (
              <Card
                key={i}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:bg-white/20 transition-all hover:scale-110 hover:-translate-y-2 hover:shadow-2xl"
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-16 h-16 bg-linear-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl`}
                  >
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-5xl font-bold mb-2 text-white">
                    {stat.value}
                  </h3>
                  <p className="text-white/90 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section with 3D Hover Effects */}
      <section className="py-24 bg-linear-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">
          {isAuthenticated && user ? (
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="w-32 h-32 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-5xl font-bold mb-6 text-gray-900">
                Welcome Back,{" "}
                <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  {user.name}!
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                You are logged in as a <span className="font-semibold text-sky-600 capitalize">{user.role}</span>
              </p>
              <Button
                className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 px-12 py-6 text-lg"
                size="lg"
                asChild
              >
                <Link href={getDashboardUrl()}>
                  <HomeIcon className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold mb-4 text-gray-900">
                  Choose Your{" "}
                  <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                    Role
                  </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Join thousands of satisfied customers and skilled providers on our
                  platform
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {[
                  {
                    title: "Customer",
                    icon: User,
                    href: "/register/customer",
                    desc: "Post service requests and connect with skilled providers",
                    features: [
                      "Verified providers",
                      "Transparent pricing",
                      "Easy booking",
                      "24/7 Support",
                    ],
                    color: "sky",
                    gradient: "from-sky-400 to-sky-500",
                    bgGradient: "from-sky-50 to-sky-100",
                    borderColor: "border-sky-200",
                  },
                  {
                    title: "Service Provider",
                    icon: Wrench,
                    href: "/register/provider",
                    desc: "Grow your business and reach more customers",
                    features: [
                      "Flexible schedule",
                      "Instant payments",
                      "Build reputation",
                      "Analytics",
                    ],
                    color: "teal",
                    gradient: "from-teal-400 to-teal-500",
                    bgGradient: "from-teal-50 to-teal-100",
                    borderColor: "border-teal-200",
                  },
                  {
                    title: "Admin",
                    icon: Shield,
                    href: "/login/admin",
                    desc: "Manage and monitor the entire platform",
                    features: [
                      "User management",
                      "Analytics dashboard",
                      "Review moderation",
                      "Full control",
                    ],
                    color: "blue",
                    gradient: "from-blue-400 to-blue-500",
                    bgGradient: "from-blue-50 to-blue-100",
                    borderColor: "border-blue-200",
                  },
                ].map((role, i) => (
                  <Card
                    key={i}
                    className={`group relative overflow-hidden border-2 ${role.borderColor} hover:border-${role.color}-300 transition-all bg-linear-to-br ${role.bgGradient} hover:scale-105 hover:shadow-2xl hover:-translate-y-2`}
                    style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-white/0 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-8 text-center relative">
                      <div
                        className={`w-24 h-24 bg-linear-to-br ${role.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all`}
                      >
                        <role.icon className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold mb-4 text-gray-900">
                        {role.title}
                      </h3>
                      <p className="text-gray-600 mb-6">{role.desc}</p>
                      <ul className="space-y-3 mb-6 text-left">
                        {role.features.map((feature, fi) => (
                          <li
                            key={fi}
                            className="flex items-center gap-3 text-sm text-gray-700"
                          >
                            <CheckCircle2
                              className={`h-5 w-5 text-${role.color}-500 shrink-0`}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full bg-linear-to-r ${role.gradient} hover:shadow-xl transition-all hover:scale-105`}
                        asChild
                      >
                        <Link href={role.href}>Get Started</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">
              Why Choose{" "}
              <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                FixBee?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Award,
                title: "Verified Professionals",
                desc: "All providers are background-checked and verified for your safety",
                color: "sky",
              },
              {
                icon: Clock,
                title: "Quick Service",
                desc: "Get your services done quickly with our instant matching system",
                color: "teal",
              },
              {
                icon: Star,
                title: "Transparent Reviews",
                desc: "Read authentic reviews from real customers to make informed decisions",
                color: "amber",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="group border-2 border-gray-100 hover:border-sky-400 transition-all bg-white hover:scale-105 hover:shadow-2xl"
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`w-20 h-20 bg-linear-to-br from-${feature.color}-400 to-${feature.color}-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all`}
                  >
                    <feature.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-linear-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">
              How It{" "}
              <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your home services done in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                icon: Search,
                title: "Find Your Service",
                desc: "Browse through our wide range of home service categories",
                color: "from-sky-400 to-sky-500",
              },
              {
                step: "02",
                icon: Calendar,
                title: "Book a Time",
                desc: "Select your preferred date and time for the service",
                color: "from-blue-400 to-blue-500",
              },
              {
                step: "03",
                icon: MessageCircle,
                title: "Get Matched",
                desc: "We connect you with verified professionals in your area",
                color: "from-indigo-400 to-indigo-500",
              },
              {
                step: "04",
                icon: CheckCircle2,
                title: "Service Complete",
                desc: "Enjoy your completed service and leave a review",
                color: "from-teal-400 to-teal-500",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <Card className="group border-2 border-gray-100 hover:border-sky-300 transition-all bg-white hover:scale-105 hover:shadow-2xl h-full">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 bg-linear-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all`}
                    >
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold bg-linear-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-2">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-sky-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">
              Popular{" "}
              <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Services
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our most requested home services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: HomeIcon,
                name: "Home Cleaning",
                providers: "2.5K+",
                rating: 4.8,
                gradient: "from-sky-400 to-sky-500",
              },
              {
                icon: Wrench,
                name: "Plumbing",
                providers: "1.8K+",
                rating: 4.9,
                gradient: "from-blue-400 to-blue-500",
              },
              {
                icon: Lightbulb,
                name: "Electrical",
                providers: "1.5K+",
                rating: 4.7,
                gradient: "from-amber-400 to-amber-500",
              },
              {
                icon: Hammer,
                name: "Carpentry",
                providers: "1.2K+",
                rating: 4.8,
                gradient: "from-orange-400 to-orange-500",
              },
              {
                icon: Sparkles,
                name: "Painting",
                providers: "1.4K+",
                rating: 4.6,
                gradient: "from-purple-400 to-purple-500",
              },
              {
                icon: Droplets,
                name: "HVAC",
                providers: "1.6K+",
                rating: 4.9,
                gradient: "from-teal-400 to-teal-500",
              },
              {
                icon: Leaf,
                name: "Landscaping",
                providers: "1.1K+",
                rating: 4.7,
                gradient: "from-green-400 to-green-500",
              },
              {
                icon: Zap,
                name: "Appliance Repair",
                providers: "1.3K+",
                rating: 4.8,
                gradient: "from-indigo-400 to-indigo-500",
              },
            ].map((service, i) => (
              <Card
                key={i}
                className="group border-2 border-gray-100 hover:border-sky-300 transition-all bg-white hover:scale-105 hover:shadow-2xl cursor-pointer"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 bg-linear-to-br ${service.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all`}
                  >
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">
                    {service.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span>{service.providers} providers</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">
                      {service.rating}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              asChild
            >
              <Link href="/register/customer">
                View All Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-linear-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">
              What Our{" "}
              <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Customers Say
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from real customers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                role: "Homeowner",
                avatar: "SJ",
                rating: 5,
                text: "FixBee made finding a plumber so easy! The professional arrived on time and did an excellent job. Highly recommend!",
                service: "Plumbing Service",
                gradient: "from-sky-400 to-sky-500",
              },
              {
                name: "Michael Chen",
                role: "Business Owner",
                avatar: "MC",
                rating: 5,
                text: "As a service provider, FixBee has helped me grow my business significantly. The platform is intuitive and the support is great.",
                service: "Service Provider",
                gradient: "from-blue-400 to-blue-500",
              },
              {
                name: "Emily Rodriguez",
                role: "Homeowner",
                avatar: "ER",
                rating: 5,
                text: "I&apos;ve used FixBee for multiple home services. The quality of providers is consistently high and pricing is transparent.",
                service: "Multiple Services",
                gradient: "from-indigo-400 to-indigo-500",
              },
            ].map((testimonial, i) => (
              <Card
                key={i}
                className="group border-2 border-gray-100 hover:border-sky-300 transition-all bg-white hover:scale-105 hover:shadow-2xl"
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-14 h-14 bg-linear-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                    <Quote className="h-8 w-8 text-sky-200" />
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    &quot;{testimonial.text}&quot;
                  </p>
                  <div className="flex items-center gap-2 text-sm text-sky-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">{testimonial.service}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Benefits Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-5xl font-bold mb-6 text-gray-900">
                More Reasons to{" "}
                <span className="bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Choose FixBee
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-10">
                We go above and beyond to ensure your satisfaction
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: DollarSign,
                    title: "Transparent Pricing",
                    desc: "Know exactly what you&apos;ll pay before booking. No hidden fees or surprises.",
                  },
                  {
                    icon: Shield,
                    title: "Insurance Coverage",
                    desc: "All services are covered by our insurance policy for your peace of mind.",
                  },
                  {
                    icon: MessageSquare,
                    title: "24/7 Customer Support",
                    desc: "Our support team is always ready to help you with any questions or issues.",
                  },
                  {
                    icon: Award,
                    title: "Satisfaction Guarantee",
                    desc: "Not happy with the service? We&apos;ll work to make it right or refund your money.",
                  },
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-gray-900">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-linear-to-br from-sky-100 via-blue-100 to-indigo-100 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center">
                    Join FixBee Today
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">
                        Free to join for customers
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">
                        Access to 50,000+ verified providers
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">
                        Book services in minutes
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">
                        Secure payments & refunds
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-6 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 text-white py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                    asChild
                  >
                    <Link href="/register/customer">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-linear-to-r from-sky-400 via-blue-400 to-indigo-400 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join thousands of satisfied customers and skilled providers today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-sky-600 hover:bg-white/90 px-12 py-7 text-xl shadow-2xl hover:scale-105 transition-all"
                asChild
              >
                <Link href="/register/customer">
                  Book Your First Service
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-12 py-7 text-xl shadow-2xl hover:scale-105 transition-all"
                asChild
              >
                <Link href="/register/provider">Become a Provider</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 border-t border-gray-200 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-sky-400 via-blue-400 to-indigo-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  FixBee
                </span>
              </Link>
              <p className="text-gray-600 mb-6">
                Your trusted home services marketplace
              </p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="w-10 h-10 bg-linear-to-br from-sky-400 to-sky-500 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white"
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  className="w-10 h-10 bg-linear-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  className="w-10 h-10 bg-linear-to-br from-sky-400 to-sky-500 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-all text-white"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-gray-900">Platform</h4>
              <ul className="space-y-3">
                {!isAuthenticated && (
                  <>
                    <li>
                      <Link
                        href="/register/customer"
                        className="text-gray-600 hover:text-sky-600 transition-colors"
                      >
                        For Customers
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/register/provider"
                        className="text-gray-600 hover:text-sky-600 transition-colors"
                      >
                        For Providers
                      </Link>
                    </li>
                  </>
                )}
                {isAuthenticated && user?.role === "customer" && (
                  <li>
                    <Link
                      href="/customer/dashboard"
                      className="text-gray-600 hover:text-sky-600 transition-colors"
                    >
                      Customer Dashboard
                    </Link>
                  </li>
                )}
                {isAuthenticated && user?.role === "provider" && (
                  <li>
                    <Link
                      href="/provider/dashboard"
                      className="text-gray-600 hover:text-sky-600 transition-colors"
                    >
                      Provider Dashboard
                    </Link>
                  </li>
                )}
                {isAuthenticated && user?.role === "admin" && (
                  <li>
                    <Link
                      href="/admin/dashboard"
                      className="text-gray-600 hover:text-sky-600 transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}
                {!isAuthenticated && (
                  <li>
                    <Link
                      href="/login/admin"
                      className="text-gray-600 hover:text-sky-600 transition-colors"
                    >
                      Admin Login
                    </Link>
                  </li>
                )}
                {isAuthenticated && user?.role === "admin" && (
                  <li>
                    <Link
                      href="/admin/dashboard"
                      className="text-gray-600 hover:text-sky-600 transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-gray-900">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-gray-600 hover:text-sky-600 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-gray-900">Contact</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-sky-600" />
                  <Link
                    href="mailto:hello@fixbee.com"
                    className="hover:text-sky-600 transition-colors"
                  >
                    hello@fixbee.com
                  </Link>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-sky-600" />
                  <Link
                    href="tel:+1234567890"
                    className="hover:text-sky-600 transition-colors"
                  >
                    +1 (234) 567-890
                  </Link>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-sky-600" />
                  <span>San Francisco, CA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © 2024 FixBee. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link
                href="/privacy"
                className="hover:text-sky-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-sky-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(12deg);
          }
          50% {
            transform: translateY(-20px) rotate(12deg);
          }
        }
        @keyframes float-delay-1 {
          0%,
          100% {
            transform: translateY(0px) rotate(-12deg);
          }
          50% {
            transform: translateY(-20px) rotate(-12deg);
          }
        }
        @keyframes float-delay-2 {
          0%,
          100% {
            transform: translateY(0px) rotate(6deg);
          }
          50% {
            transform: translateY(-15px) rotate(6deg);
          }
        }
        @keyframes float-delay-3 {
          0%,
          100% {
            transform: translateY(0px) rotate(-6deg);
          }
          50% {
            transform: translateY(-15px) rotate(-6deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay-1 {
          animation: float-delay-1 7s ease-in-out infinite;
        }
        .animate-float-delay-2 {
          animation: float-delay-2 8s ease-in-out infinite;
        }
        .animate-float-delay-3 {
          animation: float-delay-3 9s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
