import { Outlet } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { markAuthChecked, setUser } from "./store/features/auth/authSlice";
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
      dispatch(setUser(data.user));

    } catch {
      dispatch(markAuthChecked());
    }
  };

  checkAuth();
}, [dispatch]);

  return (
    <>
      <Navbar />
      <ScrollToTop />
      <Outlet />
      <Footer />
    </>
  );
}

export default App;
