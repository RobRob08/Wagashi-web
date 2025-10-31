"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function ProductManagementPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error, count } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.error(error);
      } else {
        setProducts((data as Product[]) ?? []);
        setTotalCount(count ?? 0);
      }
    };

    fetchProducts();
  }, [page, supabase]);

  // Pagination logic
  const totalPages = Math.ceil(totalCount / pageSize);

  // Open product details modal for editing
  const handleOpenDetails = (product: Product | null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Add or update product
  const saveProduct = async (product: Product) => {
    if (product.product_id === 0) {
      // Add new product
      const { error } = await supabase.from("products").insert([product]);
      if (error) {
        alert(`Error adding product: ${error.message}`);
      } else {
        setPage(1); // Reset to first page
        handleCloseModal();
      }
    } else {
      // Update existing product
      const { error } = await supabase
        .from("products")
        .update(product)
        .eq("product_id", product.product_id);

      if (error) {
        alert(`Error updating product: ${error.message}`);
      } else {
        setPage(1); // Reset to first page
        handleCloseModal();
      }
    }
  };

  // Delete product
  const deleteProduct = async (product_id: number) => {
    const { error } = await supabase.from("products").delete().eq("product_id", product_id);
    if (error) {
      alert(`Error deleting product: ${error.message}`);
    } else {
      setPage(1); // Reset to first page
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Product Management</h1>

      {/* Add Product Button */}
      <div className="mb-4">
        <button
          className="btn btn-primary"
          onClick={() => handleOpenDetails(null)} // Open modal to add new product
        >
          Add Product
        </button>
      </div>

      {/* Products Table - Centered */}
      <div className="overflow-x-auto mx-auto w-full max-w-6xl"> {/* Centering the table */}
        <table className="table-auto w-full mb-6 text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Image</th> {/* Image column first */}
              <th className="px-2 py-1">Product Name</th>
              <th className="px-2 py-1">Price</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.product_id}>
                {/* Image column is now the first column */}
                <td className="px-2 py-1 flex justify-center items-center">
                  {product.product_img ? (
                    <img
                      src={`/prod/${product.product_img}`}
                      alt={product.product_name}
                      className="w-16 h-16 object-cover"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-2 py-1">{product.product_name}</td>
                <td className="px-2 py-1">{product.product_price ? `₱ ${product.product_price}` : "N/A"}</td>
                <td className="px-2 py-1">
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleOpenDetails(product)} // Open modal to edit product
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-error btn-sm ml-2"
                    onClick={() => deleteProduct(product.product_id)} // Delete product
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
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
                className={`btn ${page === pageNum ? "btn-primary" : "btn-outline"}`}
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

      {/* Product Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-1/2">
            <h2 className="text-2xl font-bold mb-4">
              {selectedProduct ? "Edit Product" : "Add Product"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProduct(selectedProduct as Product);
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  value={selectedProduct?.product_name || ""}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct!, product_name: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Price</label>
                <input
                  type="number"
                  value={selectedProduct?.product_price || ""}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct!, product_price: Number(e.target.value) })
                  }
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="text"
                  value={selectedProduct?.product_img || ""}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct!, product_img: e.target.value })
                  }
                  className="input input-bordered w-full"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={selectedProduct?.product_desc || ""}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct!, product_desc: e.target.value })
                  }
                  className="textarea textarea-bordered w-full"
                />
              </div>
              <div className="mb-4">
                <button type="submit" className="btn btn-primary w-full">
                  Save
                </button>
              </div>
            </form>
            <button
              className="btn btn-secondary w-full mt-2"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
