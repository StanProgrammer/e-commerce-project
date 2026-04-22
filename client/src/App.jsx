import { Outlet } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout, setUser } from "./store/features/auth/authSlice";
import getBaseUrl from "./utils/baseUrl";

function App() {
  const dispatch = useDispatch();

 useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      console.log("Auth check success:", data);
      dispatch(setUser(data.user));

    } catch (err) {
      console.error("Auth check failed:", err);
      dispatch(logout());
    }
  };

  checkAuth();
}, [dispatch]);

  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 9999 }}
        toastOptions={{
          style: {
            maxWidth: "none",
            whiteSpace: "nowrap",
          },
        }}
      />

      <Navbar />
      <ScrollToTop />
      <Outlet />
      <Footer />
    </>
  );
}

export default App;
