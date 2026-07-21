import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { Heart, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./BrowseCategory.css";
import Loading from "./Loading";

const BrowseCategory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedCatFromState = location.state?.selectedCategory;

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubCat, setSelectedSubCat] = useState("All");

  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true);
        const catRef = collection(db, "category");
        const snap = await getDocs(catRef);
        const catList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort categories logically if needed
        catList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        setCategories(catList);
        if (catList.length > 0) {
          if (selectedCatFromState) {
            const found = catList.find(c => c.name === selectedCatFromState);
            setActiveCategory(found || catList[0]);
          } else {
            setActiveCategory(catList[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCats(false);
      }
    };

    fetchCategories();
  }, [selectedCatFromState]);

  // 2. Fetch Products and Subcategories when Active Category changes
  useEffect(() => {
    if (!activeCategory) return;

    const fetchCategoryData = async () => {
      setLoadingProds(true);
      setSelectedSubCat("All");
      try {
        // Fetch Subcategories for chips
        const subCatRef = collection(db, "subcategory");
        const subQ = query(subCatRef, where("category", "==", activeCategory.name));
        const subSnap = await getDocs(subQ);
        const subList = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubcategories(subList);

        // Fetch Products
        const prodRef = collection(db, "products");
        // We fetch by category name based on previous implementations
        const prodQ = query(prodRef, where("category", "==", activeCategory.name));
        const prodSnap = await getDocs(prodQ);

        let prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter out inactive products
        prodList = prodList.filter((p) => p.isActive !== false);

        setProducts(prodList);
        setFilteredProducts(prodList);
      } catch (err) {
        console.error("Error fetching category data:", err);
      } finally {
        setLoadingProds(false);
      }
    };

    fetchCategoryData();
  }, [activeCategory]);

  // Handle Subcategory Filter
  const handleSubCatClick = (subName) => {
    setSelectedSubCat(subName);
    if (subName === "All") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.subcategory === subName));
    }
  };

  // Helper to extract a valid image from a product
  const getProductImage = (product) => {
    if (!product) return "https://placehold.jp/300x300.png?text=No+Image";
    const imageKeys = ["images", "image", "imageUrl", "thumbnail", "photo"];
    for (const key of imageKeys) {
      if (typeof product[key] === "string" && product[key].startsWith("http")) return product[key];
      if (Array.isArray(product[key]) && product[key][0]?.startsWith("http")) return product[key][0];
    }
    for (const key in product) {
      if (typeof product[key] === "string" && product[key].startsWith("http")) return product[key];
    }
    return "https://placehold.jp/300x300.png?text=No+Image";
  };

  const handleAddToWishlist = async (e, prod) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error(t("pleaseLoginWishlist", "Please login to add to wishlist"), { position: "top-right", autoClose: 3000 });
      navigate('/login', { state: { from: '/browse-categories' } });
      return;
    }

    try {
      const wishlistRef = collection(db, "users", currentUser.uid, "favorites");
      const q = query(wishlistRef, where("productId", "==", prod.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.info(t("alreadyInWishlist", "Product is already in your wishlist"), { position: "top-right", autoClose: 3000 });
        return;
      }

      const offerPrice = prod.offerprice || prod.price || 0;
      const originalPrice = prod.price || 0;

      const wishlistItem = {
        productId: prod.id,
        name: prod.name || prod.title || "Product",
        image: getProductImage(prod),
        price: Number(offerPrice),
        originalPrice: Number(originalPrice),
        category: prod.category || "",
        createdAt: serverTimestamp(),
        size: null,
        sellerId: prod.sellerId || "default_seller"
      };

      await addDoc(wishlistRef, wishlistItem);
      toast.success(t("addedToWishlist", "Added to wishlist!"), { position: "top-right", autoClose: 2000 });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error(t("failedToAddWishlist", "Failed to add to wishlist"), { position: "top-right", autoClose: 3000 });
    }
  };

  if (loadingCats) {
    return <Loading />;
  }

  return (
    <div className="browse-category-page-wrapper">
      <ToastContainer />
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="mobile-browse-header d-lg-none">
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="header-title">{activeCategory?.name || t("categories", "Categories")}</h2>
      </div>

      {/* Desktop Breadcrumb (Hidden on Mobile) */}
      <div className="desktop-breadcrumb d-none d-lg-flex container mt-3 mb-2">
        <Link to="/" className="text-decoration-none text-secondary"><i className="fas fa-home"></i> {t("homeLabel", "Home")}</Link>
        <i className="fas fa-chevron-right mx-2 text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}></i>
        <span className="text-secondary">{t("categories", "Categories")}</span>
        <i className="fas fa-chevron-right mx-2 text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px' }}></i>
        <span className="fw-bold text-dark">{activeCategory?.name}</span>
      </div>

      <div className="browse-content-container container">
        {/* Left Sidebar - Categories */}
        <div className="category-sidebar-scroll">
          {categories.map((cat) => {
            const isActive = activeCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                className={`sidebar-cat-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                <div className="cat-img-wrapper">
                  <img
                    src={cat.image || "https://placehold.jp/100x100.png?text=Cat"}
                    alt={cat.name}
                  />
                </div>
                <span className="cat-name">{cat.name}</span>
              </div>
            );
          })}
        </div>

        {/* Right Content - Products & Chips */}
        <div className="products-main-area">
          {/* Subcategory Chips */}
          {(subcategories.length > 0 || products.length > 0) && (
            <div className="subcat-chips-container">
              <button
                className={`subcat-chip ${selectedSubCat === "All" ? "active" : ""}`}
                onClick={() => handleSubCatClick("All")}
              >
                {selectedSubCat === "All" && <i className="fas fa-check"></i>} {t("all", "All")}
              </button>
              {subcategories.map(sub => (
                <button
                  key={sub.id}
                  className={`subcat-chip ${selectedSubCat === sub.name ? "active" : ""}`}
                  onClick={() => handleSubCatClick(sub.name)}
                >
                  {selectedSubCat === sub.name && <i className="fas fa-check"></i>} {sub.name}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          <div className="browse-products-grid">
            {loadingProds ? (
              <div className="loading-prods-wrapper py-4">
                <Loading minHeight="200px" />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => {
                const price = Number(prod.price || 0);
                const offerPrice = Number(prod.offerprice || price);
                const discount = (price > offerPrice && price > 0) ? Math.round(((price - offerPrice) / price) * 100) : 0;

                const handleCart = (e) => {
                  e.stopPropagation();
                  dispatch(addToCart({
                    id: prod.id,
                    title: prod.name || "Product",
                    price: offerPrice,
                    image: getProductImage(prod),
                    quantity: 1,
                  }));
                  toast.success(`${prod.name || "Product"} ${t("addedToCart", "added to cart!")}`, {
                    position: "bottom-right",
                    autoClose: 2000,
                  });
                };

                return (
                  <div
                    key={prod.id}
                    className="browse-prod-card"
                    onClick={() => navigate(`/product/${prod.id}`)}
                  >
                    {discount > 0 && <span className="sc-discount-tag">{discount}% {t("off", "OFF")}</span>}
                    <div className="prod-img-box">
                      <img src={getProductImage(prod)} alt={prod.name} />
                      <button
                        className="browse-wishlist-btn"
                        onClick={(e) => handleAddToWishlist(e, prod)}
                      >
                        <Heart size={16} color="#64748b" />
                      </button>
                    </div>
                    <div className="prod-info-box">
                      <h4 className="prod-title">{prod.name}</h4>
                      <div className="prod-price-row">
                        <span className="prod-offer-price">₹{offerPrice.toLocaleString()}</span>
                        {price > offerPrice && (
                          <span className="prod-original-price">₹{price.toLocaleString()}</span>
                        )}
                        {discount > 0 && (
                          <span className="sc-off">{discount}% {t("off", "OFF")}</span>
                        )}
                      </div>
                      <button
                        className="sc-add-btn"
                        onClick={handleCart}
                      >
                        <ShoppingCart size={14} /> {t("addToCart", "Add to Cart")}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-prods-found">
                <p>{t("noProductsFoundInCategory", "No products found in this category.")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseCategory;
