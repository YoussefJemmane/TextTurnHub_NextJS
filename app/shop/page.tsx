"use client";
import { useState, useEffect, Suspense } from "react";
import {
  Search,
  Filter,
  ShoppingBag,
  Star,
  User,
  Package,
  AlertTriangle,
  ShoppingCart,
  Check,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useCart from "@/app/hooks/useCart";

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  unit: string | null;
  color: string | null;
  material: string;
  image: string | null;
  is_featured: boolean;
  artisanProfile: {
    user: {
      name: string;
    };
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const UnauthorizedWarning = () => (
  <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 rounded-2xl border border-red-200">
    <div className="flex items-center gap-3 mb-4">
      <AlertTriangle className="w-6 h-6 text-red-600" />
      <h2 className="text-xl font-semibold text-red-700">Access Denied</h2>
    </div>
    <p className="text-red-600 mb-4">
      Company accounts do not have access to the shop. This section is reserved
      for artisans and regular users.
    </p>
    <p className="text-gray-600">
      If you believe this is a mistake, please contact support or verify your
      account type.
    </p>
  </div>
);

function ShopContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    material: searchParams.get("material") || "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { incrementCartCount } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, searchTerm, filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (filters.category) {
        queryParams.append("category", filters.category);
      }
      if (filters.material) {
        queryParams.append("material", filters.material);
      }

      const response = await fetch(`/api/shop?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);

      if (!searchTerm && !filters.category && !filters.material) {
        setInitialProducts(data.products);
      }

      setPagination(data.pagination);
      setError("");
    } catch (err) {
      setError("Error fetching products. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (filters.category) params.append("category", filters.category);
    if (filters.material) params.append("material", filters.material);
    router.push(`/shop?${params.toString()}`);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (name === "category") {
      if (value) params.append("category", value);
      if (filters.material) params.append("material", filters.material);
    } else {
      if (filters.category) params.append("category", filters.category);
      if (value) params.append("material", value);
    }
    router.push(`/shop?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Apply client-side filters and search
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.material?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filters.category === "" ||
      product.category?.toLowerCase() === filters.category.toLowerCase();

    const matchesMaterial =
      filters.material === "" ||
      product.material?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch && matchesCategory && matchesMaterial;
  });

  const uniqueCategories = Array.from(
    new Set(
      initialProducts
        .filter((p) => p.category)
        .map((product) => product.category)
    )
  );
  const uniqueMaterials = Array.from(
    new Set(
      initialProducts
        .filter((p) => p.material)
        .map((product) => product.material)
    )
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ category: "", material: "" });
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
    >
      <div className="relative h-56 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {product.is_featured && (
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-sm font-medium">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        )}

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
          {product.stock} left
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            {product.category}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {product.material}
          </span>
          {product.color && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {product.color}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-emerald-600">
            ${Number(product.price).toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>
              {product.artisanProfile?.user?.name || "Unknown Artisan"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/products/${product.id}`}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 px-3 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl text-center text-sm"
          >
            View Details
          </Link>
          {status === "authenticated" ? (
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch("/api/cart", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      productId: product.id,
                      quantity: 1,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to add to cart");
                  }

                  incrementCartCount();
                  showSuccessToast("Product added to cart successfully!");
                } catch (error) {
                  console.error("Error adding to cart:", error);
                  setToastMessage("Failed to add product to cart");
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }
              }}
              className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-1.5 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-1.5 text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </Link>
          )}
        </div>
      </div>
    </Link>
  );

  // Check if user is a company
  const isCompanyUser = session?.user?.roles?.includes("company");

  if (isCompanyUser) {
    return <UnauthorizedWarning />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-fade-in-down">
          <Check className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Sustainable Marketplace
          </h1>
          <p className="text-gray-600">
            Discover eco-friendly products from talented artisans
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sustainable products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/70"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filters.material}
              onChange={(e) => handleFilterChange("material", e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/70"
            >
              <option value="">All Materials</option>
              {uniqueMaterials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading sustainable products...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
          <div className="text-lg font-semibold mb-2">
            Oops! Something went wrong
          </div>
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filters.category || filters.material
              ? "Try adjusting your search or filters"
              : "Be the first to add a sustainable product!"}
          </p>
          {session?.user?.roles?.includes("artisan") && (
            <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200">
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Showing{" "}
              <span className="font-semibold">{filteredProducts.length}</span>{" "}
              sustainable products
            </p>
            {(searchTerm || filters.category || filters.material) && (
              <button
                onClick={clearFilters}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    page === pagination.page
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

// Add keyframe animation for toast
const styles = `
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.3s ease-out;
}
`;

// Add the styles to the document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function SustainableShop() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
