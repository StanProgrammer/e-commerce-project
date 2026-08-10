import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import CartModal from "./CartModal";
import avatar from "../assets/avatar.webp";
import { useLogoutUserMutation } from "../store/features/auth/authApi";
import { logout } from "../store/features/auth/authSlice";
import toast from "react-hot-toast";
import getApiErrorMessage from "../utils/getApiErrorMessage";
const Navbar = () => {
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuToggleRef = useRef(null);

  const products = useSelector((state) => state.cart.products);
  const selectedItems = useSelector((state) => state.cart.selectedItems ?? 0);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const toggleCart = () => setIsCartOpen((s) => !s);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // show user if logged in
  const { user } = useSelector((state) => state.auth);
  // Dropdown for user options
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  // Logout
  const [logoutApi] = useLogoutUserMutation();

  const dispatch = useDispatch();
  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout())
      toast.success("You have been signed out.", { id: "logout-success" });
     
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error(getApiErrorMessage(error, "We could not sign you out. Please try again."));
    }
  }
  const adminDropDownMenu = [
    { name: "Dashboard", link: "/dashboard/admin" },
    { name: "Manage Products", link: "/dashboard/manage-products" },
    { name: "Manage Orders", link: "/dashboard/manage-orders" },
    { name: "Manage Users", link: "/dashboard/user-management" },
    { name: "Add Product", link: "/dashboard/add-product" },
    { name: "Manage Blogs", link: "/dashboard/manage-blogs" },
  ];

  const userDropDownMenu = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Profile", link: "/dashboard/profile" },
    { name: "Orders", link: "/dashboard/orders" },
  ];

  const renderDropdownMenu = user && user.role === "admin" ? adminDropDownMenu : userDropDownMenu;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }

      const clickedInsideMobileMenu =
        mobileMenuRef.current?.contains(event.target) || mobileMenuToggleRef.current?.contains(event.target);

      if (isMobileMenuOpen && !clickedInsideMobileMenu) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = [
    { label: "Home", to: "/", end: true },
    { label: "Shop", to: "/shop" },
    { label: "Blogs", to: "/blogs" },
    { label: "Contact", to: "/contact" },
  ];


  return (
    <header className="fixed-nav-bar w-nav relative">
      <nav className="max-w-screen-2xl mx-auto px-4 flex justify-between items-center h-16">
        {/* left links */}
        <ul className="nav__links">
          {navLinks.map((item) => (
            <li key={item.to} className="link">
              <NavLink to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* logo */}
        <div className="nav__logo">
          <Link to="/">
            Willow & Rue<span>.</span>
          </Link>
        </div>

        {/* icons */}
        <div className="nav__icons flex items-center gap-6">
          <button
            ref={mobileMenuToggleRef}
            type="button"
            className="mobile__menu__toggle"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <i className={isMobileMenuOpen ? "ri-close-line" : "ri-menu-line"} />
          </button>

          <Link to="/search" className="text-xl hover:text-primary transition cursor-pointer">
            <i className="ri-search-line" />
          </Link>

          <div className="relative">
            <button onClick={toggleCart} className="hover:text-primary cursor-pointer transition">
              <i className="ri-shopping-bag-line text-xl" />
              <span
                className="absolute -top-1.5 -right-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-[10px] font-semibold text-white leading-none"
                aria-live="polite"
              >
                {selectedItems}
              </span>
            </button>
          </div>
          {user && user ? (
            <div ref={dropdownRef} className="relative">
              <img
                onClick={toggleDropdown}
                src={user.profilePic || avatar}
                alt="User Pic"
                className="size-6 rounded-full object-cover cursor-pointer"
              />

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 p-4 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <ul className="font-medium space-y-4 p-2">
                    {renderDropdownMenu.map((item, index) => (
                      <li key={index}>
                        <Link onClick={() => setIsDropdownOpen(false)} className="dropdown-items block" to={item.link}>
                          {item.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        onClick={handleLogout}
                        className="dropdown-items block text-red-600 hover:text-red-700"
                        to="/"
                      >
                        Logout
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="text-xl hover:text-primary transition cursor-pointer">
              <i className="ri-user-line" />
            </Link>
          )}
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          ref={mobileMenuRef}
          className="mobile__menu absolute left-4 right-4 top-[4.5rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg z-40"
        >
          <ul className="space-y-3">
            {navLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  className="mobile__menu__link block rounded-xl px-3 py-2"
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCartOpen && <CartModal products={products} isOpen={isCartOpen} onClose={toggleCart} />}
    </header>
  );
};

export default Navbar;
