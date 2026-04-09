import React from "react";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
  return (
    <div className="privacy-container" id="top">

      {/* 🔶 Header */}
      <header className="privacy-header-bg">
        <div className="privacy-header-content">
          <i className="fas fa-shield-alt privacy-icon"></i>
          <h1 className="header-title">Privacy Policy</h1>
          <h2 className="header-subtitle">SadhanaCart</h2>
        </div>
      </header>

      {/* 🔷 Content */}
      <div className="container">
        <main className="privacy-main-content">

          <p><strong>Effective Date:</strong> [01-04-2026]</p>

          <p>
            Welcome to <strong>SadhanaCart</strong>. Your privacy is important to us. 
            This Privacy Policy explains how we collect, use, and protect your information 
            when you use our website and mobile application.
          </p>

          {/* 1 */}
          <section className="privacy-section">
            <h3>1. Information We Collect</h3>

            <h5>a. Personal Information</h5>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Shipping and billing address</li>
            </ul>

            <h5>b. Account Information</h5>
            <ul>
              <li>Login credentials (if you create an account)</li>
            </ul>

            <h5>c. Transaction Information</h5>
            <ul>
              <li>Order details</li>
              <li>Payment information (processed securely via third-party payment providers)</li>
            </ul>

            <h5>d. Device & Usage Information</h5>
            <ul>
              <li>Device type</li>
              <li>IP address</li>
              <li>Browser type</li>
              <li>App usage data</li>
            </ul>
          </section>

          {/* 2 */}
          <section className="privacy-section">
            <h3>2. How We Use Your Information</h3>
            <ul>
              <li>Process and deliver your orders</li>
              <li>Provide customer support</li>
              <li>Improve our app and services</li>
              <li>Send order updates and notifications</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
          </section>

          {/* 3 */}
          <section className="privacy-section">
            <h3>3. Sharing Your Information</h3>
            <p>We do not sell your personal data. We may share your information with:</p>
            <ul>
              <li>Payment gateways (to process payments securely)</li>
              <li>Delivery partners (to ship your orders)</li>
              <li>Service providers (hosting, analytics, etc.)</li>
            </ul>
            <p>These partners are required to keep your information secure.</p>
          </section>

          {/* 4 */}
          <section className="privacy-section">
            <h3>4. Cookies and Tracking Technologies</h3>
            <ul>
              <li>Enhance user experience</li>
              <li>Analyze app and website traffic</li>
              <li>Remember your preferences</li>
            </ul>
            <p>You can disable cookies through your browser settings.</p>
          </section>

          {/* 5 */}
          <section className="privacy-section">
            <h3>5. Data Security</h3>
            <p>
              We take appropriate security measures to protect your data from 
              unauthorized access, alteration, or disclosure.
            </p>
          </section>

          {/* 6 */}
          <section className="privacy-section">
            <h3>6. Your Rights</h3>
            <ul>
              <li>Access your personal data</li>
              <li>Update or correct your information</li>
              <li>Request deletion of your account</li>
            </ul>
          </section>

          {/* 7 */}
          <section className="privacy-section">
            <h3>7. Children’s Privacy</h3>
            <p>
              SadhanaCart does not knowingly collect data from children under 13 years of age. 
              If we become aware of such data, we will delete it.
            </p>
          </section>

          {/* 8 */}
          <section className="privacy-section">
            <h3>8. Third-Party Links</h3>
            <p>
              Our app or website may contain links to third-party websites. 
              We are not responsible for their privacy practices.
            </p>
          </section>

          {/* 9 */}
          <section className="privacy-section">
            <h3>9. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. 
              Changes will be posted on this page with an updated effective date.
            </p>
          </section>

          {/* 10 */}
          <section className="privacy-section">
            <h3>10. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy:</p>

            <ul>
              <li>📧 Email: support@sadhanacart.com</li>
              <li>📞 Phone: +91 94488 10877</li>
              <li>
                📍 Address: <br />
                Ground Floor, Ward No. 24,<br />
                A No. 4-14-155/36A,<br />
                Teachers Colony, Near LIC Office,<br />
                Gangawati - 583222,<br />
                Koppal District, Karnataka, India
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