import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import cartReducer from "../cart/cartSlice";
import authApi from "./authApi";
import { useAuthSession } from "./useAuthSession";

// The real server reads JWT_SECRET when it boots, so set it before imports run.
vi.hoisted(() => {
  globalThis.process.env.JWT_SECRET =
    globalThis.process.env.JWT_SECRET || "integration-test-secret";
  globalThis.__fakeDbUser = null;
});

// Mimic the chainable Mongoose query the real endpoints use.
const createQuery = (data) => {
  let resolveData;
  const query = new Promise((resolve) => {
    resolveData = resolve;
  });
  query.select = () => query;
  query.lean = () => query;
  resolveData(data);
  return query;
};

const mockUser = {
  _id: "user-1",
  username: "jane",
  email: "jane@example.com",
  role: "user",
  profilePic: "",
};

const persistedCart = {
  products: [{ _id: "p1", name: "Watch", price: 100, quantity: 1, stock: 5 }],
  selectedItems: 1,
  totalPrice: 100,
  tax: 6,
  taxRate: 0.06,
  grandTotal: 106,
};

const appReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  [authApi.reducerPath]: authApi.reducer,
});

// Same root reducer as the real store: logout wipes the persisted state.
const rootReducer = (state, action) => {
  if (action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

const makeStore = (preloadedState) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
    preloadedState,
  });

const renderSession = (store) =>
  renderHook(() => useAuthSession(), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });

describe("useAuthSession — integration with the real /auth/me endpoint", () => {
  let projectRoot;
  let server;
  let serverRequire;
  let realFetch;
  let testToken;
  let failFetch;
  let lastMeResponse;

  beforeAll(async () => {
    // Load the server through Node's own require so every file shares one
    // module instance (vite's graph would compile the models twice).
    projectRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../../../"
    );
    serverRequire = createRequire(
      path.join(projectRoot, "server/tests/helpers/buildApp.js")
    );

    // Point the real model at a controllable fake so the endpoint needs no DB.
    const User = serverRequire(path.join(projectRoot, "server/models/userModel.js"));
    User.findOne = vi.fn(() => createQuery(globalThis.__fakeDbUser));

    const app = serverRequire(
      path.join(projectRoot, "server/tests/helpers/buildApp.js")
    )();
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));

    // Forward the client's fetch to the live Express server, injecting the token
    // as the cookie the real endpoint expects. This is the only test seam.
    realFetch = globalThis.fetch;
    vi.stubGlobal("fetch", async (input, init = {}) => {
      if (failFetch) {
        throw new TypeError("Network request failed");
      }

      const url = new URL(typeof input === "string" ? input : input.url);
      url.protocol = "http:";
      url.host = new URL(`http://127.0.0.1:${server.address().port}`).host;

      const headers = new Headers(init.headers || {});
      if (testToken) {
        headers.set("Cookie", `token=${testToken}`);
      }

      const res = await realFetch(url.toString(), {
        ...init,
        headers,
        credentials: "omit",
      });

      if (url.pathname === "/api/auth/me") {
        lastMeResponse = await res.clone().json();
      }

      return res;
    });
  });

  beforeEach(() => {
    testToken = null;
    failFetch = false;
    lastMeResponse = null;
    globalThis.__fakeDbUser = null;
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await new Promise((resolve) => server?.close(resolve));
  });

  // A stale token surfaces as 200 { isAuthenticated: false } from the real
  // endpoint (optionalVerifyToken never 401s); the hook logs out on that.
  // The literal error?.status === 401 branch stays covered by the unit test.
  it("logs out when the real endpoint rejects a stale session", async () => {
    testToken = "not-a-real-token";
    const store = makeStore({
      auth: { user: mockUser, isAuthenticated: true, authChecked: false },
      cart: persistedCart,
    });

    renderSession(store);

    await waitFor(
      () => expect(store.getState().auth.user).toBeNull(),
      { timeout: 5000 }
    );
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.authChecked).toBe(true);
    expect(store.getState().cart.products).toEqual([]);

    // The logout really went through the live /auth/me route.
    expect(lastMeResponse).toEqual({ isAuthenticated: false, user: null });
  });

  it("restores the session when the real endpoint validates the token", async () => {
    globalThis.__fakeDbUser = mockUser;
    testToken = serverRequire(path.join(projectRoot, "server/utils/helper.js")).generateToken(mockUser);

    const store = makeStore({
      auth: { user: null, isAuthenticated: false, authChecked: false },
      cart: { ...persistedCart, products: [] },
    });

    renderSession(store);

    await waitFor(
      () => expect(store.getState().auth.user?.username).toBe("jane"),
      { timeout: 5000 }
    );
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(lastMeResponse.isAuthenticated).toBe(true);
  });

  it("marks auth as checked for guests", async () => {
    const store = makeStore({
      auth: { user: null, isAuthenticated: false, authChecked: false },
      cart: { ...persistedCart, products: [] },
    });

    renderSession(store);

    await waitFor(
      () => expect(store.getState().auth.authChecked).toBe(true),
      { timeout: 5000 }
    );
    expect(store.getState().auth.user).toBeNull();
    expect(lastMeResponse.isAuthenticated).toBe(false);
  });

  it("keeps the persisted session when the endpoint is unreachable", async () => {
    failFetch = true;
    const store = makeStore({
      auth: { user: mockUser, isAuthenticated: true, authChecked: false },
      cart: persistedCart,
    });

    renderSession(store);

    await waitFor(
      () => expect(store.getState().auth.authChecked).toBe(true),
      { timeout: 5000 }
    );
    expect(store.getState().auth.user).toEqual(mockUser);
    expect(store.getState().cart.products).toHaveLength(1);
  });
});
