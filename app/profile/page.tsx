"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // General user profile
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  
  // Company profile
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [website, setWebsite] = useState("");
  
  // Artisan profile
  const [artisanSpecialty, setArtisanSpecialty] = useState("");
  const [artisanExperience, setArtisanExperience] = useState("");
  const [materialsInterest, setMaterialsInterest] = useState("");
  
  const isCompany = session?.user?.roles?.includes("company");
  const isArtisan = session?.user?.roles?.includes("artisan");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profiles/user");
        if (res.ok) {
          const data = await res.json();
          setBio(data.profile.bio || "");
          setLocation(data.profile.location || "");
          setInterests(data.profile.interests || "");
        }
        
        // Fetch company profile if user has company role
        if (isCompany) {
          const companyRes = await fetch("/api/profiles/company");
          if (companyRes.ok) {
            const data = await companyRes.json();
            setCompanyName(data.profile.company_name || "");
            setIndustry(data.profile.industry || "");
            setCompanyDescription(data.profile.description || "");
            setLocation(data.profile.location || location);
            setWebsite(data.profile.website || "");
          }
        }
        
        // Fetch artisan profile if user has artisan role
        if (isArtisan) {
          const artisanRes = await fetch("/api/profiles/artisan");
          if (artisanRes.ok) {
            const data = await artisanRes.json();
            setArtisanSpecialty(data.profile.artisan_specialty || "");
            setArtisanExperience(data.profile.artisan_experience || "");
            setMaterialsInterest(data.profile.materials_interest || "");
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setMessage({ type: "error", text: "Failed to load profile" });
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [session, status, router, isCompany, isArtisan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Update user profile
      const userRes = await fetch("/api/profiles/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio,
          location,
          interests,
        }),
      });
      
      if (!userRes.ok) {
        throw new Error("Failed to update user profile");
      }
      
      // Update company profile if user has company role
      if (isCompany) {
        const companyRes = await fetch("/api/profiles/company", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: companyName,
            industry,
            description: companyDescription,
            location,
            website,
          }),
        });
        
        if (!companyRes.ok) {
          throw new Error("Failed to update company profile");
        }
      }
      
      // Update artisan profile if user has artisan role
      if (isArtisan) {
        const artisanRes = await fetch("/api/profiles/artisan", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artisan_specialty: artisanSpecialty,
            artisan_experience: artisanExperience,
            materials_interest: materialsInterest,
          }),
        });
        
        if (!artisanRes.ok) {
          throw new Error("Failed to update artisan profile");
        }
      }
      
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic user information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={session?.user?.name || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Name cannot be changed
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Email cannot be changed
            </p>
          </div>
          
          <div className="mb-4">
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          
          <div>
            <label
              htmlFor="interests"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Interests
            </label>
            <textarea
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Sustainable fashion, recycling, etc."
            ></textarea>
          </div>
        </div>
        
        {/* Company information */}
        {isCompany && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            
            <div className="mb-4">
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company Name *
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            
            <div className="mb-4">
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Industry
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="Textile Manufacturing, Fashion, etc."
              />
            </div>
            
            <div className="mb-4">
              <label
                htmlFor="companyDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company Description
              </label>
              <textarea
                id="companyDescription"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              ></textarea>
            </div>
            
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Website
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="https://example.com"
              />
            </div>
          </div>
        )}
        
        {/* Artisan information */}
        {isArtisan && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Artisan Information</h2>
            
            <div className="mb-4">
              <label
                htmlFor="artisanSpecialty"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Specialty
              </label>
              <input
                id="artisanSpecialty"
                type="text"
                value={artisanSpecialty}
                onChange={(e) => setArtisanSpecialty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="Upcycled Fashion, Textile Art, etc."
              />
            </div>
            
            <div className="mb-4">
              <label
                htmlFor="artisanExperience"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Years of Experience
              </label>
              <input
                id="artisanExperience"
                type="text"
                value={artisanExperience}
                onChange={(e) => setArtisanExperience(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="5 years, 10+ years, etc."
              />
            </div>
            
            <div>
              <label
                htmlFor="materialsInterest"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Materials of Interest
              </label>
              <textarea
                id="materialsInterest"
                value={materialsInterest}
                onChange={(e) => setMaterialsInterest(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="Cotton, Denim, Silk, etc."
              ></textarea>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}