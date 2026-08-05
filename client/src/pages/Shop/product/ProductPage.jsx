import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Ratings from "../../../components/Ratings";
import { useDispatch } from "react-redux";
import { useGetSingleProductQuery } from "../../../store/features/products/productsApi";
import { addToCart } from "../../../store/features/cart/cartSlice";
import ReviewCard from "../reviews/ReviewCard";
import toast from "react-hot-toast";
import { getProductImages } from "../../../utils/productImage";

const ProductPage = () => {
  const { id } = useParams();

  const { data: product, isLoading, isError } = useGetSingleProductQuery(id, {
    skip: !id,
  });

  const dispatch = useDispatch();
  const singleProduct = product?.product || {};
  const productImages = useMemo(() => getProductImages(product?.product), [product]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const productReviews = product?.reviews || [];
  const reviewCount = productReviews.length;
  const savings =
    singleProduct.oldPrice && singleProduct.price
      ? Number(singleProduct.oldPrice) - Number(singleProduct.price)
      : 0;
  const savingsPercentage =
    singleProduct.oldPrice && singleProduct.price
      ? Math.round((savings / Number(singleProduct.oldPrice)) * 100)
      : 0;

  const formatPrice = (value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    return Number(value).toFixed(2);
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    toast.success(`${product.name} added to cart`, {
      id: product._id,
    });
  };

  useEffect(() => {
    setActiveImageIndex(0);
  }, [singleProduct._id]);

  const hasMultipleImages = productImages.length > 1;
  const activeImage = productImages[activeImageIndex] || "";

  const handlePreviousImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? productImages.length - 1 : currentIndex - 1
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === productImages.length - 1 ? 0 : currentIndex + 1
    );
  };

  if (isLoading) {
    return (
      <section className="section__container">
        <div className="mx-auto max-w-6xl animate-pulse rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:rounded-4xl sm:p-6 md:p-10">
          <div className="mb-6 h-5 w-28 rounded-full bg-blue-100 sm:mb-8 sm:w-32"></div>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="aspect-square rounded-3xl bg-slate-100"></div>
            <div className="space-y-4">
              <div className="h-8 w-4/5 rounded-full bg-slate-100 sm:h-10 sm:w-3/4"></div>
              <div className="h-6 w-2/5 rounded-full bg-blue-100 sm:w-1/3"></div>
              <div className="h-24 rounded-3xl bg-slate-100"></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-20 rounded-2xl bg-slate-100"></div>
                <div className="h-20 rounded-2xl bg-slate-100"></div>
              </div>
              <div className="h-12 w-40 rounded-xl bg-blue-200"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="section__container">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-100 bg-red-50 px-5 py-10 text-center shadow-sm sm:rounded-4xl sm:px-6 sm:py-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-red-500 shadow-sm">
            <i className="ri-error-warning-line"></i>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-text-dark">Unable to load this product</h2>
          <p className="mx-auto max-w-lg text-text-light">
            Something went wrong while fetching the product details. Please try again from the shop page.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-white transition hover:bg-primary-dark"
          >
            <i className="ri-arrow-left-line"></i>
            Back to Shop
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section__container bg-primary-light">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-center text-xs font-medium text-text-light sm:text-sm">
            <Link to="/" className="transition hover:text-primary">
              Home
            </Link>
            <i className="ri-arrow-right-s-line"></i>
            <Link to="/shop" className="transition hover:text-primary">
              Shop
            </Link>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-text-dark">{singleProduct.name}</span>
          </div>

          <h2 className="section__header text-3xl capitalize sm:text-4xl">{singleProduct.name || "Product Details"}</h2>
          <p className="section__subheader max-w-2xl">
            Explore the details, pricing, and customer feedback for this piece before adding it to your collection.
          </p>
        </div>
      </section>

      <section className="section__container pb-6 pt-8 sm:pb-8 sm:pt-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-4xl sm:p-4 md:p-6">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 via-white to-slate-100">
              {singleProduct.category ? (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm sm:left-4 sm:top-4 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em]">
                  {singleProduct.category}
                </span>
              ) : null}

              {hasMultipleImages ? (
                <>
                  <button
                    type="button"
                    onClick={handlePreviousImage}
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-text-dark shadow-md transition hover:bg-primary hover:text-white sm:left-4"
                    aria-label="Show previous product image"
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-text-dark shadow-md transition hover:bg-primary hover:text-white sm:right-4"
                    aria-label="Show next product image"
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </>
              ) : null}

              <img
                src={activeImage}
                alt={singleProduct.name || "Product image"}
                className="aspect-square w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
            </div>

            {hasMultipleImages ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {productImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`overflow-hidden rounded-2xl border-2 transition ${
                      index === activeImageIndex
                        ? "border-primary shadow-md"
                        : "border-slate-200 hover:border-primary/50"
                    }`}
                    aria-label={`Show product image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${singleProduct.name || "Product"} thumbnail ${index + 1}`}
                      className="h-20 w-20 object-cover sm:h-24 sm:w-24"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-4xl sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary-light px-4 py-2 text-sm font-semibold text-primary">
                Featured Pick
              </span>
              {reviewCount > 0 ? (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-text-light">
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-text-light">
                  No reviews yet
                </span>
              )}
            </div>

            <h3
              className="mb-4 text-3xl leading-tight text-text-dark sm:text-4xl"
              style={{ fontFamily: "var(--font-header)" }}
            >
              {singleProduct.name}
            </h3>

            <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                <span className="text-2xl font-bold text-primary sm:text-3xl">${formatPrice(singleProduct.price)}</span>
                {singleProduct.oldPrice ? (
                  <s className="pb-1 text-base text-text-light">${formatPrice(singleProduct.oldPrice)}</s>
                ) : null}
              </div>

              {savings > 0 ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Save ${formatPrice(savings)} ({savingsPercentage}% off)
                </span>
              ) : null}
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 sm:w-auto sm:justify-start">
                <Ratings rating={singleProduct.rating} />
                <span>{singleProduct.rating ? Number(singleProduct.rating).toFixed(1) : "New"}</span>
              </div>
              <div className="w-full rounded-full bg-slate-100 px-4 py-2 text-center text-sm font-medium text-text-light sm:w-auto sm:text-left">
                Carefully curated for everyday styling
              </div>
            </div>

            <p className="mb-8 text-sm leading-7 text-text-light sm:text-base sm:leading-8">
              {singleProduct.description || "A beautifully presented product with clean details and standout appeal."}
            </p>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-light">Category</p>
                <p className="text-lg font-semibold capitalize text-text-dark">{singleProduct.category || "N/A"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-light">Color</p>
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: singleProduct.color || "#ffffff" }}
                  ></span>
                  <p className="text-lg font-semibold capitalize text-text-dark">{singleProduct.color || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                className="btn inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(singleProduct);
                }}
              >
                <i className="ri-shopping-bag-3-line"></i>
                Add to Cart
              </button>

              <Link
                to="/shop"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 font-medium text-text-dark transition hover:border-primary hover:text-primary sm:w-auto"
              >
                <i className="ri-arrow-left-line"></i>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section__container pb-12 pt-2 sm:pb-16 sm:pt-4">
        <div className="mx-auto max-w-6xl">
          <ReviewCard productReviews={productReviews} />
        </div>
      </section>
    </>
  );
};

export default ProductPage;
