import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  authChecked: false, // important for refresh handling
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.authChecked = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;
    },
    markAuthChecked: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;
    },
    // Session check failed on a blip — keep the persisted user instead of wiping it.
    markAuthCheckedKeepUser: (state) => {
      state.authChecked = true;
    },
  },
});

export const { setUser, logout, markAuthChecked, markAuthCheckedKeepUser } = authSlice.actions;
export default authSlice.reducer;
