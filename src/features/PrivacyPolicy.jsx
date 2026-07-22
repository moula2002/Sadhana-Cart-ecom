import React from "react";
import { useTranslation } from "react-i18next";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
  const { t } = useTranslation();

  // Helper to retrieve points array safely or fall back to an empty array
  const getPoints = (key, defaultVal = []) => {
    const val = t(key, { returnObjects: true });
    return Array.isArray(val) ? val : defaultVal;
  };

  const personalPoints = getPoints("privacy.section1.personalPoints", [
    "Name",
    "Email address",
    "Phone number",
    "Shipping and billing address"
  ]);

  const accountPoints = getPoints("privacy.section1.accountPoints", [
    "Login credentials (if you create an account)"
  ]);

  const transactionPoints = getPoints("privacy.section1.transactionPoints", [
    "Order details",
    "Payment information (processed securely via third-party payment providers)"
  ]);

  const devicePoints = getPoints("privacy.section1.devicePoints", [
    "Device type",
    "IP address",
    "Browser type",
    "App usage data"
  ]);

  const section2Points = getPoints("privacy.section2.points", [
    "Process and deliver your orders",
    "Provide customer support",
    "Improve our app and services",
    "Send order updates and notifications",
    "Prevent fraud and enhance security"
  ]);

  const section3Points = getPoints("privacy.section3.points", [
    "Payment gateways (to process payments securely)",
    "Delivery partners (to ship your orders)",
    "Service providers (hosting, analytics, etc.)"
  ]);

  const section4Points = getPoints("privacy.section4.points", [
    "Enhance user experience",
    "Analyze app and website traffic",
    "Remember your preferences"
  ]);

  const section6Points = getPoints("privacy.section6.points", [
    "Access your personal data",
    "Update or correct your information",
    "Request deletion of your account"
  ]);

  const addressLines = getPoints("privacy.section10.addressLines", [
    "Ground Floor, Ward No. 24,",
    "A No. 4-14-155/36A,",
    "Teachers Colony, Near LIC Office,",
    "Gangawati - 583222,",
    "Koppal District, Karnataka, India"
  ]);

  return (
    <div className="privacy-container" id="top">

      {/* 🔶 Header */}
      <header className="privacy-header-bg">
        <div className="privacy-header-content">
          <i className="fas fa-shield-alt privacy-icon"></i>
          <h1 className="header-title text-center">
            {t("privacy.title", "Privacy Policy")}
          </h1>
          <p className="text-center text-white-50 mt-1">
            {t("privacy.subtitle", "Your privacy is important to us")}
          </p>
        </div>
      </header>

      {/* 🔷 Content */}
      <div className="container">
        <main className="privacy-main-content">

          <p>
            <strong>
              {t("privacy.effectiveDate", "Effective Date: 01-04-2026")}
            </strong>
          </p>

          <p>
            {t("privacy.intro", "Welcome to SadhanaCart. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website and mobile application.")}
          </p>

          {/* 1 */}
          <section className="privacy-section">
            <h3>{t("privacy.section1.title", "1. Information We Collect")}</h3>

            <h5>{t("privacy.section1.personal", "a. Personal Information")}</h5>
            <ul>
              {personalPoints.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>

            <h5>{t("privacy.section1.account", "b. Account Information")}</h5>
            <ul>
              {accountPoints.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>

            <h5>{t("privacy.section1.transaction", "c. Transaction Information")}</h5>
            <ul>
              {transactionPoints.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>

            <h5>{t("privacy.section1.device", "d. Device & Usage Information")}</h5>
            <ul>
              {devicePoints.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>
          </section>

          {/* 2 */}
          <section className="privacy-section">
            <h3>{t("privacy.section2.title", "2. How We Use Your Information")}</h3>
            <ul>
              {section2Points.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>
          </section>

          {/* 3 */}
          <section className="privacy-section">
            <h3>{t("privacy.section3.title", "3. Sharing Your Information")}</h3>
            <p>{t("privacy.section3.text1", "We do not sell your personal data. We may share your information with:")}</p>
            <ul>
              {section3Points.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>
            <p>{t("privacy.section3.text2", "These partners are required to keep your information secure.")}</p>
          </section>

          {/* 4 */}
          <section className="privacy-section">
            <h3>{t("privacy.section4.title", "4. Cookies and Tracking Technologies")}</h3>
            <ul>
              {section4Points.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>
            <p>{t("privacy.section4.text", "You can disable cookies through your browser settings.")}</p>
          </section>

          {/* 5 */}
          <section className="privacy-section">
            <h3>{t("privacy.section5.title", "5. Data Security")}</h3>
            <p>
              {t("privacy.section5.text", "We take appropriate security measures to protect your data from unauthorized access, alteration, or disclosure.")}
            </p>
          </section>

          {/* 6 */}
          <section className="privacy-section">
            <h3>{t("privacy.section6.title", "6. Your Rights")}</h3>
            <ul>
              {section6Points.map((pt, index) => (
                <li key={index}>{pt}</li>
              ))}
            </ul>
          </section>

          {/* 7 */}
          <section className="privacy-section">
            <h3>{t("privacy.section7.title", "7. Children’s Privacy")}</h3>
            <p>
              {t("privacy.section7.text", "SadhanaCart does not knowingly collect data from children under 13 years of age. If we become aware of such data, we will delete it.")}
            </p>
          </section>

          {/* 8 */}
          <section className="privacy-section">
            <h3>{t("privacy.section8.title", "8. Third-Party Links")}</h3>
            <p>
              {t("privacy.section8.text", "Our app or website may contain links to third-party websites. We are not responsible for their privacy practices.")}
            </p>
          </section>

          {/* 9 */}
          <section className="privacy-section">
            <h3>{t("privacy.section9.title", "9. Changes to This Policy")}</h3>
            <p>
              {t("privacy.section9.text", "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.")}
            </p>
          </section>

          {/* 10 */}
          <section className="privacy-section">
            <h3>{t("privacy.section10.title", "10. Contact Us")}</h3>
            <p>{t("privacy.section10.text", "If you have any questions about this Privacy Policy:")}</p>

            <ul>
              <li> {t("privacy.section10.email", "Email: support@sadhanacart.com")}</li>
              <li> {t("privacy.section10.phone", "Phone: +91 94488 10877")}</li>
              <li>
                {t("privacy.section10.address", "Address:")} <br />
                {addressLines.map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </li>
            </ul>
          </section>

          {/* 🔝 Scroll Top */}
          <a href="#top" className="back-to-top-button">⬆️</a>

        </main>
      </div>
    </div>
  );
}

export default PrivacyPolicy;