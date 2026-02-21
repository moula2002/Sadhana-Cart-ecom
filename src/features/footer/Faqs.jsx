import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Truck, LogIn, RefreshCcw, Wallet, Undo2, PackageOpen, XCircle,
  ChevronDown, ChevronRight, ArrowLeft, ArrowUp
} from "lucide-react";
import "./Faqs.css";

const iconComponentMap = {
  delivery: Truck,
  login: LogIn,
  refund: RefreshCcw,
  payment: Wallet,
  return: Undo2,
  pickup: PackageOpen,
  cancellation: XCircle,
};

function Faqs() {
  const { t } = useTranslation();
  const [openCollapseId, setOpenCollapseId] = useState(null);
  const navigate = useNavigate();

  const faqTopics = [
    "delivery",
    "login",
    "refund",
    "payment",
    "return",
    "pickup",
    "cancellation",
  ];

  const handleToggle = (id) =>
    setOpenCollapseId(openCollapseId === id ? null : id);

  const handleBack = () => navigate(-1);

  return (
    <div className="faqs-container" id="top">

      {/* Header */}
      <header className="faqs-header-bg">
        <div className="faqs-header-content">
          <ArrowLeft className="faqs-back-icon" onClick={handleBack} />
          <h1 className="faqs-header-title">{t("brandName")}</h1>
          <span className="faqs-header-subtitle">{t("faqs.title")}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="faqs-main-content">
        <h2 className="help-topics-title">{t("faqs.helpTopics")}</h2>

        <div className="faqs-topics-container">
          {faqTopics.map((topic) => {
            const IconComponent = iconComponentMap[topic];
            const isActive = openCollapseId === topic;

            return (
              <div key={topic} className="faq-item">
                <button
                  className={`faq-button ${isActive ? "active" : ""}`}
                  onClick={() => handleToggle(topic)}
                >
                  <div className="faq-button-content">
                    <IconComponent className="faq-topic-icon" />
                    <span className="faq-topic-title">
                      {t(`faqs.${topic}.title`)}
                    </span>
                  </div>
                  <ChevronDown className={`faq-arrow ${isActive ? "rotate-180" : ""}`} />
                </button>

                {isActive && (
                  <div className="accordion-body">
                    {[1,2,3,4,5,6,7,8].map((num) => {
                      const question = t(`faqs.${topic}.q${num}`);
                      if (!question) return null;

                      return (
                        <div key={num} className="faq-question">
                          <p className="faq-question-text">{question}</p>
                          <ChevronRight className="faq-question-arrow"/>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Scroll to Top */}
      <a href="#top" className="back-to-top-button">
        <ArrowUp className="scroll-to-top-icon"/>
      </a>
    </div>
  );
}

export default Faqs;
