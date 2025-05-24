"use client";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Package,
  Check,
  X,
  Eye,
} from "lucide-react";
import React from "react";

// Types
interface TextileWaste {
  id: number;
  title: string;
}
interface ExchangeRequest {
  id: number;
  textileWaste: TextileWaste;
  requester_id: number;
  city?: string;
  quantity: string;
  request_message?: string;
  status: string;
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-lg relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function CompanyExchangesPage() {
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortField, setSortField] = useState<
    keyof ExchangeRequest | "created_at"
  >("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.append("status", status);
        const response = await fetch(
          `/api/waste-exchanges?type=received&${params}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }
        const data = await response.json();
        if (Array.isArray(data.wasteExchanges)) {
          setRequests(data.wasteExchanges);
        } else {
          setRequests([]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching requests"
        );
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [status]);

  const handleAction = async (id: number, action: string) => {
    const res = await fetch(`/api/waste-exchanges/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setRequests((reqs) =>
        reqs.map((r) =>
          r.id === id
            ? { ...r, status: action === "accept" ? "accepted" : "rejected" }
            : r
        )
      );
    }
  };

  const handleShowDetails = async (id: number) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalError("");
    setModalData(null);
    try {
      const res = await fetch(`/api/waste-exchanges/${id}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setModalData(data.wasteExchange);
    } catch (err) {
      setModalError("Could not load request details.");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredAndSorted = requests
    .filter(
      (r) =>
        r.textileWaste.title.toLowerCase().includes(search.toLowerCase()) ||
        r.request_message?.toLowerCase().includes(search.toLowerCase()) ||
        r.city?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: any = a[sortField as keyof ExchangeRequest];
      let bVal: any = b[sortField as keyof ExchangeRequest];
      if (sortField === "quantity") {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const handleSort = (field: keyof ExchangeRequest | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${
          statusStyles[status] || statusStyles["pending"]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: keyof ExchangeRequest | "created_at";
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        ) : (
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Textile Waste Exchange Requests
          </h1>
          <p className="text-lg text-gray-600">
            Manage all exchange requests for your textile waste
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by title, message, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
          <div className="flex gap-4 items-center">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <SortableHeader field="id">#</SortableHeader>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waste Title
                </th>
                <SortableHeader field="city">City</SortableHeader>
                <SortableHeader field="quantity">Quantity</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/60 divide-y divide-gray-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    No exchange requests found.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((req, idx) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.textileWaste.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.city}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.quantity}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.request_message}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Show Details"
                          onClick={() => handleShowDetails(req.id)}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {req.status === "pending" && (
                          <>
                            <button
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                              title="Accept"
                              onClick={() => handleAction(req.id, "accept")}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                              onClick={() => handleAction(req.id, "reject")}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for request details */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        {modalLoading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : modalError ? (
          <div className="p-4 text-center text-red-600">{modalError}</div>
        ) : modalData ? (
          <div>
            <h2 className="text-xl font-bold mb-2">Request Details</h2>
            <div className="mb-2">
              <b>Waste:</b> {modalData.textileWaste?.title}
            </div>
            <div className="mb-2">
              <b>City:</b> {modalData.city}
            </div>
            <div className="mb-2">
              <b>Quantity:</b> {modalData.quantity}
            </div>
            <div className="mb-2">
              <b>Message:</b> {modalData.request_message || "-"}
            </div>
            <div className="mb-2">
              <b>Status:</b> {modalData.status}
            </div>
            {modalData.carbon_details ? (
              <div className="mb-2">
                <b>Carbon Calculation Breakdown:</b>
                <ul className="text-sm mt-1 ml-2 list-disc list-inside">
                  <li>
                    <b>Weight:</b> {modalData.carbon_details.weight} kg
                  </li>
                  <li>
                    <b>From:</b> {modalData.carbon_details.fromCity}
                  </li>
                  <li>
                    <b>To:</b> {modalData.carbon_details.toCity}
                  </li>
                  <li>
                    <b>Distance:</b> {modalData.carbon_details.distanceKm} km
                  </li>
                  <li>
                    <b>Waste Type:</b> {modalData.carbon_details.wasteType}
                  </li>
                  <li>
                    <b>Waste Factor:</b> {modalData.carbon_details.wasteFactor}
                  </li>
                  <li>
                    <b>Mode:</b> {modalData.carbon_details.mode}
                  </li>
                  <li>
                    <b>Mode Factor:</b> {modalData.carbon_details.modeFactor}
                  </li>
                  <li>
                    <b>Formula:</b> {modalData.carbon_details.formula}
                  </li>
                  <li>
                    <b>Result:</b>{" "}
                    <span className="text-green-700 font-bold">
                      {modalData.carbon_details.result} kg CO₂
                    </span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="mb-2 text-yellow-700">
                No carbon calculation available for this request.
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
