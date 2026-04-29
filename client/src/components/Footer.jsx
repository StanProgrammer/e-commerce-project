import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import insta1 from "../assets/instagram-1.jpg";
import insta2 from "../assets/instagram-2.jpg";
import insta3 from "../assets/instagram-3.jpg";
import insta4 from "../assets/instagram-4.jpg";
import insta5 from "../assets/instagram-5.jpg";
import insta6 from "../assets/instagram-6.jpg";
const Footer = () => {
  const { user } = useSelector((state) => state.auth);
  const orderLinkLabel = user?.role === "admin" ? "Manage order" : "Track Order";

  return (
    <>
    <footer className="section__container footer__container">
      <div className="footer__col">
        <h4>Contact US</h4>
        <p>
          <span>
            <i className="ri-map-pin-2-fill"></i>
          </span>
          123 Fashion St, Pune, MH 10001
        </p>
        <p>
          <span>
            <i className="ri-phone-mail"></i>
            support@willow.rue.com
          </span>
        </p>
        <p>
          <span>
            <i className="ri-phone-fill"></i>
          </span>
          +1 (555) 123-4567
        </p>
      </div>
      <div className="footer__col">
        <h4>About Us</h4>
        <Link to="/">Home</Link>
        <Link to="/team">About Us</Link>
        {/* this is good idea lets see in future if we can add more links here */}
        {/* <a href="/careers">Careers</a> */}
        {/* <a href="/blog">Blogs</a> */}
        <Link to="/policy">Terms & Conditions</Link>
      </div>
      <div className="footer__col">
        <h4>Useful Resources</h4>
        <a href="/contact">Help Center</a>
        <Link to="/dashboard/orders">{orderLinkLabel}</Link>
        <a href="/shop?category=clothes">Dresses</a>
        {/* <a href="/sizing">Men</a>
        <a href="/faqs">FAQs</a> */}
      </div>
      <div className="footer__col">
        <h4>Follow Us</h4>
        <div className="instagram__grid">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src={insta1} alt="Instagram 1" />
          </a>

          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <img src={insta2} alt="Facebook 2" />
          </a>

          <a href="https://x.com" target="_blank" rel="noopener noreferrer">
            <img src={insta3} alt="X (formerly Twitter) 3" />
          </a>

          <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">
            <img src={insta4} alt="Pinterest 4" />
          </a>

          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <img src={insta5} alt="YouTube 5" />
          </a>

          <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
            <img src={insta6} alt="LinkedIn 6" />
          </a>
        </div>

        {/* <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a> */}
      </div>
    </footer>
    <div className="footer__bar">
      <p>&copy; 2026 Willow Rue. All rights reserved.</p>
    </div>
    </>
  );
};

export default Footer;
