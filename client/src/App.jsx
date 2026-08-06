import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import FeedbackWidget from "./components/FeedbackWidget";
import PageSuspense from "./components/PageSuspense";
import { useAuthSession } from "./store/features/auth/useAuthSession";

function App() {
  // Verifies the session once; protected routes reuse this single request.
  useAuthSession();

  return (
    <>
      <Navbar />
      <ScrollToTop />
      <Suspense fallback={<PageSuspense />}>
        <Outlet />
      </Suspense>
      <FeedbackWidget />
      <Footer />
    </>
  );
}

export default App;
