import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import ShopPage from "./ShopPage";
import { productsApi } from "../../store/features/products/productsApi";
import cartReducer from "../../store/features/cart/cartSlice";

const MOCK_PRODUCTS = [
  {
    _id: "p1",
    name: "Chic Dress",
    price: 35,
    rating: 4,
    images: ["https://res.cloudinary.com/demo/image/upload/v1/dress.jpg"],
    stock: 10,
  },
  {
    _id: "p2",
    name: "Silk Scarf",
    price: 20,
    rating: 5,
    images: ["https://res.cloudinary.com/demo/image/upload/v1/scarf.jpg"],
    stock: 5,
  },
];

const jsonResponse = (status, body) => {
  const clone = () => jsonResponse(status, body);

  return {
    ok: status >= 200 && status < 300,
    status,
    clone,
    text: async () => JSON.stringify(body),
    json: async () => body,
    headers: { get: () => "application/json" },
  };
};

// Mirrors the server's Joi query validation: empty minPrice/maxPrice -> 400,
// valid params -> 200. If the client ever regresses to sending empty strings,
// this stub responds 400 and the product list fails to render.
let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn(async (input) => {
    const url = typeof input === "string" ? input : input.url;
    const params = new URL(url).searchParams;
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");

    if (minPrice === "" || maxPrice === "") {
      return jsonResponse(400, { message: "Validation failed" });
    }

    return jsonResponse(200, {
      products: MOCK_PRODUCTS,
      totalProducts: MOCK_PRODUCTS.length,
      totalPages: 1,
    });
  });

  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      [productsApi.reducerPath]: productsApi.reducer,
    },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(productsApi.middleware),
  });

const renderShop = (store) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/shop"]}>
        <ShopPage />
      </MemoryRouter>
    </Provider>
  );

const requestedUrls = () =>
  fetchMock.mock.calls.map(([input]) =>
    typeof input === "string" ? input : input.url
  );

describe("ShopPage price filter", () => {
  it("sends minPrice=0/maxPrice=50 (never empty strings) when 'Under $50' is selected", async () => {
    const store = makeStore();
    renderShop(store);

    fireEvent.click(screen.getByRole("radio", { name: "Under $50" }));

    // Wait for the filtered request to fire with valid price params.
    await waitFor(() => {
      const urls = requestedUrls();
      expect(urls.some((u) => u.includes("minPrice=0"))).toBe(true);
    });

    const urls = requestedUrls();
    const filtered = urls.find((u) => u.includes("minPrice=0"));

    expect(filtered).toContain("minPrice=0");
    expect(filtered).toContain("maxPrice=50");

    // Regression guard: no request may carry empty price params.
    for (const url of urls) {
      expect(url).not.toMatch(/[?&]minPrice=&/);
      expect(url).not.toMatch(/[?&]maxPrice=&/);
    }

    // The fetch stub returns 400 for empty params, so the products rendering
    // here proves no 400 happened — the error state never appeared.
    expect(await screen.findByText("Chic Dress")).toBeInTheDocument();
    expect(screen.queryByText(/Products could not be loaded/)).toBeNull();
  });
});
