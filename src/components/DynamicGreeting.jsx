import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Modal } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import "./DynamicGreeting.css";

const DynamicGreeting = () => {
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [icon, setIcon] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
      setGreeting("Good Morning");
      setIcon("🌅");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
      setIcon("☀️");
    } else {
      setGreeting("Good Evening");
      setIcon("🌙");
    }

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const userName = user?.displayName || user?.email?.split("@")[0] || "Guest";

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
                  {greeting}, <br/>
                  <span className="greeting-name-modal">{userName}</span>!
                </h3>
                
                <p className="greeting-subtext-modal text-muted mt-3 mb-4">
                  {user ? "Welcome back! Ready to explore new deals?" : "Log in to see personalized offers."}
                </p>
                
                <button 
                  className="btn btn-primary rounded-pill px-5 fw-bold" 
                  onClick={() => setShow(false)}
                >
                  Let's Go!
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
