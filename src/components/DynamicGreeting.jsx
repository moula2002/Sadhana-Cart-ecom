import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Modal } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import "./DynamicGreeting.css";

const DynamicGreeting = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [dbName, setDbName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [icon, setIcon] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (docSnap.exists()) {
            setDbName(docSnap.data().name || "");
          }
        } catch (e) {
          console.error("Error fetching user name for dynamic greeting:", e);
        }
      } else {
        setDbName("");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only show once per session to avoid annoying the user on every home page visit
    const hasSeenGreeting = sessionStorage.getItem("hasSeenDynamicGreeting");
    
    if (!hasSeenGreeting) {
      setShow(true);
      sessionStorage.setItem("hasSeenDynamicGreeting", "true");
    }

    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("greeting.goodMorning");
      setIcon("🌅");
    } else if (hour < 17) {
      setGreeting("greeting.goodAfternoon");
      setIcon("☀️");
    } else {
      setGreeting("greeting.goodEvening");
      setIcon("🌙");
    }

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const userName = dbName || user?.displayName || user?.email?.split("@")[0] || t("greeting.guest", "Guest");

  // Get the default text for the greeting fallback
  const getGreetingDefaultText = () => {
    if (greeting === "greeting.goodMorning") return "Good Morning";
    if (greeting === "greeting.goodAfternoon") return "Good Afternoon";
    if (greeting === "greeting.goodEvening") return "Good Evening";
    return "";
  };

  return (
    <Modal 
      show={show} 
      onHide={() => setShow(false)} 
      centered 
      className="dynamic-greeting-modal"
      backdrop="static"
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <Modal.Body className="p-4 text-center py-5 position-relative">
              <button 
                type="button" 
                className="btn-close position-absolute top-0 end-0 m-3" 
                onClick={() => setShow(false)} 
                aria-label="Close"
              ></button>
              
              <div className="dynamic-greeting-content-modal">
                <motion.div 
                  className="greeting-icon-modal mb-3"
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  {icon}
                </motion.div>
                
                <h3 className="greeting-text-modal fw-bolder text-dark mb-2">
                  {greeting ? t(greeting, getGreetingDefaultText()) : ""}, <br/>
                  <span className="greeting-name-modal">{userName}</span>!
                </h3>
                
                <p className="greeting-subtext-modal text-muted mt-3 mb-4">
                  {user 
                    ? t("greeting.welcomeBack", "Welcome back! Ready to explore new deals?") 
                    : t("greeting.logInText", "Log in to see personalized offers.")}
                </p>
                
                <button 
                  className="btn btn-primary rounded-pill px-5 fw-bold" 
                  onClick={() => setShow(false)}
                >
                  {t("greeting.letsGo", "Let's Go!")}
                </button>
              </div>
            </Modal.Body>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default DynamicGreeting;

