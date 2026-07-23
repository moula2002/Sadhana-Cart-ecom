import React from 'react';
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaUser, FaSearch, FaCreditCard } from "react-icons/fa";
import { FiTruck, FiRefreshCw, FiFileMinus, FiAward, FiHeadphones } from "react-icons/fi";
import { TbTicket } from "react-icons/tb";
import { useTranslation } from "react-i18next";

const CustomerSupportCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const popularTopics = [
    { icon: <FiTruck style={{ color: "#0a45bd", fontSize: "22px" }} />, label: t("trackMyOrder", "Track My Order") },
    { icon: <FiRefreshCw style={{ color: "#0a45bd", fontSize: "22px" }} />, label: t("returnsAndRefunds", "Returns & Refunds") },
    { icon: <FiFileMinus style={{ color: "#0a45bd", fontSize: "22px" }} />, label: t("cancellation", "Cancellation") },
    { icon: <FaCreditCard style={{ color: "#0a45bd", fontSize: "20px" }} />, label: t("paymentOptions", "Payment Options") },
    { icon: <FaUser style={{ color: "#0a45bd", fontSize: "20px" }} />, label: t("accountAndProfile", "Account & Profile") },
    { icon: <TbTicket style={{ color: "#0a45bd", fontSize: "24px" }} />, label: t("offersAndCoupons", "Offers & Coupons") }
  ];

  return (
    <div className="cs-wrapper">
      <div className="cs-container">
        
        {/* Title */}
        <div className="cs-title-header">
          <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "bold" }}>{t("helpAndSupportPage", "Help & Support Page")}</h2>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="cs-dashboard-layout">
          
          {/* Sidebar Menu */}
          <div className="cs-sidebar">
            <h6 className="cs-sidebar-title">{t("myAccount", "My Account")}</h6>
            <ul className="sidebar-menu-list" style={{ marginTop: "0", listStyle: "none", padding: 0 }}>
              <li className="cs-menu-item" onClick={() => navigate("/orders")}>
                <FaUser className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t("myOrders", "My Orders")}</span>
              </li>
              <li className="cs-menu-item" onClick={() => navigate("/rewards")}>
                <FiAward className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t("accountRewards", "Account Rewards")}</span>
              </li>
              <li className="cs-menu-item" onClick={() => navigate("/save-address")}>
                <FaMapMarkerAlt className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t("savedAddresses", "Saved Addresses")}</span>
              </li>
              <li className="cs-menu-item-active">
                <FiHeadphones className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontWeight: "bold", fontSize: '14px' }}>{t("helpCenter", "Help Center")}</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="cs-main-content">
            
            <h4 className="fw-bold mb-4 cs-text-dark" style={{ fontSize: "20px" }}>{t("howCanWeHelpYou", "How can we help you?")}</h4>
            
            {/* Search Input */}
            <div style={{ position: 'relative', maxWidth: '550px', marginBottom: '40px' }}>
              <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
              <input 
                type="text" 
                placeholder={t("searchForHelpTopics", "Search for help topics...")} 
                className="cs-search-input"
              />
            </div>

            <h5 className="fw-bold mb-3 cs-text-dark" style={{ fontSize: "16px" }}>{t("popularTopics", "Popular Topics")}</h5>
            
            {/* Topics Grid */}
            <div className="cs-topics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '550px', marginBottom: '40px' }}>
              {popularTopics.map((topic, idx) => (
                <div key={idx} className="cs-topic-card">
                  <div className="cs-topic-icon-bg">
                    {topic.icon}
                  </div>
                  <span className="cs-topic-text">
                    {topic.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Still Need Help Box */}
            <div className="cs-help-box">
              <h5 className="fw-bold mb-1" style={{ color: '#1e3a8a', fontSize: '16px' }}>{t("stillNeedHelp", "Still need help?")}</h5>
              <p className="cs-help-box-text">{t("supportTeamHere", "Our support team is here for you")}</p>
              
              <div className="cs-help-actions" style={{ display: 'flex', gap: '16px' }}>
                <button style={{ 
                  background: '#0a45bd', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 24px', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  {t("chatWithUs", "Chat with Us")}
                </button>
                <button className="cs-btn-secondary">
                  {t("contactUs", "Contact Us")}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <style>{`
        .cs-wrapper {
          background: #f8f9fa;
          padding: 20px;
          min-height: 100vh;
        }
        .cs-container {
          max-width: 1200px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          background: white;
        }
        .cs-title-header {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #0a45bd;
          color: white;
          padding: 16px 24px;
          margin: 0;
          border-radius: 10px 10px 0 0;
        }
        .cs-dashboard-layout {
          margin: 0;
          border-radius: 0 0 10px 10px;
          background: white;
          display: flex;
          flex-direction: row;
        }
        .cs-sidebar {
          border-right: 1px solid #e0e0e0;
          padding: 24px 16px;
          min-height: 600px;
          min-width: 250px;
          flex-shrink: 0;
        }
        .cs-sidebar-title {
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 20px;
          padding-left: 12px;
          font-size: 15px;
        }
        .cs-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
          color: #4a5568;
        }
        .cs-menu-item:hover {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .cs-menu-item-active {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          cursor: pointer;
          background: #e8f0fe;
          color: #0a45bd;
          border-radius: 6px;
        }
        .cs-main-content {
          padding: 40px 60px;
          flex-grow: 1;
        }
        .cs-text-dark {
          color: #1a202c !important;
        }
        .cs-search-input {
          width: 100%;
          padding: 12px 12px 12px 48px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          outline: none;
          font-size: 14px;
          background: white;
          color: #1a202c;
        }
        .cs-topic-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          padding: 10px;
          transition: transform 0.2s;
        }
        .cs-topic-card:hover {
          transform: scale(1.05);
        }
        .cs-topic-icon-bg {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .cs-topic-text {
          font-size: 12px;
          font-weight: 600;
          color: #2d3748;
          text-align: center;
        }
        .cs-help-box {
          background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
          border-radius: 12px;
          padding: 30px;
          max-width: 550px;
        }
        .cs-help-box-text {
          color: #475569;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .cs-btn-secondary {
          background: white;
          color: #0a45bd;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          cursor: pointer;
        }

        /* ── Dark Mode ── */
        .dark-theme .cs-wrapper,
        [data-bs-theme="dark"] .cs-wrapper,
        [data-theme="dark"] .cs-wrapper {
          background: #0f172a;
        }
        .dark-theme .cs-container,
        [data-bs-theme="dark"] .cs-container,
        [data-theme="dark"] .cs-container {
          background: #1e293b;
          border-color: #334155;
        }
        .dark-theme .cs-title-header,
        [data-bs-theme="dark"] .cs-title-header,
        [data-theme="dark"] .cs-title-header {
          background: #1e3a8a;
        }
        .dark-theme .cs-dashboard-layout,
        [data-bs-theme="dark"] .cs-dashboard-layout,
        [data-theme="dark"] .cs-dashboard-layout {
          background: #1e293b;
        }
        .dark-theme .cs-sidebar,
        [data-bs-theme="dark"] .cs-sidebar,
        [data-theme="dark"] .cs-sidebar {
          border-color: #334155;
        }
        .dark-theme .cs-sidebar-title,
        [data-bs-theme="dark"] .cs-sidebar-title,
        [data-theme="dark"] .cs-sidebar-title {
          color: #f8fafc;
        }
        .dark-theme .cs-menu-item,
        [data-bs-theme="dark"] .cs-menu-item,
        [data-theme="dark"] .cs-menu-item {
          color: #94a3b8;
        }
        .dark-theme .cs-menu-item:hover,
        [data-bs-theme="dark"] .cs-menu-item:hover,
        [data-theme="dark"] .cs-menu-item:hover {
          background: #334155;
          color: #f1f5f9;
        }
        .dark-theme .cs-menu-item-active,
        [data-bs-theme="dark"] .cs-menu-item-active,
        [data-theme="dark"] .cs-menu-item-active {
          background: #1e3a8a;
          color: #60a5fa;
        }
        .dark-theme .cs-text-dark,
        [data-bs-theme="dark"] .cs-text-dark,
        [data-theme="dark"] .cs-text-dark {
          color: #f8fafc !important;
        }
        .dark-theme .cs-search-input,
        [data-bs-theme="dark"] .cs-search-input,
        [data-theme="dark"] .cs-search-input {
          background: #0f172a;
          border-color: #334155;
          color: #f8fafc;
        }
        .dark-theme .cs-topic-icon-bg,
        [data-bs-theme="dark"] .cs-topic-icon-bg,
        [data-theme="dark"] .cs-topic-icon-bg {
          background-color: #334155;
        }
        .dark-theme .cs-topic-text,
        [data-bs-theme="dark"] .cs-topic-text,
        [data-theme="dark"] .cs-topic-text {
          color: #cbd5e1;
        }
        .dark-theme .cs-help-box,
        [data-bs-theme="dark"] .cs-help-box,
        [data-theme="dark"] .cs-help-box {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%);
          border: 1px solid #334155;
        }
        .dark-theme .cs-help-box-text,
        [data-bs-theme="dark"] .cs-help-box-text,
        [data-theme="dark"] .cs-help-box-text {
          color: #cbd5e1;
        }
        .dark-theme .cs-btn-secondary,
        [data-bs-theme="dark"] .cs-btn-secondary,
        [data-theme="dark"] .cs-btn-secondary {
          background: #0f172a;
          color: #60a5fa;
          border: 1px solid #334155;
        }

        /* ── Mobile & Tablet Responsiveness ── */
        @media (max-width: 991px) {
          .cs-wrapper {
            padding: 12px 10px !important;
          }
          .cs-container {
            border-radius: 8px !important;
          }
          .cs-dashboard-layout {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .cs-sidebar {
            border-right: none !important;
            border-bottom: 1px solid #e0e0e0 !important;
            padding: 12px !important;
            min-height: auto !important;
            min-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .cs-sidebar-title {
            margin-bottom: 12px !important;
            font-size: 14px !important;
            padding-left: 4px !important;
          }
          .sidebar-menu-list {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            white-space: nowrap !important;
            gap: 8px !important;
            padding: 4px 0 !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .sidebar-menu-list::-webkit-scrollbar {
            display: none !important;
          }
          .cs-menu-item,
          .cs-menu-item-active {
            display: inline-flex !important;
            align-items: center !important;
            padding: 8px 16px !important;
            border-radius: 20px !important;
            font-size: 13px !important;
            white-space: nowrap !important;
            gap: 6px !important;
          }
          .cs-main-content {
            padding: 24px 16px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .cs-help-box {
            padding: 20px !important;
            max-width: 100% !important;
          }
        }
        @media (max-width: 576px) {
          .cs-topics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            max-width: 100% !important;
          }
          .cs-help-actions {
            flex-direction: column !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .cs-help-actions button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerSupportCenter;