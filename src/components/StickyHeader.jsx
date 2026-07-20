import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const StickyHeader = () => {
  const [headerData, setHeaderData] = useState(null);

  useEffect(() => {
    const fetchStickyHeader = async () => {
      try {
        const q = query(collection(db, "stickyHeader"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setHeaderData(querySnapshot.docs[0].data());
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
