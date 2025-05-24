"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Form state
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  
  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [wasteTypes, setWasteTypes] = useState([]);
  
  // Artisan fields
  const [artisanSpecialty, setArtisanSpecialty] = useState("");
  const [artisanExperience, setArtisanExperience] = useState("");
  const [materialsInterest, setMaterialsInterest] = useState([]);
  
  // User fields
  const [interests, setInterests] = useState([]);
  const [sustainabilityImportance, setSustainabilityImportance] = useState("");

  // Constants for form options
  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-1000", label: "201-1000 employees" },
    { value: "1000+", label: "1000+ employees" }
  ];

  const wasteTypeOptions = [
    "Plastic", "Metal", "Glass", "Paper", "Electronics", "Textile", "Organic", "Other"
  ];

  const artisanSpecialties = [
    "Furniture Making", "Jewelry", "Pottery", "Textiles", "Metalwork", "Glasswork", "Mixed Media", "Other"
  ];

  const experienceLevels = [
    { value: "beginner", label: "Beginner (0-2 years)" },
    { value: "intermediate", label: "Intermediate (2-5 years)" },
    { value: "advanced", label: "Advanced (5-10 years)" },
    { value: "expert", label: "Expert (10+ years)" }
  ];

  const materialOptions = [
    "Recycled Plastic", "Reclaimed Wood", "Scrap Metal", "Glass", "Fabric Scraps", "Paper", "Electronics", "Other"
  ];

  const userInterests = [
    "DIY Projects", "Eco-friendly Products", "Art & Crafts", "Home Decor", "Fashion", "Technology", "Gardening", "Other"
  ];

  const sustainabilityLevels = [
    { value: "very-important", label: "Very Important" },
    { value: "important", label: "Important" },
    { value: "somewhat-important", label: "Somewhat Important" },
    { value: "not-important", label: "Not Important" }
  ];

  // Handle checkbox changes
  const handleCheckboxChange = (e, currentValues, setValues) => {
    const value = e.target.value;
    if (e.target.checked) {
      setValues([...currentValues, value]);
    } else {
      setValues(currentValues.filter(v => v !== value));
    }
  };

  // Validation functions
  const validateStep1 = () => {
    console.log('Validating step 1...');
    const errors = {};
    if (!role) {
      errors.role = "Please select a role";
    }
    console.log('Step 1 validation results:', { role, errors });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    console.log('Validating step 2...');
    const errors = {};
    
    if (!name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }
    
    if (password !== passwordConfirmation) {
      errors.passwordConfirmation = "Passwords do not match";
    }
    
    console.log('Step 2 validation results:', {
      name: name.trim(),
      email,
      passwordLength: password?.length,
      passwordsMatch: password === passwordConfirmation,
      errors
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    console.log('Validating step 3...');
    const errors = {};
    
    console.log('Validating role-specific fields:', {
      role,
      company: { name: companyName, size: companySize },
      artisan: { specialty: artisanSpecialty, experience: artisanExperience },
      user: { sustainabilityImportance }
    });
    
    if (role === "company") {
      if (!companyName.trim()) {
        errors.companyName = "Company name is required";
      }
      if (!companySize) {
        errors.companySize = "Company size is required";
      }
    } else if (role === "artisan") {
      if (!artisanSpecialty) {
        errors.artisanSpecialty = "Specialty is required";
      }
      if (!artisanExperience) {
        errors.artisanExperience = "Experience level is required";
      }
    } else if (role === "user") {
      if (!sustainabilityImportance) {
        errors.sustainabilityImportance = "Please select how important sustainability is to you";
      }
    }
    
    console.log('Step 3 validation results:', { errors });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation functions
  const goToNextStep = () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
      setFieldErrors({});
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setFieldErrors({});
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Starting form submission with data:', {
      name,
      email,
      role,
      // Don't log password
      company_name: companyName,
      company_size: companySize,
      waste_types: wasteTypes,
      artisan_specialty: artisanSpecialty,
      artisan_experience: artisanExperience,
      materials_interest: materialsInterest,
      interests,
      sustainability_importance: sustainabilityImportance,
    });
    
    if (!validateStep3()) {
      console.log('Form validation failed:', fieldErrors);
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    const requestData = {
      name,
      email,
      password,
      role,
      company_name: companyName,
      company_size: companySize,
      waste_types: wasteTypes,
      artisan_specialty: artisanSpecialty,
      artisan_experience: artisanExperience,
      materials_interest: materialsInterest,
      interests,
      sustainability_importance: sustainabilityImportance,
    };

    console.log('Sending registration request...');
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        console.error('Registration failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        
        let errorMessage = data.message || "Registration failed. Please try again.";
        
        // Handle specific error cases
        if (response.status === 400) {
          errorMessage = data.message || "Please check your input and try again.";
        } else if (response.status === 500) {
          errorMessage = "A server error occurred. Please try again later.";
          console.error('Server error details:', data);
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }
      
      console.log('Registration successful, redirecting...');
      router.push("/auth/signin?registered=true");
    } catch (err) {
      console.error("Registration error:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      let errorMessage = "An unexpected error occurred. Please try again later.";
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = "Could not connect to the server. Please check your internet connection.";
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Your Role</h3>
              <p className="text-sm text-gray-600">Select the option that best describes you</p>
            </div>

            {fieldErrors.role && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">
                {fieldErrors.role}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  value: "company",
                  title: "Company",
                  description: "I represent a business with waste materials",
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )
                },
                {
                  value: "artisan",
                  title: "Artisan",
                  description: "I create products from recycled materials",
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10v.01M12 17v.01M8 21l4-7 4 7H8z" />
                    </svg>
                  )
                },
                {
                  value: "user",
                  title: "Consumer",
                  description: "I'm interested in sustainable products",
                  icon: (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )
                }
              ].map((roleOption) => (
                <div 
                  key={roleOption.value}
                  onClick={() => setRole(roleOption.value)} 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    role === roleOption.value 
                      ? "border-teal-600 bg-teal-50 shadow-md" 
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      role === roleOption.value ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                      {roleOption.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{roleOption.title}</h4>
                      <p className="text-sm text-gray-600">{roleOption.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      role === roleOption.value 
                        ? "bg-teal-600 border-teal-600" 
                        : "border-gray-300"
                    }`}>
                      {role === roleOption.value && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic Information</h3>
              <p className="text-sm text-gray-600">Please provide your basic details</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input 
                  id="name" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm ${
                    fieldErrors.name 
                      ? "ring-red-300 focus:ring-red-600" 
                      : "ring-gray-300 focus:ring-teal-600"
                  }`}
                  placeholder="Enter your full name"
                />
                {fieldErrors.name && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm ${
                    fieldErrors.email 
                      ? "ring-red-300 focus:ring-red-600" 
                      : "ring-gray-300 focus:ring-teal-600"
                  }`}
                  placeholder="Enter your email address"
                />
                {fieldErrors.email && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm ${
                    fieldErrors.password 
                      ? "ring-red-300 focus:ring-red-600" 
                      : "ring-gray-300 focus:ring-teal-600"
                  }`}
                  placeholder="Create a secure password"
                />
                {fieldErrors.password && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input 
                  id="passwordConfirmation" 
                  type="password" 
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm ${
                    fieldErrors.passwordConfirmation 
                      ? "ring-red-300 focus:ring-red-600" 
                      : "ring-gray-300 focus:ring-teal-600"
                  }`}
                  placeholder="Confirm your password"
                />
                {fieldErrors.passwordConfirmation && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.passwordConfirmation}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Additional Details</h3>
              <p className="text-sm text-gray-600">Help us personalize your experience</p>
            </div>

            {role === "company" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm ${
                      fieldErrors.companyName 
                        ? "ring-red-300 focus:ring-red-600" 
                        : "ring-gray-300 focus:ring-teal-600"
                    }`}
                    placeholder="Enter your company name"
                  />
                  {fieldErrors.companyName && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size *
                  </label>
                  <select 
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm ${
                      fieldErrors.companySize 
                        ? "ring-red-300 focus:ring-red-600" 
                        : "ring-gray-300 focus:ring-teal-600"
                    }`}
                  >
                    <option value="">Select company size</option>
                    {companySizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                  {fieldErrors.companySize && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.companySize}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Types of Waste Materials (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {wasteTypeOptions.map(type => (
                      <label key={type} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          value={type}
                          checked={wasteTypes.includes(type)}
                          onChange={(e) => handleCheckboxChange(e, wasteTypes, setWasteTypes)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-600"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {role === "artisan" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialty *
                  </label>
                  <select 
                    value={artisanSpecialty}
                    onChange={(e) => setArtisanSpecialty(e.target.value)}
                    className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm ${
                      fieldErrors.artisanSpecialty 
                        ? "ring-red-300 focus:ring-red-600" 
                        : "ring-gray-300 focus:ring-teal-600"
                    }`}
                  >
                    <option value="">Select your specialty</option>
                    {artisanSpecialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                  {fieldErrors.artisanSpecialty && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.artisanSpecialty}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level *
                  </label>
                  <select 
                    value={artisanExperience}
                    onChange={(e) => setArtisanExperience(e.target.value)}
                    className={`block w-full rounded-md border-0 py-2.5 px-3 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm ${
                      fieldErrors.artisanExperience 
                        ? "ring-red-300 focus:ring-red-600" 
                        : "ring-gray-300 focus:ring-teal-600"
                    }`}
                  >
                    <option value="">Select experience level</option>
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  {fieldErrors.artisanExperience && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.artisanExperience}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materials of Interest (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {materialOptions.map(material => (
                      <label key={material} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          value={material}
                          checked={materialsInterest.includes(material)}
                          onChange={(e) => handleCheckboxChange(e, materialsInterest, setMaterialsInterest)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-600"
                        />
                        <span className="text-sm text-gray-700">{material}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {role === "user" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How important is sustainability to you? *
                  </label>
                  <div className="space-y-2">
                    {sustainabilityLevels.map(level => (
                      <label key={level.value} className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          value={level.value}
                          checked={sustainabilityImportance === level.value}
                          onChange={(e) => setSustainabilityImportance(e.target.value)}
                          className="text-teal-600 focus:ring-teal-600"
                        />
                        <span className="text-sm text-gray-700">{level.label}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.sustainabilityImportance && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.sustainabilityImportance}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {userInterests.map(interest => (
                      <label key={interest} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          value={interest}
                          checked={interests.includes(interest)}
                          onChange={(e) => handleCheckboxChange(e, interests, setInterests)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-600"
                        />
                        <span className="text-sm text-gray-700">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our sustainable marketplace community
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${
                    currentStep >= step 
                      ? "bg-teal-600 text-white" 
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {step}
                  </div>
                  {index < 2 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? "bg-teal-600" : "bg-gray-200"
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Role</span>
              <span>Info</span>
              <span>Details</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={goToPreviousStep}
                  className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-md font-medium hover:bg-gray-300 transition duration-200"
                >
                  Previous
                </button>
              )}
              
              <div className="ml-auto">
                {currentStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={goToNextStep}
                    className="bg-teal-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-teal-700 transition duration-200"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-teal-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-teal-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-teal-600 hover:text-teal-500 transition duration-200">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}