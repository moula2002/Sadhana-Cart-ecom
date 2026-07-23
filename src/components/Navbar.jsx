import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Navbar, Nav, Container, Button, Modal, Badge, Dropdown, Offcanvas } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";

import AuthPage from "../pages/LoginPage";
import Loading from "../pages/Loading";
import { syncLocalStorageToFirestore } from "../services/recentlyViewedService";
import FilterOffcanvas from "./searchBar/FilterOffcanvas";


import {
  FiUser, FiMapPin, FiPackage, FiHeart, FiCreditCard, FiShoppingCart,
  FiGrid, FiList, FiTag, FiStar, FiHelpCircle, FiMessageCircle,
  FiPhone, FiInfo, FiShield, FiFileText, FiRefreshCcw,
  FiMoon, FiSun, FiInstagram, FiFacebook, FiYoutube, FiLogOut, FiSearch, FiLock
} from "react-icons/fi";

import "./Navbar.css";
import "./HamburgerMenu.css";
import logo from "../Images/Sadhanacart1.png";
import cartGif from "../Images/shopping-cart icon.gif";
import LanguageSwitcher from "../language/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

import { db, auth } from "../firebase";
import { collection, query, getDocs, orderBy, limit, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
const EMPTY_ARRAY = [];

/* ---------------- MODALS ---------------- */
const LoginConfirmationModal = ({ show, onClose, userName }) => {
  const { t } = useTranslation();

  const [greeting, setGreeting] = useState({ key: "greeting.welcome", text: "Welcome", icon: "👋" });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ key: "greeting.goodMorning", text: "Good Morning", icon: "🌅" });
    } else if (hour < 17) {
      setGreeting({ key: "greeting.goodAfternoon", text: "Good Afternoon", icon: "☀️" });
    } else {
      setGreeting({ key: "greeting.goodEvening", text: "Good Evening", icon: "🌙" });
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onClose} centered className="login-success-modal">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3, type: "spring", damping: 15 }}
          >
            <Modal.Body className="p-4 text-center py-5">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="mb-3"
                style={{ fontSize: "3.5rem" }}
              >
                {greeting.icon}
              </motion.div>
              <h3 className="mb-2 fw-bolder text-dark">
                {t(greeting.key, greeting.text)}, <span className="text-primary">{userName || t("greeting.user", "User")}</span>!
              </h3>
              <p className="text-muted mt-3 mb-0">
                {t("loginModal.successText", "You have successfully signed in.")} <br />
                {t("loginModal.exploreText", "Ready to explore new deals?")}
              </p>
            </Modal.Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

const LogoutConfirmationModal = ({ show, onClose, userName }) => {
  const { t } = useTranslation();
  const [greeting, setGreeting] = useState({ key: "logoutModal.goodbye", text: "Goodbye", icon: "👋" });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ key: "logoutModal.morning", text: "Have a great Morning", icon: "🌅" });
    } else if (hour < 17) {
      setGreeting({ key: "logoutModal.afternoon", text: "Have a great Afternoon", icon: "☀️" });
    } else {
      setGreeting({ key: "logoutModal.night", text: "Good Night", icon: "🌙" });
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onClose} centered className="logout-success-modal">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3, type: "spring", damping: 15 }}
          >
            <Modal.Body className="p-4 text-center py-5">
              <motion.div
                initial={{ rotate: -10, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                className="mb-3"
                style={{ fontSize: "3.5rem" }}
              >
                {greeting.icon}
              </motion.div>
              <h3 className="mb-2 fw-bold text-danger">
                {t(greeting.key, greeting.text)}, {userName || t("greeting.user", "User")}!
              </h3>
              <p className="text-muted mt-3 mb-0">
                {t("logoutModal.successText", "You have been successfully logged out.")} <br />
                {t("logoutModal.seeYou", "See you next time!")}
              </p>
            </Modal.Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

/* ---------------- HOVER CART ICON COMPONENT ---------------- */
const HoverCartIcon = ({ src, alt, style }) => {
  const [isHovered, setIsHovered] = useState(false);
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (canvas && ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
      }
    };
  }, [src]);

  const darkStyle = theme === 'dark' ? { filter: 'invert(1)', mixBlendMode: 'screen' } : { mixBlendMode: 'multiply' };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...style, position: "relative", display: "inline-block", verticalAlign: "middle" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: style?.objectFit || "contain",
          display: isHovered ? "none" : "block",
          ...darkStyle
        }}
      />
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: style?.objectFit || "contain",
          display: isHovered ? "block" : "none",
          ...darkStyle
        }}
      />
    </div>
  );
};

