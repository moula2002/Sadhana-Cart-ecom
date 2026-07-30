import React from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

const DynamicRating = ({ initialRating, initialReviews }) => {
  const { t } = useTranslation();
  
  // Only render if we have actual rating data
  if (!initialRating && !initialReviews) return null;

  return (
    <div className="d-flex align-items-center gap-1 mt-1 mb-1" style={{ fontSize: "0.85rem" }}>
      {initialRating && (
        <div className="d-flex align-items-center" style={{ color: "#f4a11a" }}>
          <Star size={14} fill="#f4a11a" color="#f4a11a" />
          <span className="fw-bold ms-1 text-dark">{initialRating}</span>
        </div>
      )}
      {initialReviews && (
        <span className="text-muted ms-1" style={{ fontSize: "0.8rem" }}>
          ({initialReviews} {t("reviews", "reviews")})
        </span>
      )}
    </div>
  );
};

export default DynamicRating;
