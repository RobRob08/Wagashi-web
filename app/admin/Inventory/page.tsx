"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

const supabase = createClient();

interface Product {
  product_id: number;
  product_name: string;
  product_price: number;
  product_img: string | null;
  product_desc: string | null;
  product_category: string | null; // cat_id
  product_subcategory: string | null; // subc_id
  product_jp: string | null;
  stock_level: number;
  quantity_sold: number;
}

interface Category {
  cat_id: string;
  cat_name: string;
  cat_jp: string | null;
}

interface SubCategory {
  subc_id: string;
  subc_name: string;
  subc_jp: string | null;
  cat_id: string | null;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 10;

  // --- Fetch category/subcategory lists ---
  useEffect(() => {
    const fetchFilters = async () => {
      const [{ data: catData }, { data: subData }] = await Promise.all([
        supabase.from("category").select("*").order("cat_name"),
        supabase.from("sub_category").select("*").order("subc_name"),
      ]);

      setCategories(catData || []);
      setSubcategories(subData || []);
    };

    fetchFilters();
  }, []);

  // --- Fetch products with filters ---
  const fetchProducts = async () => {
    setLoading(true);

    let query = supabase.from("products").select("*", { count: "exact" });

    if (search) query = query.ilike("product_name", `%${search}%`);
    if (category) query = query.eq("product_category", category);
    if (subcategory) query = query.eq("product_subcategory", subcategory);
    if (stockFilter === "low") query = query.lt("stock_level", 5);
    if (stockFilter === "high") query = query.gte("stock_level", 5);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .range(from, to)
      .order("product_id", { ascending: true });

    if (error) console.error("Error fetching products:", error);
    else {
      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, category, subcategory, stockFilter]);

  // --- Update stock level ---
  const updateStock = async (id: number, newStock: number) => {
    const { error } = await supabase
      .from("products")
      .update({ stock_level: newStock })
      .eq("product_id", id);

    if (error) {
      alert("Failed to update stock");
      console.error(error);
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === id ? { ...p, stock_level: newStock } : p
        )
      );
    }
  };

  if (loading) return <p className="p-10 text-center">Loading inventory...</p>;

  // --- Filter subcategories by selected category ---
  const filteredSubcategories = category
    ? subcategories.filter((sub) => sub.cat_id === category)
    : subcategories;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>

        <Link href="/admin" className="btn btn-outline">
          ← Back
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="input input-bordered"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        {/* Category Filter */}
        <select
          className="select select-bordered"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubcategory(""); // reset subcategory when category changes
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.cat_id} value={c.cat_id}>
              {c.cat_name}
            </option>
          ))}
        </select>

        {/* Subcategory Filter */}
        <select
          className="select select-bordered"
          value={subcategory}
          onChange={(e) => {
            setSubcategory(e.target.value);
            setPage(1);
          }}
          disabled={!category && filteredSubcategories.length === 0}
        >
          <option value="">All Subcategories</option>
          {filteredSubcategories.map((s) => (
            <option key={s.subc_id} value={s.subc_id}>
              {s.subc_name}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          className="select select-bordered"
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Stock</option>
          <option value="low">Low Stock (&lt;5)</option>
          <option value="high">High Stock (&ge;5)</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mx-auto w-full max-w-6xl">
        <table className="table-auto w-full mb-6 text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Image</th>
              <th className="px-2 py-1">Name</th>
              <th className="px-2 py-1">JP Name</th>
              <th className="px-2 py-1">Category</th>
              <th className="px-2 py-1">Stock Level</th>
              <th className="px-2 py-1">Stock Status</th>
              <th className="px-2 py-1">Sold</th>
              <th className="px-2 py-1">Update</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_id}>
                <td className="px-2 py-1 flex justify-center items-center">
                  {p.product_img ? (
                    <Image
                      src={`/prod/${p.product_img}`}
                      alt={p.product_name}
                      width={50}
                      height={50}
                      className="rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  )}
                </td>
                <td className="px-2 py-1">{p.product_name}</td>
                <td className="px-2 py-1 text-gray-500 text-sm">{p.product_jp}</td>
                <td className="px-2 py-1">
                  {
                    categories.find((c) => c.cat_id === p.product_category)
                      ?.cat_name
                  }
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    className="input input-sm w-20"
                    value={p.stock_level}
                    onChange={(e) =>
                      updateStock(p.product_id, Number(e.target.value))
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  {p.stock_level < 5 ? (
                    <span className="badge badge-error text-xs p-2">
                      Low Stock
                    </span>
                  ) : (
                    <span className="badge badge-success text-xs p-2">Good</span>
                  )}
                </td>
                <td className="px-2 py-1">{p.quantity_sold}</td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => updateStock(p.product_id, p.stock_level)}
                    className="btn btn-xs btn-primary"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
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
    </div>
  );
}
