import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Modal, Alert } from "react-bootstrap";
import { FaCoins } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { clearCart } from "../../redux/cartSlice";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";

function CashOnDelivery() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Data from Checkout -> COD page
  const billingDetails = location.state?.billingDetails || {};
  const cartItems = location.state?.cartItems || [];
  const productSkus = location.state?.productSkus || {};
  const totalPrice = location.state?.totalPrice || 0;
  const finalAmount = location.state?.finalAmount || totalPrice;
  const coinsToUse = location.state?.coinsToUse || 0;
  const walletCoins = location.state?.walletCoins || 0;
  const COIN_TO_RUPEE_RATE = 1;
  const coinDiscount = coinsToUse * COIN_TO_RUPEE_RATE;
  const coordinates = location.state?.coordinates || { lat: null, lng: null };
  const shippingCharges = location.state?.shippingCharges || 0;

  // Local state
  const [userId, setUserId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userWalletCoins, setUserWalletCoins] = useState(walletCoins);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showPopup = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserWalletCoins(userData.walletCoins || 0);
          }
        } catch (error) {
          console.error("Error fetching wallet coins:", error);
        }
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const getSellerIdForCartItem = (item) => {
    return (
      item.sellerId ||
      item.sellerid ||
      item.seller ||
      item.vendorId ||
      "default_seller"
    );
  };

  // Deduct coins from wallet
  const deductCoinsFromWallet = async (coinsToDeduct) => {
    if (!userId || coinsToDeduct <= 0) return true;

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentCoins = userData.walletCoins || 0;

        if (currentCoins < coinsToDeduct) {
          showPopup("Insufficient Coins", `You have only ${currentCoins} coins in your wallet. Please adjust your order.`);
          return false;
        }

        await updateDoc(userRef, {
          walletCoins: currentCoins - coinsToDeduct
        });

        console.log(`${coinsToDeduct} coins deducted from wallet for COD order`);
        setUserWalletCoins(currentCoins - coinsToDeduct);
        return true;
      }
    } catch (error) {
      console.error("Error deducting coins:", error);
      showPopup("Wallet Error", "Failed to deduct coins from wallet. Please try again.");
      return false;
    }
    return true;
  };

  // Save order to seller collections (matches Flutter structure)
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
        const sellerSubtotal = sellerProducts.reduce((t, p) => t + (p.price || 0), 0);

        await addDoc(sellerOrdersRef, {
          orderId: orderData.orderId,
          userOrderDocId,
          userId: orderData.userId,
          products: sellerProducts,
          totalAmount: sellerSubtotal,
          paymentMethod: orderData.paymentMethod,
          orderStatus: orderData.orderStatus,
          createdAt: serverTimestamp(),
          customerName: orderData.name,
          customerPhone: orderData.phoneNumber,
          address: orderData.address,
          sellerId,
          shippingCharges: orderData.shippingCharges || 0,
        });
      }
    } catch (err) {
      console.error("Error in saveOrderToSellerCollections:", err);
    }
  };

  // Update seller documents (matches Flutter structure)
  const updateSellerDocuments = async (sellerIds, userOrderDocId, orderData) => {
    try {
      for (const sellerId of sellerIds) {
        if (!sellerId) continue;
        const sellerRef = doc(db, "sellers", sellerId);

        const sellerProducts = (orderData.products || []).filter((p) => p.sellerId === sellerId);
        const sellerSubtotal = sellerProducts.reduce((t, p) => t + (p.price || 0), 0);

        const orderSummary = {
          orderId: orderData.orderId,
          userOrderDocId,
          customerName: orderData.name,
          totalAmount: sellerSubtotal,
          orderDate: new Date(),
          orderStatus: orderData.orderStatus,
        };

        const sellerSnap = await getDoc(sellerRef);
        if (!sellerSnap.exists()) {
          await setDoc(sellerRef, {
            sellerId,
            orders: [],
            totalSales: 0,
            createdAt: serverTimestamp(),
          }).catch(() => {});
        }

        await updateDoc(sellerRef, {
          orders: arrayUnion(orderSummary),
          lastOrderDate: serverTimestamp(),
          totalSales: increment(sellerSubtotal),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error in updateSellerDocuments:", err);
    }
  };

  // Save order to Firestore (MATCHES FLUTTER STRUCTURE EXACTLY)
  const saveOrderToFirestore = async (paymentMethod, status = "pending") => {
    if (!userId) {
      showPopup("Authentication Required", "You must be logged in to place an order.");
      return { success: false };
    }

    // Deduct coins if used
    if (coinsToUse > 0) {
      const coinsDeducted = await deductCoinsFromWallet(coinsToUse);
      if (!coinsDeducted) {
        return { success: false };
      }
    }

    try {
      const sellerIdsInOrder = [...new Set((cartItems || []).map((it) => getSellerIdForCartItem(it)))].filter(Boolean);
      
      // Build products array matching Flutter's OrderProductModel structure
      const products = (cartItems || []).map((item) => {
        const finalSku = productSkus[item.id] || item.sku || item.id || "unknown_sku";
        const sellerId = getSellerIdForCartItem(item);
        const itemPrice = (item.price || 0) * (item.quantity || 1);
        const proportionalCoinsUsed = totalPrice > 0 ? Math.round(itemPrice * coinsToUse / totalPrice) : 0;

        return {
          productid: item.id,                    // Matches Flutter: productid
          name: item.title || item.name || "Unnamed Product",
          price: itemPrice,                       // Matches Flutter: price (total for quantity)
          stock: item.stock || 0,                  // Matches Flutter: stock
          quantity: item.quantity || 1,            // Matches Flutter: quantity
          sku: finalSku,                           // Matches Flutter: sku
          sizevariants: item.sizeVariant ? [       // Matches Flutter: sizevariants array
            {
              size: item.sizeVariant.size,
              stock: item.quantity,
              skuSuffix: item.sizeVariant.skuSuffix,
              color: item.sizeVariant.color,
            }
          ] : [],
          images: item.images || [],                // Matches Flutter: images
          sellerId,                                 // Additional field for seller tracking
        };
      });

      const selleridField = sellerIdsInOrder.length === 1 ? sellerIdsInOrder[0] : sellerIdsInOrder;
      
      // Generate order ID in Flutter format (without ORD- prefix)
      const timestamp = Date.now();
      const orderId = `order_${timestamp}`;  // Flutter uses auto-generated IDs, but we'll use consistent format
      
      // Use auto-generated document ID like Flutter
      const ordersRef = collection(db, "users", userId, "orders");
      
      // Calculate cashback (1% of total)
      const cashbackCoins = Math.floor(totalPrice * 0.01);

      // Create order data EXACTLY matching Flutter structure
      const orderData = {
        orderId: orderId,                         // Will be overridden by Firestore ID, but keep for reference
        userId: userId,
        quantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
        productsTotal: totalPrice,
        payableAmount: finalAmount,
        walletCoinsUsed: coinsToUse,
        cashbackCoinsAdded: cashbackCoins,
        shippingCharges: shippingCharges,
        address: `${billingDetails.address || ""}, ${billingDetails.city || ""}, ${billingDetails.state || "Karnataka"}, ${billingDetails.pincode || ""}`,
        phoneNumber: billingDetails.phone ? parseInt(billingDetails.phone) : null,
        latitude: coordinates.lat || null,
        longitude: coordinates.lng || null,
        orderStatus: status,
        orderDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        products: products,
        paymentMethod: paymentMethod,
        name: billingDetails.fullName || null,
        sellerid: selleridField,
      };

      // Save to Firestore (auto-generated ID like Flutter)
      const userOrderDocRef = await addDoc(ordersRef, orderData);
      
      // Update the document with its own ID as orderId (like Flutter does)
      await updateDoc(userOrderDocRef, {
        orderId: userOrderDocRef.id
      });

      console.log("Order saved with ID:", userOrderDocRef.id);

      // Add cashback to wallet (1% of total)
      if (cashbackCoins > 0) {
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            walletCoins: increment(cashbackCoins)
          });
          console.log(`Added ${cashbackCoins} cashback coins`);
        } catch (e) {
          console.error("Failed to add cashback:", e);
        }
      }

      // Send to Shiprocket
      try {
        const response = await fetch(
          "https://createshiprocketorder-cij4erke6a-uc.a.run.app",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_id: userOrderDocRef.id,
              order_date: new Date().toISOString().split("T")[0],
              billing_customer_name: billingDetails.fullName,
              billing_last_name: "",
              billing_address: billingDetails.address,
              billing_city: billingDetails.city,
              billing_pincode: billingDetails.pincode,
              billing_state: billingDetails.state || "Karnataka",
              billing_country: "India",
              billing_email: billingDetails.email || "appasharan@gmail.com",
              billing_phone: billingDetails.phone,
              shipping_is_billing: true,
              order_items: products.map((item) => ({
                name: item.name,
                sku: item.sku,
                units: item.quantity,
                selling_price: item.price / item.quantity, // Per unit price
              })),
              payment_method: "COD",
              sub_total: totalPrice,
              length: 1,
              breadth: 1,
              height: 1,
              weight: 0.5,
            }),
          }
        );

        const shiprocketData = await response.json();
        console.log("Shiprocket Response:", shiprocketData);

        // Update order with Shiprocket details
        await updateDoc(userOrderDocRef, {
          shipmentId: shiprocketData.shipment_id,
          shiprocketOrderId: shiprocketData.order_id,
          shiprocketStatus: shiprocketData.status,
          shiprocketRawResponse: shiprocketData,
          shiprocketAttempted: true,
        });

      } catch (error) {
        console.error("Shiprocket Error:", error);
        await updateDoc(userOrderDocRef, {
          shiprocketAttempted: true,
          shiprocketError: error.message,
          shiprocketLastAttemptAt: serverTimestamp(),
        });
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
        discount: coinDiscount,
        orderData: orderData
      };
    } catch (error) {
      console.error("Error saving order:", error);
      showPopup("Order Error", "Failed to save order details. Please try again.");
      return { success: false };
    }
  };

  const handleFinalOrderPlacement = async () => {
    if (isSaving) return;
    setShowConfirmModal(false);
    setIsSaving(true);

    const result = await saveOrderToFirestore("Cash on Delivery", "pending");

    if (result && result.success) {
      dispatch(clearCart());
      navigate("/order-confirm", {
        state: {
          paymentMethod: "Cash on Delivery",
          total: formatPrice(finalAmount),
          originalTotal: formatPrice(totalPrice),
          itemsCount: cartItems.length,
          billingDetails,
          cartItems,
          sellerid: result.sellerid,
          orderDocId: result.docId,
          coinsUsed: result.coinsUsed,
          discount: result.discount,
          orderData: result.orderData,
        },
      });
    }
    setIsSaving(false);
  };

  const handleConfirmOrder = () => {
    if (isSaving || !userId) return;
    
    if (coinsToUse > userWalletCoins) {
      showPopup("Insufficient Coins", `You only have ${userWalletCoins} coins available. Please go back and adjust your order.`);
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleBack = () => {
    navigate("/checkout", {
      state: {
        cartItems,
        billingDetails,
        productSkus,
        totalPrice,
        coordinates,
        shippingCharges
      }
    });
  };

  if (!userId || cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h2 className="text-danger">Error</h2>
        <p>Order data is missing or you are not logged in.</p>
        <Button onClick={handleBack} variant="primary">Go back to Checkout</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h2 className="mb-4 text-center">{t("cod.title")}</h2>
          
          {coinsToUse > 0 && (
            <Card className="mb-4 shadow-sm p-4 border-warning">
              <div className="d-flex align-items-center mb-3">
                <FaCoins size={24} className="me-2 text-warning" />
                <h5 className="fw-bold mb-0 text-warning">{t("cod.walletApplied")}</h5>
              </div>
              
              <Alert variant="success" className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaCoins className="me-2" />
                    <strong>{coinsToUse} {t("cod.coins")}</strong> (₹{coinsToUse}) applied
                  </div>
                  <div className="text-success fw-bold">
                    -{formatPrice(coinDiscount)}
                  </div>
                </div>
                <small className="d-block mt-2 text-muted">
                  {t("cod.availableAfter")}: {userWalletCoins - coinsToUse}
                </small>
              </Alert>
              
              <div className="text-center small text-muted">
                <FaCoins className="me-1" />
                {t("cod.youSave", { amount: coinDiscount })}
              </div>
            </Card>
          )}

          <Card className="mb-4 shadow-sm p-4">
            <h5>{t("cod.deliveryDetails")}</h5>
            <p className="mb-1"><strong>{billingDetails.fullName}</strong></p>
            <p className="mb-1 text-muted">{billingDetails.phone}</p>
            <p className="mb-0">{billingDetails.address}, {billingDetails.city} - {billingDetails.pincode}</p>
          </Card>

          <Card className="mb-4 shadow-sm p-4">
            <h5>{t("cod.orderItems")}</h5>
            {cartItems.map((item, idx) => (
              <div key={idx} className="d-flex justify-content-between mb-2">
                <span>{item.title} x {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <hr />
            
            <div className="d-flex justify-content-between mb-2">
              <span>{t("cod.subtotal")}:</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            
            {coinsToUse > 0 && (
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>
                  <FaCoins className="me-1" />
                  {t("cod.coinsDiscount")}:
                </span>
                <span className="fw-bold">-{formatPrice(coinDiscount)}</span>
              </div>
            )}
            
            {shippingCharges > 0 ? (
              <div className="d-flex justify-content-between mb-2">
                <span>{t("cod.shipping")}:</span>
                <span>{formatPrice(shippingCharges)}</span>
              </div>
            ) : (
              <div className="d-flex justify-content-between mb-2">
                <span>{t("cod.shipping")}:</span>
                <span className="text-success fw-semibold">{t("cod.free")}</span>
              </div>
            )}
            
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>{t("cod.totalPayable")}:</span>
              <span className={coinsToUse > 0 ? "text-success" : ""}>
                {formatPrice(finalAmount + (shippingCharges || 0))}
                {coinsToUse > 0 && (
                  <small className="text-muted ms-2">
                    <s>{formatPrice(totalPrice + (shippingCharges || 0))}</s>
                  </small>
                )}
              </span>
            </div>
          </Card>

          <div className="d-grid gap-2">
            <Button
              variant="warning"
              className="py-3 fw-bold"
              onClick={handleConfirmOrder}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {t("cod.processing")}
                </>
              ) : (
                `${t("cod.placeOrder")} - ${formatPrice(finalAmount + (shippingCharges || 0))}`
              )}
            </Button>
            
            <Button
              variant="outline-secondary"
              onClick={handleBack}
              disabled={isSaving}
            >
              {t("cod.backToCheckout")}
            </Button>
          </div>
          
          {coinsToUse > 0 && (
            <Alert variant="info" className="mt-3 small">
              <FaCoins className="me-2" />
              <strong>{t("cod.note")}:</strong> {coinsToUse} coins will be deducted from your wallet immediately upon order confirmation.
            </Alert>
          )}
          
          {/* 1% Cashback info */}
          <Alert variant="success" className="mt-2 small">
            <FaCoins className="me-2" />
            <strong>Cashback:</strong> You'll receive {Math.floor(totalPrice * 0.01)} coins (1% cashback) after order confirmation.
          </Alert>
        </Col>
      </Row>

      {/* Info Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton><Modal.Title>{modalTitle}</Modal.Title></Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer><Button onClick={handleCloseModal}>Close</Button></Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCoins className="me-2 text-warning" />
            {t("cod.confirmOrder")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t("cod.placeOrderFor")} <strong>{formatPrice(finalAmount + (shippingCharges || 0))}</strong> {t("cod.usingCOD")}</p>
          
          {coinsToUse > 0 && (
            <Alert variant="warning" className="py-2">
              <FaCoins className="me-1" />
              <strong>{coinsToUse} coins</strong> (₹{coinsToUse}) will be deducted from your wallet.
            </Alert>
          )}
          
          <div className="small text-muted">
            <strong>{t("cod.deliveryTo")}:</strong> {billingDetails.address}, {billingDetails.city}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirmModal(false)}>
            {t("cod.cancel")}
          </Button>
          <Button variant="warning" onClick={handleFinalOrderPlacement}>
            {coinsToUse > 0 ? t("cod.confirmUseCoins") : t("cod.confirmOrder")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CashOnDelivery;