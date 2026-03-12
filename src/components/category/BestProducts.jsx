import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function BestProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const PAGE_SIZE = 12;

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "products"),
        orderBy("productid"),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(list);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMoreProducts = async () => {
    if (!lastDoc || loading) return;

    setLoading(true);

    const q = query(
      collection(db, "products"),
      orderBy("productid"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    const snapshot = await getDocs(q);

    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setProducts((prev) => [...prev, ...list]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.scrollHeight
      ) {
        loadMoreProducts();
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastDoc, loading]);

  const calculateDiscount = (price, offerprice) => {
    if (!price || !offerprice) return 0;
    return Math.round(((price - offerprice) / price) * 100);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2 style={{ fontWeight: "700", marginBottom: "30px" }}>
        Best Products
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: "30px",
        }}
      >
        {products.map((product) => {
          const image =
            product.images?.[0] ||
            product.image ||
            "https://via.placeholder.com/300";

          const name = product.name || "Product";
          const price = product.price || 0;
          const offerprice = product.offerprice || price;
          const discount = calculateDiscount(price, offerprice);

          return (
            <div
              key={product.id}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              style={{
                background: "white",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                transition: "0.3s",
                position: "relative",
              }}
            >
              {/* IMAGE */}
              <div
                style={{
                  height: "300px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* CONTENT */}
              <div style={{ padding: "15px" }}>
                <h4
                  style={{
                    fontSize: "1rem",
                    marginBottom: "8px",
                    minHeight: "45px",
                  }}
                >
                  {name}
                </h4>

                {/* PRICE */}
                <div style={{ marginBottom: "5px" }}>
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "1.1rem",
                    }}
                  >
                    ₹{offerprice.toLocaleString()}
                  </span>

                  <span
                    style={{
                      textDecoration: "line-through",
                      color: "#999",
                      marginLeft: "8px",
                    }}
                  >
                    ₹{price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* HOVER BUTTON AREA */}
              <div
                style={{
                  position: "absolute",
                  bottom: hoveredProduct === product.id ? "0" : "-120px",
                  left: "0",
                  width: "100%",
                  background: "white",
                  padding: "15px",
                  transition: "0.3s",
                  boxShadow: "0 -5px 10px rgba(0,0,0,0.05)",
                }}
              >
                <button
                  style={{
                    width: "100%",
                    background: "#0a0f8f",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    marginBottom: "10px",
                    cursor: "pointer",
                  }}
                >
                  Add to cart
                </button>

                <button
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{
                    width: "100%",
                    background: "white",
                    border: "2px solid #0a0f8f",
                    color: "#0a0f8f",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Quick View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <h4>Loading products...</h4>
        </div>
      )}
    </div>
  );
}

export default BestProducts;