import React, { useEffect } from "react";
import FeatureProducts from "../components/category/FeatureProducts";
import { useTranslation } from "react-i18next";

function NewArrivalsPage() {
  const { t } = useTranslation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="nap-page-wrapper">
      <div className="nap-inner">
        <div className="nap-card">
          <div className="nap-header">
            <h2 className="nap-title">{t("nav.newArrivals", "New Arrivals")}</h2>
          </div>
          <FeatureProducts showCart={true} />
        </div>
      </div>

      <style>{`
        .nap-page-wrapper {
          min-height: 100vh;
          padding: 40px 20px;
          background: #f8f9fa;
          transition: background 0.3s ease;
        }
        .nap-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .nap-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 30px;
        }
        .nap-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 16px;
        }
        .nap-title {
          margin: 0;
          font-weight: bold;
          color: #1a202c;
          font-size: 24px;
        }

        /* ── Dark mode overrides ── */
        .dark-theme .nap-page-wrapper,
        [data-bs-theme="dark"] .nap-page-wrapper,
        [data-theme="dark"] .nap-page-wrapper {
          background: #0f172a !important;
        }
        .dark-theme .nap-card,
        [data-bs-theme="dark"] .nap-card,
        [data-theme="dark"] .nap-card {
          background: #1e293b !important;
          box-shadow: 0 2px 16px rgba(0,0,0,0.4) !important;
        }
        .dark-theme .nap-header,
        [data-bs-theme="dark"] .nap-header,
        [data-theme="dark"] .nap-header {
          border-bottom-color: #334155 !important;
        }
        .dark-theme .nap-title,
        [data-bs-theme="dark"] .nap-title,
        [data-theme="dark"] .nap-title {
          color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

export default NewArrivalsPage;
