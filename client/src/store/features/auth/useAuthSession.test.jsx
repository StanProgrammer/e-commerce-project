import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { setUser } from "./authSlice";
import { useAuthSession } from "./useAuthSession";

// Mock the RTK Query hook so each test controls the /auth/me response.
vi.mock("./authApi", () => ({
  useGetMeQuery: vi.fn(),
}));

import { useGetMeQuery } from "./authApi";

const mockUser = {
  _id: "user-1",
  id: "user-1",
  username: "jane",
  email: "jane@example.com",
  role: "user",
};

const makeStore = (state) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: state },
  });

const renderSession = (store) =>
  renderHook(() => useAuthSession(), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });

describe("useAuthSession", () => {
  beforeEach(() => {
    useGetMeQuery.mockReset();
  });

  it("restores the user when the server confirms an active session", () => {
    const store = makeStore({ user: null, isAuthenticated: false, authChecked: false });
    useGetMeQuery.mockReturnValue({
      data: { isAuthenticated: true, user: mockUser },
      isSuccess: true,
      isError: false,
      isFetching: false,
    });

    renderSession(store);

    expect(store.getState().auth.user).toEqual(mockUser);
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.authChecked).toBe(true);
  });

  it("logs out when the server explicitly reports no active session", () => {
    const store = makeStore({
      user: mockUser,
      isAuthenticated: true,
      authChecked: false,
    });
    useGetMeQuery.mockReturnValue({
      data: { isAuthenticated: false, user: null },
      isSuccess: true,
      isError: false,
      isFetching: false,
    });

    renderSession(store);

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.authChecked).toBe(true);
  });

  it("keeps the persisted session on a transient network error (FETCH_ERROR)", () => {
    const store = makeStore({
      user: mockUser,
      isAuthenticated: true,
      authChecked: false,
    });
    useGetMeQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: true,
      isFetching: false,
      error: { status: "FETCH_ERROR" },
    });

    renderSession(store);

    // A network blip must NOT wipe the session or trigger the store reset.
    expect(store.getState().auth.user).toEqual(mockUser);
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.authChecked).toBe(true);
  });

  it("keeps the persisted session on a server error (5xx)", () => {
    const store = makeStore({
      user: mockUser,
      isAuthenticated: true,
      authChecked: false,
    });
    useGetMeQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: true,
      isFetching: false,
      error: { status: 500 },
    });

    renderSession(store);

    expect(store.getState().auth.user).toEqual(mockUser);
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.authChecked).toBe(true);
  });

  it("logs out when the token is rejected with a genuine 401", () => {
    const store = makeStore({
      user: mockUser,
      isAuthenticated: true,
      authChecked: false,
    });
    useGetMeQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isError: true,
      isFetching: false,
      error: { status: 401 },
    });

    renderSession(store);

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.authChecked).toBe(true);
  });

  it("marks auth as checked for guests with no persisted session", () => {
    const store = makeStore({
      user: null,
      isAuthenticated: false,
      authChecked: false,
    });
    useGetMeQuery.mockReturnValue({
      data: { isAuthenticated: false, user: null },
      isSuccess: true,
      isError: false,
      isFetching: false,
    });

    renderSession(store);

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.authChecked).toBe(true);
  });

  it("exports setUser action for explicit session restoration", () => {
    const store = makeStore({ user: null, isAuthenticated: false, authChecked: false });
    store.dispatch(setUser(mockUser));
    expect(store.getState().auth.user).toEqual(mockUser);
  });
});
