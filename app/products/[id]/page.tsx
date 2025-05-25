"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Loader2, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import useCart from "@/app/hooks/useCart";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string | null;
  images?: string[]; // Array of additional images
  stock: number;
  unit: string | null;
  artisanProfile: {
    user: {
      name: string;
      email?: string;
    };
    artisan_specialty?: string;
  };
}

export default function ProductShowPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { incrementCartCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch product");
        }
        const data = await res.json();
        setProduct(data);
      } catch (err: any) {
        setError(err.message || "Error loading product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Get all available images (main image + additional images)
  const getAllImages = () => {
    if (!product) return [];
    const images = [];
    if (product.image) images.push(product.image);
    if (product.images) images.push(...product.images);
    return images;
  };

  const allImages = getAllImages();

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (allImages.length <= 1) return;
    
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => 
        prev === 0 ? allImages.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === allImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setAddToCartLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity: quantity,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to add to cart");
      }
      incrementCartCount();
      setSuccess(`${quantity} item(s) added to cart!`);
    } catch (err: any) {
      setError(err.message || "Error adding to cart");
    } finally {
      setAddToCartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center text-red-600">
        <p>{error}</p>
        <Link href="/shop" className="text-emerald-600 underline mt-4 block">
          Back to Shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p>Product not found.</p>
        <Link href="/shop" className="text-emerald-600 underline mt-4 block">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/shop" className="text-emerald-600 hover:underline">
          &larr; Back to Shop
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-8">
        {/* Image Section with Slideshow */}
        <div className="flex-shrink-0 w-full md:w-1/2 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-md">
            {allImages.length > 0 ? (
              <div className="relative">
                <Image
                  src={allImages[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  width={400}
                  height={400}
                  className="rounded-xl object-cover max-h-80 w-full cursor-pointer"
                  onClick={() => handleImageNavigation('next')}
                />
                
                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageNavigation('prev')}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleImageNavigation('next')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-80 h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            
            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-emerald-600' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="text-lg text-emerald-700 font-semibold mb-2">
            ${Number(product.price).toFixed(2)}
            {product.unit && (
              <span className="ml-1 text-gray-500">/ {product.unit}</span>
            )}
          </div>
          <div className="mb-2">
            <span className="font-medium">Stock:</span>{" "}
            {product.stock > 0 ? (
              <span className="text-emerald-700">{product.stock}</span>
            ) : (
              <span className="text-red-500">Out of stock</span>
            )}
          </div>
          <div className="mb-4">
            <span className="font-medium">Artisan:</span>{" "}
            <span className="text-gray-700">
              {product.artisanProfile.user.name}
            </span>
            {product.artisanProfile.artisan_specialty && (
              <span className="ml-2 text-sm text-gray-500">
                ({product.artisanProfile.artisan_specialty})
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-4">
              <span className="font-medium mb-2 block">Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Total: ${(Number(product.price) * quantity).toFixed(2)}
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded mb-2">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-2">
              {error}
            </div>
          )}
          
          <div className="flex gap-4 mt-2">
            <button
              onClick={handleAddToCart}
              disabled={addToCartLoading || product.stock < 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium shadow transition-all ${
                product.stock < 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {addToCartLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}