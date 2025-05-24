"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

function TextileWasteShowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/textile-waste/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json.textileWaste);
      })
      .catch((err) => {
        setError("Could not load textile waste.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequestExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError("");
    setRequestSuccess("");
    try {
      const res = await fetch("/api/waste-exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textile_waste_id: id,
          quantity,
          request_message: message,
          city,
          latitude,
          longitude,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRequestError(data.error || "Failed to request exchange");
      } else {
        setRequestSuccess("Exchange request sent successfully!");
        setShowRequest(false);
        setQuantity("");
        setMessage("");
        setCity("");
        setLatitude(null);
        setLongitude(null);
        setTimeout(() => {
          router.push("/marketplace");
        }, 1500);
      }
    } catch (err) {
      setRequestError("An unexpected error occurred.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.hamlet ||
            "";
          const country = data.address.country || "";
          const location =
            city && country ? `${city}, ${country}` : country || city;
          setCity(location);
        } catch (err) {
          alert("Could not determine your city.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        alert("Unable to retrieve your location.");
        setLocating(false);
      }
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !data)
    return (
      <div className="p-8 text-center text-red-600">
        {error || "Not found."}
      </div>
    );

  const images = Array.isArray(data.images) ? data.images : [];
  const sustainability = data.sustainability_metrics || {};

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-8">
      <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
      <div className="text-gray-500 mb-4">
        {data.companyProfile?.company_name} &bull; {data.location}
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
            <span className="font-semibold">Description:</span>{" "}
            {data.description || "-"}
          </div>
          <div>
            <span className="font-semibold">Waste Type:</span> {data.waste_type}
          </div>
          <div>
            <span className="font-semibold">Material Type:</span>{" "}
            {data.material_type}
          </div>
          <div>
            <span className="font-semibold">Condition:</span>{" "}
            {data.condition || "-"}
          </div>
          <div>
            <span className="font-semibold">Color:</span> {data.color || "-"}
          </div>
          <div>
            <span className="font-semibold">Composition:</span>{" "}
            {data.composition || "-"}
          </div>
          <div>
            <span className="font-semibold">Quantity:</span> {data.quantity}{" "}
            {data.unit}
          </div>
          <div>
            <span className="font-semibold">Min Order Qty:</span>{" "}
            {data.minimum_order_quantity || "-"}
          </div>
          <div>
            <span className="font-semibold">Price per Unit:</span> $
            {data.price_per_unit || "-"} / {data.unit}
          </div>
          <div>
            <span className="font-semibold">Availability:</span>{" "}
            {data.availability_status}
          </div>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Sustainability Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="font-semibold">Carbon Saved:</span>
            <br />
            {sustainability.carbon_footprint_saved || "-"} kg CO₂
          </div>
          <div>
            <span className="font-semibold">Water Saved:</span>
            <br />
            {sustainability.water_saved || "-"} L
          </div>
          <div>
            <span className="font-semibold">Energy Saved:</span>
            <br />
            {sustainability.energy_saved || "-"} kWh
          </div>
          <div>
            <span className="font-semibold">Recyclability:</span>
            <br />
            {sustainability.recyclability_score || "-"}/10
          </div>
        </div>
      </div>
      {/* Exchange Request Button and Modal */}
      <div className="mt-8">
        {requestSuccess && (
          <div className="mb-4 text-green-600">{requestSuccess}</div>
        )}
        {requestError && (
          <div className="mb-4 text-red-600">{requestError}</div>
        )}
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          onClick={() => setShowRequest(true)}
        >
          Request Exchange
        </button>
        {showRequest && (
          <form
            onSubmit={handleRequestExchange}
            className="mt-6 bg-gray-50 p-4 rounded-lg shadow flex flex-col gap-4"
          >
            <div>
              <label className="block font-medium mb-1">Quantity</label>
              <input
                type="number"
                min={data.minimum_order_quantity || 1}
                max={data.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              {data.minimum_order_quantity && (
                <p className="text-sm text-gray-500 mt-1">
                  Minimum order quantity: {data.minimum_order_quantity}{" "}
                  {data.unit}
                </p>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1">
                City (for Carbon Saver calculation)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your city"
                  required
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                  disabled={locating}
                >
                  {locating ? "Locating..." : "Use My Location"}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Add a message for the owner..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition"
                disabled={requestLoading}
              >
                {requestLoading ? "Requesting..." : "Send Request"}
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-400 transition"
                onClick={() => setShowRequest(false)}
                disabled={requestLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function TextileWasteShowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <TextileWasteShowContent />
    </Suspense>
  );
}
