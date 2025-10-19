"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Yuji_Boku } from "next/font/google";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/app/context/cartcontext";
import { motion } from "motion/react";
import ProductDetailsModal from "./product-details-modal";

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

// --- Types for database ---
type Product = {
  product_id: number;
  product_name: string;
  product_price: number;
  product_img: string | null;
  product_desc: string | null;
  product_category: string | null;
  product_subcategory: string | null;
  product_jp: string;
};

type SubCategory = {
  subc_id: string;
  subc_name: string;
  subc_jp: string | null;
};

export default function SearchProducts() {
  const supabase = createClient();
  const { addToCart } = useCart();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalCount, setTotalCount] = useState(0);

  // UI States
  const [recentlyAdded, setRecentlyAdded] = useState<Set<number>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Load categories + subcategories
  useEffect(() => {
    const fetchFilters = async () => {
      const { data: subs } = await supabase.from("sub_category").select("*");
      setSubcategories(subs ?? []);
    };
    fetchFilters();
  }, [supabase]);

  // Fetch products with filters + pagination
  useEffect(() => {
    const fetchProducts = async () => {
      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Keyword search
      if (keyword) {
        query = query.or(
          `product_name.ilike.%${keyword}%,product_jp.ilike.%${keyword}%,product_desc.ilike.%${keyword}%`
        );
      }

      // Category filter
      if (category !== "all") {
        query = query.eq("product_subcategory", category);
      }

      // Price filter
      if (minPrice) {
        query = query.gte("product_price", parseFloat(minPrice));
      }
      if (maxPrice) {
        query = query.lte("product_price", parseFloat(maxPrice));
      }

      // Sorting
      switch (sortBy) {
        case "price_asc":
          query = query.order("product_price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("product_price", { ascending: false });
          break;
        case "name_asc":
          query = query.order("product_name", { ascending: true });
          break;
        case "name_desc":
          query = query.order("product_name", { ascending: false });
          break;
        default:
          query = query.order("product_id", { ascending: true });
      }

      const { data, error, count } = await query;

      if (error) {
        console.error(error);
      } else {
        setProducts((data as Product[]) ?? []);
        setTotalCount(count ?? 0);
      }
    };

    fetchProducts();
  }, [page, pageSize, keyword, category, minPrice, maxPrice, sortBy, supabase]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleReset = () => {
    setKeyword("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("relevance");
    setPage(1);
  };

  return (
    <div className="w-full">
      <h1 className="text-4xl font-bold mb-8">Search Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="md:col-span-1 bg-base-100 shadow-sm rounded-lg p-6 h-fit space-y-6">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-semibold mb-2">Keyword</label>
            <input
              type="text"
              placeholder="Search..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="input input-bordered w-full"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="select select-bordered w-full"
            >
              <option value="all">All</option>
              {subcategories.map((sub) => (
                <option key={sub.subc_id} value={sub.subc_id}>
                  {sub.subc_name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold mb-2">Price</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="input input-bordered w-full"
                min="0"
              />
              <span className="text-sm">-</span>
              <input
                type="number"
                placeholder="10000"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="input input-bordered w-full"
                min="0"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="select select-bordered w-full"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>

          {/* Page Size */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Page size
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="select select-bordered w-full"
            >
              <option value="9">9</option>
              <option value="12">12</option>
              <option value="18">18</option>
              <option value="24">24</option>
            </select>
          </div>

          {/* Reset Button */}
          <button className="btn btn-outline w-full" onClick={handleReset}>
            Reset
          </button>
        </aside>

        {/* Products Grid */}
        <main className="md:col-span-3">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-base-content/60">
              {totalCount} result{totalCount !== 1 ? "s" : ""}
            </p>
            <p className="text-base-content/60">
              Showing {Math.min((page - 1) * pageSize + 1, totalCount)}-
              {Math.min(page * pageSize, totalCount)}
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full overflow-x-hidden">
            {products.map((product) => (
              <div
                key={product.product_id}
                className="card rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
              >
                <figure
                  className="relative w-full h-64 overflow-hidden cursor-pointer"
                  onClick={() => handleOpenDetails(product)}
                >
                  <Image
                    src={`/prod/${product.product_img}`}
                    alt={product.product_name}
                    fill
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </figure>

                <div className="card-body pt-4 px-4 flex flex-col flex-1">
                  <h2
                    className="card-title mb-2 text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleOpenDetails(product)}
                  >
                    {product.product_name}
                    <p className={`${yuji.className} pb-1 text-sm`}>
                      {product.product_jp}
                    </p>
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
                    {product.product_desc}
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <h1 className="text-2xl font-bold">
                      ₱ {product.product_price}
                    </h1>
                    <motion.button
                      className={`btn ${
                        recentlyAdded.has(product.product_id)
                          ? "btn-success"
                          : "btn-black"
                      } transition-colors`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({
                          product_id: product.product_id,
                          product_name: product.product_name,
                          product_price: product.product_price,
                          product_img: product.product_img,
                          product_jp: product.product_jp,
                        });

                        // Add to recently added set
                        setRecentlyAdded((prev) =>
                          new Set(prev).add(product.product_id)
                        );

                        // Remove after animation
                        setTimeout(() => {
                          setRecentlyAdded((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(product.product_id);
                            return newSet;
                          });
                        }, 1000);
                      }}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {recentlyAdded.has(product.product_id) ? (
                        <>
                          <Check className="w-5 h-5" />
                          Added!
                        </>
                      ) : (
                        <>
                          <ShoppingBag />
                          Add to Cart
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl text-base-content/60 mb-4">
                No products found
              </p>
              <p className="text-base-content/40 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <button className="btn btn-primary" onClick={handleReset}>
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 gap-2">
              <button
                className="btn btn-outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`btn ${
                      page === pageNum ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="btn btn-outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
