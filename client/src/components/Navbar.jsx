import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CartModal from "./CartModal";
import avatar from "../assets/avatar.png";
import { useLogoutUserMutation } from "../store/features/auth/authApi";
import { logout } from "../store/features/auth/authSlice";
const Navbar = () => {
  const dropdownRef = useRef(null);

  const products = useSelector((state) => state.cart.products);
  const selectedItems = useSelector((state) => state.cart.selectedItems ?? 0);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const toggleCart = () => setIsCartOpen((s) => !s);

  // show user if logged in
  const { user } = useSelector((state) => state.auth);
  //dropdown for user options
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  //logout
  const [logoutApi] = useLogoutUserMutation();

  const dispatch = useDispatch();
  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout())
     
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }
  const adminDropDownMenu = [
    { name: "Dashboard", link: "/dashboard/admin" },
    { name: "Manage Products", link: "/dashboard/manage-products" },
    { name: "Manage Orders", link: "/dashboard/manage-orders" },
    { name: "Manage Users", link: "/dashboard/user-management" },
    { name: "Add Product", link: "/dashboard/add-product" },
  ];

  const userDropDownMenu = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Profile", link: "/dashboard/profile" },
    { name: "Orders", link: "/dashboard/orders" },
    { name: "Settings", link: "/dashboard/settings" },
  ];

  const renderDropdownMenu = user && user.role === "admin" ? adminDropDownMenu : userDropDownMenu;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen]);


  return (
    <header className="fixed-nav-bar w-nav">
      <nav className="max-w-screen-2xl mx-auto px-4 flex justify-between items-center h-16">
        {/* left links */}
        <ul className="nav__links">
          <li className="link">
            <Link to="/">Home</Link>
          </li>
          <li className="link">
            <Link to="/shop">Shop</Link>
          </li>
          <li className="link">
            <Link to="/contact">Contact</Link>
          </li>
        </ul>

        {/* logo */}
        <div className="nav__logo">
          <Link to="/">
            Willow & Rue<span>.</span>
          </Link>
        </div>

        {/* icons */}
        <div className="nav__icons flex items-center gap-6">
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

      {isCartOpen && <CartModal products={products} isOpen={isCartOpen} onClose={toggleCart} />}
    </header>
  );
};

export default Navbar;
