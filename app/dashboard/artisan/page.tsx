"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Package, ArrowRight } from "lucide-react";

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

interface DashboardStats {
  listings: number;
  transactions: number;
  products: number;
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

export default function ArtisanDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    listings: 0,
    transactions: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; retryFunction: () => void } | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
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
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
}

