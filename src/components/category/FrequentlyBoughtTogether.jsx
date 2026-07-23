import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Check, ShoppingCart } from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  getDoc,
  collectionGroup,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/cartSlice";
import { toast } from "react-toastify";
import Loading from "../../pages/Loading";
import SkeletonGrid from "../SkeletonGrid";
import "./FrequentlyBoughtTogether.css";

const FrequentlyBoughtTogether = ({ currentProduct }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!currentProduct || !currentProduct.id) return;

    let isMounted = true;

    const fetchFrequentlyBoughtProducts = async () => {
      setLoading(true);
      try {
        const targetId = String(currentProduct.id);
        const freqMap = {};

        // 1. Analyze Order History for Co-purchased Products
        try {
          // Query recent orders from collection group "orders"
          const ordersQuery = query(collectionGroup(db, "orders"), limit(100));
          const ordersSnapshot = await getDocs(ordersQuery);

          ordersSnapshot.forEach((orderDoc) => {
            const data = orderDoc.data();
            const productsList = data.products || [];

            // Check if current product exists in this order
            const hasCurrentProduct = productsList.some(
              (p) => String(p.productId || p.id) === targetId
            );

            if (hasCurrentProduct) {
              productsList.forEach((p) => {
                const pId = String(p.productId || p.id);
                if (pId && pId !== targetId) {
                  freqMap[pId] = (freqMap[pId] || 0) + 1;
                }
              });
            }
          });
        } catch (orderErr) {
          console.warn("Could not query orders collection group:", orderErr);
        }

        // Sort by co-occurrence frequency
        let topCoBoughtIds = Object.keys(freqMap).sort(
          (a, b) => freqMap[b] - freqMap[a]
        );

        let finalProducts = [];

        // Fetch details for top co-bought products
        if (topCoBoughtIds.length > 0) {
          const fetchPromises = topCoBoughtIds.slice(0, 2).map(async (pId) => {
            try {
              const pDoc = await getDoc(doc(db, "products", pId));
              if (pDoc.exists()) {
                return { id: pDoc.id, ...pDoc.data() };
              }
            } catch (err) {
              return null;
            }
            return null;
          });
          const fetchedCoBought = (await Promise.all(fetchPromises)).filter(Boolean);
          finalProducts.push(...fetchedCoBought);
        }

        // 2. Fallback: Fill with Category / Subcategory complementary items if < 2 co-bought items
        if (finalProducts.length < 2) {
          try {
            const existingIds = new Set([
              targetId,
              ...finalProducts.map((p) => String(p.id)),
            ]);

            const category = currentProduct.category;
            const subcategory =
              currentProduct.subcategory ||
              currentProduct.subCategory ||
              currentProduct.sub_category;

            const fallbackConditions = [];
            if (category) {
              fallbackConditions.push(where("category", "==", category));
            }

            const fallbackQuery = query(
              collection(db, "products"),
              ...fallbackConditions,
              limit(10)
            );

            const fallbackSnap = await getDocs(fallbackQuery);
            const fallbackList = fallbackSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((p) => !existingIds.has(String(p.id)));

            // Add required items to reach 2 recommendations
            const needed = 2 - finalProducts.length;
            finalProducts.push(...fallbackList.slice(0, needed));
          } catch (fallbackErr) {
            console.warn("Error fetching fallback recommendations:", fallbackErr);
          }
        }

        if (isMounted) {
          setRecommendedProducts(finalProducts);
          // Default all items (current + recommendations) to selected
          setSelectedIds([targetId, ...finalProducts.map((p) => String(p.id))]);
        }
      } catch (err) {
        console.error("Error in FrequentlyBoughtTogether:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFrequentlyBoughtProducts();

    return () => {
      isMounted = false;
    };
  }, [currentProduct]);

  // Combine current product + recommended products
  const allBundleProducts = useMemo(() => {
    if (!currentProduct) return [];
    return [currentProduct, ...recommendedProducts];
  }, [currentProduct, recommendedProducts]);

  // Handle Checkbox Selection
  const toggleSelect = (productId) => {
    const pIdStr = String(productId);
    setSelectedIds((prev) => {
      if (prev.includes(pIdStr)) {
        // Don't allow unselecting all items
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== pIdStr);
      } else {
        return [...prev, pIdStr];
      }
    });
  };

  // Price calculations
  const { totalOriginalPrice, totalOfferPrice, totalSavings } = useMemo(() => {
    let originalSum = 0;
    let offerSum = 0;

    allBundleProducts.forEach((prod) => {
      if (selectedIds.includes(String(prod.id))) {
        const price = Number(prod.price || prod.mrp || 0);
        const offer = Number(prod.offerprice || prod.price || price);
        originalSum += price > 0 ? price : offer;
        offerSum += offer;
      }
    });

    const savings = originalSum > offerSum ? originalSum - offerSum : 0;

    return {
      totalOriginalPrice: originalSum,
      totalOfferPrice: offerSum,
      totalSavings: savings,
    };
  }, [allBundleProducts, selectedIds]);

  // Add all selected bundle items to cart
  const handleAddBundleToCart = () => {
    const selectedProds = allBundleProducts.filter((p) =>
      selectedIds.includes(String(p.id))
    );

    if (selectedProds.length === 0) return;

    selectedProds.forEach((item) => {
      dispatch(
        addToCart({
          id: item.id,
          title: item.name || item.title || "Product",
          price: Number(item.offerprice || item.price || 0),
          image: item.images?.[0] || item.image || "",
          quantity: 1,
        })
      );
    });

    toast.success(
      `🎉 Added ${selectedProds.length} ${
        selectedProds.length === 1 ? "item" : "items"
      } to your cart!`,
      { position: "top-right", autoClose: 2500 }
    );
  };

  if (loading) {
    return (
      <div className="py-2 w-100">
        <SkeletonGrid count={4} />
      </div>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <div className="fbt-container">
      <div className="fbt-header">
        <div className="fbt-title-row">
          <h3 className="fbt-title">{t("productDetail.frequentlyBoughtTogether", "Frequently Bought Together")}</h3>
        </div>
        <p className="fbt-subtitle">
          {t("productDetail.customersAlsoBought", "Customers who bought this item also frequently added these to their cart")}
        </p>
      </div>

      <div className="fbt-content-grid">
        {/* Products Visual Row */}
        <div className="fbt-products-row">
          {allBundleProducts.map((prod, index) => {
            const isSelected = selectedIds.includes(String(prod.id));
            const isMainProduct = index === 0;
            const img = prod.images?.[0] || prod.image || "https://via.placeholder.com/150";
            const rawName = prod.name || prod.title || "Product";
            const name = rawName.length > 35 ? rawName.substring(0, 35) + "..." : rawName;
            const price = Number(prod.price || prod.mrp || 0);
            const offer = Number(prod.offerprice || prod.price || price);

            return (
              <React.Fragment key={prod.id}>
                {index > 0 && (
                  <div className="fbt-plus-divider">
                    <Plus size={20} className="text-muted" />
                  </div>
                )}

                <div
                  className={`fbt-product-card ${isSelected ? "selected" : "unselected"} ${
                    isMainProduct ? "main-product" : ""
                  }`}
                  onClick={() => toggleSelect(prod.id)}
                >
                  {isMainProduct && <span className="fbt-this-item-badge">{t("productDetail.thisItem", "THIS ITEM")}</span>}

                  <div className="fbt-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(prod.id)}
                      onClick={(e) => e.stopPropagation()}
                      id={`fbt-check-${prod.id}`}
                    />
                  </div>

                  <div className="fbt-img-wrap">
                    <img src={img} alt={rawName} />
                  </div>

                  <div className="fbt-prod-info">
                    <p className="fbt-prod-name" title={rawName}>
                      {name}
                    </p>
                    <div className="fbt-prod-price-line">
                      <span className="fbt-prod-offer">₹{offer.toLocaleString()}</span>
                      {price > offer && (
                        <span className="fbt-prod-mrp">₹{price.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Total Summary Card */}
        <div className="fbt-summary-card">
          <div className="fbt-summary-header">
            <span className="fbt-summary-label">
              {t("productDetail.totalFor", "Total for")} {selectedIds.length} {selectedIds.length === 1 ? "item" : "items"}:
            </span>
          </div>

          <div className="fbt-price-box">
            <span className="fbt-total-price">₹{totalOfferPrice.toLocaleString()}</span>
            {totalOriginalPrice > totalOfferPrice && (
              <span className="fbt-total-mrp">₹{totalOriginalPrice.toLocaleString()}</span>
            )}
          </div>

          {totalSavings > 0 && (
            <div className="fbt-savings-badge">
              {t("productDetail.save", "Save")} ₹{totalSavings.toLocaleString()} {t("productDetail.onThisBundle", "on this bundle!")}
            </div>
          )}

          <button
            className="fbt-add-bundle-btn"
            onClick={handleAddBundleToCart}
            disabled={selectedIds.length === 0}
          >
            <ShoppingCart size={18} /> {t("productDetail.addSelectedToCart", "Add Selected to Cart")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
