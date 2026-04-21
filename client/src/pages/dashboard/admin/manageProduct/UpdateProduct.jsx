import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TextInput from "../addProduct/TextInput";
import SelectInput from "../addProduct/SelectInput";
import UploadImage from "../addProduct/UploadImage";
import { useGetSingleProductQuery, useUpdateProductMutation } from "../../../../store/features/products/productsApi";
import toast from "react-hot-toast";

const categories = [
  { label: "Select Category", value: "" },
  { label: "Accessories", value: "accessories" },
  { label: "Clothes", value: "clothes" },
  { label: "Jewellery", value: "jewellery" },
  { label: "Cosmetics", value: "cosmetics" },
];

const colors = [
  { label: "Select Color", value: "" },
  { label: "Red", value: "red" },
  { label: "Blue", value: "blue" },
  { label: "Green", value: "green" },
  { label: "Black", value: "black" },
  { label: "Gold", value: "gold" },
  { label: "Silver", value: "silver" },
  { label: "Beige", value: "beige" },
];

const UpdateProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: productData, isLoading: isFetching, isError } = useGetSingleProductQuery(id);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    color: "",
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [errors, setErrors] = useState({});

  // Pre-populate form when product data is loaded
  useEffect(() => {
    
    
    if (productData) {
      setProduct({
        name: productData.product.name || "",
        description: productData.product.description || "",
        price: productData.product.price || "",
        category: productData.product.category || "",
        color: productData.product.color || "",
      });
      setExistingImages(productData.product.images || []);
    }
  }, [productData]);

  // Handle input changes
  const handleChange = (e) => {
    setProduct((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Validation
  const validate = () => {
    let newErrors = {};

    if (!product.name.trim()) newErrors.name = "Name is required";
    if (!product.category) newErrors.category = "Select a category";
    if (!product.color) newErrors.color = "Select a color";
    if (!product.price || product.price <= 0) newErrors.price = "Enter valid price";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
     const formData = new FormData();

Object.entries(product).forEach(([key, value]) => {
  formData.append(key, value);
});

images.forEach((img) => {
  formData.append("images", img);
});

formData.append("existingImages", JSON.stringify(existingImages));

await updateProduct({ id, formData }).unwrap();  

      toast.success("Product updated successfully");
      navigate("/dashboard/manage-products");
    } catch (err) {
  console.error(err);

  // ✅ RTK Query error structure
  const backendError = err?.data;

  //  1. Joi validation errors (multiple possible)
  if (backendError?.details && Array.isArray(backendError.details)) {
    backendError.details.forEach((detail) => {
      toast.error(detail.message);
    });
    return;
  }

  //  2. Single backend message
  if (backendError?.message) {
    toast.error(backendError.message);
    return;
  }

  if (backendError?.error) {
    toast.error(backendError.error);
    return;
  }

  //  3. Network / unknown errors
  if (err?.error) {
    toast.error(err.error);
    return;
  }

  //  fallback
  toast.error("Something went wrong");
}
  };

  
  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error loading product</p>
          <button
            onClick={() => navigate("/dashboard/manage-products")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-6 md:p-8">
        {/* Header */}
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
          Update Product
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              name="name"
              label="Product Name"
              value={product.name}
              onChange={handleChange}
              type="text"
              placeholder="Enter product name"
              error={errors.name}
              required
            />

            <TextInput
              name="price"
              label="Price ($)"
              value={product.price}
              onChange={handleChange}
              type="number"
              placeholder="Enter price"
              error={errors.price}
                required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectInput
              name="category"
              label="Category"
              value={product.category}
              onChange={handleChange}
              options={categories}
              error={errors.category}
              required
            />

            <SelectInput
              name="color"
              label="Color"
              value={product.color}
              onChange={handleChange}
              options={colors}
              error={errors.color}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
              rows="4"
              placeholder="Enter product description"
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              minLength={11}
            />
          </div>

          {/* Existing Images */}
       

          {/* Image Upload */}
        <UploadImage
  label="Add New Images (optional)"
  setImage={setImages}
  existingImages={existingImages} // REQUIRED
/>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isUpdating}
              className={`flex-1 py-3 rounded-lg font-medium text-white transition cursor-pointer ${
                isUpdating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isUpdating ? "Updating..." : "Update Product"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/manage-products")}
              className="flex-1 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProduct;