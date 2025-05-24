"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Layers,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

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

interface Analytics {
  overview: {
    totalProducts: number;
    totalSales: number;
    currentStock: number;
    wasteRequests: number;
  };
  timeline: Array<{
    date: string;
    products: number;
    sales: number;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    price: number;
    sales_count: number;
    stock: number;
    category: string;
    revenue: number;
  }>;
  materials: Array<{
    name: string;
    products: number;
    sales: number;
  }>;
  categories: Array<{
    name: string;
    products: number;
    sales: number;
  }>;
  wasteStats: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    byMaterial: Record<string, number>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DashboardCard = ({
  title,
  value,
  description,
  icon,
  trend,
}: DashboardCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-teal-100 rounded-lg">{icon}</div>
      {trend && (
        <div
          className={`flex items-center ${
            trend.isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{trend.value}%</span>
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function ArtisanDashboardPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    message: string;
    retryFunction: () => void;
  } | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/artisan/analytics?timeRange=${timeRange}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      setError({
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        retryFunction: fetchAnalytics,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

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

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-2 text-gray-600 hover:text-teal-600"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Products"
          value={analytics.overview.totalProducts}
          description="Products in your shop"
          icon={<ShoppingBag className="w-6 h-6 text-teal-600" />}
        />
        <DashboardCard
          title="Total Sales"
          value={analytics.overview.totalSales}
          description="Products sold"
          icon={<BarChart2 className="w-6 h-6 text-blue-600" />}
        />
        <DashboardCard
          title="Current Stock"
          value={analytics.overview.currentStock}
          description="Items in stock"
          icon={<Layers className="w-6 h-6 text-purple-600" />}
        />
        <DashboardCard
          title="Waste Requests"
          value={analytics.overview.wasteRequests}
          description="Material requests"
          icon={<Package className="w-6 h-6 text-orange-600" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Timeline */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Products Timeline</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  stroke="#0088FE"
                  name="Sales"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="products"
                  stroke="#00C49F"
                  name="Products"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categories}
                  dataKey="products"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales_count" name="Sales" fill="#0088FE" />
                <Bar dataKey="stock" name="Stock" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Requests Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Requests by Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: analytics.wasteStats.pending },
                    { name: 'Approved', value: analytics.wasteStats.approved },
                    { name: 'Completed', value: analytics.wasteStats.completed }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {[0, 1, 2].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-500 p-6 rounded-xl text-white">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/products/create"
            className="flex items-center justify-between bg-white/10 p-4 rounded-lg hover:bg-white/20 transition-all"
          >
            <div>
              <h4 className="font-medium">Add New Product</h4>
              <p className="text-sm text-white/80">Create a new sustainable product</p>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center justify-between bg-white/10 p-4 rounded-lg hover:bg-white/20 transition-all"
          >
            <div>
              <h4 className="font-medium">Browse Materials</h4>
              <p className="text-sm text-white/80">Find textile waste materials</p>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
