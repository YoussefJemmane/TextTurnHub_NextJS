"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Package,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string | null;
    unit: string | null;
    artisanProfile: {
      user: {
        name: string;
      };
    };
  };
}

interface Order {
  id: string;
  createdAt: string;
  created_at: string;
  status: string;
  totalAmount: number | string;
  pickupAddress: string;
  contactNumber: string;
  notes: string | null;
  orderItems: OrderItem[];
}

export default function OrderPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrder();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, params.id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      const data = await response.json();
      setOrder({
        ...data,
        createdAt: data.createdAt || data.created_at,
        totalAmount:
          typeof data.totalAmount === "string"
            ? parseFloat(data.totalAmount)
            : data.totalAmount,
      });
    } catch (err) {
      setError("Error loading order details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? "0.00" : numAmount.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {error || "Order not found"}
        </h2>
        <button
          onClick={() => router.push("/orders")}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors mt-4"
        >
          View All Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <span className="font-medium text-emerald-600">
            Order #{order.id.slice(-8)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    By {item.product.artisanProfile.user.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity} × $
                    {formatPrice(item.product.price)}
                  </p>
                </div>

                <div className="font-medium text-gray-900">
                  ${formatPrice(Number(item.product.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Pickup Details */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-6">Pickup Details</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Address
              </label>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <p className="text-gray-900">{order.pickupAddress}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <p className="text-gray-900">{order.contactNumber}</p>
              </div>
            </div>

            {order.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <p className="text-gray-900">{order.notes}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                {order.status}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date
              </label>
              <p className="text-gray-900">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
