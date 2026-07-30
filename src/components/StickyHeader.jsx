import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const StickyHeader = () => {
  const [headerData, setHeaderData] = useState(() => {
    try {
      const cached = localStorage.getItem("stickyHeader");
      return cached ? JSON.parse(cached) : { content: "Mega Savings Festival! Enjoy Up to 50% OFF on Best Sellers." };
    } catch {
      return { content: "Mega Savings Festival! Enjoy Up to 50% OFF on Best Sellers." };
    }
  });

  useEffect(() => {
    const fetchStickyHeader = async () => {
      try {
        const q = query(collection(db, "stickyHeader"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setHeaderData(data);
          localStorage.setItem("stickyHeader", JSON.stringify(data));
        } else {
          setHeaderData(null);
          localStorage.removeItem("stickyHeader");
        }
      } catch (error) {
        console.error("Error fetching sticky header:", error);
      }
    };
    fetchStickyHeader();
  }, []);

  if (!headerData) return null;

  return (
    <div className="announcement-bar">
      <div className="marquee-content">
        <span className="tag-badge">🎁</span>
        <span dangerouslySetInnerHTML={{ __html: headerData.content }}></span>
        {headerData.link && (
          <a href={headerData.link} className="announcement-link">
            Shop Now
          </a>
        )}
      </div>
    </div>
  );
};

export default StickyHeader;
