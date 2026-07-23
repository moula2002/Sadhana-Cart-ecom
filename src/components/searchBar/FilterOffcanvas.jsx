import React, { useState, useEffect } from "react";
import { Offcanvas, Button, Form } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import "./FilterOffcanvas.css";
import { useTranslation } from "react-i18next";
import { db } from "../../firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { useTheme } from "../../context/ThemeContext";

const FilterOffcanvas = ({ show, onHide, onApply }) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("Price");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    category: "",
    gender: "",
    brand: "",
    size: "",
    rating: ""
  });
  
  const [options, setOptions] = useState({
    Category: [],
    Gender: [],
    Brand: [],
    Size: [],
    Rating: ["4 & above", "3 & above", "2 & above", "1 & above"]
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!show || options.Category.length > 0) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const q = query(collection(db, "products"), limit(500));
        const snap = await getDocs(q);
        
        const catSet = new Set();
        const genSet = new Set();
        const brandSet = new Set();
        const sizeSet = new Set();
        
        snap.forEach(doc => {
          const data = doc.data();
          if (data.category) catSet.add(data.category);
          if (data.gender) genSet.add(data.gender);
          if (data.brand) brandSet.add(data.brand);
          if (data.size) {
            if (Array.isArray(data.size)) {
              data.size.forEach(s => sizeSet.add(s));
            } else {
              sizeSet.add(data.size);
            }
          }
        });
        
        setOptions(prev => ({
          ...prev,
          Category: Array.from(catSet).sort(),
          Gender: Array.from(genSet).sort(),
          Brand: Array.from(brandSet).sort(),
          Size: Array.from(sizeSet).sort()
        }));
      } catch (err) {
        console.error("Error fetching filter options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [show, options.Category.length]);

  const tabs = [
    { id: "Price", label: t("price", "Price") },
    { id: "Category", label: t("categoryLabel", "Category") },
    { id: "Gender", label: t("gender", "Gender") },
    { id: "Brand", label: t("brand", "Brand") },
    { id: "Size", label: t("size", "Size") },
    { id: "Rating", label: t("rating", "Rating") }
  ];

  const handleApply = () => {
    onApply(filters);
    onHide();
  };

  const handleQuickSelect = (min, max) => {
    setFilters({ ...filters, minPrice: min, maxPrice: max });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Price":
        return (
          <div className="filter-content-pane">
            <h5 className="fw-bold mb-3" style={{ color: isDark ? '#f8fafc' : '#1a202c' }}>{t("priceRange", "Price Range")}</h5>
            
            <div className="d-flex align-items-center gap-2 mb-4">
              <div className="price-input-box" style={{ borderColor: isDark ? '#334155' : '#ced4da', backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
                <span className="text-muted small">{t("min", "Min")}</span>
                <div className="d-flex align-items-center fw-bold" style={{ color: isDark ? '#f8fafc' : '#1a202c' }}>
                  <span>₹</span>
                  <input 
                    type="number" 
                    className="border-0 bg-transparent flex-grow-1 ms-1"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    placeholder="168"
                    style={{ color: isDark ? '#f8fafc' : '#1a202c' }}
                  />
                </div>
              </div>
              <span className="fw-bold text-muted">-</span>
              <div className="price-input-box" style={{ borderColor: isDark ? '#334155' : '#ced4da', backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
                <span className="text-muted small">{t("max", "Max")}</span>
                <div className="d-flex align-items-center fw-bold" style={{ color: isDark ? '#f8fafc' : '#1a202c' }}>
                  <span>₹</span>
                  <input 
                    type="number" 
                    className="border-0 bg-transparent flex-grow-1 ms-1"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    placeholder="12899"
                    style={{ color: isDark ? '#f8fafc' : '#1a202c' }}
                  />
                </div>
              </div>
            </div>

            <div className="price-slider-container mb-4">
               {/* Custom Dual Range Slider representation using HTML5 input for simplicity, or just a single range for now */}
               <input 
                 type="range" 
                 className="form-range custom-price-range" 
                 min="0" 
                 max="20000"
                 value={filters.maxPrice || 12899}
                 onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
               />
               <div className="d-flex justify-content-between text-muted small mt-1">
                  <span>₹168</span>
                  <span>₹12899</span>
               </div>
            </div>

            <h6 className="fw-bold mb-3 text-muted">{t("quickSelect", "Quick Select")}</h6>
            <div className="quick-select-grid">
              <button className="quick-select-btn" onClick={() => handleQuickSelect("", "500")}>{t("under500", "Under ₹500")}</button>
              <button className="quick-select-btn" onClick={() => handleQuickSelect("500", "1000")}>{t("500to1000", "₹500 - ₹1,000")}</button>
              <button className="quick-select-btn" onClick={() => handleQuickSelect("1000", "2500")}>{t("1000to2500", "₹1,000 - ₹2,500")}</button>
              <button className="quick-select-btn" onClick={() => handleQuickSelect("2500", "5000")}>{t("2500to5000", "₹2,500 - ₹5,000")}</button>
              <button className="quick-select-btn" onClick={() => handleQuickSelect("5000", "10000")}>{t("5000to10000", "₹5,000 - ₹10,000")}</button>
              <button className="quick-select-btn" onClick={() => handleQuickSelect("10000", "")}>{t("above10000", "Above ₹10,000")}</button>
            </div>
          </div>
        );
      case "Category":
      case "Gender":
      case "Brand":
      case "Size":
      case "Rating":
        const list = options[activeTab] || [];
        const filterKey = activeTab.toLowerCase();
        const title = t(filterKey, activeTab);

        if (loadingOptions) {
          return <div className="filter-content-pane text-muted p-3">{t("loading", "Loading...")}</div>;
        }
        
        if (list.length === 0) {
          return <div className="filter-content-pane text-muted p-3">{t("noOptions", "No options available.")}</div>;
        }

        return (
          <div className="filter-content-pane">
            <h5 className="fw-bold mb-3" style={{ color: isDark ? '#f8fafc' : '#1a202c' }}>{title}</h5>
            <div className="d-flex flex-column gap-3">
              {list.map((item, idx) => {
                const isChecked = filters[filterKey] === item;
                return (
                  <label key={idx} className="d-flex align-items-center gap-3" style={{ cursor: 'pointer', color: isDark ? '#cbd5e1' : '#4a5568' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => {
                        setFilters({...filters, [filterKey]: isChecked ? "" : item});
                      }}
                      style={{ accentColor: '#3b82f6', width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '15px' }}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      default:
        return <div className="filter-content-pane text-muted p-3">{t("filterComingSoon", "{{tab}} filter coming soon.", { tab: t(activeTab.toLowerCase(), activeTab) })}</div>;
    }
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" className="custom-filter-offcanvas">
      <Offcanvas.Header className="filter-header border-bottom">
        <Button variant="link" onClick={onHide} className={`p-0 me-3 ${isDark ? 'text-light' : 'text-dark'}`}>
          <FaTimes size={20} />
        </Button>
        <Offcanvas.Title className={`fw-bold flex-grow-1 text-center pe-4 ${isDark ? 'text-light' : 'text-dark'}`}>
          {t("filters", "Filters")}
        </Offcanvas.Title>
      </Offcanvas.Header>
      
      <Offcanvas.Body className="p-0 d-flex flex-column">
        <div className="d-flex flex-grow-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="filter-sidebar">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`filter-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </div>
          
          {/* Right Content */}
          <div className="filter-content flex-grow-1 overflow-auto p-3">
             {renderContent()}
          </div>
        </div>
        
        {/* Sticky Footer */}
        <div className="filter-footer border-top p-3 d-flex align-items-center justify-content-between">
          <span className="text-muted small">
             {Object.values(filters).filter(Boolean).length > 0 ? t("filtersApplied", "Filters applied") : t("noFiltersApplied", "No filters applied")}
          </span>
          <Button variant="primary" className="apply-filter-btn" onClick={handleApply}>
            {t("apply", "APPLY")}
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default FilterOffcanvas;
