import React from 'react';
import './TermsAndConditions.css';
import { useTranslation } from "react-i18next";

function TermsAndConditions() {
  const { t } = useTranslation();

  const sections = [
    {
      title: t("terms.section1.title"),
      points: [
        t("terms.section1.point1"),
        t("terms.section1.point2"),
        t("terms.section1.point3")
      ]
    },
    {
      title: t("terms.section2.title"),
      points: [
        t("terms.section2.point1"),
        t("terms.section2.point2"),
        t("terms.section2.point3")
      ]
    },
    {
      title: t("terms.section3.title"),
      points: [
        t("terms.section3.point1"),
        t("terms.section3.point2"),
        t("terms.section3.point3")
      ]
    },
    {
      title: t("terms.section4.title"),
      points: [
        t("terms.section4.point1"),
        t("terms.section4.point2"),
        t("terms.section4.point3")
      ]
    },
    {
      title: t("terms.section5.title"),
      points: [
        t("terms.section5.point1"),
        t("terms.section5.point2"),
        t("terms.section5.point3")
      ]
    },
    {
      title: t("terms.section6.title"),
      points: [
        t("terms.section6.point1"),
        t("terms.section6.point2"),
        t("terms.section6.point3")
      ]
    },
    {
      title: t("terms.section7.title"),
      points: [
        t("terms.section7.point1"),
        t("terms.section7.point2"),
        t("terms.section7.point3")
      ]
    }
  ];

  const whatsappLink = `https://wa.me/9448810877?text=Hello%20SadhanaCart%20Support`;

  return (
    <div className="terms-container" id="top">

      <header className="terms-header-bg">
        <div className="terms-header-content">
          <h1>{t("terms.header")}</h1>
        </div>
      </header>

      <div className="terms-page-container">
        <main className="terms-main-content">

          <div className="terms-intro">
            <h2>{t("terms.title")}</h2>
            <p>{t("terms.intro")}</p>
          </div>

          {sections.map((section, index) => (
            <section key={index} className="terms-section">
              <h3 className="section-title-highlight">{section.title}</h3>
              <ul className="terms-list">
                {section.points.map((point, pIndex) => (
                  <li key={pIndex}>{point}</li>
                ))}
              </ul>
            </section>
          ))}

          <div className="acceptance-box">
            <h3>{t("terms.acceptanceTitle")}</h3>
            <p>{t("terms.acceptanceText")}</p>

            <div className="terms-buttons-container">
              <button className="terms-btn-primary">
                {t("terms.understandButton")}
              </button>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-contact-btn"
              >
                {t("terms.contactSupport")}
              </a>
            </div>
          </div>

          <a href="#" className="scroll-to-top-btn">
            <i className="fas fa-arrow-up"></i>
          </a>

        </main>
      </div>
    </div>
  );
}

export default TermsAndConditions;
