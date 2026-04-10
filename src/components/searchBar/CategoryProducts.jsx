import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { db, collection, getDocs, query, where } from "../../firebase";
import "./CategoryProducts.css";
import Loading from "../../pages/Loading"; 
import { FaHome, FaSpinner, FaSearch, FaTag, FaChevronRight, FaTimes, FaFileImage } from "react-icons/fa";

const CategoryProducts = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubCat, setSelectedSubCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* ---------------- FETCH DATA ---------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let currentCategory = location.state?.categoryName || "";

      if (!currentCategory) {
        const catRef = collection(db, "category");
        const catQ = query(catRef, where("__name__", "==", categoryId));
        const snap = await getDocs(catQ);
        if (!snap.empty) currentCategory = snap.docs[0].data().name;
      }

      setCategoryName(currentCategory);

      if (currentCategory) {
        const subCatRef = collection(db, "subcategory");
        const subCatQ = query(subCatRef, where("category", "==", currentCategory));
        const subSnap = await getDocs(subCatQ);
        const subList = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubcategories(subList);
      }

      const prodRef = collection(db, "products");
      const q1 = query(prodRef, where("categoryId", "==", categoryId));
      const s1 = await getDocs(q1);

      let list = s1.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      if (list.length === 0 && currentCategory) {
        const q2 = query(prodRef, where("category", "==", currentCategory));
        const s2 = await getDocs(q2);
        list = s2.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      }

      // ✅ IMPORTANT FIX (stock 0 irundhalum show aagum)
      list = list.filter((p) => p.isActive !== false);

      setProducts(list);
      setFilteredProducts(list);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, location.state]);

  useEffect(() => {
    if (categoryId) fetchData();
  }, [categoryId, fetchData]);

  /* ---------------- FILTER LOGIC ---------------- */
  const handleSubCategoryClick = (subName) => {
    setSelectedSubCat(subName);

    if (subName === "All") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => p.subcategory === subName);
      setFilteredProducts(filtered);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    const lowerValue = value.toLowerCase();

    const filtered = products.filter((p) =>
      (p.name?.toLowerCase().includes(lowerValue)) &&
      (selectedSubCat === "All" || p.subcategory === selectedSubCat)
    );

    setFilteredProducts(filtered);
  };

  const getFirstImage = (product) => {
    if (!product) return "https://placehold.jp/300x300.png?text=No+Data";

    const possibleFields = [
      "images", "image", "imageUrl", "imgUrl", "image_url", "img_url",
      "thumbnail", "thumb", "productImage", "product_image",
      "mainImage", "main_image", "cover", "photo", "img", "pic", "picture"
    ];

    const isValidUrl = (url) => typeof url === "string" && url.trim().length > 0 && (url.startsWith("http") || url.startsWith("data:image"));

    for (const field of possibleFields) {
      const source = product[field];
      if (!source) continue;

      if (Array.isArray(source)) {
        const flattened = source.flat(Infinity);
        for (const item of flattened) {
          if (!item) continue;
          if (isValidUrl(item)) return item.trim();
          if (typeof item === "object") {
             const url = item.url || item.src || item.imageUrl || item.image || item.thumb || item.thumbnail;
             if (isValidUrl(url)) return url.trim();
             // Scan object values
             for (const k in item) if (isValidUrl(item[k])) return item[k].trim();
          }
        }
      } 
      else if (isValidUrl(source)) {
        return source.trim();
      } 
      else if (typeof source === "object") {
        const url = source.url || source.src || source.imageUrl || source.image || source.thumb || source.thumbnail;
        if (isValidUrl(url)) return url.trim();
        // Scan object values
        for (const k in source) if (isValidUrl(source[k])) return source[k].trim();
      }
    }

    // Last-ditch: scan all product keys
    for (const key in product) {
        if (isValidUrl(product[key])) {
            const trimmed = product[key].trim();
            if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|emf)(\?.*)?$/i) || trimmed.startsWith("data:image")) {
                return trimmed;
            }
        }
    }

    return "https://placehold.jp/300x300.png?text=Image+Missing";
  };

  return (
    <div className="category-products-page">

      <div className="breadcrumb">
        <Link to="/"><FaHome /> Home</Link>
        <FaChevronRight className="breadcrumb-separator" />
        <span className="breadcrumb-current">{categoryName}</span>
      </div>

      <div className="category-header">
        <h1 className="category-title">{categoryName} Products</h1>

        {subcategories.length > 0 && (
          <div className="subcategories-wrapper">

            <button
              className={`subcategory-chip ${selectedSubCat === "All" ? "active" : ""}`}
              onClick={() => handleSubCategoryClick("All")}
            >
              All Items
            </button>

            {subcategories.map((sub) => (
              <button
                key={sub.id}
                className={`subcategory-chip ${selectedSubCat === sub.name ? "active" : ""}`}
                onClick={() => handleSubCategoryClick(sub.name)}
              >
                <FaTag className="chip-icon" />
                <span>{sub.name}</span>
              </button>
            ))}

          </div>
        )}

      </div>

      <div className="divider"></div>

      {loading ? (
  <Loading />
) : filteredProducts.length > 0 ? (

        <div className="products-grid">

          {filteredProducts.map((product) => {

            const price = product.price || 0;
            const offerprice = product.offerprice || price;
            const description = product.description || "";

            return (

              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >

                <div className="image-wrapper">
                  {getFirstImage(product).toLowerCase().includes(".emf") ? (
                    <div className="emf-placeholder" style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      height: "100%", 
                      background: "#f8fafc",
                      padding: "10px",
                      textAlign: "center",
                      position: "absolute",
                      width: "100%",
                      top: 0,
                      left: 0
                    }}>
                      <FaFileImage size={42} color="#2563eb" />
                      <span style={{ fontSize: "11px", marginTop: "10px", color: "#1e293b", fontWeight: "700" }}>EMF VECTOR</span>
                      <span style={{ fontSize: "9px", color: "#64748b" }}>Format not supported by browser</span>
                    </div>
                  ) : (
                    <img
                      src={getFirstImage(product)}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.jp/300x300.png?text=Format+Not+Supported";
                      }}
                    />
                  )}
                </div>

                <div className="card-content">

                  <h3 className="product-title">
                    {product.name}
                  </h3>

                  <p className="product-subcategory-label">
                    {product.subcategory}
                  </p>

                  {/* DESCRIPTION */}
                  <p className="product-description">
                    {description}
                  </p>

                  {/* PRICE */}
                  <div className="price-wrapper">

                    <span className="offer-price">
                      ₹{offerprice.toLocaleString()}
                    </span>

                    {price > offerprice && (
                      <span className="original-price">
                        ₹{price.toLocaleString()}
                      </span>
                    )}

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      ) : (

        <div className="no-products">
          <h3>No matches found in {selectedSubCat}</h3>

          <button
            onClick={() => handleSubCategoryClick("All")}
            className="browse-btn"
          >
            Show All
          </button>
        </div>

      )}

    </div>
  );
};

export default CategoryProducts;