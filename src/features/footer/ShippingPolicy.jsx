import React from 'react';
import './ShippingPolicy.css';
import { useTranslation } from "react-i18next";
import {
  MdAccessTime,
  MdLocalShipping,
  MdCalendarToday,
  MdAttachMoney,
  MdPublic,
  MdWatchLater,
  MdWarning,
  MdHelpOutline
} from 'react-icons/md';

// --- Reusable Policy Section Component ---
const PolicySection = ({ number, title, icon: Icon, children, colorClass = '' }) => (
  <div className={`policy-card ${colorClass}`}>
    <div className="policy-title">
      <Icon />
      <h3>{number}. {title}</h3>
    </div>
    <ul>{children}</ul>
  </div>
);

const ShippingPolicy = () => {
  const { t } = useTranslation();

  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=support@sadhanacart.com&su=Shipping%20Inquiry&body=Hello%20SadhanaCart%20Team,%0A%0AI%20have%20a%20question%20regarding%20shipping.%20Please%20assist.%0A%0AThank%20you!`;

  return (
    <div className="shipping-policy-page">

      {/* Header */}
      <div className="shipping-header">
        <h1>{t("shippingPolicy.title")}</h1>
        <p>{t("shippingPolicy.subtitle")}</p>
      </div>

      <div className="shipping-container">

        {/* Intro */}
        <h2 className="shipping-intro-title">
          {t("shippingPolicy.title")}
        </h2>

        <p className="shipping-intro-text">
          {t("shippingPolicy.intro")}
        </p>

        {/* Section 1 */}
        <PolicySection
          number={1}
          title={t("shippingPolicy.section1.title")}
          icon={MdAccessTime}
        >
          <li>{t("shippingPolicy.section1.point1")}</li>
          <li>{t("shippingPolicy.section1.point2")}</li>
        </PolicySection>

        {/* Section 2 */}
        <PolicySection
          number={2}
          title={t("shippingPolicy.section2.title")}
          icon={MdLocalShipping}
        >
          <li>{t("shippingPolicy.section2.point1")}</li>
          <li>{t("shippingPolicy.section2.point2")}</li>
        </PolicySection>

        {/* Section 3 */}
        <PolicySection
          number={3}
          title={t("shippingPolicy.section3.title")}
          icon={MdCalendarToday}
        >
          <li>{t("shippingPolicy.section3.point1")}</li>
          <li>{t("shippingPolicy.section3.point2")}</li>
          <li>{t("shippingPolicy.section3.point3")}</li>
        </PolicySection>

        {/* Section 4 */}
        <PolicySection
          number={4}
          title={t("shippingPolicy.section4.title")}
          icon={MdAttachMoney}
        >
          <li>{t("shippingPolicy.section4.point1")}</li>
          <li>{t("shippingPolicy.section4.point2")}</li>
        </PolicySection>

        {/* Section 5 */}
        <PolicySection
          number={5}
          title={t("shippingPolicy.section5.title")}
          icon={MdPublic}
          colorClass="red-highlight"
        >
          <li>{t("shippingPolicy.section5.point1")}</li>
          <li>{t("shippingPolicy.section5.point2")}</li>
        </PolicySection>

        {/* Section 6 */}
        <PolicySection
          number={6}
          title={t("shippingPolicy.section6.title")}
          icon={MdWatchLater}
          colorClass="red-highlight"
        >
          <li>{t("shippingPolicy.section6.point1")}</li>
          <li>{t("shippingPolicy.section6.point2")}</li>
        </PolicySection>

        {/* Section 7 */}
        <PolicySection
          number={7}
          title={t("shippingPolicy.section7.title")}
          icon={MdWarning}
          colorClass="red-highlight"
        >
          <li>{t("shippingPolicy.section7.point1")}</li>
        </PolicySection>

        {/* Help Section */}
        <div className="help-card">
          <h4>
            <MdHelpOutline /> {t("shippingPolicy.help.title")}
          </h4>
          <p>{t("shippingPolicy.help.description")}</p>

          <a
            href={gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn"
          >
            {t("shippingPolicy.help.button")}
          </a>
        </div>

        {/* Scroll Button */}
        <a href="#" className="scroll-to-top-btn">
          ↑
        </a>

      </div>
    </div>
  );
};

export default ShippingPolicy;
