import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Footer.css";
import logo from "../../Images/Sadhanacart1.png";

const Footer = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <footer className="footer pt-5">
      <div className="container">
        <div className="row">

          {/* Column 1: Logo & About */}
          <div className="col-md-3 col-sm-6 mb-4">
            <div className="footer-brand mb-3">
              <img src={logo} alt="SadhanaCart Logo" className="footer-logo-img" />
              <span className="footer-logo-text">
                Sadhana<span className="cart-text">Cart</span>
              </span>
            </div>

            <h6 className="footer-heading">About Us</h6>
            <p className="footer-text">
              SadhanaCart is a multipurpose Ecommerce Platform for Electronics,
              Fashion, Groceries, Gifts, Medical, and more.
            </p>

            <p className="footer-copyright">
              © 2024–2025 All Rights Reserved<br />
              SadhanaCart Team
              <br />
              <span className="developer-text">
                Developed by Innomatrics Technologies
              </span>
            </p>
          </div>

          {/* Column 2: Contact */}
          <div className="col-md-3 col-sm-6 mb-4">
            <h6 className="footer-heading">Call Us</h6>
            <p>
              <a href="tel:+919448810877">+91 94488 10877</a>
            </p>

            <h6 className="footer-heading">Mail Us</h6>
            <p>
              <a href="mailto:support@sadhanacart.com">
                support@sadhanacart.com
              </a>
            </p>

            <h6 className="footer-heading">Working Hours</h6>
            <p className="mb-0">Monday to Saturday</p>
            <p>9:00 AM – 6:00 PM</p>
          </div>

          {/* Column 3: Links */}
          <div className="col-md-3 col-sm-6 mb-4">
            <h6 className="footer-heading">Useful Links</h6>
            <ul className="list-unstyled footer-links">
              <li><Link to="/return-policy">Return Policy</Link></li>
              <li><Link to="/shipping-policy">Shipping Policy</Link></li>
              <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
              <li><Link to="/about-us">About Us</Link></li>
              <li>
                <a href="https://wa.me/919448810877" target="_blank" rel="noreferrer">
                  Chat With Us
                </a>
              </li>
              <li><Link to="/faqs">FAQs</Link></li>
            </ul>
          </div>

          {/* Column 4: Address */}
          <div className="col-md-3 col-sm-6 mb-4">
            <h6 className="footer-heading">Located At</h6>
            <p className="office-title">Registered Office</p>
            <address className="footer-address">
              Ground Floor, Ward No. 24, A No. 4-14-155/36A,<br />
              Teachers Colony, Near LIC Office,<br />
              Gangawati – 583222, Koppal District,<br />
              Karnataka.
            </address>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
