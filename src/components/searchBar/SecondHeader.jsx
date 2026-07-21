import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SecondHeader.css";
import { FaBars, FaTimes, FaSpinner, FaChevronLeft, FaChevronRight, } from "react-icons/fa";
import { db, collection, getDocs } from "../../firebase";
import { useTranslation } from "react-i18next";

const SecondHeader = () => {
  const { t } = useTranslation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [categories, setCategories] = useState(() => {
    try {
      const cached = sessionStorage.getItem("sc_cached_categories");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("sc_cached_categories");
    } catch (e) {
      return true;
    }
  });
  const [activeCategory, setActiveCategory] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
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

        if (allCategories.length > 0) {
          setCategories(allCategories);
          try {
            sessionStorage.setItem(
              "sc_cached_categories",
              JSON.stringify(allCategories)
            );
          } catch (e) {}
        }
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
          {/* MOBILE CATEGORY SCROLL UI */}
          <div className="mobile-category-scroll">
            {loading ? (
              <div className="mobile-loading theme-text-secondary">
                <div className="header-loader">
  <div className="orbit">
    <span className="dot dot1"></span>
    <span className="dot dot2"></span>
    <span className="dot dot3"></span>
    <span className="dot dot4"></span>
  </div>
</div>
              </div>
            ) : (
              <div className="mobile-category-list">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="mobile-category-card"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="mobile-category-img-wrapper">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="mobile-category-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="mobile-category-icon-placeholder theme-accent-bg">
                          {category.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <span className="mobile-category-title">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="desktop-menu-container">
            {showLeftArrow && (
              <button className="scroll-arrow left-arrow theme-border" onClick={() => handleScroll('left')}>
                <FaChevronLeft className="theme-text" />
              </button>
            )}

            <ul className="menu-list desktop-menu theme-bg" ref={scrollContainerRef}>
              {loading ? (
  <li className="menu-item loading">
    <div className="header-loader">
      <div className="orbit">
        <span className="dot dot1"></span>
        <span className="dot dot2"></span>
        <span className="dot dot3"></span>
        <span className="dot dot4"></span>
      </div>
    </div>
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
                  <h3 className="theme-text">{t("allCategories", "All Categories")}</h3>
                  <button className="close-menu-btn theme-text" onClick={() => setMobileMenu(false)}>
                    <FaTimes />
                  </button>
                </div>
                <div className="mobile-menu-content">
                  {loading ? (
                    <div className="mobile-loading theme-text-secondary">
                      <FaSpinner className="spinner" /> <span>{t("loading", "Loading...")}</span>
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