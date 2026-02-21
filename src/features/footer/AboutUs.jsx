import React from "react";
import "./AboutUs.css";
import aboutImg from "../../Images/aboutusimg1.jpg";
import { useTranslation } from "react-i18next";

function AboutUs() {
  const { t } = useTranslation();

  const teamMembers = [
    { name: "Sadhaka Anand", title: "Founder & Spiritual Visionary" },
    { name: "Priya Sharma", title: "Ethical Product Curator" },
    { name: "Rahul Verma", title: "Operations & Fulfillment" },
    { name: "Meera Iyer", title: "Community & Support" },
  ];

  return (
    <div className="about-container" id="top">
      {/* ================= HEADER ================= */}
      <header className="about-header-bg">
        <div className="about-header-container text-center">
          <h1 className="about-title">
            {t("about.header")}
          </h1>
          <p className="about-subtitle">
            {t("about.subtitle")}
          </p>
        </div>
      </header>

      <div className="about-page-container">
        {/* ================= IMAGE + CONTENT ================= */}
        <div className="about-content-section">
          <div className="about-image-container">
            <img
              src={aboutImg}
              alt="Sadhana Cart"
              className="about-hero-image"
            />
          </div>

          <div className="about-text-container">
            <h2 className="section-title">
              {t("about.title")}
            </h2>

            <p className="lead-text">
              {t("about.lead")}
            </p>

            <p className="paragraph">
              {t("about.description")}
            </p>

            <div className="info-card">
              <h4>{t("about.missionTitle")}</h4>
              <p>{t("about.missionText")}</p>
            </div>

            <div className="info-card">
              <h4>{t("about.visionTitle")}</h4>
              <p>{t("about.visionText")}</p>
            </div>
          </div>
        </div>

        {/* ================= VALUE PROPOSITION ================= */}
        <div className="about-section">
          <h2 className="section-title text-center">
            {t("about.differentTitle")}
          </h2>

          <div className="features-grid">
            <div className="feature-box">
              {t("about.feature1")}
            </div>
            <div className="feature-box">
              {t("about.feature2")}
            </div>
            <div className="feature-box">
              {t("about.feature3")}
            </div>
            <div className="feature-box">
              {t("about.feature4")}
            </div>
          </div>
        </div>

        {/* ================= TEAM ================= */}
        <div className="about-section text-center">
          <h2 className="section-title">
            {t("about.teamTitle")}
          </h2>

          <p className="paragraph">
            {t("about.teamSubtitle")}
          </p>

          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-card">
                <i className="fas fa-user-circle team-icon"></i>
                <h5>{member.name}</h5>
                <p>{member.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================= CTA ================= */}
        <div className="cta-box text-center">
          <h3>{t("about.ctaTitle")}</h3>
          <p>{t("about.ctaText")}</p>
          <button className="cta-btn">
            {t("about.shopNow")}
          </button>
        </div>

        {/* Scroll to top */}
        <a href="#top" className="scroll-to-top-btn">↑</a>
      </div>
    </div>
  );
}

export default AboutUs;
