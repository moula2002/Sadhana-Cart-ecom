import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Navbar, Nav, Container, Button, Modal, Form, Badge } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";

// Redux & Components
import AuthPage from "../pages/LoginPage";
import SecondHeader from "./searchBar/SecondHeader";

import "./Navbar.css";
import logo from "../Images/Sadhanacart1.png";

// Firebase
import { db } from "../firebase";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
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
              
              <div className="px-3 py-2 text-muted small fw-bold bg-light">
                <i className="fas fa-fire me-2 text-warning"></i> TRENDING NOW
              </div>
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
    const nameToDisplay = user.displayName || user.email.split('@')[0];
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
    window.open("https://sadhana-cart-seller-panel.vercel.app/seller/login", "_blank");
  };

  const goToCart = () => navigate("/cart");
  const goToOrders = () => navigate("/orders");

  return (
    <>
      {/* =================== MAIN NAVBAR =================== */}
      <Navbar expand="lg" className="navbar-custom shadow-sm sticky-top bg-white" variant="light">
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
                      Sadhana<span style={{ color: "navy" }}>Cart</span>
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
                  className="border-0"
                  onClick={() => setMobileSearchActive(true)}
                >
                  <i className="fas fa-search"></i>
                </Button>


                {/* Orders with Badge */}
                <Button 
                  variant="outline-dark" 
                  size="sm" 
                  className="border-0 position-relative"
                  onClick={goToOrders}
                >
                  <i className="fas fa-box"></i>
                  {orderCount > 0 && (
                    <Badge 
                      bg="info" 
                      className="position-absolute top-0 start-100 translate-middle rounded-pill"
                      style={{ fontSize: "0.6rem", padding: "0.2rem 0.4rem" }}
                    >
                      {orderCount}
                    </Badge>
                  )}
                </Button>

                {/* Cart with Badge */}
                <Button 
                  size="sm" 
                  className="position-relative rounded-pill px-3"
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
                className="me-2 text-dark"
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
                <small className="text-dark fw-semibold">Seller</small>
              </motion.div>

              {/* Orders with Badge */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="d-flex flex-column align-items-center cursor-pointer position-relative"
                onClick={goToOrders}
              >
                <i className="fas fa-box text-success mb-1"></i>
                <small className="text-dark fw-semibold">Orders</small>
                {orderCount > 0 && (
                  <Badge 
                    bg="info" 
                    className="position-absolute top-0 end-0 translate-middle rounded-pill"
                    style={{ fontSize: "0.6rem", padding: "0.2rem 0.4rem" }}
                  >
                    {orderCount}
                  </Badge>
                )}
              </motion.div>

              {/* Auth */}
              {currentUser ? (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="d-flex align-items-center gap-2"
                >
                  <div className="text-end">
                    <div className="fw-bold text-dark small">
                      Hi, {currentUser.displayName || currentUser.email.split('@')[0]}
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={handleLogout}
                      className="border-1"
                    >
                      <i className="fas fa-sign-out-alt me-1"></i>
                      Logout
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline-dark" 
                    className="px-4"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <i className="fas fa-user me-2"></i>
                    Sign In
                  </Button>
                </motion.div>
              )}

              {/* Cart with Badge */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="warning" 
                  className="position-relative px-4"
                  onClick={goToCart}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  Cart
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