"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface TextileWaste {
  id: number;
  title: string;
  description: string;
  waste_type: string;
  material_type: string;
  quantity: number;
  unit: string;
  condition: string;
  color: string;
  price_per_unit: number;
  location: string;
  availability_status: string;
  images: string[];
  companyProfile: {
    company_name: string;
    location: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [textileWastes, setTextileWastes] = useState<TextileWaste[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    material: "",
    location: "",
  });

  useEffect(() => {
    fetchTextileWastes();
  }, [pagination.page]);

  const fetchTextileWastes = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: "available",
      });

      const response = await fetch(`/api/textile-waste?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch textile wastes");
      }

      const data = await response.json();
      setTextileWastes(data.textileWastes);
      setPagination(data.pagination);
    } catch (err) {
      setError("Error fetching textile wastes. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const filteredWastes = textileWastes.filter((waste) => {
    const matchesSearch =
      searchTerm === "" ||
      waste.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waste.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waste.material_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMaterial =
      filters.material === "" ||
      waste.material_type.toLowerCase() === filters.material.toLowerCase();

    const matchesLocation =
      filters.location === "" ||
      waste.location.toLowerCase().includes(filters.location.toLowerCase());

    return matchesSearch && matchesMaterial && matchesLocation;
  });

  // Extract unique materials and locations for filters
  const uniqueMaterials = Array.from(
    new Set(textileWastes.map((waste) => waste.material_type))
  );
  const uniqueLocations = Array.from(
    new Set(textileWastes.map((waste) => waste.location))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Textile Waste Marketplace</h1>
        {session?.user?.roles?.includes("company") && (
          <Link
            href="/textile-waste/list"
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
          >
            List Textile Waste
          </Link>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search textile waste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex-1">
            <select
              value={filters.material}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, material: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All Materials</option>
              {uniqueMaterials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={filters.location}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading textile wastes...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      ) : filteredWastes.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-md text-center">
          <p className="text-gray-600">No textile waste listings found.</p>
          {session?.user?.roles?.includes("company") && (
            <p className="mt-4">
              <Link
                href="/textile-waste/create"
                className="text-teal-600 hover:underline"
              >
                List your textile waste
              </Link>
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWastes.map((waste) => (
              <div
                key={waste.id}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition"
              >
                 <div className="h-48 relative">
                   {(() => {
                     try {
                       const images = waste.images ? JSON.parse(waste.images) : [];
                       const imageUrl = images && images.length > 0 
                         ? (images[0].startsWith('/') || images[0].startsWith('http') 
                           ? images[0] 
                           : `/${images[0]}`)
                         : '/images/placeholder.jpg';
                       
                       return (
                         <Image
                           src={imageUrl}
                           alt={waste.title}
                           fill
                           style={{ objectFit: 'cover' }}
                           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                         />
                       );
                     } catch (error) {
                       console.error('Error parsing image data:', error);
                       return (
                         <div className="bg-gray-200 h-full flex items-center justify-center">
                           <span className="text-gray-400">No image</span>
                         </div>
                       );
                     }
                   })()}
                 </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold">{waste.title}</h2>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {waste.availability_status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {waste.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {waste.waste_type}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                      {waste.material_type}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      {waste.condition}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm text-gray-500">Quantity:</span>
                      <span className="ml-1 font-medium">
                        {waste.quantity} {waste.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="ml-1 font-medium">
                        ${waste.price_per_unit}/{waste.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    <div>
                      <span className="font-medium text-gray-700">
                        {waste.companyProfile.company_name}
                      </span>
                    </div>
                    <div>{waste.location}</div>
                  </div>
                  <Link
                    href={`/textile-waste/${waste.id}`}
                    className="block w-full text-center bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded-md border enabled:hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md ${
                      page === pagination.page
                        ? "bg-teal-600 text-white"
                        : "border hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 rounded-md border enabled:hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}