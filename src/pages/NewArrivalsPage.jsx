import React, { useEffect } from "react";
import FeatureProducts from "../components/category/FeatureProducts";

function NewArrivalsPage() {
  // Ensure we start at top of the page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ 
          background: "white", 
          borderRadius: "12px", 
          padding: "30px", 
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          marginBottom: "30px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
            <h2 style={{ margin: 0, fontWeight: "bold", color: "#1a202c", fontSize: "24px" }}>New Arrivals</h2>
          </div>
          <FeatureProducts showCart={true} />
        </div>
      </div>
    </div>
  );
}

export default NewArrivalsPage;
