import React, { useEffect, useState, useCallback, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
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
        setLoading(true);
        const snap = await getDocs(collection(db, "posters"));
        const list = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.status === "active") {
            list.push({ id: doc.id, image: d.image });
          }
        });
        setBanners(list.slice(0, 5));
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        // Add slight delay for smooth transition
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    setIndex((prev) => (prev + 1) % banners.length);
    setProgress(0);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
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
        return prev + 0.7; // Speed of progress bar
      });
    }, 50);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide, loading]);

  // Helper to get 3 images to show
  const getVisibleIndices = () => {
    const prev = (index - 1 + banners.length) % banners.length;
    const curr = index;
    const next = (index + 1) % banners.length;
    return { prev, curr, next };
  };

  const { prev, curr, next } = getVisibleIndices();

  if (loading) {
    return (
      <div className="banner-loader-wrapper">
        {/* Animated Background */}
        <div className="banner-loader-bg">
          <div className="gradient-animation"></div>
        </div>
        
        {/* Glassmorphism Container */}
        <div className="banner-loader">
          {/* Spinner */}
          <div className="loader-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-center">
              <div className="pulse-dot"></div>
            </div>
          </div>
          
          {/* Loading Text */}
          <div className="loader-text" style={{textAlign : "center"}}>
            <span className="loader-text-line" style={{color: "blueviolet"}}>Loading</span>
            <div className="loader-dots">
              <div className="dot-bounce"></div>
              <div className="dot-bounce"></div>
              <div className="dot-bounce"></div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="loader-progress" style={{textAlign: "center"}}>
            <div className="progress-track">
              <div className="progress-fill"></div>
            </div>
            <div className="progress-text" style={{color: "forestgreen"}}>Preparing your experience</div>
          </div>
          
          {/* Floating Elements */}
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length < 1) {
    return (
      <div className="banner-empty">
        <div className="empty-icon">🎬</div>
        <h3>No banners available</h3>
        <p>Check back soon for amazing content!</p>
      </div>
    );
  }

  return (
    <section className="banner-wrapper">
      {/* Dynamic Background */}
      <div className="banner-bg">
        <img src={banners[curr]?.image} alt="bg" />
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
              <img src={b.image} alt="Banner" />
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