import React, { useState } from "react";
import { useSelector } from "react-redux";
import TextInput from "./TextInput";
import SelectInput from "./SelectInput";
import UploadImage from "./UploadImage";
import { useAddProductMutation } from "../../../../store/features/products/productsApi";
import toast from "react-hot-toast";
import getApiErrorMessage from "../../../../utils/getApiErrorMessage";
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

const AddProduct = () => {
  const { user } = useSelector((state) => state.auth);
const [addProduct] = useAddProductMutation();
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    color: "",
  });

const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  //  Handle Inputs
  const handleChange = (e) => {
    setProduct((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  //  Validation
  const validate = () => {
    let newErrors = {};

    if (!product.name.trim()) newErrors.name = "Name is required";
    if (!product.category) newErrors.category = "Select a category";
    if (!product.color) newErrors.color = "Select a color";
    if (!product.price || product.price <= 0)
      newErrors.price = "Enter valid price";
// validation
if (!images.length)
  newErrors.image = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  try {
    setLoading(true);

    const formData = new FormData();

    Object.entries(product).forEach(([key, value]) => {
      formData.append(key, value);
    });

    images.forEach((img) => {
      formData.append("images", img);
    });

    await addProduct(formData).unwrap(); 

    // reset
    setProduct({
      name: "",
      description: "",
      price: "",
      category: "",
      color: "",
    });

    setImages([]);
    setErrors({});
    toast.success("Product added. It is now available in the catalog.");
  } catch (err) {
    console.error(err);
    toast.error(getApiErrorMessage(err, "Product could not be added. Check the form and try again."));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-6 md:p-8">
        
        {/* Header */}
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
          Add New Product
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
            />

            <TextInput
              name="price"
              label="Price ($)"
              value={product.price}
              onChange={handleChange}
              type="number"
              placeholder="Enter price"
              error={errors.price}
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
            />

            <SelectInput
              name="color"
              label="Color"
              value={product.color}
              onChange={handleChange}
              options={colors}
              error={errors.color}
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
            />
          </div>

          {/* Image Upload */}
        <UploadImage
  label="Product Image"
  setImage={setImages}
  error={errors.image}
  resetTrigger={images.length === 0}
/>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium text-white transition cursor-pointer ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
