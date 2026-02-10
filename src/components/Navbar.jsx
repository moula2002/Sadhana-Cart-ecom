import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Navbar, Nav, Container, Button, Modal, Form, Badge, Dropdown } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion"; 
// Redux & Components
import AuthPage from "../pages/LoginPage";
import SecondHeader from "./searchBar/SecondHeader";

import "./Navbar.css";
import logo from "../Images/Sadhanacart1.png";

// Firebase
import { db } from "../firebase";
import { collection, query, getDocs, orderBy, limit, where, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const auth = getAuth();

/* ---------------- MODALS ---------------- */
const LoginConfirmationModal = ({ show, onClose, userName }) => {
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
              <h4 className="mb-2 fw-bolder text-dark">Welcome Back!</h4>
              <p className="text-muted mt-3 mb-0">
                Hello, <span className="fw-bold text-primary">{userName}</span>!
                You are now signed in.
              </p>
            </Modal.Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

const LogoutConfirmationModal = ({ show, onClose }) => {
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
              <h4 className="mb-2 fw-bold text-danger">Logout Successful!</h4>
              <p className="text-muted mt-3 mb-0">You've been securely logged out.</p>
            </Modal.Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

/* ---------------- SEARCH BAR COMPONENT ---------------- */
const SearchBar = () => {
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
      <div className="input-group">
        <input
          type="text"
          className="form-control search-input-desktop border-end-0 rounded-start-pill"
          placeholder="What are you looking for?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {/* X Button - shows only when typing, positioned before search button */}
        {searchTerm && (
          <Button
            variant="outline-secondary"
            className="border-start-0 border-end-0 rounded-0 px-3"
            onClick={clearSearchText}
            style={{ borderColor: '#dee2e6' }}
          >
            <i className="fas fa-times"></i>
          </Button>
        )}

        <Button
          variant="warning"
          className="rounded-end-pill px-4"
          onClick={handleSubmit}
        >
          <i className="fas fa-search"></i>
        </Button>
      </div>

      {showDropdown && (
        <motion.div
          className="suggestions-dropdown shadow-lg border-0 rounded-3 mt-1"
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
                  className="suggestion-item p-3 border-bottom"
                  onClick={() => handleSelect(p)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={p.image || p.thumbnail || p.images?.[0]}
                      alt={p.pattern || p.name}
                      className="search-suggestion-img"
                      onError={(e) => e.target.src = "https://via.placeholder.com/40"}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-bold text-dark">
                        {highlightText(p.pattern || p.name, searchTerm)}
                      </div>
                      <div className="small text-muted">
                        {p.category} • {p.subcategory || ""}
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-1">

                        {p.mrp && p.offerprice && (
                          <Badge bg="danger" className="ms-2">
                            {Math.round(((p.mrp - p.offerprice) / p.mrp) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-muted">
                No products found for "{searchTerm}"
              </div>
            )
          ) : (
            <>
              {recentSearches.length > 0 && (
                <>
                  <div className="px-3 py-2 text-muted small fw-bold bg-light d-flex justify-content-between align-items-center">
                    <span>
                      <i className="fas fa-history me-2"></i> RECENT SEARCHES
                    </span>
                    <button
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={clearAllRecentSearches}
                    >
                      Clear all
                    </button>
                  </div>
                  {recentSearches.map((term, i) => (
                    <div
                      key={i}
                      className="suggestion-item px-3 py-2 d-flex justify-content-between align-items-center"
                      onClick={() => handleRecentSearchClick(term)}
                    >
                      <div className="d-flex align-items-center">
                        <i className="fas fa-clock me-2 text-muted"></i>
                        <span>{term}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-link text-danger p-0"
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
                  className="suggestion-item px-3 py-2"
                  onClick={() => handleSelect(p)}
                >
                  <i className="fas fa-chart-line me-2 text-primary"></i>
                  {p.pattern || p.name}
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
const FlipkartLoginDropdown = ({ currentUser, handleLogout, setShowAuthModal }) => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCoins, setWalletCoins] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

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

  // Fetch wallet balance when dropdown opens
  useEffect(() => {
    const fetchWalletData = async () => {
      if (currentUser && dropdownOpen) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setWalletBalance(userData.walletBalance || 0);
            setWalletCoins(userData.walletCoins || 0);
          }
        } catch (error) {
          console.error("Error fetching wallet data:", error);
        }
      }
    };

    fetchWalletData();
  }, [currentUser, dropdownOpen]);

  const handleProfileClick = () => {
    navigate("/profile");
    setDropdownOpen(false);
  };

  const handleWishlistClick = () => {
    navigate("/wishlist");
    setDropdownOpen(false);
  };

  const handleGiftCardsClick = () => {
    navigate("/refercode");
    setDropdownOpen(false);
  };

  const handleWalletClick = () => {
    navigate("/wallet");
    setDropdownOpen(false);
  };

  const handleOrdersClick = () => {
    navigate("/orders");
    setDropdownOpen(false);
  };
  

  return (
    <Dropdown 
      className="flipkart-login-dropdown"
      show={dropdownOpen}
      onToggle={(isOpen) => setDropdownOpen(isOpen)}
    >
      <Dropdown.Toggle 
        variant="light" 
        className="d-flex align-items-center gap-2 px-3 py-2 border-0"
        style={{ background: 'transparent' }}
      >
        <i className="fas fa-user text-primary"></i>
        <span className="d-none d-lg-inline text-dark fw-semibold theme-text">
          {currentUser ? 
            (currentUser.displayName || currentUser.email?.split("@")[0] || "User") : 
            "Login"
          }
        </span>
        <i className="fas fa-chevron-down ms-1 small text-muted"></i>
      </Dropdown.Toggle>

      <Dropdown.Menu className="border-0 shadow-lg rounded-3 mt-2 py-3 theme-dropdown" style={{ minWidth: '320px' }}>
        {!currentUser ? (
          <>
            <div className="px-4 pt-3">
              <button 
                className="btn btn-outline-primary w-100 rounded-pill fw-bold mb-3"
                onClick={() => {
                  setShowAuthModal(true);
                  setDropdownOpen(false);
                }}
              >
                Login
              </button>
            </div>
          </>
        ) : (
          <div className="px-4 pb-3 border-bottom">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-primary bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center" 
                   style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                {currentUser.displayName?.[0]?.toUpperCase() || 
                 currentUser.email?.[0]?.toUpperCase() || 
                 <i className="fas fa-user"></i>}
              </div>
              <div>
                <h6 className="mb-0 fw-bold theme-text">{currentUser.displayName || currentUser.email?.split("@")[0] || "User"}</h6>
                <small className="text-muted theme-text-secondary">{currentUser.email}</small>
              </div>
            </div>
          </div>
        )}

        <div className="px-2">
          <Dropdown.Item 
            className="py-3 px-3 d-flex align-items-center gap-3 theme-dropdown-item"
            onClick={handleProfileClick}
          >
            <i className="fas fa-user-circle text-primary"></i>
            <div>
              <div className="fw-semibold theme-text">My Profile</div>
              <small className="text-muted theme-text-secondary">View & edit profile</small>
            </div>
          </Dropdown.Item>

          <Dropdown.Item 
            className="py-3 px-3 d-flex align-items-center gap-3 theme-dropdown-item"
            onClick={handleOrdersClick}
          >
            <i className="fas fa-box text-success"></i>
            <div>
              <div className="fw-semibold theme-text">Orders</div>
              <small className="text-muted theme-text-secondary">Track & manage orders</small>
            </div>
          </Dropdown.Item>

          <Dropdown.Item 
            className="py-3 px-3 d-flex align-items-center gap-3 theme-dropdown-item"
            onClick={handleWishlistClick}
          >
            <i className="fas fa-heart text-danger"></i>
            <div>
              <div className="fw-semibold theme-text">Wishlist</div>
              <small className="text-muted theme-text-secondary">Saved items</small>
            </div>
          </Dropdown.Item>

          <Dropdown.Item 
            className="py-3 px-3 d-flex align-items-center gap-3 theme-dropdown-item"
            onClick={handleWalletClick}
          >
            <div className="position-relative">
              <i className="fas fa-wallet text-success"></i>
              {walletBalance > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}>
                  ₹{walletBalance}
                </span>
              )}
            </div>
            <div>
              <div className="fw-semibold theme-text">Wallet & Rewards</div>
              <small className="text-muted theme-text-secondary">Balance: ₹{walletBalance} • Coins: {walletCoins}</small>
            </div>
          </Dropdown.Item>

          <Dropdown.Item 
            className="py-3 px-3 d-flex align-items-center gap-3 theme-dropdown-item"
            onClick={handleGiftCardsClick}
          >
            <i className="fas fa-credit-card text-info"></i>
            <div>
              <div className="fw-semibold theme-text">Refer & Earn</div>
              <small className="text-muted theme-text-secondary">Get ₹50 for each friend</small>
            </div>
          </Dropdown.Item>

          {/* THEME TOGGLE BUTTON */}
          <hr className="my-2" />
          <Dropdown.Item 
            className="py-3 px-3 d-flex align-items-center gap-3 theme-dropdown-item"
            onClick={toggleTheme}
          >
            <div className="position-relative">
              {theme === 'light' ? (
                <i className="fas fa-moon text-warning"></i>
              ) : (
                <i className="fas fa-sun text-warning"></i>
              )}
            </div>
            <div>
              <div className="fw-semibold theme-text">Theme</div>
              <small className="text-muted theme-text-secondary">
                {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              </small>
            </div>
            <div className="ms-auto">
              <div className={`theme-toggle-switch ${theme}`}>
                <div className="theme-toggle-slider"></div>
              </div>
            </div>
          </Dropdown.Item>

          {currentUser && (
            <>
              <hr className="my-2" />
              <Dropdown.Item 
                className="py-3 px-3 d-flex align-items-center gap-3 text-danger theme-dropdown-item"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i>
                <div className="fw-semibold theme-text">Logout</div>
              </Dropdown.Item>
            </>
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

/* ---------------- MAIN HEADER COMPONENT ---------------- */
export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State
  const { location } = useSelector((state) => state.header);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const orders = useSelector((state) => state.orders?.items || []);

  const cartCount = cartItems.length;
  const orderCount = orders.length;

  // Local State
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [mobileSearchActive, setMobileSearchActive] = useState(false);

  // Check theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('dark-theme');
    }
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  /* ---------------- HANDLERS ---------------- */
  const handleLoginSuccess = (user) => {
    setShowAuthModal(false);
    const nameToDisplay = user.displayName || user.email?.split('@')[0] || "User";
    setLoggedInUserName(nameToDisplay);
    setShowLoginModal(true);
    setTimeout(() => setShowLoginModal(false), 2000);
  };

  const handleLogout = async () => {
    try {
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
      <Navbar expand="lg" className="navbar-custom shadow-sm sticky-top" variant="light">
        <Container fluid className="px-3 px-lg-4">

          {/* MOBILE VIEW */}
          {!mobileSearchActive && (
            <>
              {/* LOGO */}
              <Navbar.Brand href="/" className="d-flex align-items-center me-auto">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="d-flex align-items-center"
                >
                  <img
                    src={logo}
                    alt="Sadhana Cart"
                    className="logo-img"
                    style={{ width: "50px", height: "50px", objectFit: "contain" }}
                  />
                  <div className="ms-2">
                    <div className="brand-text" style={{
                      color: "goldenrod",
                      fontWeight: "800",
                      fontSize: "1.4rem",
                      lineHeight: "1.1"
                    }}>
                      Sadhana<span className="brand-text-part" style={{ color: "navy" }}>Cart</span>
                    </div>
                  </div>
                </motion.div>
              </Navbar.Brand>

              {/* MOBILE ACTIONS */}
              <div className="d-flex d-lg-none align-items-center gap-2">
                {/* Search Toggle */}
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="border-0 theme-button"
                  onClick={() => setMobileSearchActive(true)}
                >
                  <i className="fas fa-search"></i>
                </Button>

                {/* Mobile Login Dropdown */}
                <FlipkartLoginDropdown 
                  currentUser={currentUser}
                  handleLogout={handleLogout}
                  setShowAuthModal={setShowAuthModal}
                />

                {/* Cart with Badge */}
                <Button
                  variant="warning"
                  size="sm"
                  className="position-relative rounded-pill px-3 theme-button"
                  onClick={goToCart}
                >
                  <i className="fas fa-shopping-cart"></i>
                  {cartCount > 0 && (
                    <Badge
                      bg="danger"
                      className="position-absolute top-0 start-100 translate-middle rounded-pill"
                      style={{ fontSize: "0.6rem", padding: "0.2rem 0.4rem" }}
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* MOBILE SEARCH VIEW */}
          {mobileSearchActive && (
            <div className="d-flex d-lg-none align-items-center w-100">
              <Button
                variant="link"
                className="me-2 text-dark theme-text"
                onClick={() => setMobileSearchActive(false)}
              >
                <i className="fas fa-arrow-left"></i>
              </Button>
              <SearchBar />
            </div>
          )}

          {/* DESKTOP VIEW */}
          <Navbar.Collapse id="navbar-collapse" className="d-none d-lg-flex">

            {/* Search Bar */}
            <Nav className="flex-grow-1 mx-4" style={{ maxWidth: "600px" }}>
              <SearchBar />
            </Nav>

            {/* Right Actions */}
            <Nav className="align-items-center gap-4">
              {/* Seller */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="d-flex flex-column align-items-center cursor-pointer"
                onClick={handleSellerClick}
              >
                <i className="fas fa-store text-primary mb-1"></i>
                <small className="text-dark fw-semibold theme-text">Seller</small>
              </motion.div>

              {/* Flipkart Style Login Dropdown */}
              <FlipkartLoginDropdown 
                currentUser={currentUser}
                handleLogout={handleLogout}
                setShowAuthModal={setShowAuthModal}
              />

              {/* Cart with Badge */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="warning"
                  className="position-relative px-4 theme-button"
                  onClick={goToCart}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  <span className="theme-text">Cart</span>
                  {cartCount > 0 && (
                    <Badge
                      bg="danger"
                      className="position-absolute top-0 start-100 translate-middle rounded-pill"
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* SECOND HEADER */}
      <SecondHeader />

      {/* MODALS */}
      <AnimatePresence>
        {/* Auth Modal */}
        <Modal
          show={showAuthModal}
          onHide={() => setShowAuthModal(false)}
          centered
          size="lg"
        >
          <Modal.Body className="p-0">
            <AuthPage
              onClose={() => setShowAuthModal(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          </Modal.Body>
        </Modal>

        {/* Login Success Modal */}
        {showLoginModal && (
          <LoginConfirmationModal
            show={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            userName={loggedInUserName}
          />
        )}

        {/* Logout Success Modal */}
        {showLogoutModal && (
          <LogoutConfirmationModal
            show={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}