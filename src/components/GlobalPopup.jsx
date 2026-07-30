import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { X } from 'lucide-react';
import './GlobalPopup.css';

const GlobalPopup = () => {
  const [activePopup, setActivePopup] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAndCheckPopup = async () => {
      try {
        const q = query(collection(db, 'popups'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;

        const popups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const now = new Date();

        // Find the first valid popup based on date range
        const validPopup = popups.find(popup => {
          const startDate = popup.startDate ? popup.startDate.toDate() : null;
          const endDate = popup.endDate ? popup.endDate.toDate() : null;
          
          if (startDate && endDate) {
            return now >= startDate && now <= endDate;
          } else if (startDate) {
            return now >= startDate;
          } else if (endDate) {
            return now <= endDate;
          }
          return true; // No dates set, always valid if active
        });

        if (validPopup) {
          checkFrequencyAndDisplay(validPopup);
        }
      } catch (error) {
        console.error("Error fetching popups:", error);
      }
    };

    fetchAndCheckPopup();
  }, []);

  const checkFrequencyAndDisplay = (popup) => {
    const popupId = popup.id;
    const { frequency } = popup;

    const storageKey = `popup_viewed_${popupId}`;
    
    let shouldShow = false;

    if (frequency === 'always') {
      shouldShow = true;
    } else if (frequency === 'session') {
      if (!sessionStorage.getItem(storageKey)) {
        shouldShow = true;
        sessionStorage.setItem(storageKey, 'true');
      }
    } else if (frequency === 'daily') {
      const lastViewed = localStorage.getItem(storageKey);
      if (!lastViewed) {
        shouldShow = true;
        localStorage.setItem(storageKey, new Date().toISOString());
      } else {
        const hoursPassed = (new Date() - new Date(lastViewed)) / (1000 * 60 * 60);
        if (hoursPassed >= 24) {
          shouldShow = true;
          localStorage.setItem(storageKey, new Date().toISOString());
        }
      }
    } else if (frequency === 'once') {
      if (!localStorage.getItem(storageKey)) {
        shouldShow = true;
        localStorage.setItem(storageKey, 'true');
      }
    }

    if (shouldShow) {
      if (popup.imageUrl) {
        const img = new Image();
        img.src = popup.imageUrl;
        img.onload = () => {
          setActivePopup(popup);
          setTimeout(() => setIsVisible(true), 50); // fast entrance animation
        };
        img.onerror = () => {
          setActivePopup(popup);
          setTimeout(() => setIsVisible(true), 50);
        };
      } else {
        setActivePopup(popup);
        setTimeout(() => setIsVisible(true), 50);
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setActivePopup(null), 300); // Wait for animation to finish
  };

  const handleActionClick = () => {
    if (activePopup.buttonLink) {
      // Internal or external link handling
      if (activePopup.buttonLink.startsWith('http')) {
        window.open(activePopup.buttonLink, '_blank');
      } else {
        window.location.href = activePopup.buttonLink;
      }
    }
    handleClose();
  };

  if (!activePopup) return null;

  return (
    <div className={`global-popup-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`global-popup-container ${isVisible ? 'visible' : ''}`}>
        <button className="global-popup-close" onClick={handleClose}>
          <X size={24} />
        </button>
        
        {activePopup.imageUrl && (
          <div className="global-popup-image-container">
            <img 
              src={activePopup.imageUrl} 
              alt={activePopup.title} 
              className="global-popup-image" 
            />
          </div>
        )}
        
        <div className="global-popup-content">
          {activePopup.title && (
            <h2 className="global-popup-title">{activePopup.title}</h2>
          )}
          
          {activePopup.description && (
            <p className="global-popup-description">{activePopup.description}</p>
          )}
          
          {activePopup.buttonText && (
            <button 
              className="global-popup-action-btn"
              onClick={handleActionClick}
            >
              {activePopup.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalPopup;
