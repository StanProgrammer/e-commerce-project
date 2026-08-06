import { describe, it, expect } from "vitest";
import cartReducer, {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "./cartSlice";

describe("cartSlice", () => {
  it("adds a new product and computes totals", () => {
    const state = cartReducer(undefined, addToCart({ _id: "p1", name: "Shirt", price: 20 }));

    expect(state.products).toHaveLength(1);
    expect(state.products[0].quantity).toBe(1);
    expect(state.selectedItems).toBe(1);
    expect(state.totalPrice).toBe(20);
  });

  it("increments quantity when the same product is added again", () => {
    let state = cartReducer(undefined, addToCart({ _id: "p1", price: 10 }));
    state = cartReducer(state, addToCart({ _id: "p1", price: 10 }));

    expect(state.products[0].quantity).toBe(2);
    expect(state.totalPrice).toBe(20);
  });

  it("never exceeds tracked stock when adding", () => {
    let state = cartReducer(undefined, addToCart({ _id: "p1", price: 10, stock: 2 }));
    state = cartReducer(state, addToCart({ _id: "p1", price: 10, stock: 2 }));
    state = cartReducer(state, addToCart({ _id: "p1", price: 10, stock: 2 }));

    expect(state.products[0].quantity).toBe(2);
    expect(state.totalPrice).toBe(20);
  });

  it("never exceeds tracked stock when incrementing", () => {
    let state = cartReducer(undefined, addToCart({ _id: "p1", price: 10, stock: 1 }));
    state = cartReducer(state, updateQuantity({ _id: "p1", type: "increment" }));

    expect(state.products[0].quantity).toBe(1);
  });

  it("decrements quantity but never below one", () => {
    let state = cartReducer(undefined, addToCart({ _id: "p1", price: 10 }));
    state = cartReducer(state, updateQuantity({ _id: "p1", type: "decrement" }));

    expect(state.products[0].quantity).toBe(1);
  });

  it("removes products and recomputes totals", () => {
    let state = cartReducer(undefined, addToCart({ _id: "p1", price: 10 }));
    state = cartReducer(state, addToCart({ _id: "p2", price: 5 }));
    state = cartReducer(state, removeFromCart({ _id: "p1" }));

    expect(state.products).toHaveLength(1);
    expect(state.totalPrice).toBe(5);
  });

  it("computes tax and grand total from the configured rate", () => {
    const state = cartReducer(undefined, addToCart({ _id: "p1", price: 100 }));

    expect(state.taxRate).toBe(0.06);
    expect(state.tax).toBe(6);
    expect(state.grandTotal).toBe(106);
  });

  it("clears the cart", () => {
    let state = cartReducer(undefined, addToCart({ _id: "p1", price: 10 }));
    state = cartReducer(state, clearCart());

    expect(state.products).toEqual([]);
    expect(state.selectedItems).toBe(0);
    expect(state.totalPrice).toBe(0);
    expect(state.grandTotal).toBe(0);
  });
});
