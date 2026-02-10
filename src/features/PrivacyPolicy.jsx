import React from 'react';
// NOTE: Make sure this CSS file is located in the same folder as this JSX file.
import './PrivacyPolicy.css'; 

function PrivacyPolicy() {
  const sections = [
    { title: "1. Information We Collect", points: ["Personal Information (e.g., name, email, phone number)", "Address and Payment details", "Vendor and product data", "Usage and device data"] },
    { title: "2. How We Use Your Information", points: ["To process orders and payments", "To connect vendors with customers", "For customer support and service improvements", "To send promotional emails and app notifications"] },
    { title: "3. Data Sharing & Disclosure", points: ["We do not sell your personal data", "We may share information with vendors or delivery partners to fulfill your orders", "Data may be shared with third-party services for analytics and payment processing"] },
    { title: "4. Cookies & Tracking", points: ["We use cookies to personalize your experience", "Cookies help us understand user behavior and improve functionality"] },
    { title: "5. Your Rights", points: ["You can access, update, or delete your data anytime", "You can opt-out of marketing communications", "You can deactivate your account or vendor profile upon request"] },
    { title: "6. Policy Updates", points: ["We may update this Privacy Policy from time to time. Changes will be posted in the app with updated effective dates."] }
  ];

  return (
    <div className="privacy-container" id="top">
      
      {/* --- Orange Header Section --- */}
      <header className="privacy-header-bg">
        <div className="privacy-header-content">
          <div className="privacy-header-icon-wrapper">
             {/* Icon from your screenshot is an image or font icon, using Font Awesome class here for structure */}
             <i className="fas fa-shield-alt privacy-icon"></i> 
             {/* The current Unicode icon (🛡️) works fine too, but using a class allows for easier styling */}
          </div>
          <h1 className="header-title">Privacy & Policies</h1>
          <h2 className="header-subtitle">Your Privacy Matters</h2>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <div className="container"> 
        <main className="privacy-main-content">
          
          {/* Welcome/Intro Section */}
          <div className="privacy-intro">
            <h2 className="main-policy-title">Welcome to Our Privacy Policy</h2>
            <p>
              Your privacy is critically important to us. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our e-commerce multi-vendor platform.
            </p>
          </div>

          {/* Dynamic Sections */}
          {sections.map((section, index) => (
            <section key={index} className="privacy-section">
              <h3 className="section-title-highlight">{section.title}</h3>
              {section.points && section.points.length > 0 && (
                <ul className="privacy-list">
                  {section.points.map((point, pIndex) => (
                    <li key={pIndex}>{point}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* --- Help/Contact Box --- */}
          <div className="help-box">
             <i className="fas fa-headset help-icon"></i> {/* Font Awesome icon for support */}
            <h3>Need Help? Contact Our Support Team</h3>
            <p>
              If you have any questions about our Privacy Policy, please contact our support team.
            </p>
            <div className="d-flex justify-content-center mt-3">
              {/* NOTE: Bootstrap btn-primary is used but overridden by custom CSS */}
              <button className="btn help-btn-primary">Contact Support</button>
            </div>
            <p className="effective-date">
              Effective Date: April 16, 2025
            </p>
          </div>
          
           {/* Scroll-to-Top Button Wrapper */}
           <a href="#top" className="back-to-top-button">⬆️</a>

        </main>
      </div>
    </div>
  );
}

export default PrivacyPolicy;