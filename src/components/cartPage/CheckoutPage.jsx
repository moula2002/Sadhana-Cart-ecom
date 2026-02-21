import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Image,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";
import "./CartPage.css";
import "./CheckoutPage.css";
import { FaCoins } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const RAZORPAY_KEY_ID = "rzp_live_RF5gE7NCdAsEIs";
const NOMINATIM_CONTACT_EMAIL = "your.app.contact@example.com";
const COIN_TO_RUPEE_RATE = 1;

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

const loadRazorpayScript = (src) =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const cartItemsFromRedux = useSelector((state) => state.cart.items || []);
  const productFromBuyNow = location.state?.product;
  const quantityFromBuyNow = location.state?.quantity || 1;

  const mergedCartItems = cartItemsFromRedux.map((item) => ({
    ...item,
    sku: item.sku || item.SKU || item.product_sku || item.skuCode || "N/A",
  }));

  if (productFromBuyNow) {
    const buyNowItem = {
      ...productFromBuyNow,
      quantity: quantityFromBuyNow,
      sku:
        productFromBuyNow.sku ||
        productFromBuyNow.SKU ||
        productFromBuyNow.product_sku ||
        productFromBuyNow.skuCode ||
        "N/A",
    };
    const exists = mergedCartItems.find(
      (item) => item.id === buyNowItem.id && item.sku === buyNowItem.sku
    );
    if (exists) {
      exists.quantity += buyNowItem.quantity;
    } else {
      mergedCartItems.push(buyNowItem);
    }
  }

  const totalPrice = mergedCartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [productSkus, setProductSkus] = useState({});
  const [productSellers, setProductSellers] = useState({});
  const [billingDetails, setBillingDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [geocodingError, setGeocodingError] = useState(null);
  const [locationStatusMessage, setLocationStatusMessage] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [theme, setTheme] = useState("light");
  const [walletCoins, setWalletCoins] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState(0);

  /* ---------------- THEME MANAGEMENT ---------------- */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    if (savedTheme === "dark") {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }

    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      setTheme(currentTheme);
      if (currentTheme === "dark") {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
      } else {
        document.body.classList.add("light-theme");
        document.body.classList.remove("dark-theme");
      }
    };

    window.addEventListener("storage", handleThemeChange);
    return () => window.removeEventListener("storage", handleThemeChange);
  }, []);

  const getSellerIdFromProduct = (productData) => {
    return productData.sellerId || productData.sellerid || productData.vendorId || productData.vendor_id || productData.sellersid || "default_seller";
  };

  const fetchProductMainSkuAndSeller = async (productId) => {
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const data = productSnap.data();
        const mainSku = data.sku || data.basesku || productId;
        const sellerId = getSellerIdFromProduct(data);
        return { mainSku, sellerId };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching product SKU and seller:", error);
      return null;
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchUserData(user.uid);

        const uniqueProductIds = [
          ...new Set(cartItemsFromRedux.map((item) => item.id)),
        ];

        const fetchAllSkusAndSellers = async () => {
          const skuMap = {};
          const sellerMap = {};
          for (const id of uniqueProductIds) {
            const productData = await fetchProductMainSkuAndSeller(id);
            if (productData) {
              skuMap[id] = productData.mainSku;
              sellerMap[id] = productData.sellerId;
            }
          }
          setProductSkus(skuMap);
          setProductSellers(sellerMap);
        };

        fetchAllSkusAndSellers();
      } else {
        setLoading(false);
        alert(t("checkout.loginRequired"));
        navigate("/login", { state: { from: location.pathname } });
      }
    });
    return () => unsubscribe();
  }, [navigate, location.pathname, cartItemsFromRedux]);

  const fetchUserData = async (uid) => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();

        const coords = data.shipping_address?.coordinates;
        if (coords) {
          setCoordinates({ lat: coords.latitude, lng: coords.longitude });
          setGeocodingError(null);
        }

        setWalletCoins(data.walletCoins || 0);
        setBillingDetails((prev) => ({
          ...prev,
          fullName: data.name || prev.fullName,
          email: data.email || prev.email,
          phone: data.phone || prev.phone || "",
          address: data.shipping_address?.addressLine1 || prev.address,
          city: data.shipping_address?.city || prev.city,
          pincode: data.shipping_address?.postalCode || prev.pincode,
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletCoins > 0 && totalPrice > 0) {
      const maxAllowedCoins = Math.floor(totalPrice * 0.1);
      const autoCoins = Math.min(walletCoins, maxAllowedCoins);
      setCoinsToUse(autoCoins);
    } else {
      setCoinsToUse(0);
    }
  }, [walletCoins, totalPrice]);

  const coinDiscount = coinsToUse * COIN_TO_RUPEE_RATE;
  const finalAmount = Math.max(0, totalPrice - coinDiscount);

  const geocodeAddress = useCallback(async (details) => {
    const fullAddress = `${details.address}, ${details.city}, ${details.pincode}`;

    if (fullAddress.trim().length < 10) {
      setGeocodingError(t("checkout.addressIncomplete"));
      setCoordinates({ lat: null, lng: null });
      setLocationStatusMessage(null);
      return;
    }

    setGeocodingError(t("checkout.locatingAddress"));
    setLocationStatusMessage(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          fullAddress
        )}&format=json&limit=1&email=${NOMINATIM_CONTACT_EMAIL}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setGeocodingError(null);
        setLocationStatusMessage(null);
      } else {
        setCoordinates({ lat: null, lng: null });
        setGeocodingError(
          `Address could not be accurately located. Please check the spelling.`
        );
        setLocationStatusMessage(null);
      }
    } catch (error) {
      console.error("Error during Nominatim API call:", error);
      setCoordinates({ lat: null, lng: null });
      setGeocodingError("Failed to connect to geocoding service (Network Error).");
      setLocationStatusMessage(null);
    }
  }, []);

  const debouncedGeocodeAddress = useCallback(
    debounce((details) => {
      geocodeAddress(details);
    }, 1000),
    [geocodeAddress]
  );

  const reverseGeocodeCoordinates = async (lat, lng) => {
    setIsLocating(true);
    setGeocodingError(t("checkout.reverseGeocoding"));
    setLocationStatusMessage(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&email=${NOMINATIM_CONTACT_EMAIL}`
      );
      const data = await response.json();

      if (data.address) {
        const address = data.address;

        const doorNumber = address.house_number || address.building || address.office || "";
        const streetName = address.road || address.pedestrian || address.street || address.residential || "";
        const areaLocality = address.suburb || address.neighbourhood || address.hamlet || address.village || "";

        let addressComponents = [];
        if (doorNumber) addressComponents.push(doorNumber);
        if (streetName) addressComponents.push(streetName);
        if (streetName && areaLocality) addressComponents.push(areaLocality);

        let cleanedAddress = addressComponents.join(", ");

        if (cleanedAddress.length < 10 || (doorNumber === "" && streetName === "")) {
          const fullDisplayNameParts = data.display_name.split(",").map(p => p.trim()).filter(p => p !== '');
          cleanedAddress = fullDisplayNameParts.slice(0, Math.min(5, fullDisplayNameParts.length)).join(", ");

          if (cleanedAddress.length < 10 && areaLocality) {
            cleanedAddress = areaLocality;
          }
        }

        const newAddressDetails = {
          address: cleanedAddress || address.country || "",
          city: address.city || address.town || address.county || address.state_district || address.village || "",
          pincode: address.postcode || "",
        };

        setBillingDetails((prev) => ({
          ...prev,
          address: newAddressDetails.address || prev.address,
          city: newAddressDetails.city || prev.city,
          pincode: newAddressDetails.pincode || prev.pincode,
        }));

        setCoordinates({ lat: parseFloat(data.lat), lng: parseFloat(data.lon) });
        setGeocodingError(null);
        setLocationStatusMessage("Address pre-filled from current location! Please check and edit the House/Door Number if necessary.");
      } else {
        setCoordinates({ lat: null, lng: null });
        setGeocodingError("Reverse geocoding failed: Address not found for coordinates.");
        setLocationStatusMessage(null);
      }
    } catch (error) {
      console.error("Error during reverse geocoding:", error);
      setGeocodingError("Failed to connect to reverse geocoding service.");
      setLocationStatusMessage(null);
    } finally {
      setIsLocating(false);
    }
  };

  const fetchCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeocodingError("Geolocation is not supported by your browser.");
      setLocationStatusMessage(null);
      return;
    }

    setIsLocating(true);
    setGeocodingError(t("checkout.fetchingLocation"));
    setLocationStatusMessage(null);
    setCoordinates({ lat: null, lng: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocodeCoordinates(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = "Could not get location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage =
            "Location access denied. Please allow location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Timed out while trying to get location.";
        }
        setGeocodingError(errorMessage);
        setLocationStatusMessage(null);
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const saveBillingDetails = async (details) => {
    if (!userId) return;

    await geocodeAddress(details);

    try {
      const docRef = doc(db, "users", userId);
      await setDoc(
        docRef,
        {
          name: details.fullName,
          email: details.email,
          phone: details.phone,
          shipping_address: {
            addressLine1: details.address,
            city: details.city,
            postalCode: details.pincode,
            state: "Karnataka",
            coordinates:
              coordinates.lat && coordinates.lng
                ? {
                  latitude: coordinates.lat,
                  longitude: coordinates.lng,
                }
                : null,
          },
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving billing details:", error);
    }
  };

  const getSellerIdForCartItem = (item) => {
    return productSellers[item.id] || item.sellerId || item.sellerid || "default_seller";
  };

  const deductCoinsFromWallet = async (coinsToDeduct) => {
    if (!userId || coinsToDeduct <= 0) return true;

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentCoins = userData.walletCoins || 0;

        if (currentCoins < coinsToDeduct) {
          alert(`Insufficient Coins. You have only ${currentCoins} coins in your wallet.`);
          return false;
        }

        await updateDoc(userRef, {
          walletCoins: currentCoins - coinsToDeduct
        });

        console.log(`${coinsToDeduct} coins deducted from wallet`);
        setWalletCoins(currentCoins - coinsToDeduct);
        return true;
      }
    } catch (error) {
      console.error("Error deducting coins:", error);
      alert("Failed to deduct coins from wallet. Please try again.");
      return false;
    }
    return true;
  };

  const saveOrderToSellerCollections = async (orderData, userOrderDocId) => {
    try {
      const productsBySeller = {};
      (orderData.products || []).forEach((product) => {
        const sellerId = product.sellerId || "default_seller";
        if (!productsBySeller[sellerId]) productsBySeller[sellerId] = [];
        productsBySeller[sellerId].push(product);
      });

      for (const [sellerId, sellerProducts] of Object.entries(productsBySeller)) {
        const sellerOrdersRef = collection(db, "sellers", sellerId, "orders");
        const sellerSubtotal = sellerProducts.reduce((t, p) => t + (p.totalAmount || 0), 0);

        await addDoc(sellerOrdersRef, {
          orderId: orderData.orderId,
          userOrderDocId,
          userId: orderData.userId,
          products: sellerProducts,
          totalAmount: sellerSubtotal,
          discountedAmount: sellerSubtotal - (sellerSubtotal * coinsToUse / totalPrice),
          coinsUsed: Math.round(sellerSubtotal * coinsToUse / totalPrice),
          coinDiscount: Math.round(sellerSubtotal * coinDiscount / totalPrice),
          paymentMethod: orderData.paymentMethod,
          orderStatus: orderData.orderStatus,
          createdAt: serverTimestamp(),
          customerName: orderData.name,
          customerPhone: orderData.phoneNumber,
          address: orderData.address,
          sellerId,
        });
      }
    } catch (err) {
      console.error("Error in saveOrderToSellerCollections:", err);
    }
  };

  const updateSellerDocuments = async (sellerIds, userOrderDocId, orderData) => {
    try {
      for (const sellerId of sellerIds) {
        if (!sellerId) continue;
        const sellerRef = doc(db, "sellers", sellerId);

        const sellerProducts = (orderData.products || []).filter((p) => p.sellerId === sellerId);
        const sellerSubtotal = sellerProducts.reduce((t, p) => t + (p.totalAmount || 0), 0);

        const orderSummary = {
          orderId: orderData.orderId,
          userOrderDocId,
          customerName: orderData.name,
          totalAmount: sellerSubtotal,
          discountedAmount: sellerSubtotal - (sellerSubtotal * coinsToUse / totalPrice),
          coinsUsed: Math.round(sellerSubtotal * coinsToUse / totalPrice),
          orderDate: new Date(),
          orderStatus: orderData.orderStatus,
        };

        const sellerSnap = await getDoc(sellerRef);
        if (!sellerSnap.exists()) {
          await updateDoc(sellerRef, {
            sellerId,
            orders: [],
            totalSales: 0,
            createdAt: serverTimestamp(),
          }).catch(() => {}); 
        }

        await updateDoc(sellerRef, {
          orders: arrayUnion(orderSummary),
          lastOrderDate: serverTimestamp(),
          totalSales: increment(sellerSubtotal - (sellerSubtotal * coinsToUse / totalPrice)),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error in updateSellerDocuments:", err);
    }
  };

  const saveOrderToFirestore = async (
    paymentMethod,
    status = "Pending",
    paymentId = null
  ) => {
    if (!userId) return null;

    if (coinsToUse > 0) {
      const coinsDeducted = await deductCoinsFromWallet(coinsToUse);
      if (!coinsDeducted) {
        return null;
      }
    }

    try {
      const sellerIdsInOrder = [...new Set(mergedCartItems.map((it) => getSellerIdForCartItem(it)))].filter(Boolean);
      const orderId = `ORD-${Date.now()}`;
      const ordersRef = collection(db, "users", userId, "orders");

      const products = mergedCartItems.map((item) => {
        const finalSku = productSkus[item.id] || (item.sku !== "N/A" ? item.sku : item.id);
        const sellerId = getSellerIdForCartItem(item);
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        const proportionalCoinsUsed = Math.round(itemTotal * coinsToUse / totalPrice);

        return {
          productId: item.id,
          name: item.title || item.name || "Unnamed Product",
          price: item.price || 0,
          quantity: item.quantity || 1,
          sku: finalSku,
          images: item.images || [],
          sellerId,
          totalAmount: itemTotal,
          coinsUsed: proportionalCoinsUsed,
          coinDiscount: proportionalCoinsUsed * COIN_TO_RUPEE_RATE,
        };
      });

      const selleridField = sellerIdsInOrder.length === 1 ? sellerIdsInOrder[0] : sellerIdsInOrder;

      const orderData = {
        userId,
        orderId,
        orderStatus: status,
        totalAmount: totalPrice,
        discountedAmount: finalAmount,
        coinsUsed: coinsToUse,
        coinDiscount: coinDiscount,
        paymentMethod,
        phoneNumber: billingDetails.phone || null,
        createdAt: serverTimestamp(),
        orderDate: serverTimestamp(),
        address: `${billingDetails.address || ""}, ${billingDetails.city || ""}, ${billingDetails.pincode || ""}, Karnataka`,
        latitude: coordinates.lat || null,
        longitude: coordinates.lng || null,
        name: billingDetails.fullName || null,
        sellerid: selleridField,
        products,
        shippingCharges: 0,
        paymentId,
      };

      // Save to Firestore
      const userOrderDocRef = await addDoc(ordersRef, orderData);

      // 🔥 SEND TO SHIPROCKET (Same as CashOnDelivery component)
      try {
        const shiprocketPaymentMethod = paymentMethod === "Razorpay" ? "Prepaid" : "COD";
        
        const response = await fetch(
          "https://createshiprocketorder-cij4erke6a-uc.a.run.app",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_id: orderId,
              order_date: new Date().toISOString().split("T")[0],
              pickup_location: "Office",
              billing_customer_name: billingDetails.fullName,
              billing_last_name: "",
              billing_address: billingDetails.address,
              billing_city: billingDetails.city,
              billing_pincode: billingDetails.pincode,
              billing_state: "Karnataka",
              billing_country: "India",
              billing_email: billingDetails.email || "appasharan@gmail.com",
              billing_phone: billingDetails.phone,

              shipping_is_billing: true,

              order_items: products.map((item) => ({
                name: item.name,
                sku: item.sku,
                units: item.quantity,
                selling_price: item.price,
              })),

              payment_method: shiprocketPaymentMethod,
              sub_total: totalPrice,
              length: 10,
              breadth: 10,
              height: 10,
              weight: 0.5,
            }),
          }
        );

        const shiprocketData = await response.json();
        console.log("Shiprocket Response:", JSON.stringify(shiprocketData, null, 2));

      } catch (error) {
        console.error("❌ Shiprocket Error:", error);
      }

      // Sync with Seller data
      await saveOrderToSellerCollections(orderData, userOrderDocRef.id);
      await updateSellerDocuments(
        Array.isArray(sellerIdsInOrder) ? sellerIdsInOrder : [sellerIdsInOrder], 
        userOrderDocRef.id, 
        orderData
      );

      return {
        success: true,
        docId: userOrderDocRef.id,
        sellerid: selleridField,
        coinsUsed: coinsToUse,
        discount: coinDiscount
      };

    } catch (error) {
      console.error("Order Error:", error);
      alert("Failed to place order");
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    const newDetails = { ...billingDetails, [id]: value };
    setBillingDetails(newDetails);

    if (id === "address" || id === "pincode" || id === "city") {
      if (
        newDetails.address.length > 5 &&
        newDetails.pincode.length > 5 &&
        newDetails.city.length > 2
      ) {
        debouncedGeocodeAddress(newDetails);
      } else {
        setCoordinates({ lat: null, lng: null });
        setGeocodingError(null);
        setLocationStatusMessage(null);
      }
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const handleRazorpayPayment = async () => {
    const res = await loadRazorpayScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );
    if (!res) return alert(t("checkout.razorpayFailed"));

    const amountInPaise = Math.round(finalAmount * 100);

    if (amountInPaise < 100 && finalAmount > 0) {
      alert(t("checkout.minimumAmount"));
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
      name: "SadhanaCart",
      description: "Purchase Checkout",
      handler: async function (response) {
        alert(
          `Payment Successful! Payment ID: ${response.razorpay_payment_id}`
        );
        
        const result = await saveOrderToFirestore(
          "Razorpay",
          "Paid",
          response.razorpay_payment_id
        );

        if (result && result.success) {
          navigate("/order-confirm", {
            state: {
              paymentMethod: "Razorpay",
              total: formatPrice(finalAmount),
              originalTotal: formatPrice(totalPrice),
              itemsCount: mergedCartItems.length,
              billingDetails,
              cartItems: mergedCartItems,
              sellerid: result.sellerid,
              orderDocId: result.docId,
              coinsUsed: result.coinsUsed,
              discount: result.discount,
            },
          });
        }
      },
      prefill: {
        name: billingDetails.fullName,
        email: billingDetails.email,
        contact: billingDetails.phone,
      },
      notes: {
        address: billingDetails.address,
        pincode: billingDetails.pincode,
        coins_used: coinsToUse,
        coin_discount: coinDiscount,
      },
      theme: { color: "#FFA500" },
    };
    
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "pincode",
    ];
    
    for (const field of requiredFields) {
      if (!billingDetails[field]) {
        alert(`Please fill in the required field: ${field}`);
        return;
      }
    }

    await geocodeAddress(billingDetails);

    if (!coordinates.lat || !coordinates.lng) {
      alert(
        "Could not confirm shipping address location. Please check the address details and ensure the address is complete."
      );
      return;
    }

    await saveBillingDetails(billingDetails);

    if (paymentMethod === "cod") {
      navigate("/cod", {
        state: {
          billingDetails,
          cartItems: mergedCartItems,
          productSkus,
          productSellers,
          totalPrice,
          finalAmount,
          coinsToUse,
          walletCoins,
          coordinates,
        },
      });
      return;
    }

    // Razorpay payment
    await handleRazorpayPayment();
  };

  if (loading) {
    return (
      <Container className="py-5 text-center theme-container">
        <Spinner animation="border" variant="warning" />
        <p className="mt-3 theme-text-primary">
          {t("checkout.fetching")}
        </p>
      </Container>
    );
  }

  if (mergedCartItems.length === 0) {
    return (
      <Container className="py-5 text-center theme-container">
        <Alert variant="info" className="theme-alert-info">
          {t("checkout.emptyCart")}.{" "}
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="theme-link"
          >
            {t("checkout.shipping")}
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5 checkout-container theme-container">
      <Row>
        <Col md={7}>
          <h3 className="fw-bold mb-4 border-bottom pb-2 theme-title">
            {t("checkout.billingInfo")}
          </h3>
          <Card className="shadow-lg border-0 p-4 theme-card">
            <Form onSubmit={handlePayment}>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group controlId="fullName">
                    <Form.Label className="theme-form-label">{t("checkout.fullName")} *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={t("checkout.enterFullName")}
                      required
                      value={billingDetails.fullName}
                      onChange={handleInputChange}
                      className="theme-form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group controlId="email">
                    <Form.Label className="theme-form-label">{t("checkout.email")} *</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      required
                      value={billingDetails.email}
                      onChange={handleInputChange}
                      className="theme-form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3" controlId="phone">
                <Form.Label className="theme-form-label">{t("checkout.phone")} *</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Enter phone number"
                  required
                  value={billingDetails.phone}
                  onChange={handleInputChange}
                  className="theme-form-control"
                />
              </Form.Group>

              <div className="mb-3 d-flex justify-content-end">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={fetchCurrentLocation}
                  disabled={!userId || isLocating}
                  className="theme-button-outline"
                >
                  {isLocating ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {t("checkout.locating")}
                    </>
                  ) : (
                    <>
                      <span className="me-1">📍</span>
                      {t("checkout.useLocation")}
                    </>

                  )}
                </Button>
              </div>

              <Form.Group className="mb-3" controlId="address">
                <Form.Label className="theme-form-label">{t("checkout.address")} *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Enter full street address (including door/house number)"
                  required
                  value={billingDetails.address}
                  onChange={handleInputChange}
                  className="theme-form-control"
                />
              </Form.Group>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group controlId="city">
                    <Form.Label className="theme-form-label">{t("checkout.city")} *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="City"
                      required
                      value={billingDetails.city}
                      onChange={handleInputChange}
                      className="theme-form-control"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group controlId="pincode">
                    <Form.Label className="theme-form-label">{t("checkout.pincode")} *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="PIN code"
                      required
                      value={billingDetails.pincode}
                      onChange={handleInputChange}
                      className="theme-form-control"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {locationStatusMessage ? (
                <Alert variant="success" className="mt-2 theme-alert-success">
                  {locationStatusMessage}
                </Alert>
              ) : geocodingError ? (
                <Alert
                  variant={
                    geocodingError.includes("failed") || geocodingError.includes("denied") || geocodingError.includes("Could not get location")
                      ? "danger"
                      : "info"
                  }
                  className="mt-2 theme-alert-info"
                >
                  {geocodingError}
                </Alert>
              ) : null}

              <Form.Group className="mb-3">
                <Form.Label className="theme-form-label">{t("checkout.paymentMethod")} *</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    label={t("checkout.razorpay")}
                    name="paymentMethod"
                    id="razorpay"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    className="theme-radio"
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label={t("checkout.cod")}
                    name="paymentMethod"
                    id="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="theme-radio"
                  />
                </div>
              </Form.Group>
              <Button
                variant="warning"
                className="w-100 mt-3 py-2 fw-bold shadow-sm"
                type="submit"
                disabled={!coordinates.lat || isLocating || finalAmount <= 0}
              >
                🔒 {t("checkout.pay")} {formatPrice(finalAmount)}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col md={5} className="mt-4 mt-md-0">
          <h3 className="fw-bold mb-4 border-bottom pb-2 theme-title">
            {t("checkout.orderSummary")}
          </h3>

          <Card className="shadow-lg border-0 p-4 theme-card">
            {walletCoins > 0 && (
              <div className="mb-4 p-4 rounded theme-wallet-section">
                <div className="d-flex align-items-center mb-3">
                  <FaCoins size={22} className="me-2 theme-coin-icon" />
                  <h6 className="fw-bold mb-0 theme-text-primary">
                    {t("checkout.useCoins")}
                  </h6>
                </div>

                <p className="small mb-2 theme-text-secondary">
                  {t("checkout.availableCoins")}: <strong className="theme-text-primary">{walletCoins}</strong> (1 coin = ₹1)
                </p>
                <p className="small mb-3 theme-text-secondary">
                  {t("checkout.orderAmount")}: <strong className="theme-text-primary">₹{totalPrice}</strong>
                </p>

                <Form.Group>
                  <Form.Label className="fw-semibold theme-form-label">
                    {t("checkout.coinsApplied")}
                  </Form.Label>

                  <div className="d-flex align-items-center gap-2">
                    <FaCoins className="theme-coin-icon" />
                    <Form.Control
                      type="text"
                      value={`${coinsToUse} Coins  (₹${coinsToUse})`}
                      readOnly
                      className="theme-form-control"
                    />
                  </div>

                  <Form.Text className="text-muted theme-text-muted">
                    {t("checkout.autoApplied")}
                  </Form.Text>
                </Form.Group>

                {coinsToUse > 0 && (
                  <Alert variant="success" className="mt-3 py-2 mb-0 theme-alert-success">
                    <small>
                      <FaCoins className="me-1" />
                      Using {coinsToUse} coins (₹{coinsToUse} discount applied)
                    </small>
                  </Alert>
                )}
              </div>
            )}

            {mergedCartItems && mergedCartItems.length > 0 ? (
              mergedCartItems.map((item, index) => {
                const imageSrc =
                  item.images?.[0] ||
                  item.image ||
                  item.imageUrl ||
                  item.thumbnail ||
                  item.img ||
                  "";

                const sellerId = getSellerIdForCartItem(item);

                return (
                  <div
                    key={item.id + (item.sku || "") + index}
                    className="d-flex align-items-center mb-4 p-3 rounded border theme-product-card"
                  >
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={item.title || item.name || "Product"}
                        thumbnail
                        width={90}
                        height={90}
                        className="me-3 theme-product-image"
                      />
                    ) : (
                      <div
                        className="me-3 d-flex align-items-center justify-content-center theme-no-image"
                      >
                        No Image
                      </div>
                    )}

                    <div className="flex-grow-1">
                      <p className="fw-bold mb-1 theme-text-primary">
                        {item.title || item.name || "Unnamed Product"}
                      </p>

                      {item.color && (
                        <small className="d-block theme-text-secondary">
                          Color: {item.color}
                        </small>
                      )}
                      {item.category && (
                        <small className="d-block theme-text-secondary">
                          Category: {item.category}
                        </small>
                      )}
                      <small className="d-block theme-text-secondary">
                        Quantity: {item.quantity || 1}
                      </small>
                      <small className="d-block theme-text-secondary">
                        Price per item: {formatPrice(item.price || 0)}
                      </small>
                      <span className="fw-bold theme-price">
                        Total:{" "}
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-3 theme-text-secondary">
                {t("checkout.noItems")}
              </p>
            )}

            {mergedCartItems && mergedCartItems.length > 0 && (
              <div className="mt-3 border-top pt-3 theme-border">
                <p className="d-flex justify-content-between mb-2 theme-text-primary">
                  <span>{t("checkout.subtotal")}:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </p>

                {coinsToUse > 0 && (
                  <p className="d-flex justify-content-between mb-2 theme-text-success">
                    <span>
                      <FaCoins className="me-1" />
                      Coins Discount ({coinsToUse} coins):
                    </span>
                    <span className="fw-bold">-{formatPrice(coinDiscount)}</span>
                  </p>
                )}

                <p className="d-flex justify-content-between mb-2 theme-text-primary">
                  <span>{t("checkout.shipping")}</span>
                  <span className="fw-semibold theme-text-success">{t("checkout.free")}</span>
                </p>
                <hr className="theme-border" />
                <h5 className="d-flex justify-content-between fw-bold theme-text-primary">
                  <span>{t("checkout.total")}:</span>
                  <span className={coinsToUse > 0 ? "theme-text-success" : "theme-text-primary"}>
                    {formatPrice(finalAmount)}
                    {coinsToUse > 0 && (
                      <small className="ms-2 theme-text-muted">
                        <s>{formatPrice(totalPrice)}</s>
                      </small>
                    )}
                  </span>
                </h5>

                {coinsToUse > 0 && (
                  <div className="mt-2 py-2 theme-coins-saved">
                    <small>
                      <FaCoins className="me-1" />
                      {t("checkout.savedMessage", { amount: coinDiscount, coins: coinsToUse })}
                    </small>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;