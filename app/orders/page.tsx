"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, AlertCircle } from "lucide-react";

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
  items?: OrderItem[];
  orderItems?: OrderItem[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      const transformedOrders = data.map((order: Order) => ({
        ...order,
        createdAt: order.createdAt || order.created_at,
        items: order.items || order.orderItems || [],
        totalAmount:
          typeof order.totalAmount === "string"
            ? parseFloat(order.totalAmount)
            : order.totalAmount,
      }));
      setOrders(transformedOrders);
    } catch (err) {
      setError("Error loading orders");
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

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-600 mb-6">
          Start shopping to create your first order.
        </p>
        <Link
          href="/shop"
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors inline-block"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => {
          const orderItems = order.items || [];
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">
                      Order #{order.id.slice(-8)}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {orderItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white"
                      >
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {orderItems.length > 3 && (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          +{orderItems.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Amount</div>
                    <div className="font-medium text-gray-900">
                      ${formatPrice(order.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
