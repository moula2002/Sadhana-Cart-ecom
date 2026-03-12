import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";
import "./Banner.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Query-லேயே "active" மட்டும் எடுப்பது வேகமானது
        const q = query(
          collection(db, "posters"),
          where("status", "==", "active"),
          limit(5)
        );
        
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({
          id: doc.id,
          image: doc.data().image
        }));

        setBanners(list);
        setLoading(false); // உடனே Loading-ஐ நிறுத்தவும்

        // படங்களை முன்கூட்டியே Cache செய்ய (Pre-fetching)
        list.forEach((b) => {
          const img = new Image();
          img.src = b.image;
        });

      } catch (error) {
        console.error("Error fetching banners:", error);
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setIndex((prev) => (prev + 1) % banners.length);
    setProgress(0);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setProgress(0);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || loading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 1; // வேகத்தை இங்கு மாற்றலாம்
      });
    }, 40); // 50-லிருந்து 40-க்கு மாற்றப்பட்டது (Smoother)

    return () => clearInterval(interval);
  }, [banners.length, nextSlide, loading]);

  const getVisibleIndices = () => {
    const len = banners.length;
    const prev = (index - 1 + len) % len;
    const curr = index;
    const next = (index + 1) % len;
    return { prev, curr, next };
  };

  if (loading) {
    return (
      <div className="banner-loader-compact">
        <div className="simple-spinner"></div>
      </div>
    );
  }

  if (banners.length < 1) {
    return (
      <div className="banner-empty">
        <div className="empty-icon">🎬</div>
        <h3>No banners available</h3>
      </div>
    );
  }

  const { prev, curr, next } = getVisibleIndices();

  return (
    <section className="banner-wrapper">
      {/* Background with Blur */}
      <div className="banner-bg">
        <img src={banners[curr]?.image} alt="bg" loading="eager" />
        <div className="overlay"></div>
      </div>

      <div className="banner-progress">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="slides-container">
        {banners.map((b, i) => {
          let slideClass = "banner-slide";
          if (i === curr) slideClass += " center";
          else if (i === prev) slideClass += " left";
          else if (i === next) slideClass += " right";
          else slideClass += " hidden";

          return (
            <div key={b.id} className={slideClass}>
              <img src={b.image} alt="Banner" loading="eager" />
            </div>
          );
        })}
      </div>

      <div className="banner-nav">
        <button onClick={prevSlide} className="nav-btn left">
          <FaChevronLeft />
        </button>
        <button onClick={nextSlide} className="nav-btn right">
          <FaChevronRight />
        </button>
      </div>

      <div className="banner-dots">
        {banners.map((_, i) => (
          <span
            key={i}
            className={index === i ? "dot active" : "dot"}
            onClick={() => {
              setIndex(i);
              setProgress(0);
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default Banner;