/* ---------------- SEARCH BAR COMPONENT WITH FILTER BUTTON ---------------- */
const SearchBar = ({ onFilterClick }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilterOffcanvas, setShowFilterOffcanvas] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleApplyFilter = (filters) => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    const params = new URLSearchParams(cleanFilters).toString();
    navigate(`/search-results?${params}`);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTrending(data);
      } catch (err) {
        console.error("Trending fetch error:", err);
      }
    };

    fetchTrending();
    fetchTrending();
    const stored = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(stored);

    // Fallback if trending is empty or taking too long
    if (trending.length === 0) {
      setTrending([
        { id: "fallback-1", name: "T-Shirts" },
        { id: "fallback-2", name: "Shoes" },
        { id: "fallback-3", name: "Watches" },
        { id: "fallback-4", name: "Sunglasses" }
      ]);
    }
  }, []);

  const fetchSearchData = async (value) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setLoading(true);
    const searchTerms = value.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    if (searchTerms.length === 0) {
      setLoading(false);
      return;
    }
    
    const firstWord = searchTerms[0];

    try {
      const productsRef = collection(db, "products");
      
      // Query Firebase using the first keyword to narrow down
      const q = query(
        productsRef,
        where("searchkeywords", "array-contains", firstWord),
        limit(50) // fetch more for local filtering
      );

      const snap = await getDocs(q);
      let results = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter locally to ensure ALL search terms are present (AND logic)
      if (searchTerms.length > 1) {
        results = results.filter(p => {
          const keywords = p.searchkeywords || [];
          const textToSearch = (p.name + " " + (p.pattern || "") + " " + (p.category || "") + " " + keywords.join(" ")).toLowerCase();
          return searchTerms.every(term => textToSearch.includes(term));
        });
      }

      // Fallback if no exact array-contains matches found
      if (results.length === 0) {
        const allSnap = await getDocs(query(productsRef, limit(30)));
        results = allSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => {
            const textToSearch = (p.name + " " + (p.pattern || "") + " " + (p.category || "")).toLowerCase();
            return searchTerms.every(term => textToSearch.includes(term));
          });
      }

      setSuggestions(results.slice(0, 8));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm) fetchSearchData(searchTerm);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (term) => {
    if (!term.trim()) return;

    let updated = [term, ...recentSearches.filter(t =>
      t.toLowerCase() !== term.toLowerCase()
    )];
    updated = updated.slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleSelect = (product) => {
    const term = product.pattern || product.name || "";
    saveRecentSearch(term);
    setSearchTerm(term);
    setShowDropdown(false);
    navigate(`/product/${product.id}`);
  };

  const handleSubmit = () => {
    if (!searchTerm.trim()) return;
    saveRecentSearch(searchTerm);
    setShowDropdown(false);
    navigate(`/search-results?q=${encodeURIComponent(searchTerm)}`);
  };

  /* ---------------- FILTER BUTTON HANDLER ---------------- */
  const handleFilterClick = () => {
    navigate("/advanced-search");
  };

  /* ---------------- DELETE SINGLE RECENT SEARCH ---------------- */
  const deleteRecentSearch = (term, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(t =>
      t.toLowerCase() !== term.toLowerCase()
    );
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  /* ---------------- CLEAR ALL RECENT SEARCHES ---------------- */
  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  /* ---------------- CLEAR SEARCH TEXT ---------------- */
  const clearSearchText = () => {
    setSearchTerm("");
    setSuggestions([]);
  };

  /* ---------------- RECENT SEARCH CLICK HANDLER ---------------- */
  const handleRecentSearchClick = (term) => {
    setSearchTerm(term);
    fetchSearchData(term);
    setShowDropdown(true);
  };

  return (
    <div className="position-relative w-100" ref={dropdownRef}>
      <div className="ref-search-bar w-100">
        <FiSearch className="search-icon-left" />
        <input
          type="text"
          className="ref-search-input"
          placeholder={t("searchPlaceholder", "Try Saree, Kurti or Search by Product Code")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => setShowDropdown(true)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {searchTerm && (
          <button
            className="search-clear-btn"
            onClick={clearSearchText}
            type="button"
            style={{ position: 'absolute', right: '140px', border: 'none', background: 'none', color: '#888' }}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        <div className="ref-search-divider" />
        <button
          className="filter-button"
          type="button"
          onClick={onFilterClick}
        >
          <i className="fas fa-sliders-h me-2"></i> {t("nav.filter", "Filter")}
        </button>
      </div>

      {showDropdown && (
        <motion.div
          className="suggestions-dropdown"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {loading ? (
            <div className="p-3 text-center">
              <Loading small inline message="Searching..." />
            </div>
          ) : searchTerm.length > 0 ? (
            suggestions.length > 0 ? (
              suggestions.map((p) => (
                <div
                  key={p.id}
                  className="suggestion-row"
                  onClick={() => handleSelect(p)}
                >
                  <div className="suggestion-thumb-wrapper">
                    <img
                      src={p.image || p.thumbnail || p.images?.[0] || "https://via.placeholder.com/50"}
                      alt={p.pattern || p.name}
                      className="suggestion-thumb"
                      onError={(e) => e.target.src = "https://via.placeholder.com/50"}
                    />
                  </div>
                  <div className="suggestion-info">
                    <div className="suggestion-title">
                      {highlightText(p.pattern || p.name, searchTerm)}
                    </div>
                    <div className="suggestion-category">
                      in {p.category?.toLowerCase() || 'fashion'}
                    </div>
                  </div>
                  <div className="suggestion-action">
                    <div className="suggestion-price">₹{p.offerprice || p.mrp || 209}</div>
                    <i className="fas fa-arrow-up" style={{ transform: 'rotate(45deg)', color: '#aaa', fontSize: '1.1rem' }}></i>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results-item">
                <i className="FiPackage-open"></i>
                <p>No products found for "{searchTerm}"</p>
              </div>
            )
          ) : (
            <>
              {recentSearches.length > 0 && (
                <>
                  <div className="recent-searches-header">
                    <div className="recent-searches-title">
                      <i className="fas fa-history"></i> Recent Searches
                    </div>
                    <button
                      className="clear-all-btn"
                      onClick={clearAllRecentSearches}
                    >
                      <i className="fas fa-trash-alt"></i> Clear All
                    </button>
                  </div>
                  {recentSearches.map((term, i) => (
                    <div
                      key={i}
                      className="recent-search-item"
                      onClick={() => handleRecentSearchClick(term)}
                    >
                      <div className="recent-search-content">
                        <i className="fas fa-clock"></i>
                        <span className="recent-search-text">{term}</span>
                      </div>
                      <button
                        className="recent-search-delete-btn"
                        onClick={(e) => deleteRecentSearch(term, e)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </>
              )}

              {trending.length > 0 && (
                <>
                  <div className="recent-searches-header mt-2">
                    <div className="recent-searches-title">
                      <i className="fas fa-fire text-danger"></i> Popular Searches
                    </div>
                  </div>
                  {trending.map((p) => (
                    <div
                      key={p.id}
                      className="suggestion-item trending-item"
                      onClick={() => handleSelect(p)}
                    >
                      <i className="fas fa-search trending-icon text-muted"></i>
                      <span>{p.pattern || p.name}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </motion.div>
      )}

    </div>
  );
};

/* ---------------- FLIPKART STYLE DROPDOWN COMPONENT ---------------- */
const FlipkartLoginDropdown = ({ currentUser, handleLogout, setShowAuthModal, setAuthMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCoins, setWalletCoins] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");

  // Listen to user data in real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(
      doc(db, "users", currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setWalletBalance(userData.walletBalance || 0);
          setWalletCoins(userData.walletCoins || 0);
          setProfileImage(userData.profileImage || null);
          setUserName(userData.name || "");

          // Fetch saved addresses
          if (userData.addresses) {
            setSavedAddresses(userData.addresses);
          }
        }
      },
      (error) => {
        console.error("Error listening to user data:", error);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const handleProfileClick = () => {
    navigate("/profile");
    setDropdownOpen(false);
  };

  const handleAddressClick = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    navigate("/save-address");
    setDropdownOpen(false);
  };

  const handleWishlistClick = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    navigate("/wishlist");
    setDropdownOpen(false);
  };

  const handleGiftCardsClick = () => {
    navigate("/refercode");
    setDropdownOpen(false);
  };

  const handleWalletClick = () => {
    navigate("/rewards");
    setDropdownOpen(false);
  };

  const handleOrdersClick = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    navigate("/orders");
    setDropdownOpen(false);
  };
  return (
    <>
      <div
        className="ref-account-toggle account-pill-btn d-flex align-items-center gap-2"
        onClick={() => setDropdownOpen(true)}
        style={{ cursor: 'pointer' }}
      >
        {currentUser && (profileImage || currentUser.photoURL) ? (
          <img
            src={profileImage || currentUser.photoURL}
            alt="Profile"
            className="rounded-circle"
            style={{ width: '38px', height: '38px', objectFit: 'cover', border: '1px solid #e0e0e0' }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://ui-avatars.com/api/?name=" + (currentUser.displayName || 'U') + "&background=0d6efd&color=fff";
            }}
          />
        ) : (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
            style={{
              width: '38px',
              height: '38px',
              background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
              border: '2px solid rgba(255, 255, 255, 0.8)'
            }}
          >
            <i className="far fa-user ref-icon" style={{ fontSize: '1.1rem' }}></i>
          </motion.div>
        )}
        <div className="ref-account-text d-none d-lg-flex flex-column align-items-start">
          {currentUser ? (
            <>
              <span style={{ fontSize: '0.8rem', color: '#888', lineHeight: '1.2' }}>
                {userName || currentUser.displayName || currentUser.email?.split("@")[0] || "User"}
              </span>
              <div className="d-flex align-items-center">
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#212121', lineHeight: '1.2' }}>
                  {t("myAccount", "My Account")}
                </span>
                <i className="fas fa-chevron-down ms-2" style={{ fontSize: '0.7rem', color: '#888' }}></i>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.8rem', color: '#888', lineHeight: '1.2' }}>{t("loginSignUp", "Login / Sign up")}</span>
              <div className="d-flex align-items-center">
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#212121', lineHeight: '1.2' }}>
                  {t("myAccount", "My Account")}
                </span>
                <i className="fas fa-chevron-down ms-2" style={{ fontSize: '0.7rem', color: '#888' }}></i>
              </div>
            </>
          )}
        </div>
      </div>

      <Offcanvas show={dropdownOpen} onHide={() => setDropdownOpen(false)} placement="end" className="login-offcanvas">
        <Offcanvas.Header closeButton className="hamburger-header">
          <div className="d-flex align-items-center gap-3">
            <img src={logo} alt="SadhanaCart" style={{ height: '35px' }} />
            <Offcanvas.Title className="theme-text fw-bold mb-0">
              {currentUser ? t("myAccount", "My Account") : t("welcomeToSadhanaCart", "Welcome to Sadhana Cart")}
            </Offcanvas.Title>
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {!currentUser ? (
            <div className="px-4 py-4 border-bottom text-center">
              <h6 className="fw-bold text-dark mb-2">🔒 Login Required</h6>
              <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                Please sign in or create an account to access your cart.
              </p>
              <button
                className="btn btn-primary text-white w-100 rounded-pill fw-bold"
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                  setDropdownOpen(false);
                }}
              >
                {t("login")}
              </button>
              <p className="text-center mt-3 mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                New to SadhanaCart? <span style={{ cursor: 'pointer', color: 'var(--bs-primary)' }} onClick={() => { setAuthMode("signup"); setShowAuthModal(true); setDropdownOpen(false); }}>Sign Up</span>
              </p>
            </div>
          ) : (
            <div className="px-4 py-4 border-bottom bg-light">
              <div className="d-flex align-items-center gap-3">
                {currentUser && (profileImage || currentUser.photoURL) ? (
                  <img
                    src={profileImage || currentUser.photoURL}
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://ui-avatars.com/api/?name=" + (currentUser.displayName || 'U') + "&background=0d6efd&color=fff";
                    }}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="rounded-circle d-flex align-items-center justify-content-center text-white shadow"
                    style={{ width: '50px', height: '50px', fontSize: '1.4rem', background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)', border: '3px solid #fff' }}
                  >
                    <i className="far fa-user"></i>
                  </motion.div>
                )}
                <div>
                  <h6 className="mb-0 fw-bold text-dark">{userName || currentUser.displayName || currentUser.email?.split("@")[0] || "User"}</h6>
                  <small className="text-muted">{currentUser.email}</small>
                </div>
              </div>
            </div>
          )}

          <div className="hamburger-menu-list px-0 pb-3">
            {currentUser && (
              <>
                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleProfileClick(); }}>
                  <FiUser className="menu-icon-svg text-primary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("myProfile")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleAddressClick(); }}>
                  <FiMapPin className="menu-icon-svg text-danger" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("address")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleOrdersClick(); }}>
                  <FiPackage className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("orders.title")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleWishlistClick(); }}>
                  <FiHeart className="menu-icon-svg text-danger" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("wishList")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/cart"); setDropdownOpen(false); }}>
                  <FiShoppingCart className="menu-icon-svg text-secondary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("cart", "Cart")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleWalletClick(); }}>
                  <FiCreditCard className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("walletRewards")}</span>
                  {walletCoins > 0 && (
                    <span className="badge rounded-pill bg-danger ms-2" style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                      ₹{walletCoins}
                    </span>
                  )}
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleGiftCardsClick(); }}>
                  <FiCreditCard className="menu-icon-svg text-info" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("referEarn", "Refer & Earn")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <hr className="hamburger-divider" />
              </>
            )}

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/browse-categories"); setDropdownOpen(false); }}>
              <FiList className="menu-icon-svg text-primary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("nav.browseCategory", "Browse Categories")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/offers"); setDropdownOpen(false); }}>
              <FiTag className="menu-icon-svg text-warning" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("nav.offersZone", "Offers & Deals")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/new-arrivals"); setDropdownOpen(false); }}>
              <FiStar className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("nav.newArrivals", "New Arrivals")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <hr className="hamburger-divider" />

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/support"); setDropdownOpen(false); }}>
              <FiHelpCircle className="menu-icon-svg text-info" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("helpSupport", "Help & Support")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/faqs"); setDropdownOpen(false); }}>
              <FiMessageCircle className="menu-icon-svg text-primary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("footer.faqs", "FAQs")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/contact"); setDropdownOpen(false); }}>
              <FiPhone className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("footer.contactUs", "Contact Us")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <hr className="hamburger-divider" />

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/about-us"); setDropdownOpen(false); }}>
              <FiInfo className="menu-icon-svg text-primary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("aboutUs", "About Us")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/shipping-policy"); setDropdownOpen(false); }}>
              <FiShield className="menu-icon-svg text-secondary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("footer.policies", "Store Policies")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/privacy-policy"); setDropdownOpen(false); }}>
              <FiLock className="menu-icon-svg text-info" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("footer.privacyPolicy", "Privacy Policy")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/terms-and-conditions"); setDropdownOpen(false); }}>
              <FiFileText className="menu-icon-svg text-secondary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("term's", "Terms & Conditions")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/return-policy"); setDropdownOpen(false); }}>
              <FiRefreshCcw className="menu-icon-svg text-warning" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">{t("returnPolicy", "Return & Refund Policy")}</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            {/* 🌍 LANGUAGE SWITCHER */}
            <hr className="hamburger-divider" />
            <div className="px-4 py-2">
              <small className="text-muted fw-bold d-block mb-2">
                {t("language")}
              </small>
              <LanguageSwitcher />
            </div>

            {/* THEME TOGGLE BUTTON */}
            <hr className="hamburger-divider" />
            <div className="hamburger-menu-item d-flex align-items-center justify-content-between" style={{ paddingRight: '20px' }}>
              <div className="d-flex align-items-center gap-3">
                {theme === 'light' ? (
                  <FiMoon className="menu-icon-svg text-dark" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                ) : (
                  <FiSun className="menu-icon-svg text-dark" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                )}
                <span className="fw-bold text-dark">{t("theme")}</span>
              </div>
              <div className={`theme-toggle-switch ${theme}`} onClick={toggleTheme}>
                <div className="theme-toggle-slider"></div>
              </div>
            </div>

            {/* FOLLOW US */}
            <div className="px-4 py-3">
              <small className="text-muted fw-bold d-block mb-3">{t("footer.followUs", "FOLLOW US")}</small>
              <div className="d-flex align-items-center gap-3">
                <a href="#" style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <FiInstagram color="white" size={22} />
                </a>
                <a href="#" style={{ backgroundColor: '#1877F2', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <FiFacebook color="white" size={22} />
                </a>
                <a href="#" style={{ backgroundColor: '#FF0000', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <FiYoutube color="white" size={22} />
                </a>
              </div>
            </div>

            {currentUser && (
              <>
                <hr className="hamburger-divider" />
                <a href="#" className="hamburger-menu-item text-danger" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                  <FiLogOut className="menu-icon-svg text-danger" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold">{t("logout")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>
              </>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

/* ---------------- MAIN HEADER COMPONENT ---------------- */
export default function Header() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 🔥 MEMOIZED SELECTORS - Fix Redux warning
  const headerLocation = useSelector((state) => state.header?.location);

  // Memoized cart items selector
  const cartItems = useSelector((state) => state.cart?.items) || EMPTY_ARRAY;
  const orders = useSelector((state) => state.orders?.items) || EMPTY_ARRAY;

  // Memoized counts - prevents unnecessary re-renders
  const cartCount = cartItems.length;
  // Local State
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [wishlistCount, setWishlistCount] = useState(0);

  // Categories Dropdown State
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        syncLocalStorageToFirestore(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // Wishlist Listener
  useEffect(() => {
    if (!currentUser) {
      setWishlistCount(0);
      return;
    }
    const q = collection(db, "users", currentUser.uid, "favorites");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWishlistCount(snapshot.docs.length);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch Categories for Dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catRef = collection(db, "category");
        const snap = await getDocs(catRef);
        const catList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        catList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setCategories(catList);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (currentUser && sessionStorage.getItem("justLoggedIn") === "true") {
      sessionStorage.removeItem("justLoggedIn");
      handleLoginSuccess(currentUser);
    }
  }, [currentUser]);

  /* ---------------- HANDLERS ---------------- */
  const handleLoginSuccess = (user) => {
    setShowAuthModal(false);
    const nameToDisplay = user.displayName || user.email?.split('@')[0] || "User";
    setLoggedInUserName(nameToDisplay);
    setShowLoginModal(true);
    setTimeout(() => setShowLoginModal(false), 5000);
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    setShowLogoutConfirmModal(true);
  };

  const handleConfirmLogoutAction = async () => {
    try {
      setShowLogoutConfirmModal(false);
      const nameToDisplay = currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";
      setLoggedInUserName(nameToDisplay);
      await signOut(auth);
      setShowLogoutModal(true);
      setTimeout(() => {
        setShowLogoutModal(false);
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleSellerClick = () => {
    window.open("https://sadhana-cart-seller-panel1.vercel.app/seller/login", "_blank");
  };

  const goToCart = () => navigate("/cart");

  return (
    <>
      {/* =================== MAIN NAVBAR =================== */}
      <div className="navbar-custom sticky-top">
        <div className="navbar-main-row flex-wrap">

          {/* TOP HEADER ROW: LOGO & RIGHT ACTIONS */}
          <div className="d-flex align-items-center justify-content-between w-100 flex-xl-nowrap gap-2">
            {/* LOGO */}
            <div className="navbar-left-group">
              <a href="/" className="navbar-brand-link">
                <img src={logo} alt="Sadhana Cart" className="logo-img" />
                <div className="brand-text-wrap">
                  <span className="brand-name-gold">{t("sadhana", "Sadhana")}</span>
                  <span className="brand-name-navy">{t("cart", "Cart")}</span>
                </div>
              </a>
            </div>

            {/* SEARCH BAR — Desktop (inline) */}
            <div className="navbar-search-wrap d-none d-xl-flex flex-grow-1 mx-3">
              <SearchBar onFilterClick={() => navigate("/search")} />
            </div>

            {/* RIGHT ACTIONS — All Screen Sizes */}
            <div className="navbar-right-group d-flex align-items-center gap-3 gap-md-4">

              {/* Language Switcher */}
              <div className="ref-deliver-wrap d-flex align-items-center">
                <LanguageSwitcher />
              </div>

              {/* Wishlist */}
              <div className="ref-icon-btn" onClick={() => {
                if (!currentUser) { setShowAuthModal(true); return; }
                navigate('/wishlist');
              }}>
                <div className="ref-cart-icon-wrap">
                  <FiHeart className="ref-icon" />
                  {wishlistCount > 0 && (
                    <span className="ref-cart-badge">{wishlistCount}</span>
                  )}
                </div>
                <span className="ref-icon-label d-none d-sm-inline">{t("wishList", "Wishlist")}</span>
              </div>

              {/* Cart */}
              <div className="ref-icon-btn ref-cart-btn" onClick={goToCart}>
                <div className="ref-cart-icon-wrap">
                  <HoverCartIcon src={cartGif} alt={t("cartLabel", "Cart")} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                  {cartCount > 0 && (
                    <span className="ref-cart-badge">{cartCount}</span>
                  )}
                </div>
                <span className="ref-icon-label d-none d-sm-inline">{t("cartLabel", "Cart")}</span>
              </div>

              {/* Account */}
              <FlipkartLoginDropdown
                currentUser={currentUser}
                handleLogout={handleLogout}
                setShowAuthModal={setShowAuthModal}
                setAuthMode={setAuthMode}
              />
            </div>
          </div>

          {/* SEARCH BAR — Mobile / Tablet (<1200px) */}
          <div className="navbar-mobile-search-row d-xl-none w-100 mt-2 position-relative" style={{ zIndex: 100 }}>
            <SearchBar onFilterClick={() => navigate("/search")} />
          </div>

        </div>

        {/* =================== SUB-NAVBAR MENU ROW =================== */}
        <div className="sub-navbar-row">
          <div className="sub-navbar-inner">
            <div
              className="sub-nav-all-cat"
              onClick={() => setShowCategoryDropdown(prev => !prev)}
              onMouseEnter={() => {
                if (window.matchMedia("(hover: hover)").matches) {
                  setShowCategoryDropdown(true);
                }
              }}
              onMouseLeave={() => {
                if (window.matchMedia("(hover: hover)").matches) {
                  setShowCategoryDropdown(false);
                }
              }}
            >
              <i className="fas fa-th sub-nav-grid-icon"></i>
              <span>{t("allCategories", "All Categories")}</span>
              <i className={`fas fa-chevron-${showCategoryDropdown ? 'up' : 'down'} sub-nav-chev`}></i>

              {/* Mega Menu Dropdown */}
              {showCategoryDropdown && (
                <div className="all-categories-dropdown" onClick={(e) => e.stopPropagation()}>
                  {/* Pull handle line for bottom sheet indicator */}
                  <div className="bottom-sheet-handle d-md-none"></div>

                  {/* Bottom sheet header for mobile */}
                  <div className="all-categories-dropdown-header d-md-none">
                    <span>{t("allCategories", "All Categories")}</span>
                    <button 
                      className="close-btn" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowCategoryDropdown(false); 
                      }}
                    >
                      &times;
                    </button>
                  </div>

                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <div
                        key={cat.id}
                        className="cat-dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCategoryDropdown(false);
                          navigate('/browse-categories', { state: { selectedCategory: cat.name } });
                        }}
                      >
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="cat-dropdown-img" />
                        ) : cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="cat-dropdown-img" />
                        ) : (
                          <div className="cat-dropdown-icon-placeholder">
                            {cat.name ? cat.name.charAt(0) : "C"}
                          </div>
                        )}
                        <span className="cat-dropdown-name">{cat.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="cat-dropdown-item text-center py-3 text-muted">
                      <i className="fas fa-spinner fa-spin me-2"></i> Loading...
                    </div>
                  )}
                </div>
              )}
            </div>
            <nav className="sub-nav-links">
              <a href="/" className="sub-nav-link sub-nav-active">{t("nav.home", "Home")}</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/browse-categories"); }}>{t("nav.browseCategory", "Browse Category")}</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/best-sellers"); }}>{t("nav.bestSellers", "Best Sellers")}</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/new-arrivals"); }}>{t("nav.newArrivals", "New Arrivals")}</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/rewards"); }}>
                {t("nav.sadhanaRewards", "Sadhana Rewards")} <span className="sub-nav-badge sub-nav-badge-new">{t("new", "New")}</span>
              </a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/offers"); }}>{t("nav.offersZone", "Offers Zone")}</a>
              <a href="/track-order" className="sub-nav-link">{t("nav.trackOrder", "Track Order")}</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); handleSellerClick(); }}>
                {t("nav.becomeSeller", "Become a Seller")}
              </a>
              <a href="/support" className="sub-nav-link">{t("helpSupport", "Help & Support")}</a>
            </nav>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showAuthModal && (
          <Modal key="auth-modal" show={showAuthModal} onHide={() => setShowAuthModal(false)} centered size="lg">
            <Modal.Body className="p-0">
              <AuthPage onClose={() => setShowAuthModal(false)} initialMode={authMode} onLoginSuccess={handleLoginSuccess} />
            </Modal.Body>
          </Modal>
        )}

        {showLoginModal && (
          <LoginConfirmationModal
            key="login-modal"
            show={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            userName={loggedInUserName}
          />
        )}

        {showLogoutModal && (
          <LogoutConfirmationModal
            key="logout-modal"
            show={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            userName={loggedInUserName}
          />
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirmModal && (
          <Modal key="logout-confirm-modal" show={showLogoutConfirmModal} onHide={() => setShowLogoutConfirmModal(false)} centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold" style={{ fontSize: '1.25rem' }}>{t("confirmLogoutTitle", "Confirm Log Out")}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
              <h4 className="fw-bold mb-2 text-dark" style={{ fontSize: '18px' }}>
                {t("confirmLogoutMessage", "Are you sure you want to log out?")}
              </h4>
              <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {t("confirmLogoutDesc", "You'll be signed out of your account and will need to log in again to access your profile, bookings, and other personalized features.")}
              </p>
              <div className="d-flex gap-3 mt-4">
                <button
                  type="button"
                  className="btn text-white w-100 fw-bold rounded"
                  style={{ backgroundColor: '#e53e3e', height: '42px' }}
                  onClick={handleConfirmLogoutAction}
                >
                  {t("logout", "Log Out")}
                </button>
                <button
                  type="button"
                  className="btn text-white w-100 fw-bold rounded"
                  style={{ backgroundColor: '#38a169', height: '42px' }}
                  onClick={() => setShowLogoutConfirmModal(false)}
                >
                  {t("staySignedIn", "Stay Signed In")}
                </button>
              </div>
            </Modal.Body>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
