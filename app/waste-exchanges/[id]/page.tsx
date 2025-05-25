"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

function WasteExchangeShowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [price, setPrice] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/waste-exchanges/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json.wasteExchange);
      })
      .catch((err) => {
        setError("Could not load waste exchange.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await fetch(`/api/waste-exchanges/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          response_message: responseMessage,
          price: price ? parseFloat(price) : undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setActionError(result.error || `Failed to ${action} exchange`);
      } else {
        setActionSuccess(result.message);
        setShowActions(false);
        setResponseMessage("");
        setPrice("");
        // Refresh the data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setActionError("An unexpected error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !data)
    return (
      <div className="p-8 text-center text-red-600">
        {error || "Not found."}
      </div>
    );

  const textileWaste = data.textileWaste;
  const images = Array.isArray(textileWaste?.images) ? textileWaste.images : [];
  const carbonDetails = data.carbon_details;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "accepted": return "text-blue-600 bg-blue-100";
      case "completed": return "text-green-600 bg-green-100";
      case "rejected": return "text-red-600 bg-red-100";
      case "cancelled": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const canPerformAction = (action: string) => {
    // This would need to be determined based on user session and permissions
    // For now, we'll show actions based on status
    if (action === "accept" || action === "reject") {
      return data.status === "pending";
    }
    if (action === "complete") {
      return data.status === "accepted";
    }
    if (action === "cancel") {
      return data.status === "pending" || data.status === "accepted";
    }
    return false;
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-8">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-3xl font-bold">Waste Exchange Details</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.status)}`}>
          {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </span>
      </div>
      
      <div className="text-gray-500 mb-6">
        Exchange ID: #{data.id} &bull; Created: {new Date(data.created_at).toLocaleDateString()}
      </div>

      {/* Textile Waste Information */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Textile Waste Information</h2>
        <div className="text-gray-600 mb-4">
          {textileWaste?.companyProfile?.company_name} &bull; {textileWaste?.location}
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {images.map((img: any) => (
                  <div
                    key={img.id}
                    className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={img.url}
                      alt={img.name || "Image"}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-200 flex items-center justify-center rounded-lg">
                No images
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <span className="font-semibold">Title:</span> {textileWaste?.title || "-"}
            </div>
            <div>
              <span className="font-semibold">Description:</span> {textileWaste?.description || "-"}
            </div>
            <div>
              <span className="font-semibold">Waste Type:</span> {textileWaste?.waste_type}
            </div>
            <div>
              <span className="font-semibold">Material Type:</span> {textileWaste?.material_type}
            </div>
            <div>
              <span className="font-semibold">Condition:</span> {textileWaste?.condition || "-"}
            </div>
            <div>
              <span className="font-semibold">Color:</span> {textileWaste?.color || "-"}
            </div>
            <div>
              <span className="font-semibold">Available Quantity:</span> {textileWaste?.quantity} {textileWaste?.unit}
            </div>
            <div>
              <span className="font-semibold">Price per Unit:</span> ${textileWaste?.price_per_unit || "-"} / {textileWaste?.unit}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Details */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Exchange Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-semibold">Requested Quantity:</span> {data.quantity} {textileWaste?.unit}
          </div>
          <div>
            <span className="font-semibold">Agreed Price:</span> ${data.price || "Not set"}
          </div>
          <div>
            <span className="font-semibold">Request Date:</span> {new Date(data.created_at).toLocaleDateString()}
          </div>
          {data.exchange_date && (
            <div>
              <span className="font-semibold">Exchange Date:</span> {new Date(data.exchange_date).toLocaleDateString()}
            </div>
          )}
        </div>
        
        {data.request_message && (
          <div className="mt-4">
            <span className="font-semibold">Request Message:</span>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
              {data.request_message}
            </div>
          </div>
        )}
        
        {data.response_message && (
          <div className="mt-4">
            <span className="font-semibold">Response Message:</span>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
              {data.response_message}
            </div>
          </div>
        )}
      </div>

      {/* Carbon Savings */}
      {data.carbon_savings && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Environmental Impact</h2>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700 mb-2">
              {data.carbon_savings.toFixed(2)} kg CO₂ Saved
            </div>
            {carbonDetails && (
              <div className="text-sm text-gray-600 space-y-1">
                <div>Transport: {carbonDetails.fromCity} → {carbonDetails.toCity}</div>
                <div>Distance: {carbonDetails.distanceKm.toFixed(1)} km</div>
                <div>Weight: {carbonDetails.weight} kg</div>
                <div>Transport Mode: {carbonDetails.mode}</div>
                <div>Waste Type: {carbonDetails.wasteType}</div>
                <div className="mt-2 text-xs text-gray-500">
                  Calculation: {carbonDetails.formula}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8">
        {actionSuccess && (
          <div className="mb-4 text-green-600">{actionSuccess}</div>
        )}
        {actionError && (
          <div className="mb-4 text-red-600">{actionError}</div>
        )}
        
        <div className="flex gap-2 mb-4">
          {canPerformAction("accept") && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              onClick={() => setShowActions("accept")}
            >
              Accept Exchange
            </button>
          )}
          {canPerformAction("reject") && (
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              onClick={() => setShowActions("reject")}
            >
              Reject Exchange
            </button>
          )}
          {canPerformAction("complete") && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              onClick={() => setShowActions("complete")}
            >
              Mark as Complete
            </button>
          )}
          {canPerformAction("cancel") && (
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              onClick={() => setShowActions("cancel")}
            >
              Cancel Exchange
            </button>
          )}
        </div>

        {showActions && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">
              {showActions.charAt(0).toUpperCase() + showActions.slice(1)} Exchange
            </h3>
            
            {(showActions === "accept" || showActions === "reject") && (
              <div className="mb-4">
                <label className="block font-medium mb-1">Price (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter agreed price"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block font-medium mb-1">
                Message {showActions === "reject" ? "(required)" : "(optional)"}
              </label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder={`Add a message about ${showActions}ing this exchange...`}
                required={showActions === "reject"}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(showActions)}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  showActions === "accept" 
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : showActions === "reject"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : showActions === "complete"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
                disabled={actionLoading || (showActions === "reject" && !responseMessage.trim())}
              >
                {actionLoading ? "Processing..." : `Confirm ${showActions.charAt(0).toUpperCase() + showActions.slice(1)}`}
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-400 transition"
                onClick={() => {
                  setShowActions(false);
                  setResponseMessage("");
                  setPrice("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WasteExchangeShowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <WasteExchangeShowContent />
    </Suspense>
  );
}