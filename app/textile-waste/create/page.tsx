"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Upload, AlertCircle, CheckCircle2, Package, MapPin, DollarSign, Palette, Ruler, Tag, FileText } from "lucide-react";

export default function CreateTextileWastePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    waste_type: "",
    material_type: "",
    quantity: "",
    unit: "kg",
    condition: "new",
    color: "",
    price_per_unit: "",
    location: "",
    images: []
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  const steps = [
    { id: 1, title: "Basic Info", icon: FileText, description: "Title and description" },
    { id: 2, title: "Material Details", icon: Palette, description: "Type and specifications" },
    { id: 3, title: "Quantity & Pricing", icon: Ruler, description: "Amount and cost" },
    { id: 4, title: "Location", icon: MapPin, description: "Where to collect" },
    { id: 5, title: "Review", icon: CheckCircle2, description: "Final review" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data directly without any conditional logic
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Debounce validation error clearing
    // Only clear errors on blur or when a significant time has passed since last keystroke
    if (validationErrors[name]) {
      setTimeout(() => {
        setValidationErrors((prev) => {
          // Make sure we're only clearing if the error still exists
          if (prev[name]) {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          }
          return prev;
        });
      }, 500); // Delay validation error clearing
    }
  };

  // Add a blur handler to clear validation errors
  const handleBlur = (e) => {
    const { name } = e.target;
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) errors.title = "Title is required";
        if (!formData.description.trim()) errors.description = "Description is required";
        break;
      case 2:
        if (!formData.waste_type.trim()) errors.waste_type = "Waste type is required";
        if (!formData.material_type.trim()) errors.material_type = "Material type is required";
        break;
      case 3:
        if (!formData.quantity.trim()) errors.quantity = "Quantity is required";
        if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
          errors.quantity = "Quantity must be a positive number";
        }
        if (!formData.price_per_unit.trim()) errors.price_per_unit = "Price per unit is required";
        if (isNaN(Number(formData.price_per_unit)) || Number(formData.price_per_unit) < 0) {
          errors.price_per_unit = "Price must be a non-negative number";
        }
        break;
      case 4:
        if (!formData.location.trim()) errors.location = "Location is required";
        break;
    }
    
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        waste_type: "",
        material_type: "",
        quantity: "",
        unit: "kg",
        condition: "new",
        color: "",
        price_per_unit: "",
        location: "",
        images: []
      });
      
      setCurrentStep(1);

    } catch (err) {
      setError("Failed to create textile waste listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, name, type = "text", required = false, placeholder, icon: Icon, children, ...props }) => (
    <div className="space-y-2">
      <label htmlFor={name} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children || (
        <input
          type={type}
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 ${
            validationErrors[name] 
              ? "border-red-300 bg-red-50" 
              : "border-gray-200 hover:border-gray-300 focus:bg-white"
          }`}
          placeholder={placeholder}
          {...props}
        />
      )}
      {validationErrors[name] && (
        <p className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {validationErrors[name]}
        </p>
      )}
    </div>
  );

  const StepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                Basic Information
              </h2>
              <p className="text-gray-600 mt-2">Let's start with the basics about your textile waste</p>
            </div>
            
            <InputField
              label="Listing Title"
              name="title"
              required
              placeholder="e.g., Premium Cotton Fabric Scraps"
              icon={Tag}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Package className="w-4 h-4 text-gray-500" />
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 resize-none ${
                  validationErrors.description 
                    ? "border-red-300 bg-red-50" 
                    : "border-gray-200 hover:border-gray-300 focus:bg-white"
                }`}
                placeholder="Provide a detailed description of your textile waste, including quality, origin, and any special characteristics..."
              />
              {validationErrors.description && (
                <p className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.description}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Palette className="w-6 h-6 text-emerald-600" />
                Material Details
              </h2>
              <p className="text-gray-600 mt-2">Tell us about the type and characteristics of your materials</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Waste Type"
                name="waste_type"
                required
                placeholder="e.g., Fabric Scraps, Off-cuts, Yarn waste"
              />
              
              <InputField
                label="Material Type"
                name="material_type"
                required
                placeholder="e.g., Cotton, Polyester, Wool, Silk"
              />
            </div>

            <InputField
              label="Color"
              name="color"
              placeholder="e.g., Red, Blue, Mixed colors, Natural"
              icon={Palette}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Ruler className="w-6 h-6 text-emerald-600" />
                Quantity & Pricing
              </h2>
              <p className="text-gray-600 mt-2">Specify the amount and pricing for your textile waste</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="Quantity"
                name="quantity"
                type="number"
                required
                placeholder="100"
                min="0"
                step="0.1"
              />
              
              <InputField label="Unit" name="unit">
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="m">Meters (m)</option>
                  <option value="m2">Square Meters (m²)</option>
                  <option value="pieces">Pieces</option>
                  <option value="yards">Yards</option>
                </select>
              </InputField>
              
              <InputField label="Condition" name="condition">
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-200"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </InputField>
            </div>

            <InputField
              label="Price per Unit ($)"
              name="price_per_unit"
              type="number"
              required
              placeholder="5.50"
              min="0"
              step="0.01"
              icon={DollarSign}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <MapPin className="w-6 h-6 text-emerald-600" />
                Location
              </h2>
              <p className="text-gray-600 mt-2">Where can buyers collect the textile waste?</p>
            </div>
            
            <InputField
              label="Location"
              name="location"
              required
              placeholder="City, State or Region"
              icon={MapPin}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                Review Your Listing
              </h2>
              <p className="text-gray-600 mt-2">Please review all information before submitting</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Title</h3>
                  <p className="text-gray-600">{formData.title || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Waste Type</h3>
                  <p className="text-gray-600">{formData.waste_type || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Material Type</h3>
                  <p className="text-gray-600">{formData.material_type || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Quantity</h3>
                  <p className="text-gray-600">{formData.quantity ? `${formData.quantity} ${formData.unit}` : "Not specified"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Condition</h3>
                  <p className="text-gray-600 capitalize">{formData.condition}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Price per Unit</h3>
                  <p className="text-gray-600">${formData.price_per_unit || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Color</h3>
                  <p className="text-gray-600">{formData.color || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Location</h3>
                  <p className="text-gray-600">{formData.location || "Not specified"}</p>
                </div>
              </div>
              <div className="col-span-2">
                <h3 className="font-semibold text-gray-700">Description</h3>
                <p className="text-gray-600">{formData.description || "Not specified"}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl border-2 border-emerald-200 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <a href="/textile-waste/list" className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Textile Waste Listings
          </a>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Textile Waste</h1>
          <p className="text-lg text-gray-600">Turn your textile waste into valuable resources for others</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                  currentStep === step.id 
                    ? "bg-emerald-600 border-emerald-600 text-white" 
                    : currentStep > step.id
                    ? "bg-emerald-100 border-emerald-600 text-emerald-600"
                    : "border-gray-300 text-gray-400"
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 ml-2 transition-all duration-200 ${
                    currentStep > step.id ? "bg-emerald-600" : "bg-gray-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}: {steps.find(s => s.id === currentStep)?.description}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-green-700 font-medium">
                Textile waste listing created successfully!
              </p>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-white/20">
          <StepContent />

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Create Listing
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}