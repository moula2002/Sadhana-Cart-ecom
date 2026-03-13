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

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const PAGE_SIZE = 8;

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("theme") === "dark");
    };

    window.addEventListener("storage", handleStorageChange);

    const observer = new MutationObserver(() => {
      const isDark =
        document.documentElement.getAttribute("data-bs-theme") === "dark" ||
        document.body.classList.contains("dark-theme");
      setDarkMode(isDark);
    });

    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      observer.disconnect();
    };
  }, []);

  const colors = {
    bg: darkMode ? "#121212" : "#fafafa",
    card: darkMode ? "#1e1e1e" : "white",
    text: darkMode ? "#ffffff" : "#333",
    subText: darkMode ? "#aaa" : "#999",
    shadow: darkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)",
    border: darkMode ? "#333" : "#eee",
  };

  // 🔀 Better shuffle
  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // 🔹 FIRST LOAD
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

      setProducts((prev) => {
        const combined = [...prev, ...list];

        // remove duplicates
        const unique = Array.from(
          new Map(combined.map((item) => [item.id, item])).values()
        );

        return shuffleArray(unique);
      });

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
    <div
      style={{
        padding: "30px",
        background: colors.bg,
        minHeight: "100vh",
        transition: "background 0.3s ease",
      }}
    >
      <h2
        style={{
          fontWeight: "800",
          marginBottom: "25px",
          fontSize: "1.8rem",
          color: colors.text,
        }}
      >
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
          maxWidth: "100%",
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
                background: colors.card,
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: `0 8px 20px ${colors.shadow}`,
                transition: "all 0.3s ease",
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
                  background: darkMode ? "#252525" : "#f5f5f5",
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
                    color: colors.text,
                  }}
                >
                  {name}
                </h4>

                <div>
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "1.05rem",
                      color: colors.text,
                    }}
                  >
                    ₹{offerprice.toLocaleString()}
                  </span>

                  <span
                    style={{
                      textDecoration: "line-through",
                      marginLeft: "8px",
                      color: colors.subText,
                      fontSize: "0.9rem",
                    }}
                  >
                    ₹{price.toLocaleString()}
                  </span>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: hoveredProduct === product.id ? "0" : "-120px",
                  left: "0",
                  width: "100%",
                  background: colors.card,
                  padding: "12px",
                  transition: "0.35s",
                  boxShadow: `0 -5px 12px ${colors.shadow}`,
                }}
              >
                <button
                  onClick={() => handleAddToCart(product)}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg,#0a0f8f,#1d23ff)",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "7px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Add to cart
                </button>

                <button
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: `2px solid #1d23ff`,
                    color: darkMode ? "#5d64ff" : "#0a0f8f",
                    padding: "10px",
                    borderRadius: "7px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
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
          bg={darkMode ? "dark" : "light"}
        >
          <Toast.Body style={{ color: darkMode ? "white" : "black" }}>
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}

export default BestProducts;