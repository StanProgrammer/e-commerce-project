import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import cartReducer from "./features/cart/cartSlice";
import authReducer from "./features/auth/authSlice";
import authApi from "./features/auth/authApi";
import { productsApi } from "./features/products/productsApi";
import { reviewsApi } from "./features/reviews/reviewsApi";
import statsApi from "./features/stats/statsApi";
import orderApi from "./features/orders/orderApi";
import { blogsApi } from "./features/blogs/blogsApi";

/* =========================
   Persist Configuration
========================= */
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["cart", "auth"], // persist only these slices
};

/* =========================
   Combine All Reducers
========================= */
const appReducer = combineReducers({
  cart: cartReducer,
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [productsApi.reducerPath]: productsApi.reducer,
  [reviewsApi.reducerPath]: reviewsApi.reducer,
  [statsApi.reducerPath]: statsApi.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [blogsApi.reducerPath]: blogsApi.reducer,
});

/* =========================
   Root Reducer (Reset on Logout)
========================= */
const rootReducer = (state, action) => {
  if (action.type === "auth/logout") {
    state = undefined; // clears entire Redux store
  }
  return appReducer(state, action);
};

/* =========================
   Persisted Reducer
========================= */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/* =========================
   Store
========================= */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }).concat(
      authApi.middleware,
      productsApi.middleware,
      reviewsApi.middleware,
      statsApi.middleware,
      orderApi.middleware,
      blogsApi.middleware
    ),
});


export const persistor = persistStore(store);
