"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShoppingBag, MessageCircle, Star, ArrowRight, Heart, Clock } from "lucide-react";

interface UserStats {
  favorites: number;
  recentViews: number;
  pendingOrders: number;
}

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number | string, color: string }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
    <div className="flex items-center mb-3">
      <div className={`p-2 ${color} rounded-lg mr-3`}>
        {icon}
      </div>
      <h3 className="text-gray-600 font-medium">{title}</h3>
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const ActivityItem = ({ icon, title, time, description, link }: { icon: React.ReactNode, title: string, time: string, description: string, link: string }) => (
  <div className="border-b border-gray-100 pb-4 mb-4 last:border-0">
    <div className="flex items-start">
      <div className="p-2 bg-gray-100 rounded-lg mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <span className="text-sm text-gray-500">{time}</span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{description}</p>
        <Link href={link} className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center">
          View details
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  </div>
);

export default function UserDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats>({
    favorites: 12,
    recentViews: 24,
    pendingOrders: 2
  });
  const [loading, setLoading] = useState(false);

  // In a real app, you would fetch user-specific stats here
  useEffect(() => {
    // Mock API call
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Heart className="w-5 h-5 text-white" />}
          title="Favorites"
          value={stats.favorites}
          color="bg-pink-500"
        />
        <StatCard 
          icon={<Clock className="w-5 h-5 text-white" />}
          title="Recently Viewed"
          value={stats.recentViews}
          color="bg-blue-500"
        />
        <StatCard 
          icon={<ShoppingBag className="w-5 h-5 text-white" />}
          title="Pending Orders"
          value={stats.pendingOrders}
          color="bg-teal-500"
        />
      </div>

      {/* Activity feed and recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              icon={<ShoppingBag className="w-5 h-5 text-teal-600" />}
              title="Purchase Completed"
              time="2 days ago"
              description="You purchased Recycled Cotton Tote Bag from EcoArtisans"
              link="/orders/123"
            />
            <ActivityItem
              icon={<MessageCircle className="w-5 h-5 text-blue-600" />}
              title="New Message"
              time="4 days ago"
              description="You received a message from GreenTextiles regarding your inquiry"
              link="/messaging"
            />
            <ActivityItem
              icon={<Heart className="w-5 h-5 text-pink-600" />}
              title="Item Saved"
              time="1 week ago"
              description="You saved Upcycled Denim Jacket to your favorites"
              link="/favorites"
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <h4 className="font-medium">Sustainable Products</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Discover our newest eco-friendly products made from recycled materials.</p>
              <Link href="/shop" className="text-sm text-teal-600 hover:text-teal-700 font-medium">Browse collection</Link>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <h4 className="font-medium">Complete Your Profile</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Add more details to your profile to get personalized recommendations.</p>
              <Link href="/profile" className="text-sm text-teal-600 hover:text-teal-700 font-medium">Update profile</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

