import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Brands.css";

function Brands() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "brands"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBrands(list);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -350 : 350,
        behavior: "smooth",
      });
    }
  };

  if (brands.length === 0) return null;

  return (
    <section className="brands-section sc-section home-section-animated position-relative">
      <div className="sc-header">
        <h2 className="sc-title">{t("home.topBrands", "Top Brands")}</h2>
      </div>

      <div className="position-relative">
        {brands.length > 4 && (
          <>
            <button
              className="btn btn-light rounded-circle shadow-sm border position-absolute start-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
              style={{
                width: '38px',
                height: '38px',
                zIndex: 10,
                left: '-10px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                cursor: 'pointer'
              }}
              onClick={() => scroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="btn btn-light rounded-circle shadow-sm border position-absolute end-0 top-50 translate-middle-y d-flex align-items-center justify-content-center"
              style={{
                width: '38px',
                height: '38px',
                zIndex: 10,
                right: '-10px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                cursor: 'pointer'
              }}
              onClick={() => scroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div className="brands-container" ref={scrollRef}>
          {brands.map((brand) => (
            <div 
              key={brand.id} 
              className="brand-card"
              onClick={() => navigate(`/brand/${brand.id}`)}
            >
              <div className="brand-img-wrap">
                <img src={brand.image} alt={brand.name} loading="lazy" />
              </div>
              <p className="brand-name">{brand.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Brands;
