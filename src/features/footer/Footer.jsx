import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Footer.css";
import logo from "../../Images/Sadhanacart1.png";

const Footer = () => {
  const { t } = useTranslation();
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
                {t("brandName")}
                <span className="cart-text">{t("brandSuffix")}</span>
              </span>
            </div>

            <h6 className="footer-heading">{t("aboutUs")}</h6>
            <p className="footer-text">
              {t("aboutDesc")}

            </p>

            <p className="footer-copyright">
              © 2024–2025 {t("allRights")}<br />
              SadhanaCart Team
              <br />
              <span className="developer-text">
                {t("developedBy")}
              </span>
            </p>
          </div>

          {/* Column 2: Contact */}
          <div className="col-md-3 col-sm-6 mb-4">
            <h6 className="footer-heading">{t("callUs")}</h6>
            <p>
              <a href="tel:+919448810877">+91 94488 10877</a>
            </p>

            <h6 className="footer-heading">{t("mailUs")}</h6>
            <p>
              <a href="mailto:support@sadhanacart.com">
                support@sadhanacart.com
              </a>
            </p>

            <h6 className="footer-heading">{t("workingHours")}</h6>
            <p className="mb-0">{t("workingDays")}</p>
            <p>9:00 AM – 6:00 PM</p>
          </div>

          {/* Column 3: Links */}
          <div className="col-md-3 col-sm-6 mb-4">
            <h6 className="footer-heading">{t("usefulLinks")}</h6>
            <ul className="list-unstyled footer-links">
              <Link to="/return-policy">{t("return-Policy")}</Link><br />
              <Link to="/shipping-policy">{t("shipping-Policy")}</Link><br />
              <Link to="/terms-and-conditions">{t("term's")}</Link><br />
              <Link to="/about-us">{t("aboutUs")}</Link>
              <li>
                <a href="https://wa.me/919448810877" target="_blank" rel="noreferrer">
                  {t("chatWithUs")}
                </a>
              </li>
              <Link to="/faqs">{t("faq's")}</Link>
            </ul>
          </div>

          {/* Column 4: Address */}
          <div className="col-md-3 col-sm-6 mb-4">
            <h6 className="footer-heading">{t("locatedAt")}</h6>
            <p className="office-title">{t("registeredOffice")}</p>
            <address className="footer-address">
              {t("addresspage.line1")}<br />
              {t("addresspage.line2")}<br />
              {t("addresspage.line3")}<br />
              {t("addresspage.line4")}
            </address>

          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
