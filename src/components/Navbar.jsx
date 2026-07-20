import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Navbar, Nav, Container, Button, Modal, Badge, Dropdown, Offcanvas } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";

import AuthPage from "../pages/LoginPage";


import {
  FiUser, FiMapPin, FiPackage, FiHeart, FiCreditCard,
  FiGrid, FiTag, FiStar, FiHelpCircle, FiMessageCircle,
  FiPhone, FiInfo, FiShield, FiFileText, FiRefreshCcw,
  FiMoon, FiSun, FiInstagram, FiFacebook, FiYoutube, FiLogOut
} from "react-icons/fi";

import "./Navbar.css";
import "./HamburgerMenu.css";
import logo from "../Images/Sadhanacart1.png";
import cartGif from "../Images/shopping-cart icon.gif";
import LanguageSwitcher from "../language/LanguageSwitcher";
import { useTranslation } from "react-i18next";

// Firebase
import { db } from "../firebase";
import { collection, query, getDocs, orderBy, limit, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const auth = getAuth();
/* ---------------- MODALS ---------------- */
const LoginConfirmationModal = ({ show, onClose, userName }) => {
  const { t } = useTranslation();

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
                className="text-success mb-4"
              >
                <i className="fas fa-check-circle fa-3x"></i>
              </motion.div>
              <h4 className="mb-2 fw-bolder text-dark">{t("welcomeBack")}</h4>
              <p className="text-muted mt-3 mb-0">
                {t("hello")} <span className="fw-bold text-primary">{userName}</span>! <br />
                {t("signedIn")}
              </p>
            </Modal.Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

const LogoutConfirmationModal = ({ show, onClose }) => {
  const { t } = useTranslation();

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
                initial={{ rotate: -180, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                className="text-danger mb-4"
              >
                <i className="fas fa-sign-out-alt fa-3x"></i>
              </motion.div>
              <h4 className="mb-2 fw-bold text-danger">{t("logoutSuccess")}</h4>
              <p className="text-muted mt-3 mb-0">{t("loggedOut")}</p>
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
        }}
      />
    </div>
  );
};

/* ---------------- SEARCH BAR COMPONENT WITH FILTER BUTTON ---------------- */
const SearchBar = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
    const stored = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(stored);
  }, []);

  const fetchSearchData = async (value) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const keyword = value.toLowerCase();

    try {
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("searchkeywords", "array-contains", keyword),
        limit(6)
      );

      const snap = await getDocs(q);
      let results = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (results.length === 0) {
        const allSnap = await getDocs(query(productsRef, limit(20)));
        results = allSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p =>
            p.pattern?.toLowerCase().includes(keyword) ||
            p.name?.toLowerCase().includes(keyword)
          );
      }

      setSuggestions(results);
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
      <div className="search-wrapper">
        <span className="search-icon-left">
          <i className="fas fa-search"></i>
        </span>
        <input
          type="text"
          className="search-input-desktop"
          placeholder="What are you looking for"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {searchTerm && (
          <button
            className="search-clear-btn"
            onClick={clearSearchText}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        <button
          className="filter-button"
          onClick={handleFilterClick}
          type="button"
        >
          <i className="fas fa-sliders-h"></i>
          <span className="filter-text">Filter</span>
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
              <div className="spinner-border spinner-border-sm text-warning"></div>
              <span className="ms-2">Searching...</span>
            </div>
          ) : searchTerm.length > 0 ? (
            suggestions.length > 0 ? (
              suggestions.map((p) => (
                <div
                  key={p.id}
                  className="suggestion-item"
                  onClick={() => handleSelect(p)}
                >
                  <i className="fas fa-search suggestion-icon"></i>
                  {p.image || p.images?.[0] ? (
                    <img
                      src={p.image || p.thumbnail || p.images?.[0]}
                      alt={p.pattern || p.name}
                      className="search-suggestion-img"
                      onError={(e) => e.target.src = "https://via.placeholder.com/40"}
                    />
                  ) : null}
                  <div className="flex-grow-1">
                    <div className="suggestion-title">
                      {highlightText(p.pattern || p.name, searchTerm)}
                    </div>
                    <div className="suggestion-category">
                      {p.category} â€¢ {p.subcategory || ""}
                    </div>
                  </div>
                  {p.mrp && p.offerprice && (
                    <Badge bg="danger" className="ms-2 suggestion-badge">
                      {Math.round(((p.mrp - p.offerprice) / p.mrp) * 100)}% OFF
                    </Badge>
                  )}
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

              {trending.map((p) => (
                <div
                  key={p.id}
                  className="suggestion-item trending-item"
                  onClick={() => handleSelect(p)}
                >
                  <i className="fas fa-chart-line trending-icon"></i>
                  <span>{p.pattern || p.name}</span>
                </div>
              ))}
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
  const [theme, setTheme] = useState('light');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [profileImage, setProfileImage] = useState(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
      applyTheme('dark');
    }
  }, []);

  // Apply theme to entire document
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.removeAttribute('data-bs-theme');
      document.body.classList.remove('dark-theme');
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

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
                {currentUser.displayName || currentUser.email?.split("@")[0] || "User"}
              </span>
              <div className="d-flex align-items-center">
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#212121', lineHeight: '1.2' }}>
                  My Account
                </span>
                <i className="fas fa-chevron-down ms-2" style={{ fontSize: '0.7rem', color: '#888' }}></i>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.8rem', color: '#888', lineHeight: '1.2' }}>Login / Sign up</span>
              <div className="d-flex align-items-center">
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#212121', lineHeight: '1.2' }}>
                  My Account
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
              {currentUser ? "My Account" : "Welcome to Sadhana Cart"}
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
                  <h6 className="mb-0 fw-bold text-dark">{currentUser.displayName || currentUser.email?.split("@")[0] || "User"}</h6>
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
                  <HoverCartIcon src={cartGif} alt="Cart" style={{ width: '20px', height: '20px', objectFit: 'contain', marginRight: '8px' }} />
                  <span className="fw-bold text-dark">Cart</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleWalletClick(); }}>
                  <FiCreditCard className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("walletRewards")}</span>
                  {walletBalance > 0 && (
                    <span className="badge rounded-pill bg-danger ms-2" style={{ fontSize: '0.6rem' }}>
                      ₹{walletBalance}
                    </span>
                  )}
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); handleGiftCardsClick(); }}>
                  <FiCreditCard className="menu-icon-svg text-info" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
                  <span className="fw-bold text-dark">{t("referEarn")}</span>
                  <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
                </a>

                <hr className="hamburger-divider" />
              </>
            )}

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/categories"); setDropdownOpen(false); }}>
              <FiGrid className="menu-icon-svg text-primary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Browse Categories</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/offers"); setDropdownOpen(false); }}>
              <FiTag className="menu-icon-svg text-warning" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Offers & Deals</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/new-arrivals"); setDropdownOpen(false); }}>
              <FiStar className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">New Arrivals</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <hr className="hamburger-divider" />

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/support"); setDropdownOpen(false); }}>
              <FiHelpCircle className="menu-icon-svg text-info" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Help & Support</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/faqs"); setDropdownOpen(false); }}>
              <FiMessageCircle className="menu-icon-svg text-primary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">FAQs</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/contact"); setDropdownOpen(false); }}>
              <FiPhone className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Contact Us</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <hr className="hamburger-divider" />

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/about"); setDropdownOpen(false); }}>
              <FiInfo className="menu-icon-svg text-primary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">About Us</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/policies"); setDropdownOpen(false); }}>
              <FiShield className="menu-icon-svg text-secondary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Store Policies</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/privacy"); setDropdownOpen(false); }}>
              <FiShield className="menu-icon-svg text-success" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Privacy Policy</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/terms"); setDropdownOpen(false); }}>
              <FiFileText className="menu-icon-svg text-secondary" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Terms & Conditions</span>
              <i className="fas fa-chevron-right ms-auto menu-chevron"></i>
            </a>

            <a href="#" className="hamburger-menu-item" onClick={(e) => { e.preventDefault(); navigate("/returns"); setDropdownOpen(false); }}>
              <FiRefreshCcw className="menu-icon-svg text-warning" style={{ width: '28px', fontSize: '1.2rem', marginRight: '15px' }} />
              <span className="fw-bold text-dark">Return & Refund Policy</span>
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
              <small className="text-muted fw-bold d-block mb-3">FOLLOW US</small>
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

  // ðŸ”¥ MEMOIZED SELECTORS - Fix Redux warning
  const { location } = useSelector((state) => state.header);

  // Memoized cart items selector
  const cartItems = useSelector((state) => state.cart?.items || []);
  const orders = useSelector((state) => state.orders?.items || []);

  // Memoized counts - prevents unnecessary re-renders
  const cartCount = useMemo(() => cartItems.length, [cartItems]);
  const orderCount = useMemo(() => orders.length, [orders]);

  // Local State
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [mobileSearchActive, setMobileSearchActive] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Categories Dropdown State
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Check theme on component mount
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.removeAttribute('data-bs-theme');
      document.body.classList.remove('dark-theme');
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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

  /* ---------------- HANDLERS ---------------- */
  const handleLoginSuccess = (user) => {
    setShowAuthModal(false);
    const nameToDisplay = user.displayName || user.email?.split('@')[0] || "User";
    setLoggedInUserName(nameToDisplay);
    setShowLoginModal(true);
    setTimeout(() => setShowLoginModal(false), 2000);
  };

  const handleLogout = (e) => {
    if (e) e.preventDefault();
    setShowLogoutConfirmModal(true);
  };

  const handleConfirmLogoutAction = async () => {
    try {
      setShowLogoutConfirmModal(false);
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
        <div className="navbar-main-row">

          {/* LOGO */}
          <div className="navbar-left-group">
            <a href="/" className="navbar-brand-link">
              <img src={logo} alt="Sadhana Cart" className="logo-img" />
              <div className="brand-text-wrap">
                <span className="brand-name-gold">Sadhana</span>
                <span className="brand-name-navy">Cart</span>
              </div>
            </a>
          </div>

          {/* SEARCH BAR — Desktop */}
          <div className="navbar-search-wrap d-none d-xl-flex">
            <div className="ref-search-bar">
              <input
                type="text"
                className="ref-search-input"
                placeholder="Search for products, brands and more..."
                onClick={() => navigate('/advanced-search')}
                readOnly
              />
              <div className="ref-search-divider" />
              <select className="ref-category-select">
                <option>All Categories</option>
              </select>
              <button className="ref-search-btn" onClick={() => navigate('/advanced-search')}>
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>

          {/* RIGHT ACTIONS — Desktop */}
          <div className="navbar-right-group d-none d-xl-flex">

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
              <span className="ref-icon-label">Wishlist</span>
            </div>

            {/* Cart */}
            <div className="ref-icon-btn ref-cart-btn" onClick={goToCart}>
              <div className="ref-cart-icon-wrap">
                <HoverCartIcon src={cartGif} alt="Cart" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                {cartCount > 0 && (
                  <span className="ref-cart-badge">{cartCount}</span>
                )}
              </div>
              <span className="ref-icon-label">Cart</span>
            </div>

            {/* Account */}
            <FlipkartLoginDropdown
              currentUser={currentUser}
              handleLogout={handleLogout}
              setShowAuthModal={setShowAuthModal}
              setAuthMode={setAuthMode}
            />
          </div>

          {/* MOBILE ACTIONS */}
          <div className="d-flex d-xl-none align-items-center gap-2 ms-auto">
            {!mobileSearchActive && (
              <>
                <div className="navbar-action-item px-2" onClick={() => setMobileSearchActive(true)}>
                  <i className="fas fa-search text-primary"></i>
                </div>
                <FlipkartLoginDropdown
                  currentUser={currentUser}
                  handleLogout={handleLogout}
                  setShowAuthModal={setShowAuthModal}
                  setAuthMode={setAuthMode}
                />
                <div className="ref-icon-btn ref-cart-btn" onClick={() => {
                  if (!currentUser) { setShowAuthModal(true); return; }
                  navigate('/wishlist');
                }}>
                  <div className="ref-cart-icon-wrap">
                    <FiHeart className="ref-icon" />
                    {wishlistCount > 0 && (
                      <span className="ref-cart-badge">{wishlistCount}</span>
                    )}
                  </div>
                </div>
                <div className="ref-icon-btn ref-cart-btn" onClick={goToCart}>
                  <div className="ref-cart-icon-wrap">
                    <HoverCartIcon src={cartGif} alt="Cart" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    {cartCount > 0 && (
                      <span className="ref-cart-badge">{cartCount}</span>
                    )}
                  </div>
                </div>
              </>
            )}
            {mobileSearchActive && (
              <div className="d-flex align-items-center w-100 gap-2">
                <button
                  className="btn btn-link text-dark p-0"
                  onClick={() => setMobileSearchActive(false)}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <SearchBar />
              </div>
            )}
          </div>
        </div>

        {/* =================== SUB-NAVBAR MENU ROW =================== */}
        <div className="sub-navbar-row">
          <div className="sub-navbar-inner">
            <div
              className="sub-nav-all-cat"
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
            >
              <i className="fas fa-th sub-nav-grid-icon"></i>
              <span>All Categories</span>
              <i className={`fas fa-chevron-${showCategoryDropdown ? 'up' : 'down'} sub-nav-chev`}></i>

              {/* Mega Menu Dropdown */}
              {showCategoryDropdown && (
                <div className="all-categories-dropdown">
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <div
                        key={cat.id}
                        className="cat-dropdown-item"
                        onClick={() => navigate('/browse-categories', { state: { selectedCategory: cat.name } })}
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
              <a href="/" className="sub-nav-link sub-nav-active">Home</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/browse-categories"); }}>Browse Category</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/best-sellers"); }}>Best Sellers</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/new-arrivals"); }}>New Arrivals</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/rewards"); }}>
                Sadhana Rewards <span className="sub-nav-badge sub-nav-badge-new">New</span>
              </a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); navigate("/offers"); }}>Offers Zone</a>
              <a href="/track-order" className="sub-nav-link">Track Order</a>
              <a href="#" className="sub-nav-link" onClick={(e) => { e.preventDefault(); handleSellerClick(); }}>
                Become a Seller
              </a>
              <a href="/support" className="sub-nav-link">Help &amp; Support</a>
            </nav>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)} centered size="lg">
          <Modal.Body className="p-0">
            <AuthPage onClose={() => setShowAuthModal(false)} initialMode={authMode} onLoginSuccess={handleLoginSuccess} />
          </Modal.Body>
        </Modal>

        {showLoginModal && (
          <LoginConfirmationModal
            show={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            userName={loggedInUserName}
          />
        )}

        {showLogoutModal && (
          <LogoutConfirmationModal
            show={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
          />
        )}

        {/* Logout Confirmation Modal */}
        <Modal show={showLogoutConfirmModal} onHide={() => setShowLogoutConfirmModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold" style={{ fontSize: '1.25rem' }}>Confirm Log Out</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            <h4 className="fw-bold mb-2 text-dark" style={{ fontSize: '18px' }}>
              Are you sure you want to log out?
            </h4>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              You'll be signed out of your account and will need to log in again to access your profile, bookings, and other personalized features.
            </p>
            <div className="d-flex gap-3 mt-4">
              <button 
                type="button" 
                className="btn text-white w-100 fw-bold rounded" 
                style={{ backgroundColor: '#e53e3e', height: '42px' }}
                onClick={handleConfirmLogoutAction}
              >
                Log Out
              </button>
              <button 
                type="button" 
                className="btn text-white w-100 fw-bold rounded" 
                style={{ backgroundColor: '#38a169', height: '42px' }}
                onClick={() => setShowLogoutConfirmModal(false)}
              >
                Stay Signed In
              </button>
            </div>
          </Modal.Body>
        </Modal>
      </AnimatePresence>
    </>
  );
}
