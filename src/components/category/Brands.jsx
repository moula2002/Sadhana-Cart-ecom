import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Brands.css";

function Brands() {
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "brands"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBrands(list);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  if (brands.length === 0) return null;

  return (
    <section className="brands-section sc-section home-section-animated">
      <div className="sc-header">
        <h2 className="sc-title">Top Brands</h2>
      </div>
      <div className="brands-container">
        {brands.map((brand) => (
          <div 
            key={brand.id} 
            className="brand-card"
            onClick={() => navigate(`/brand/${brand.id}`)}
          >
            <div className="brand-img-wrap">
              <img src={brand.image} alt={brand.name} loading="lazy" />
            </div>
            <p className="brand-name">{brand.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Brands;
