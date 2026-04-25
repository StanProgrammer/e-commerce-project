import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "remixicon/fonts/remixicon.css";
import { store,persistor } from "./store/store.js";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import router from "./routers/router.jsx";
import { PersistGate } from "redux-persist/integration/react";
import AppToaster from "./components/AppToaster.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
     <PersistGate loading={null} persistor={persistor}>
    <AppToaster />
    <RouterProvider router={router} />
    </PersistGate>
  </Provider>
);
