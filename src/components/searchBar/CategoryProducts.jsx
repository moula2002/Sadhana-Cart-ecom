import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [visibleCount, setVisibleCount] = useState(20);

  /* ---------------- IMAGE WITH RETRY ---------------- */
  const ProductImage = ({ src, alt }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [errorCount, setErrorCount] = useState(0);

    useEffect(() => {
      setImgSrc(src);
      setErrorCount(0);
    }, [src]);

    const handleError = () => {
      if (errorCount < 3) {
        const backoff = (errorCount + 1) * 2000;
        setTimeout(() => {
          setImgSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`);
          setErrorCount(prev => prev + 1);
        }, backoff);
      } else {
        setImgSrc("https://placehold.jp/300x300.png?text=Connection+Issue");
      }
    };

    return (
      <img
        src={imgSrc}
        alt={alt}
        className="product-image"
        loading="lazy"
        onError={handleError}
      />
    );
  };

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
      setVisibleCount(20); // Reset visible count on new fetch/category change
    }
  }, [categoryId, location.state]);

  useEffect(() => {
    if (categoryId) fetchData();
  }, [categoryId, fetchData]);

  /* ---------------- INFINITE SCROLL OBSERVER ---------------- */
  const observerTarget = useRef(null);
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1, rootMargin: "100px" } // Trigger early for smoother feel
    );

    observer.observe(currentTarget);
    return () => observer.unobserve(currentTarget);
  }, [visibleCount, filteredProducts.length]);

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

  // Function to get the first valid image URL from any product structure
  const getFirstImage = (product) => {
    if (!product) return "https://placehold.jp/300x300.png?text=No+Data";

    // Priority keys that are known to contain images
    const imageKeys = [
      "images", "image", "imageUrl", "imgUrl", "image_url", "img_url",
      "thumbnail", "thumb", "productImage", "product_image",
      "mainImage", "main_image", "cover", "photo", "img", "pic", "picture",
      "displayImage", "src", "url"
    ];

    const isValidUrl = (url) => 
      typeof url === "string" && 
      url.trim().length > 0 && 
      (url.startsWith("http") || url.startsWith("https") || url.startsWith("data:image"));

    // Internal helper to extract URL from various types (recursive)
    const extract = (val, depth = 0) => {
      if (depth > 4) return null; // Prevent deep recursion
      
      if (typeof val === "string") {
        return isValidUrl(val) ? val.trim() : null;
      }
      
      if (Array.isArray(val)) {
        for (const item of val.flat(Infinity)) {
          const res = extract(item, depth + 1);
          if (res) return res;
        }
        return null;
      }

      if (typeof val === "object" && val !== null) {
        // 1. Try priority keys within the object first
        for (const k of imageKeys) {
          const res = extract(val[k], depth + 1);
          if (res) return res;
        }
        // 2. Scan all keys for ANY URL
        for (const k in val) {
          const res = extract(val[k], depth + 1);
          if (res) return res;
        }
      }
      return null;
    };

    // Phase 1: Check known image keys in the product
    for (const key of imageKeys) {
      const result = extract(product[key]);
      if (result) return result;
    }

    // Phase 2: Final scan of ALL keys for something that looks like an image URL
    // Expanded list of formats including vectors and professional formats
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|emf|wmf|eps|tiff|tif|heic|heif|psd|ai|pdf|ico)(\?.*)?$/i;
    for (const key in product) {
      const val = product[key];
      if (typeof val === "string" && isValidUrl(val)) {
        const trimmed = val.trim();
        if (trimmed.match(imageExtensions) || trimmed.startsWith("data:image")) {
          return trimmed;
        }
      }
    }

    return "https://placehold.jp/300x300.png?text=Empty";
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
        <>

        <div className="products-grid">

          {filteredProducts.slice(0, visibleCount).map((product) => {

            const price = product.price || 0;
            const offerprice = product.offerprice || price;
            const description = product.description || "";

            return (

              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Premium Badges */}
                <div className="card-badges">
                  <span className="badge-new">New</span>
                  {price > offerprice && (
                    <span className="badge-discount">
                      -{Math.round(((price - offerprice) / price) * 100)}%
                    </span>
                  )}
                </div>

                <div className="image-wrapper">
                  {(() => {
                    const imageUrl = getFirstImage(product);
                    const lowerUrl = imageUrl.toLowerCase();
                    
                    // Formats that browsers usually can't render natively in <img> metadata
                    const unsupportedFormats = [
                      { ext: ".emf", label: "EMF VECTOR" },
                      { ext: ".wmf", label: "WMF VECTOR" },
                      { ext: ".eps", label: "EPS VECTOR" },
                      { ext: ".ai", label: "ADOBE AI" },
                      { ext: ".psd", label: "PHOTOSHOP" },
                      { ext: ".tiff", label: "TIFF IMAGE" },
                      { ext: ".tif", label: "TIFF IMAGE" },
                      { ext: ".heic", label: "HEIC IMAGE" },
                      { ext: ".heif", label: "HEIF IMAGE" },
                      { ext: ".pdf", label: "PDF DOCUMENT" },
                    ];

                    const unsupported = unsupportedFormats.find(f => lowerUrl.includes(f.ext));

                    if (unsupported) {
                      return (
                        <div className="unsupported-format-box">
                          <FaFileImage className="unsupported-icon" size={42} />
                          <span className="unsupported-label">{unsupported.label}</span>
                          <span className="unsupported-note">Browser Preview Unavailable</span>
                          <a 
                            href={imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="unsupported-view-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open File
                          </a>
                        </div>
                      );
                    }

                    return (
                      <ProductImage src={imageUrl} alt={product.name} />
                    );
                  })()}
                </div>

                <div className="card-content">

                  <h3 className="product-title">
                    {product.name}
                  </h3>

                  <p className="product-subcategory-label">
                    {product.subcategory}
                  </p>

                  {/* DESCRIPTION */}
                  <p className="product-description">{description}</p>
                  <div className="price-wrapper">
                    <span className="offer-price">₹{offerprice.toLocaleString()}</span>
                    {price > offerprice && <span className="original-price">₹{price.toLocaleString()}</span>}
                  </div>
                </div>
              </div>

            );
          })}
        </div>
        {visibleCount < filteredProducts.length ? (
          <div 
            ref={observerTarget} 
            className="load-more-trigger mt-5 text-center mb-5 pb-5 d-flex flex-column align-items-center"
          >
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted small">Loading more products...</p>
            <p className="mt-2 text-muted extra-small">
              Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} items
            </p>
          </div>
        ) : filteredProducts.length > 0 && (
          <div className="text-center mt-5 mb-5 pb-5 border-top pt-4">
            <p className="text-muted fw-bold">✨ You've reached the end of the collection</p>
            <button 
              className="btn btn-sm btn-link text-decoration-none"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to Top
            </button>
          </div>
        )}
        </>

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