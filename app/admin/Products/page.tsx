"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error, count } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) console.error(error);
      else {
        setProducts((data as Product[]) ?? []);
        setTotalCount(count ?? 0);
      }
    };

    fetchProducts();
  }, [page, supabase]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleOpenDetails = (product: Product | null) => {
    setSelectedProduct(
      product ?? {
        product_id: 0,
        product_name: "",
        product_price: 0,
        product_img: null,
        product_desc: "",
        product_category: null,
        product_subcategory: null,
        product_jp: "",
      }
    );
    setIsModalOpen(true);
    setImageFile(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setImageFile(null);
  };

  // Upload image to Supabase Storage (product-images bucket)
  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);

    if (error) {
      alert(`Error uploading image: ${error.message}`);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName);

    return publicUrl;
  };

  const saveProduct = async (product: Product) => {
    let productImg = product.product_img;

    // Upload new image if selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) productImg = uploadedUrl;
    }

    if (product.product_id === 0) {
      // Insert new product
      const { error } = await supabase
        .from("products")
        .insert([{ ...product, product_img: productImg }]);
      if (error) alert(`Error adding product: ${error.message}`);
      else {
        setPage(1);
        handleCloseModal();
      }
    } else {
      // Update product
      const { error } = await supabase
        .from("products")
        .update({ ...product, product_img: productImg })
        .eq("product_id", product.product_id);
      if (error) alert(`Error updating product: ${error.message}`);
      else {
        setPage(1);
        handleCloseModal();
      }
    }
  };

  const deleteProduct = async (product_id: number) => {
    const { error } = await supabase.from("products").delete().eq("product_id", product_id);
    if (error) alert(`Error deleting product: ${error.message}`);
    else setPage(1);
  };

  // Return correct image path
  const getImageUrl = (productImg: string | null) => {
    if (!productImg) return "/default-image.png";

    // Already an external or GitHub image
    if (productImg.startsWith("http")) return productImg;

    // Legacy local image (still works)
    return `/prod/${productImg}`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Link href="/admin" className="btn btn-outline">
          ← Back
        </Link>
      </div>

      <button className="btn btn-primary mb-4" onClick={() => handleOpenDetails(null)}>
        Add Product
      </button>

      {/* Product Table */}
      <div className="overflow-x-auto mx-auto w-full max-w-6xl">
        <table className="table-auto w-full text-center">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.product_id}>
                <td className="px-2 py-1 flex justify-center items-center">
                  <img
                    src={getImageUrl(product.product_img)}
                    alt={product.product_name}
                    className="w-16 h-16 object-cover"
                  />
                </td>
                <td>{product.product_name}</td>
                <td>{`₱ ${product.product_price}`}</td>
                <td>
                  <button className="btn btn-info btn-sm" onClick={() => handleOpenDetails(product)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-error btn-sm ml-2"
                    onClick={() => deleteProduct(product.product_id)}
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
        <div className="flex justify-center mt-4 gap-2">
          <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`btn ${page === i + 1 ? "btn-primary" : "btn-outline"}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="btn btn-outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-1/2">
            <h2 className="text-2xl font-bold mb-4">
              {selectedProduct?.product_id ? "Edit Product" : "Add Product"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProduct(selectedProduct as Product);
              }}
            >
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={selectedProduct?.product_name || ""}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct!, product_name: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={selectedProduct?.product_price || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct!,
                      product_price: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input w-full"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {selectedProduct?.product_img && (
                  <img
                    src={getImageUrl(selectedProduct.product_img)}
                    alt="preview"
                    className="w-24 h-24 object-cover mt-2"
                  />
                )}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={selectedProduct?.product_desc || ""}
                  onChange={(e) =>
                    setSelectedProduct({ ...selectedProduct!, product_desc: e.target.value })
                  }
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Save
              </button>
            </form>

            <button className="btn btn-secondary w-full mt-2" onClick={handleCloseModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
