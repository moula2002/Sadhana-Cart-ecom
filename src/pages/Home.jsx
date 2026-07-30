import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Home.css";
import SecondHeader from "../components/searchBar/SecondHeader";
import Banner from "../components/Banner";
import FeatureProducts from "../components/category/FeatureProducts";
import BestArrivals from "../components/category/BestArrivals";
import RecommendedProduct from "../components/category/RecommendedProduct";
import BestProducts from "../components/category/BestProducts";
import RecentlyViewed from "../components/category/RecentlyViewed";
import Brands from "../components/category/Brands";
import Loading from "../pages/Loading";
import googlePlayBadge from "../Images/google_play_badge.png";
import appStoreIcon from "../Images/app store .icon.jpg";
import rewardsPromo from "../Images/rewards_promo.png";
import appPromo from "../Images/app_promo.png";
import sellerPromo from "../Images/seller_promo.jpg";
import promotingApp from "../Images/Promoting.png";
import {
  FaTruck, FaMedal, FaUndoAlt, FaHeadphones,
  FaSmileBeam, FaCheckCircle, FaBoxOpen, FaCreditCard,
} from "react-icons/fa";
import DynamicGreeting from "../components/DynamicGreeting";


function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Scroll Position Restoration Logic
  useEffect(() => {
    // 1. Try to restore scroll position if it exists
    const savedScrollPos = sessionStorage.getItem('homeScrollPosition');
    if (savedScrollPos) {
      const targetY = parseInt(savedScrollPos, 10);
      
      // Since child components load data asynchronously, the page height might be 
      // small initially. We use an interval to try scrolling down as content loads.
      const maxAttempts = 20;
      let attempts = 0;
      
      const scrollInterval = setInterval(() => {
        attempts++;
        if (document.documentElement.scrollHeight >= targetY || attempts >= maxAttempts) {
          window.scrollTo({ top: targetY, behavior: 'instant' });
          if (document.documentElement.scrollTop >= targetY - 100 || attempts >= maxAttempts) {
            clearInterval(scrollInterval);
          }
        }
      }, 100);
      
      return () => clearInterval(scrollInterval);
    }
  }, []);

  useEffect(() => {
    // 2. Save scroll position continuously while on the home page
    const handleScroll = () => {
      sessionStorage.setItem('homeScrollPosition', window.scrollY.toString());
    };
    
    // Use a small timeout to avoid overriding with 0 during initial mount
    const timeoutId = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="homepage-content">

      {/* ── DYNAMIC GREETING ── */}
      <DynamicGreeting />

      {/* ── HERO BANNER ── */}
      <section className="banner-fade-in"><Banner /></section>

      {/* ── CATEGORY SCROLL — below banner ── */}
      <SecondHeader />

      {/* ── BRANDS SCROLL ── */}
      <Brands />

      {/* ── FLASH DEALS ── */}
      <BestArrivals showCart={true} />

      {/* ── PROMOTE APP AFTER FLASH DEALS ── */}
      <div className="promote-app-banner" style={{ margin: "20px -16px", width: "calc(100% + 32px)", position: "relative" }}>
        <img src={promotingApp} alt="Promote App" style={{ width: "100%", maxHeight: "400px", display: "block", objectFit: "fill" }} />
        {/* Invisible click zone — Google Play button in image */}
        <a
          href="https://play.google.com/store/apps/details?id=com.innomatrics.sadhana_cart"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get it on Google Play"
          style={{
            position: "absolute",
            bottom: "8%",
            left: "8%",
            width: "20%",
            height: "18%",
            cursor: "pointer",
            zIndex: 10,
          }}
        />
        {/* Invisible click zone — App Store button in image */}
        <a
          href="https://apps.apple.com/in/app/sadhana-cart-online-shopping/id6751406762"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download on the App Store"
          style={{
            position: "absolute",
            bottom: "8%",
            left: "29%",
            width: "20%",
            height: "18%",
            cursor: "pointer",
            zIndex: 10,
          }}
        />
      </div>

      {/* ── RECENTLY VIEWED PRODUCTS ── */}
      <RecentlyViewed />

      {/* ── NEW ARRIVALS ── */}
      <section className="sc-section home-section-animated">
        <div className="sc-header">
          <div className="sc-title-row">
            <h2 className="sc-title">{t("home.newArrivals", "New Arrivals")}</h2>
          </div>
          <a className="sc-view-all" href="#" onClick={(e) => { e.preventDefault(); navigate("/new-arrivals"); }}>{t("home.viewAllDeals", "View All Deals →")}</a>
        </div>
        <FeatureProducts showCart={true} />
      </section>



      {/* ── RECOMMENDED FOR YOU ── */}
      <section className="sc-section home-section-animated">
        <div className="sc-header">
          <h2 className="sc-title">{t("home.recommended", "Recommended For You")}</h2>
        </div>
        <RecommendedProduct showCart={true} />
      </section>

      {/* ── FEATURES BAR — 4 items with react-icons ── */}
      <div className="features-bar-4 home-section-animated">

        <div className="feature-item">
          <div className="feat-icon-wrap feat-blue"><FaTruck /></div>
          <div className="feat-text">
            <p className="feat-title">{t("home.freeDelivery", "Free Delivery")}</p>
            <p className="feat-sub">{t("home.freeDeliverySub", "On orders above ₹499")}</p>
          </div>
        </div>

        <div className="feature-divider" />

        <div className="feature-item">
          <div className="feat-icon-wrap feat-gold"><FaMedal /></div>
          <div className="feat-text">
            <p className="feat-title">{t("home.sadhanaRewards", "Sadhana Rewards")}</p>
            <p className="feat-sub">{t("home.rewardsSub", "Earn points & save more")}</p>
          </div>
        </div>

        <div className="feature-divider" />

        <div className="feature-item">
          <div className="feat-icon-wrap feat-teal"><FaUndoAlt /></div>
          <div className="feat-text">
            <p className="feat-title">{t("home.easyReturns", "Easy Returns")}</p>
            <p className="feat-sub">{t("home.returnsSub", "Return within 7 days")}</p>
          </div>
        </div>

        <div className="feature-divider" />

        <div className="feature-item">
          <div className="feat-icon-wrap feat-purple"><FaHeadphones /></div>
          <div className="feat-text">
            <p className="feat-title">{t("home.support", "24/7 Support")}</p>
            <p className="feat-sub">{t("home.supportSub", "We are here to help")}</p>
          </div>
        </div>

      </div>

      {/* ── BEST PRODUCTS ── */}
      <section className="sc-section home-section-animated">
        <div className="sc-header">
          <h2 className="sc-title">{t("home.bestProducts", "Best Products")}</h2>
        </div>
        <BestProducts />
      </section>

      {/* ── 3 PROMO CARDS (matching image) ── */}
      <div className="promo-row home-section-animated">

        {/* Sadhana Rewards — dark purple */}
        <div className="promo-card-new rewards-card">
          <div className="promo-new-text">
            <p className="promo-label">{t("home.sadhanaRewardsPromo", "Sadhana Rewards")}</p>
            <p className="promo-highlight">{t("home.rewardsPoint", "1 Point = ₹1")}</p>
            <p className="promo-desc">
              {t("home.earnPoints", "Earn points on every order")}<br />{t("home.redeemSave", "Redeem & save more!")}
            </p>
            <button className="promo-cta-btn rewards-cta" onClick={() => navigate("/rewards")}>{t("home.joinNow", "Join Now")}</button>
          </div>
          <div className="promo-card-img-wrap">
            <img src={rewardsPromo} alt={t("home.sadhanaRewardsPromo", "Sadhana Rewards")} className="promo-card-image" />
          </div>
        </div>

        {/* Download App — dark green */}
        <div className="promo-card-new app-card">
          <div className="promo-new-text">
            <p className="promo-label">{t("home.downloadApp", "Download Our App")}</p>
            <p className="promo-subdesc">{t("home.fasterEasier", "Faster, Easier, Better")}</p>
            <p className="promo-desc">
              {t("home.exclusiveDeals1", "Get exclusive app-only")}<br />{t("home.exclusiveDeals2", "deals & offers")}
            </p>
            <div className="store-btns-row" style={{ position: "relative", zIndex: 10 }}>
              <a
                href="https://play.google.com/store/apps/details?id=com.innomatrics.sadhana_cart"
                target="_blank"
                rel="noopener noreferrer"
                className="store-badge-link"
                aria-label="Get it on Google Play"
                onClick={(e) => { e.stopPropagation(); window.open('https://play.google.com/store/apps/details?id=com.innomatrics.sadhana_cart', '_blank'); }}
              >
                <img src={googlePlayBadge} alt="Get it on Google Play" className="store-badge-img" />
              </a>
              <a
                href="https://apps.apple.com/in/app/sadhana-cart-online-shopping/id6751406762"
                target="_blank"
                rel="noopener noreferrer"
                className="store-badge-link"
                aria-label="Download on the App Store"
                onClick={(e) => { e.stopPropagation(); window.open('https://apps.apple.com/in/app/sadhana-cart-online-shopping/id6751406762', '_blank'); }}
              >
                <img src={appStoreIcon} alt="App Store" className="store-badge-img" />
              </a>
            </div>
          </div>
          <div className="promo-card-img-wrap">
            <img src={appPromo} alt="Sadhana App" className="promo-card-image" />
          </div>
        </div>

        {/* Become a Seller — amber/orange */}
        <div className="promo-card-new seller-card">
          <div className="promo-new-text">
            <p className="promo-label seller-title">{t("home.becomeSeller", "Become a Seller")}</p>
            <p className="promo-desc seller-desc">
              {t("home.growBusiness1", "Grow your business with")}<br />{t("home.growBusiness2", "Sadhana Cart")}
            </p>
            <button
              className="promo-cta-btn seller-cta"
              onClick={() =>
                window.open("https://sadhana-cart-seller-panel1.vercel.app/seller/login", "_blank")
              }
            >
              {t("home.joinSeller", "Join as Seller")}
            </button>
          </div>
          <div className="promo-card-img-wrap">
            <img src={sellerPromo} alt={t("home.becomeSeller", "Become a Seller")} className="promo-card-image" />
          </div>
        </div>

      </div>

      {/* ── STATS BAR — 4 items with circle icons ── */}
      <div className="stats-bar-4 home-section-animated">

        <div className="stat-item-4">
          <div className="stat-icon-circle stat-green"><FaSmileBeam /></div>
          <div className="stat-text">
            <span className="stat-val">{t("home.happyCustomers", "Happy Customers")}</span>
            <span className="stat-sub">{t("home.happyCustomersSub", "10M+ Customers")}</span>
          </div>
        </div>

        <div className="stat-item-4">
          <div className="stat-icon-circle stat-blue"><FaCheckCircle /></div>
          <div className="stat-text">
            <span className="stat-val">{t("home.topQuality", "Top Quality")}</span>
            <span className="stat-sub">{t("home.topQualitySub", "100% Original Products")}</span>
          </div>
        </div>

        <div className="stat-item-4">
          <div className="stat-icon-circle stat-orange"><FaBoxOpen /></div>
          <div className="stat-text">
            <span className="stat-val">{t("home.wideAssortment", "Wide Assortment")}</span>
            <span className="stat-sub">{t("home.wideAssortmentSub", "1M+ Products")}</span>
          </div>
        </div>

        <div className="stat-item-4">
          <div className="stat-icon-circle stat-purple"><FaCreditCard /></div>
          <div className="stat-text">
            <span className="stat-val">{t("home.securePayments", "Secure Payments")}</span>
            <span className="stat-sub">{t("home.securePaymentsSub", "Multiple Payment Options")}</span>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Home;