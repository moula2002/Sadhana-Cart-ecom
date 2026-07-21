import React, { useEffect } from "react";
import BestProducts from "../components/category/BestProducts";
import { useTranslation } from "react-i18next";

function BestProductsPage() {
  const { t } = useTranslation();
  // Ensure we start at top of the page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bsp-page-wrapper">
      <div className="bsp-inner">
        <div className="bsp-card">
          <div className="bsp-header">
            <h2 className="bsp-title">{t("nav.bestSellers", "Best Sellers")}</h2>
          </div>
          <BestProducts />
        </div>
      </div>

      <style>{`
        .bsp-page-wrapper {
          min-height: 100vh;
          padding: 40px 20px;
          background: #f8f9fa;
          transition: background 0.3s ease;
        }
        .bsp-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .bsp-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 30px;
        }
        .bsp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 16px;
        }
        .bsp-title {
          margin: 0;
          font-weight: bold;
          color: #1a202c;
          font-size: 24px;
        }

        /* ── Dark mode overrides ── */
        .dark-theme .bsp-page-wrapper,
        [data-bs-theme="dark"] .bsp-page-wrapper,
        [data-theme="dark"] .bsp-page-wrapper {
          background: #0f172a !important;
        }
        .dark-theme .bsp-card,
        [data-bs-theme="dark"] .bsp-card,
        [data-theme="dark"] .bsp-card {
          background: #1e293b !important;
          box-shadow: 0 2px 16px rgba(0,0,0,0.4) !important;
        }
        .dark-theme .bsp-header,
        [data-bs-theme="dark"] .bsp-header,
        [data-theme="dark"] .bsp-header {
          border-bottom-color: #334155 !important;
        }
        .dark-theme .bsp-title,
        [data-bs-theme="dark"] .bsp-title,
        [data-theme="dark"] .bsp-title {
          color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}

export default BestProductsPage;
