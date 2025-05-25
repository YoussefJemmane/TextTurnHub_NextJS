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
  orderItems: OrderItem[];
}

export default function ArtisanOrdersPage() {
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
      const response = await fetch("/api/artisan/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      // Transform the data to match our interface
      const transformedOrders = data.map((order: Order) => ({
        ...order,
        createdAt: order.createdAt || order.created_at,
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
          You haven't received any orders for your products yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Orders for Your Products
      </h1>

      <div className="space-y-6">
        {orders.map((order) => {
          const orderItems = order.orderItems || [];
          // Only show items that belong to this artisan
          const artisanItems = orderItems.filter((item) => item.product.id);

          return (
            <div key={order.id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Pickup Address</div>
                    <div className="font-medium text-gray-900 text-sm">
                      {order.pickupAddress}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  Your Products in This Order
                </h4>
                <div className="space-y-4">
                  {artisanItems.map((item) => (
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
                          Quantity: {item.quantity} × $
                          {formatPrice(item.product.price)}
                        </p>
                      </div>

                      <div className="font-medium text-gray-900">
                        $
                        {formatPrice(
                          Number(item.product.price) * item.quantity
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Contact: {order.contactNumber}
                  </div>
                  <div className="font-medium text-gray-900">
                    Subtotal: $
                    {formatPrice(
                      artisanItems.reduce(
                        (total, item) =>
                          total + Number(item.product.price) * item.quantity,
                        0
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
