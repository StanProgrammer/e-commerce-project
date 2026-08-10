import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  selectedItems: 0,
  totalPrice: 0,
  tax: 0,
  taxRate: 0.06,
  grandTotal: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const payload = action.payload;
      const productId = payload._id;
      const existing = state.products.find((p) => p._id === productId);

      // Never add an out-of-stock product (buttons are already disabled, but be safe)
      const payloadTracksStock =
        payload.stock !== undefined && payload.stock !== null;
      if (!existing && payloadTracksStock && Number(payload.stock) <= 0) {
        return;
      }

      if (existing) {
        // Never exceed tracked stock; no stock field means unlimited.
        const maxQty =
          payload.stock !== undefined && payload.stock !== null
            ? Number(payload.stock)
            : Infinity;
        const nextQty = (existing.quantity || 1) + 1;
        if (nextQty <= maxQty) {
          existing.quantity = nextQty;
        }
      } else {
        state.products.push({ ...payload, quantity: 1 });
      }

      // Recompute derived values
      state.selectedItems = setSelectedItems(state);
      state.totalPrice = setTotalPrice(state);
      state.tax = setTax(state);
      state.grandTotal = setGrandTotal(state);
    },

  updateQuantity: (state, action) => {
  const { _id, type } = action.payload;
  const product = state.products.find((p) => p._id === _id);

  if (!product) return;

  if (type === "increment") {
    // Never exceed tracked stock; no stock field means unlimited.
    const maxQty =
      product.stock !== undefined && product.stock !== null
        ? Number(product.stock)
        : Infinity;
    if (product.quantity + 1 <= maxQty) {
      product.quantity += 1;
    }
  }
  if (type === "decrement" && product.quantity > 1) product.quantity -= 1;

  state.selectedItems = setSelectedItems(state);
  state.totalPrice = setTotalPrice(state);
  state.tax = setTax(state);
  state.grandTotal = setGrandTotal(state);
},


    removeFromCart: (state, action) => {
      const productId = action.payload._id;
      state.products = state.products.filter((p) => p._id !== productId);

      state.selectedItems = setSelectedItems(state);
      state.totalPrice = setTotalPrice(state);
      state.tax = setTax(state);
      state.grandTotal = setGrandTotal(state);
    },

    clearCart: (state) => {
      state.products = [];
      state.selectedItems = 0;
      state.totalPrice = 0;
      state.tax = 0;
      state.grandTotal = 0;
    },
  },
});

// Utilities
export const setSelectedItems = (state) =>
  state.products.reduce((total, product) => total + (product.quantity || 0), 0);

export const setTotalPrice = (state) =>
  state.products.reduce((total, product) => total + Number(product.price || 0) * (product.quantity || 0), 0);

export const setTax = (state) => setTotalPrice(state) * (state.taxRate ?? 0);

export const setGrandTotal = (state) => setTotalPrice(state) + setTax(state);

// Selectors
export const selectCart = (state) => state.cart;
export const selectProducts = (state) => state.cart.products;

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
