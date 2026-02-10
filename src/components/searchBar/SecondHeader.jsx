import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SecondHeader.css";
import { FaBars, FaTimes, FaSpinner, FaChevronLeft, FaChevronRight,  } from "react-icons/fa";
import { db, collection, getDocs } from "../../firebase";

const SecondHeader = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef(null);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-theme') || 
                     document.documentElement.getAttribute('data-bs-theme') === 'dark';
      setIsDarkMode(isDark);
      
      // Update CSS variables based on theme
      updateThemeColors(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

    return () => observer.disconnect();
  }, []);

  const updateThemeColors = (isDark) => {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--sadhana-orange', '#f4a11a');
      root.style.setProperty('--cart-blue', '#1a1a2e');
      root.style.setProperty('--cart-blue-dark', '#0f0f1a');
      root.style.setProperty('--cart-blue-light', '#2a2a4a');
      root.style.setProperty('--text-white', '#e9ecef');
      root.style.setProperty('--text-dark', '#f8f9fa');
      root.style.setProperty('--hover-bg', 'rgba(255, 255, 255, 0.05)');
    } else {
      root.style.setProperty('--sadhana-orange', '#f4a11a');
      root.style.setProperty('--cart-blue', '#0b1e6d');
      root.style.setProperty('--cart-blue-dark', '#08154d');
      root.style.setProperty('--cart-blue-light', '#1a2b8f');
      root.style.setProperty('--text-white', '#ffffff');
      root.style.setProperty('--text-dark', '#333333');
      root.style.setProperty('--hover-bg', 'rgba(255, 255, 255, 0.1)');
    }
  };

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const body = document.body;
    
    if (isDarkMode) {
      // Switch to light mode
      html.removeAttribute('data-bs-theme');
      body.classList.remove('dark-theme');
      html.style.setProperty('color-scheme', 'light');
    } else {
      // Switch to dark mode
      html.setAttribute('data-bs-theme', 'dark');
      body.classList.add('dark-theme');
      html.style.setProperty('color-scheme', 'dark');
    }
    
    // Force re-check
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesRef = collection(db, "category");
        const snapshot = await getDocs(categoriesRef);

        const categoriesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          imageUrl: doc.data().image
            ? doc.data().image.replace(/\\/g, "")
            : null,
        }));

        categoriesList.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return new Date(b.timestamp) - new Date(a.timestamp);
          }
          return a.name?.localeCompare(b.name);
        });

        const allCategories = [...categoriesList];

        setCategories(allCategories);
      } catch (err) {
        console.error("Category fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/category/")) {
      const categoryId = path.split("/category/")[1];
      setActiveCategory(categoryId);
    } else {
      setActiveCategory(null);
    }
  }, [location.pathname]);

  const handleCategoryClick = (category) => {
    setActiveCategory(category.id);
    setMobileMenu(false);

    navigate(`/category/${category.id}`, {
      state: {
        categoryName: category.name,
        categoryImage: category.imageUrl,
      },
    });
  };

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300; 
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      setTimeout(updateArrowVisibility, 300);
    }
  };

  const updateArrowVisibility = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 10);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateArrowVisibility);
      window.addEventListener('resize', updateArrowVisibility);
      updateArrowVisibility();
      
      return () => {
        container.removeEventListener('scroll', updateArrowVisibility);
        window.removeEventListener('resize', updateArrowVisibility);
      };
    }
  }, [loading, categories]);

  return (
    <div className="second-header-wrapper theme-bg">
      <div className="second-header">
        <div className="menu-left">
          <div className="menu-item all" onClick={() => setMobileMenu(true)}>
            <FaBars className="menu-icon" />
            <span className="all-text theme-text">ALL CATEGORIES</span>
          </div>

          <div className="desktop-menu-container">
            {showLeftArrow && (
              <button className="scroll-arrow left-arrow theme-border" onClick={() => handleScroll('left')}>
                <FaChevronLeft className="theme-text" />
              </button>
            )}

            <ul className="menu-list desktop-menu theme-bg" ref={scrollContainerRef}>
              {loading ? (
                <li className="menu-item loading theme-text-secondary">
                  <FaSpinner className="spinner" /> Loading...
                </li>
              ) : (
                categories.map((category) => (
                  <li
                    key={category.id}
                    className={`menu-item theme-hover ${activeCategory === category.id ? "active theme-active" : ""}`}
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="category-box">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="category-image"
                          onError={(e) => (e.target.style.display = "none")}
                          loading="lazy"
                        />
                      ) : (
                        <div className="category-icon-placeholder theme-accent-bg">
                          {category.name.charAt(0)}
                        </div>
                      )}
                      <span className="category-name theme-text">{category.name}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>

            {showRightArrow && (
              <button className="scroll-arrow right-arrow theme-border" onClick={() => handleScroll('right')}>
                <FaChevronRight className="theme-text" />
              </button>
            )}
          </div>


          <div className={`mobile-menu ${mobileMenu ? "active" : ""} theme-bg`}>
            {mobileMenu && (
              <>
                <div className="mobile-menu-header theme-bg-dark">
                  <h3 className="theme-text">All Categories</h3>
                  <button className="close-menu-btn theme-text" onClick={() => setMobileMenu(false)}>
                    <FaTimes />
                  </button>
                </div>
                <div className="mobile-menu-content">
                  {loading ? (
                    <div className="mobile-loading theme-text-secondary">
                      <FaSpinner className="spinner" /> <span>Loading...</span>
                    </div>
                  ) : (
                    <ul className="mobile-menu-list">
                      {categories.map((category) => (
                        <li
                          key={category.id}
                          className={`mobile-menu-item theme-hover ${activeCategory === category.id ? "active theme-active" : ""}`}
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div className="mobile-category-box">
                            {category.imageUrl ? (
                              <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="mobile-category-image"
                                onError={(e) => (e.target.style.display = "none")}
                              />
                            ) : (
                              <div className="mobile-category-icon-placeholder theme-accent-bg">
                                {category.name.charAt(0)}
                              </div>
                            )}
                            <span className="mobile-category-name theme-text">{category.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {mobileMenu && <div className="mobile-menu-backdrop" onClick={() => setMobileMenu(false)} />}
      </div>
    </div>
  );
};

export default SecondHeader;