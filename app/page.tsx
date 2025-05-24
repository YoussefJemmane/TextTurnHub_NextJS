"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Package, Users, ShoppingBag, ArrowRight, BarChart2, ListPlus } from "lucide-react";

const FeatureCard = ({ 
  title, 
  description, 
  linkHref, 
  linkText, 
  icon 
}: {
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  icon: React.ReactNode;
}) => (
  <div className="group bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 hover:border-teal-300/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div className="flex items-center mb-4">
      <div className="p-3 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    </div>
    <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
    <Link 
      href={linkHref} 
      className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium group-hover:translate-x-1 transition-all duration-200"
    >
      {linkText}
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  </div>
);

const StatCard = ({ 
  value, 
  label, 
  color = "teal" 
}: { 
  value: string; 
  label: string; 
  color?: string;
}) => (
  <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 hover:shadow-md transition-all duration-300">
    <div className={`text-5xl font-bold bg-gradient-to-r from-${color}-600 to-${color}-500 bg-clip-text text-transparent mb-3`}>
      {value}
    </div>
    <p className="text-gray-600 font-medium">{label}</p>
  </div>
);

interface DashboardCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardCard = ({ title, value, description, icon, trend }: DashboardCardProps) => (
  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 hover:border-teal-200 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-teal-50 rounded-lg">
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <span className="text-sm font-medium">{trend.isPositive ? '+' : '-'}{trend.value}%</span>
        </div>
      )}
    </div>
    <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
    <div className="text-2xl font-bold mb-2">{value}</div>
    <p className="text-gray-500 text-sm">{description}</p>
  </div>
);

interface DashboardStats {
  listings: number;
  transactions: number;
  products: number;
}

interface DashboardError {
  message: string;
  retryFunction: () => void;
}

const ErrorDisplay = ({ error }: { error: DashboardError }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
    <div className="text-red-600 mb-4">{error.message}</div>
    <button
      onClick={error.retryFunction}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

const LoadingDisplay = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
  </div>
);

const Dashboard = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    listings: 0,
    transactions: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      setError({
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        retryFunction: fetchStats
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const renderRoleSpecificContent = () => {
    if (!session?.user?.roles) return null;

    if (session.user.roles.includes('company')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Active Listings"
            value={stats.listings}
            description="Your active textile waste listings"
            icon={<Package className="w-6 h-6 text-teal-600" />}
            trend={{ value: 12, isPositive: true }}
          />
          <DashboardCard
            title="Total Transactions"
            value={stats.transactions}
            description="Completed waste exchanges"
            icon={<BarChart2 className="w-6 h-6 text-blue-600" />}
            trend={{ value: 8, isPositive: true }}
          />
          <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-6 rounded-xl text-white">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/textile-waste/create" className="flex items-center justify-between hover:bg-white/10 p-2 rounded-lg transition-all">
                <span>List New Waste</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/marketplace" className="flex items-center justify-between hover:bg-white/10 p-2 rounded-lg transition-all">
                <span>View Marketplace</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (session?.user?.roles?.includes('artisan')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Your Products"
            value={stats.products}
            description="Products in your shop"
            icon={<ShoppingBag className="w-6 h-6 text-teal-600" />}
            trend={{ value: 15, isPositive: true }}
          />
          <DashboardCard
            title="Available Materials"
            value={stats.listings}
            description="Textile waste listings available"
            icon={<Package className="w-6 h-6 text-blue-600" />}
          />
          <div className="bg-gradient-to-br from-blue-500 to-teal-500 p-6 rounded-xl text-white">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/products/create" className="flex items-center justify-between hover:bg-white/10 p-2 rounded-lg transition-all">
                <span>Add New Product</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/marketplace" className="flex items-center justify-between hover:bg-white/10 p-2 rounded-lg transition-all">
                <span>Browse Materials</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {session?.user?.name}!</h1>
          <p className="text-gray-600">Here's what's happening with your account</p>
        </div>
      </div>
      
      {loading ? (
        <LoadingDisplay />
      ) : error ? (
        <ErrorDisplay error={error} />
      ) : (
        renderRoleSpecificContent()
      )}
    </div>
  );
};

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (session) {
    return <Dashboard />;
  }

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-6 leading-tight">
            Welcome to TexTurn Hub
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            A sustainable platform connecting textile waste providers with artisans and creators
            to reduce waste and promote circular economy in the textile industry.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
          <Link 
            href="/marketplace" 
            className="group bg-gradient-to-r from-teal-600 to-teal-500 text-white px-8 py-4 rounded-2xl hover:from-teal-700 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
          >
            <span className="flex items-center justify-center">
              Explore Textile Waste
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link 
            href="/shop" 
            className="group bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
          >
            <span className="flex items-center justify-center">
              Shop Recycled Products
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </span>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          title="For Companies"
          description="List your textile waste materials and connect with artisans who can give them new life through innovative recycling solutions."
          linkHref="/api/auth/signin"
          linkText="Join as a Company"
          icon={
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        
        <FeatureCard
          title="For Artisans"
          description="Find quality textile waste materials and showcase your recycled creations to a community that values sustainability."
          linkHref="/api/auth/signin"
          linkText="Join as an Artisan"
          icon={
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
            </svg>
          }
        />
        
        <FeatureCard
          title="For Consumers"
          description="Shop unique, sustainable products made from recycled textile materials and support the circular economy movement."
          linkHref="/shop"
          linkText="Browse Products"
          icon={
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
      </section>

      {/* Impact Statistics */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            Our Growing Impact
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Together, we're building a more sustainable future for the textile industry
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <StatCard value="500+" label="Textile waste listings" color="teal" />
          <StatCard value="200+" label="Artisan products created" color="blue" />
          <StatCard value="10 tons" label="Textile waste diverted from landfill" color="cyan" />
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-12 text-center border border-teal-100">
        <h3 className="text-3xl font-bold text-gray-800 mb-4">
          Ready to Make a Difference?
        </h3>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join our community of environmentally conscious companies, creative artisans, and mindful consumers.
        </p>
        <Link 
          href="/api/auth/signin"
          className="inline-flex items-center bg-gradient-to-r from-teal-600 to-blue-600 text-white px-8 py-4 rounded-2xl hover:from-teal-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
        >
          Get Started Today
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>
    </div>
  );
}