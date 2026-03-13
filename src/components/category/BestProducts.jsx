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
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { Toast, ToastContainer } from "react-bootstrap";

function BestProducts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const PAGE_SIZE = 8;

  // 🔀 RANDOM SHUFFLE
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 🔹 FIRST LOAD (FAST)
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

      setProducts(shuffleArray(list));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 LOAD MORE
  const loadMoreProducts = async () => {
    if (!lastDoc || loading) return;

    try {
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

      setProducts((prev) => shuffleArray([...prev, ...list]));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔹 INFINITE SCROLL
  useEffect(() => {
    const handleScroll = () => {
      if (loading) return;

      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
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

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        id: product.id,
        title: product.name || "Product",
        price: product.offerprice || product.price || 0,
        image: product.images?.[0] || "",
        quantity: 1,
      })
    );

    setToastMsg(`${product.name} added to cart`);
    setShowToast(true);
  };

  return (
    <div style={{ padding: "30px", background: "#fafafa", minHeight: "100vh" }}>
      <h2 style={{ fontWeight: "800", marginBottom: "25px" }}>
        Best Products
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            window.innerWidth < 768
              ? "repeat(2,1fr)"
              : "repeat(auto-fill,minmax(200px,1fr))",
          gap: "25px",
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
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                transition: "all 0.3s",
                position: "relative",
                transform:
                  hoveredProduct === product.id
                    ? "translateY(-5px)"
                    : "translateY(0)",
              }}
            >
              {discount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "#ff3b30",
                    color: "white",
                    fontSize: "0.75rem",
                    padding: "4px 7px",
                    borderRadius: "5px",
                    fontWeight: "600",
                    zIndex: 10,
                  }}
                >
                  {discount}% OFF
                </div>
              )}

              <div
                style={{
                  height: "220px",
                  overflow: "hidden",
                  background: "#f5f5f5",
                }}
              >
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.4s",
                    transform:
                      hoveredProduct === product.id
                        ? "scale(1.05)"
                        : "scale(1)",
                  }}
                />
              </div>

              <div style={{ padding: "14px" }}>
                <h4
                  style={{
                    fontSize: "0.95rem",
                    marginBottom: "8px",
                    minHeight: "42px",
                    fontWeight: "600",
                  }}
                >
                  {name}
                </h4>

                <div>
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "1.05rem",
                    }}
                  >
                    ₹{offerprice}
                  </span>

                  <span
                    style={{
                      textDecoration: "line-through",
                      marginLeft: "8px",
                      color: "#999",
                      fontSize: "0.9rem",
                    }}
                  >
                    ₹{price}
                  </span>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: hoveredProduct === product.id ? "0" : "-120px",
                  left: "0",
                  width: "100%",
                  background: "white",
                  padding: "12px",
                  transition: "0.35s",
                }}
              >
                <button
                  onClick={() => handleAddToCart(product)}
                  style={{
                    width: "100%",
                    background: "#0a0f8f",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "7px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    cursor: "pointer",
                  }}
                >
                  Add to cart
                </button>

                <button
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "2px solid #1d23ff",
                    color: "#0a0f8f",
                    padding: "10px",
                    borderRadius: "7px",
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

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Body>{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}

export default BestProducts;