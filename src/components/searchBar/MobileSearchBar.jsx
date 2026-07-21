import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import FilterOffcanvas from "./FilterOffcanvas";
import "./MobileSearchBar.css";
import { useTranslation } from "react-i18next";

// React icons
import { FaArrowLeft, FaSearch, FaMicrophone, FaTimes } from "react-icons/fa";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { FiTrendingUp } from "react-icons/fi";
import { BsArrowUpLeft } from "react-icons/bs";

// Category Icons for Trending Now
import { 
  GiPoloShirt, GiRunningShoe, GiSonicShoes, GiMonsteraLeaf
} from "react-icons/gi";
import { PiPantsFill, PiDressFill } from "react-icons/pi";

const MobileSearchBar = ({ onBack }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock categories for "Trending Now" if firestore fails or is empty
    setTrending([
      { name: t("tShirts", "T-Shirts"), icon: <GiPoloShirt /> },
      { name: t("shoes", "Shoes"), icon: <GiRunningShoe /> },
      { name: t("jackets", "Jackets"), icon: <FiTrendingUp /> },
      { name: t("kurti", "Kurti"), icon: <PiDressFill /> },
      { name: t("pants", "Pants"), icon: <PiPantsFill /> },
      { name: t("personal", "Personal..."), icon: <GiMonsteraLeaf /> }
    ]);
  }, [t]);

  const fetchSearchData = async (value) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const searchTerms = value.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    if (searchTerms.length === 0) {
      setLoading(false);
      return;
    }
    
    const firstWord = searchTerms[0];

    try {
      const productsRef = collection(db, "products");
      const q = query(
        productsRef,
        where("searchkeywords", "array-contains", firstWord),
        limit(50)
      );

      const snap = await getDocs(q);
      let results = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (searchTerms.length > 1) {
        results = results.filter(p => {
          const keywords = p.searchkeywords || [];
          const textToSearch = (p.name + " " + (p.pattern || "") + " " + (p.category || "") + " " + keywords.join(" ")).toLowerCase();
          return searchTerms.every(term => textToSearch.includes(term));
        });
      }

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
      fetchSearchData(searchTerm);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const handleSelect = (product) => {
    const term = product.pattern || product.name || "";
    setSearchTerm(term);
    navigate(`/product/${product.id}`);
  };

  const handleApplyFilter = (filters) => {
    // construct query params
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    const params = new URLSearchParams(cleanFilters).toString();
    navigate(`/search-results?${params}`);
  };

  return (
    <div className="mobile-search-container">
      {/* Blue Header */}
      <div className="mobile-search-header bg-primary">
        <button className="icon-btn text-white" onClick={onBack}>
          <FaArrowLeft />
        </button>
        
        <div className="search-input-wrapper">
          <FaSearch className="search-icon-inside" />
          <input
            type="text"
            className="mobile-search-input"
            placeholder={t("searchPlaceholder", "Search...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm("")}>
              <FaTimes />
            </button>
          )}
          <button className="mic-btn">
            <FaMicrophone />
          </button>
        </div>
        
        <button className="icon-btn filter-btn text-white" onClick={() => setShowFilter(true)}>
          <HiOutlineAdjustmentsHorizontal size={24} />
        </button>
      </div>

      {/* Search Content Body */}
      <div className="mobile-search-body">
        {!searchTerm ? (
          /* Trending Now */
          <div className="trending-section">
            <h6 className="trending-title">{t("popularSearches", "Popular Searches")}</h6>
            <div className="trending-pills-grid">
              {trending.map((item, idx) => (
                <div key={idx} className="trending-pill" onClick={() => setSearchTerm(item.name)}>
                  <span className="pill-icon">{item.icon}</span>
                  <span className="pill-text">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Suggestions List */
          <div className="suggestions-list">
            {loading ? (
              <div className="p-4 text-center text-muted">{t("searching", "Searching...")}</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((p) => (
                <div key={p.id} className="suggestion-row" onClick={() => handleSelect(p)}>
                  <div className="suggestion-thumb-wrapper">
                    <img 
                      src={p.image || p.thumbnail || p.images?.[0] || "https://via.placeholder.com/50"} 
                      alt={p.name} 
                      className="suggestion-thumb" 
                    />
                  </div>
                  <div className="suggestion-info">
                    <div className="suggestion-title">{p.pattern || p.name}</div>
                    <div className="suggestion-category">{t("inCategory", "in {{category}}", { category: p.category?.toLowerCase() || 'fashion' }).replace("{{category}}", p.category?.toLowerCase() || 'fashion')}</div>
                  </div>
                  <div className="suggestion-action">
                    <div className="suggestion-price">₹{p.offerprice || p.mrp || 209}</div>
                    <BsArrowUpLeft className="suggestion-arrow" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted">{t("noResultsFoundFor", "No results found for '{{term}}'", { term: searchTerm }).replace("{{term}}", searchTerm)}</div>
            )}
          </div>
        )}
      </div>

      <FilterOffcanvas 
        show={showFilter} 
        onHide={() => setShowFilter(false)} 
        onApply={handleApplyFilter} 
      />
    </div>
  );
};

export default MobileSearchBar;
