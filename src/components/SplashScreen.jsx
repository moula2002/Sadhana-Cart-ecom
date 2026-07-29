import React, { useEffect, useState } from "react";
import "./SplashScreen.css";
import logo from "../Images/Sadhanacart1.png";

const SESSION_KEY = "sc_splash_shown";

const SplashScreen = ({ onDone }) => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show splash if NOT already shown this session
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) {
      onDone?.();
      return;
    }

    setVisible(true);

    // Mark as shown for this session
    sessionStorage.setItem(SESSION_KEY, "true");

    // After 2.4s start fade-out
    const fadeTimer = setTimeout(() => setFadeOut(true), 2400);

    // After fade-out completes (0.6s), call onDone
    const doneTimer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`sc-splash ${fadeOut ? "sc-splash--fadeout" : ""}`}>
      {/* Animated background orbs */}
      <div className="sc-splash__orb sc-splash__orb--1" />
      <div className="sc-splash__orb sc-splash__orb--2" />
      <div className="sc-splash__orb sc-splash__orb--3" />

      <div className="sc-splash__content">
        {/* Logo */}
        <div className="sc-splash__logo-wrap">
          <img src={logo} alt="Sadhana Cart" className="sc-splash__logo" />
        </div>

        {/* Brand Name */}
        <h1 className="sc-splash__brand">Sadhana Cart</h1>
        <p className="sc-splash__tagline">Shop Smart. Live Better.</p>

        {/* Loading bar */}
        <div className="sc-splash__bar-track">
          <div className="sc-splash__bar-fill" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
