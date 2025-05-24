"use client";
import React, { useState } from "react";
import { Upload, Plus, X, Save, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

type ImageType = {
  id: number;
  url: string | ArrayBuffer | null;
  name: string;
};

type SustainabilityMetrics = {
  carbon_footprint_saved: string;
  water_saved: string;
  energy_saved: string;
  recyclability_score: string;
};

type FormDataType = {
  title: string;
  description: string;
  waste_type: string;
  material_type: string;
  quantity: string;
  unit: string;
  condition: string;
  color: string;
  composition: string;
  minimum_order_quantity: string;
  price_per_unit: string;
  location: string;
  availability_status: string;
  images: ImageType[];
  sustainability_metrics: SustainabilityMetrics;
};

export default function WasteMaterialForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    waste_type: "",
    material_type: "",
    quantity: "",
    unit: "kg",
    condition: "",
    color: "",
    composition: "",
    minimum_order_quantity: "",
    price_per_unit: "",
    location: "",
    availability_status: "available",
    images: [],
    sustainability_metrics: {
      carbon_footprint_saved: "",
      water_saved: "",
      energy_saved: "",
      recyclability_score: "",
    },
  });

  const [imagePreview, setImagePreview] = useState<ImageType[]>([]);

  // Add step state
  const [step, setStep] = useState(0);
  const steps = [
    "Basic Information",
    "Material Details",
    "Pricing & Availability",
    "Sustainability Metrics",
    "Images",
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locating, setLocating] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSustainabilityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      sustainability_metrics: {
        ...prev.sustainability_metrics,
        [name]: value,
      },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: ImageType = {
          id: Date.now() + Math.random(),
          url: event.target?.result || "",
          name: file.name,
        };
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, newImage],
        }));
        setImagePreview((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));
    setImagePreview((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Prepare data for API
      const payload = {
        ...formData,
        images: formData.images,
        sustainability_metrics: formData.sustainability_metrics,
      };
      const res = await fetch("/api/textile-waste/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create listing");
      } else {
        setSuccess("Listing created successfully!");
        // Wait for a short moment to show the success message
        setTimeout(() => {
          router.push("/textile-waste/list");
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
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
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          // Try to get city and country
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.hamlet ||
            "";
          const country = data.address.country || "";
          const location =
            city && country ? `${city}, ${country}` : country || city;
          setFormData((prev) => ({
            ...prev,
            location,
          }));
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

  // Navigation handlers
  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const wasteTypes = [
    "Plastic",
    "Metal",
    "Paper",
    "Glass",
    "Textile",
    "Electronic",
    "Organic",
    "Chemical",
    "Construction",
    "Other",
  ];

  const materialTypes = [
    "PET",
    "HDPE",
    "PVC",
    "LDPE",
    "PP",
    "PS",
    "Other Plastic",
    "Aluminum",
    "Steel",
    "Copper",
    "Brass",
    "Iron",
    "Cardboard",
    "Office Paper",
    "Newspaper",
    "Magazine",
    "Clear Glass",
    "Colored Glass",
    "Tempered Glass",
    "Cotton",
    "Polyester",
    "Wool",
    "Silk",
    "Mixed Fabric",
  ];

  const conditions = ["New", "Like New", "Good", "Fair", "Poor", "Damaged"];
  const units = ["kg", "tons", "pieces", "liters", "cubic meters"];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step Indicator */}
          <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-green-100 to-blue-100">
            {steps.map((label, idx) => (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${
                    step === idx ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    step === idx
                      ? "text-green-700 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-8 space-y-8">
            {/* Show loading, error, or success messages */}
            {loading && <div className="text-blue-600">Submitting...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}

            {/* Step 1: Basic Information */}
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter material title"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Describe your material in detail"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Waste Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="waste_type"
                      value={formData.waste_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      required
                    >
                      <option value="">Select waste type</option>
                      {wasteTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Type
                    </label>
                    <select
                      name="material_type"
                      value={formData.material_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="">Select material type</option>
                      {materialTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Material Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                  Material Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="">Select condition</option>
                      {conditions.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="e.g., Blue, Mixed, Transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Composition
                    </label>
                    <input
                      type="text"
                      name="composition"
                      value={formData.composition}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Material composition details"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pricing & Availability */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                  Pricing & Availability
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Quantity
                    </label>
                    <input
                      type="number"
                      name="minimum_order_quantity"
                      value={formData.minimum_order_quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Unit ($)
                    </label>
                    <input
                      type="number"
                      name="price_per_unit"
                      value={formData.price_per_unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability Status
                    </label>
                    <select
                      name="availability_status"
                      value={formData.availability_status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="available">Available</option>
                      <option value="limited">Limited</option>
                      <option value="sold_out">Sold Out</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="City, Country"
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
                </div>
              </div>
            )}

            {/* Step 4: Sustainability Metrics */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                  Sustainability Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carbon Footprint Saved (kg CO₂)
                    </label>
                    <input
                      type="number"
                      name="carbon_footprint_saved"
                      value={
                        formData.sustainability_metrics.carbon_footprint_saved
                      }
                      onChange={handleSustainabilityChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Water Saved (liters)
                    </label>
                    <input
                      type="number"
                      name="water_saved"
                      value={formData.sustainability_metrics.water_saved}
                      onChange={handleSustainabilityChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Energy Saved (kWh)
                    </label>
                    <input
                      type="number"
                      name="energy_saved"
                      value={formData.sustainability_metrics.energy_saved}
                      onChange={handleSustainabilityChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recyclability Score (1-10)
                    </label>
                    <input
                      type="number"
                      name="recyclability_score"
                      value={
                        formData.sustainability_metrics.recyclability_score
                      }
                      onChange={handleSustainabilityChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="0"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Images */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                  Images
                </h2>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <span className="text-green-600 font-medium hover:text-green-500">
                          Upload images
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-gray-500 text-sm mt-1">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                    </div>
                  </div>
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreview.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url as string}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              {step > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  Back
                </button>
              )}
              {step < steps.length - 1 && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-8 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  Next
                </button>
              )}
              {step === steps.length - 1 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-8 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                  disabled={loading}
                >
                  <Save className="h-5 w-5" />
                  {loading ? "Creating..." : "Create Listing"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
