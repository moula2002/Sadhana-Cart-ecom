import React, { useState, useEffect } from "react";
// UI
import { Container, Row, Col, Card, Button, Spinner, Modal, Alert } from "react-bootstrap";
import { FaCoins } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { clearCart } from "../../redux/cartSlice";
// Firestore + Auth
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
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Data from Checkout -> COD page (WITH COIN DATA)
  const billingDetails = location.state?.billingDetails || {};
  const cartItems = location.state?.cartItems || [];
  const productSkus = location.state?.productSkus || {};
  const totalPrice = location.state?.totalPrice || 0;
  const finalAmount = location.state?.finalAmount || totalPrice; // After coins discount
  const coinsToUse = location.state?.coinsToUse || 0;
  const walletCoins = location.state?.walletCoins || 0;
const COIN_TO_RUPEE_RATE = 1;
const coinDiscount = coinsToUse * COIN_TO_RUPEE_RATE;

  const coordinates = location.state?.coordinates || { lat: null, lng: null };



  // Local state
  const [userId, setUserId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [userWalletCoins, setUserWalletCoins] = useState(walletCoins);

  // Modal states
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
        // ✅ FETCH LATEST WALLET COINS FROM DATABASE
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

  // ✅ FUNCTION TO DEDUCT COINS FROM USER WALLET
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

        // Deduct coins
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

  // Save order to sellers/{sellerId}/orders for vendor dashboard visibility
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
          userOrderDocId, // Reference to the doc in users/{uid}/orders
          userId: orderData.userId,
          products: sellerProducts,
          totalAmount: sellerSubtotal,
          discountedAmount: sellerSubtotal - (sellerSubtotal * coinsToUse / totalPrice), // Proportional discount
          coinsUsed: Math.round(sellerSubtotal * coinsToUse / totalPrice), // Proportional coins used
          coinDiscount: Math.round(sellerSubtotal * coinDiscount / totalPrice), // Proportional discount
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
          orderDate: serverTimestamp(),
          orderStatus: orderData.orderStatus,
        };

        const sellerSnap = await getDoc(sellerRef);
        if (!sellerSnap.exists()) {
          // Initialize seller doc if it doesn't exist
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

  const saveOrderToFirestore = async (paymentMethod, status = "Pending") => {
    if (!userId) {
      showPopup("Authentication Required", "You must be logged in to place an order.");
      return { success: false };
    }

    // ✅ DEDUCT COINS BEFORE SAVING ORDER
    if (coinsToUse > 0) {
      const coinsDeducted = await deductCoinsFromWallet(coinsToUse);
      if (!coinsDeducted) {
        return { success: false };
      }
    }

    try {
      const sellerIdsInOrder = [...new Set((cartItems || []).map((it) => getSellerIdForCartItem(it)))].filter(Boolean);
      
      const products = (cartItems || []).map((item) => {
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
      const orderId = `ORD-${Date.now()}`;

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
        walletCoinsAfterDeduction: userWalletCoins - coinsToUse,
      };

      // TARGET PATH: /users/{userId}/orders/
      const ordersRef = collection(db, "users", userId, "orders");
      const userOrderDocRef = await addDoc(ordersRef, orderData);

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
      console.error("Error saving order:", error);
      showPopup("Order Error", "Failed to save order details. Please try again.");
      return { success: false };
    }
  };

  const handleFinalOrderPlacement = async () => {
    if (isSaving) return;
    setShowConfirmModal(false);
    setIsSaving(true);

    const result = await saveOrderToFirestore("Cash on Delivery", "Pending");

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
        },
      });
    }
    setIsSaving(false);
  };

  const handleConfirmOrder = () => {
    if (isSaving || !userId) return;
    
    // Check if user still has enough coins
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
        coordinates 
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
          <h2 className="mb-4 text-center">Cash on Delivery</h2>
          
          {/* ✅ WALLET COINS DISPLAY SECTION */}
          {coinsToUse > 0 && (
            <Card className="mb-4 shadow-sm p-4 border-warning">
              <div className="d-flex align-items-center mb-3">
                <FaCoins size={24} className="me-2 text-warning" />
                <h5 className="fw-bold mb-0 text-warning">Wallet Coins Applied</h5>
              </div>
              
              <Alert variant="success" className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <FaCoins className="me-2" />
                    <strong>{coinsToUse} Coins</strong> (₹{coinsToUse}) applied
                  </div>
                  <div className="text-success fw-bold">
                    -{formatPrice(coinDiscount)}
                  </div>
                </div>
                <small className="d-block mt-2 text-muted">
                  Available coins after purchase: {userWalletCoins - coinsToUse}
                </small>
              </Alert>
              
              <div className="text-center small text-muted">
                <FaCoins className="me-1" />
                You save ₹{coinDiscount} using your wallet coins!
              </div>
            </Card>
          )}

          <Card className="mb-4 shadow-sm p-4">
            <h5 className="border-bottom pb-2">Delivery Details</h5>
            <p className="mb-1"><strong>{billingDetails.fullName}</strong></p>
            <p className="mb-1 text-muted">{billingDetails.phone}</p>
            <p className="mb-0">{billingDetails.address}, {billingDetails.city} - {billingDetails.pincode}</p>
          </Card>

          <Card className="mb-4 shadow-sm p-4">
            <h5 className="border-bottom pb-2">Order Items</h5>
            {cartItems.map((item, idx) => (
              <div key={idx} className="d-flex justify-content-between mb-2">
                <span>{item.title} x {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <hr />
            
            {/* ✅ ORDER SUMMARY WITH COIN DISCOUNT */}
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal:</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            
            {coinsToUse > 0 && (
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>
                  <FaCoins className="me-1" />
                  Coins Discount:
                </span>
                <span className="fw-bold">-{formatPrice(coinDiscount)}</span>
              </div>
            )}
            
            <div className="d-flex justify-content-between mb-2">
              <span>Shipping:</span>
              <span className="text-success fw-semibold">Free</span>
            </div>
            
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Total Payable:</span>
              <span className={coinsToUse > 0 ? "text-success" : ""}>
                {formatPrice(finalAmount)}
                {coinsToUse > 0 && (
                  <small className="text-muted ms-2">
                    <s>{formatPrice(totalPrice)}</s>
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
                  Processing...
                </>
              ) : (
                `PLACE ORDER - ${formatPrice(finalAmount)}`
              )}
            </Button>
            
            <Button 
              variant="outline-secondary" 
              onClick={handleBack}
              disabled={isSaving}
            >
              ← Back to Checkout
            </Button>
          </div>
          
          {coinsToUse > 0 && (
            <Alert variant="info" className="mt-3 small">
              <FaCoins className="me-2" />
              <strong>Note:</strong> {coinsToUse} coins will be deducted from your wallet immediately upon order confirmation.
            </Alert>
          )}
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
            Confirm Order
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Place order for <strong>{formatPrice(finalAmount)}</strong> using Cash on Delivery?</p>
          
          {coinsToUse > 0 && (
            <Alert variant="warning" className="py-2">
              <FaCoins className="me-1" />
              <strong>{coinsToUse} coins</strong> (₹{coinsToUse}) will be deducted from your wallet.
            </Alert>
          )}
          
          <div className="small text-muted">
            <strong>Delivery to:</strong> {billingDetails.address}, {billingDetails.city}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
          <Button variant="warning" onClick={handleFinalOrderPlacement}>
            {coinsToUse > 0 ? "Confirm & Use Coins" : "Confirm Order"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CashOnDelivery;