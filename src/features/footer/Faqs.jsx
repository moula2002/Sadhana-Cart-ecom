import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Truck, LogIn, RefreshCcw, Wallet, Undo2, PackageOpen, XCircle, 
  ChevronDown, ChevronRight, ArrowLeft, ArrowUp
} from "lucide-react";
import "./Faqs.css";

const iconComponentMap = {
  "fas fa-truck": Truck,
  "fas fa-sign-in-alt": LogIn,
  "fas fa-exchange-alt": RefreshCcw,
  "fas fa-wallet": Wallet,
  "fas fa-undo-alt": Undo2,
  "fas fa-box-open": PackageOpen,
  "fas fa-times-circle": XCircle,
};

function Faqs() {
  const [openCollapseId, setOpenCollapseId] = useState(null);
  const navigate = useNavigate();

  const faqTopics = [
    { title: "Delivery Related FAQs", iconKey: "fas fa-truck", collapseId: "delivery" },
    { title: "Login Related FAQs", iconKey: "fas fa-sign-in-alt", collapseId: "login" },
    { title: "Refund Related FAQs", iconKey: "fas fa-exchange-alt", collapseId: "refund" },
    { title: "Payment Related FAQs", iconKey: "fas fa-wallet", collapseId: "payment" },
    { title: "Return Related FAQs", iconKey: "fas fa-undo-alt", collapseId: "return" },
    { title: "Pickup Related FAQs", iconKey: "fas fa-box-open", collapseId: "pickup" },
    { title: "Cancellation Related FAQs", iconKey: "fas fa-times-circle", collapseId: "cancellation" },
  ];

  const faqData = {
    delivery: [
      "How quickly can I get my order delivered?",
      "What do the different order statuses in 'My Orders' mean?",
      "What are the standard shipping speeds and delivery charges?",
      "My order has reached the nearest delivery hub, but why isn't it out for delivery yet?",
      "Why can't I track my order even though it has been shipped?",
      "What should I do if my order is approved but hasn't been shipped yet?",
      "I have a complaint about the courier executive who came to deliver my order.",
      "Can I take the shipment after opening and checking the contents inside?",
    ],
    login: [
      "Why am I seeing a 'Google Sign-in Failed' error?",
      "What should I do if I can't log in with my Google account?",
      "Can I use a different Google account to log in?",
      "Is my Google login information secure with Sadhana Cart?",
    ],
    refund: [
      "Can I get a refund if I received a damaged or incorrect item?",
      "What should I do if my refund hasn't been received?",
      "What items are eligible for a refund?",
      "How long does it take to process a refund?",
      "How do I request a refund for an order on Sadhana Cart?",
    ],
    payment: [
      "How do I know if my payment was successful?",
      "Can I change the payment method after placing an order?",
      "What payment methods does Sadhana Cart accept?",
      "Is it safe to enter my payment details on Sadhana Cart?",
      "Why was my payment declined during checkout?",
    ],
    return: [
      "What is Sadhana Cart's return policy?",
      "How do I initiate a return request?",
      "What if the product I received is damaged or defective?",
      "Can I return an item after the return window has closed?",
      "Will I have to pay for the return shipping?",
      "How long does it take for the pickup executive to collect the return?",
    ],
    pickup: [
      "Does Sadhana Cart offer a pickup option for returns?",
      "Is there a cost for the return pickup service?",
      "How do I schedule a pickup for my return?",
      "Do I need to package the item for pickup?",
      "What should I do if the pickup courier doesn't arrive?",
    ],
    cancellation: [
      "Can I cancel an order after it has been placed?",
      "How long does it take to process a cancellation refund?",
      "How can I cancel an order on Sadhana Cart?",
      "What should I do if my cancellation request is denied?",
      "Will I be charged for cancelling an order?",
    ],
  };

  const handleToggle = (id) => setOpenCollapseId(openCollapseId === id ? null : id);
  const handleBack = () => navigate(-1);

  return (
    <div className="faqs-container" id="top">
      
      {/* Header */}
      <header className="faqs-header-bg">
        <div className="faqs-header-content">
          <ArrowLeft 
            className="faqs-back-icon" 
            onClick={handleBack} 
          />
          <h1 className="faqs-header-title">Sadhana Cart</h1>
          <span className="faqs-header-subtitle">FAQs</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="faqs-main-content">
        <h2 className="help-topics-title">Help Topics</h2>
        <div className="faqs-topics-container">
          {faqTopics.map((topic) => {
            const IconComponent = iconComponentMap[topic.iconKey];
            const isActive = openCollapseId === topic.collapseId;

            return (
              <div key={topic.collapseId} className="faq-item">
                <button
                  className={`faq-button ${isActive ? "active" : ""}`}
                  onClick={() => handleToggle(topic.collapseId)}
                  aria-expanded={isActive}
                >
                  <div className="faq-button-content">
                    {IconComponent && <IconComponent className="faq-topic-icon" />}
                    <span className="faq-topic-title">{topic.title}</span>
                  </div>
                  <ChevronDown className={`faq-arrow ${isActive ? "rotate-180" : ""}`} />
                </button>

                {isActive && (
                  <div className="accordion-body">
                    {faqData[topic.collapseId]?.map((q, i) => (
                      <div key={i} className="faq-question">
                        <p className="faq-question-text">{q}</p>
                        <ChevronRight className="faq-question-arrow"/>
                      </div>
                    ))}
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