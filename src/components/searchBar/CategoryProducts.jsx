import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { db, collection, getDocs, query, where } from "../../firebase";
import "./CategoryProducts.css";
import Loading from "../../pages/Loading"; 
import { FaHome, FaSpinner, FaSearch, FaTag, FaChevronRight, FaTimes } from "react-icons/fa";

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

  const getFirstImage = (product) =>
    product.images?.[0] ||
    product.image ||
    "https://via.placeholder.com/300";

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
                  <img
                    src={getFirstImage(product)}
                    alt={product.name}
                    className="product-image"
                  />
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