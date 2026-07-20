import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaRegClock,
  FaMapMarkerAlt,
  FaGooglePlay,
  FaApple,
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaArrowUp,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Footer.css";
import logo from "../../Images/Sadhanacart1.png";
import googlePlayBadge from "../../Images/google_play_badge.png";
import appStoreIcon from "../../Images/app store .icon.jpg";

const Footer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="sc-footer">
      {/* ── Auth Banner (only logged-out users on home page) ── */}
      {!currentUser && location.pathname === "/" && (
        <div className="sc-auth-banner">
          <div className="sc-auth-card">
            <div className="sc-auth-icon">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="sc-avatar-svg">
                <defs>
                  <radialGradient id="bgG" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#5bc8f5" />
                    <stop offset="100%" stopColor="#1a8ed1" />
                  </radialGradient>
                  <radialGradient id="bodyG" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#f0f0f0" />
                    <stop offset="100%" stopColor="#d5d5d5" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="50" fill="url(#bgG)" />
                <circle cx="50" cy="35" r="16" fill="url(#bodyG)" />
                <ellipse cx="50" cy="80" rx="26" ry="20" fill="url(#bodyG)" />
              </svg>
            </div>
            <div className="sc-auth-body">
              <h5 className="sc-auth-title">See personalized recommendations</h5>
              <p className="sc-auth-text">Sign in to get a better shopping experience tailored just for you.</p>
              <button className="sc-auth-btn" onClick={() => navigate("/login")}>Sign in</button>
              <p className="sc-auth-new">
                New customer? <Link to="/login?mode=signup">Start here.</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MAIN DARK FOOTER ══════════ */}
      <div className="sc-footer-dark">
        <div className="container-xl px-4">

          {/* ── TOP ROW: 6 columns ── */}
          <div className="row sc-top-row pb-4">

            {/* Col 1: Brand */}
            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 mb-5">
              <div className="sc-brand">
                <img src={logo} alt="SadhanaCart" className="sc-logo-img" />
                <div>
                  <div className="sc-logo-name">
                    Sadhana<span className="sc-logo-cart">Cart</span>
                  </div>
                  <div className="sc-tagline">Happiness in Every Cart</div>
                </div>
              </div>
              <p className="sc-brand-desc mt-3">
                SadhanaCart is a multipurpose ecommerce platform for Electronics,
                Fashion, Groceries, Gifts, Medical, and more.
              </p>
            </div>

            {/* Col 2: Customer Service */}
            <div className="col-xl-2 col-lg-2 col-md-3 col-sm-6 col-6 mb-5">
              <h6 className="sc-col-heading">CUSTOMER SERVICE</h6>
              <ul className="sc-link-list">
                <li><Link to="/help-center">Help Center</Link></li>
                <li><Link to="/track-order">Track Order</Link></li>
                <li><Link to="/contact-us">Contact Us</Link></li>
                <li><Link to="/faqs">FAQs</Link></li>
              </ul>
            </div>

            {/* Col 3: Policies */}
            <div className="col-xl-2 col-lg-2 col-md-3 col-sm-6 col-6 mb-5">
              <h6 className="sc-col-heading">POLICIES</h6>
              <ul className="sc-link-list">
                <li><Link to="/return-policy">Return Policy</Link></li>
                <li><Link to="/shipping-policy">Shipping Policy</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Col 4: Company */}
            <div className="col-xl-1 col-lg-1 col-md-3 col-sm-6 col-6 mb-5">
              <h6 className="sc-col-heading">COMPANY</h6>
              <ul className="sc-link-list">
                <li><Link to="/about-us">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/become-a-seller">Become a Seller</Link></li>
                <li><Link to="/blog">Blog</Link></li>
              </ul>
            </div>

            {/* Col 5: Contact Us */}
            <div className="col-xl-2 col-lg-2 col-md-3 col-sm-6 col-6 mb-5">
              <h6 className="sc-col-heading">CONTACT US</h6>
              <ul className="sc-contact-list">
                <li>
                  <FaPhoneAlt className="sc-icon" />
                  <a href="tel:+919448810877">+91 94488 10877</a>
                </li>
                <li>
                  <FaEnvelope className="sc-icon" />
                  <a href="mailto:support@sadhanacart.com">support@sadhanacart.com</a>
                </li>
                <li>
                  <FaRegClock className="sc-icon" />
                  <span>Mon - Sat, 9:00 AM - 6:00 PM IST<br />Sunday Closed</span>
                </li>
              </ul>
            </div>

            {/* Col 6: Registered Office */}
            <div className="col-xl-2 col-lg-2 col-md-6 col-sm-12 mb-5">
              <h6 className="sc-col-heading">REGISTERED OFFICE</h6>
              <ul className="sc-contact-list">
                <li>
                  <FaMapMarkerAlt className="sc-icon sc-icon-pin" />
                  <span>
                    Ground Floor, Ward No. 24,<br />
                    A No. 4-14-155/36A,<br />
                    Teachers Colony, Near LIC Office,<br />
                    Gangavati – 583222,<br />
                    Koppal District,<br />
                    Karnataka, India.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <hr className="sc-divider" />

          {/* ── MIDDLE ROW: App | Payments | Follow ── */}
          <div className="row sc-mid-row align-items-center py-3">

            {/* Download App */}
            <div className="col-lg-5 col-md-12 mb-4 mb-lg-0">
              <p className="sc-section-label">DOWNLOAD OUR APP</p>
              <div className="sc-app-row">
                {/* Google Play Badge */}
                <a
                  href="https://play.google.com/store/apps/details?id=com.innomatrics.sadhana_cart"
                  target="_blank"
                  rel="noreferrer"
                  className="sc-badge-link"
                  aria-label="Get it on Google Play"
                >
                  <img src={googlePlayBadge} alt="Get it on Google Play" className="sc-badge-img" />
                </a>

                {/* App Store Badge */}
                <a
                  href="https://apps.apple.com/in/app/sadhana-cart-online-shopping/id6751406762"
                  target="_blank"
                  rel="noreferrer"
                  className="sc-badge-link"
                  aria-label="Download on the App Store"
                >
                  <img src={appStoreIcon} alt="Download on the App Store" className="sc-badge-img" />
                </a>

              </div>
            </div>

            {/* We Accept */}
            <div className="col-lg-4 col-md-12 mb-4 mb-lg-0 text-center">
              <p className="sc-section-label">WE ACCEPT</p>
              <div className="sc-payments">
                <div className="sc-pay-card sc-visa">VISA</div>
                <div className="sc-pay-card sc-mc">
                  <div className="sc-mc-r"></div>
                  <div className="sc-mc-y"></div>
                </div>
                <div className="sc-pay-card sc-rupay">RuPay</div>
                <div className="sc-pay-card sc-upi">UPI</div>
                <div className="sc-pay-card sc-paytm">
                  <span style={{ color: '#00b9f1' }}>Pay</span><span style={{ color: '#002970' }}>tm</span>
                </div>
              </div>
            </div>

            {/* Follow Us */}
            <div className="col-lg-3 col-md-12 text-lg-end text-center">
              <p className="sc-section-label text-lg-end">FOLLOW US</p>
              <div className="sc-socials justify-content-lg-end justify-content-center">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="sc-social sc-insta"><FaInstagram /></a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="sc-social sc-fb"><FaFacebookF /></a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="sc-social sc-yt"><FaYoutube /></a>
              </div>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <hr className="sc-divider" />

          {/* ── BOTTOM BAR ── */}
          <div className="sc-bottom d-flex flex-column flex-md-row justify-content-between align-items-center">
            <p className="sc-copyright mb-2 mb-md-0">
              © 2025 SadhanaCart. All Rights Reserved.
            </p>
            <div className="sc-bottom-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span className="sc-sep">|</span>
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
              <span className="sc-sep">|</span>
              <Link to="/sitemap">Sitemap</Link>
            </div>
            <button className="sc-back-top" onClick={scrollToTop} aria-label="Back to Top">
              <FaArrowUp />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
