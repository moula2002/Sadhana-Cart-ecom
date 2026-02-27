import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Image,
  Alert
} from "react-bootstrap";
import { doc, collection, setDoc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useLocation, useNavigate } from "react-router-dom";

const ProductReturnPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, product } = location.state || {};

  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [refundType, setRefundType] = useState("wallet");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order || !product) {
      setLoading(false);
      return;
    }

    // Get product image from multiple sources
    const getImage = () => {
      if (product?.image) return product.image;
      if (product?.images?.[0]) return product.images[0];
      if (product?.productImage) return product.productImage;
      if (order?.products) {
        const foundProduct = order.products.find(p => 
          p.id === product.id || 
          p.productId === product.productId || 
          p.productid === product.productid
        );
        if (foundProduct?.image) return foundProduct.image;
        if (foundProduct?.images?.[0]) return foundProduct.images[0];
      }
      return "https://via.placeholder.com/400x500?text=Product+Image";
    };

    setProductImage(getImage());
    setLoading(false);
  }, [order, product]);

  if (!order || !product) {
    return (
      <div className="text-center py-5">
        <h3>No Return Data Found</h3>
        <Button onClick={() => navigate("/orders")}>
          Go Back
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Safe ID extraction with fallbacks
  const orderId = order?.orderId || order?.id || "";
  const productId = product?.id || product?.productId || product?.productid || product?.product_id || "";
  
  // Safe amount calculations
  const totalOrderAmount = Number(order?.payableAmount || order?.total || 0);
  const productAmount = Number(product?.price || product?.productPrice || 0);
  
  // Prevent division by zero
  const proportion = totalOrderAmount > 0 ? productAmount / totalOrderAmount : 0;
  
  const usedCoins = Number(order?.walletCoinsUsed || order?.usedCoins || 0);
  const payableAmount = Number(order?.payableAmount || totalOrderAmount);
  
  const coinsToRefund = Math.round(usedCoins * proportion) || 0;
  const amountToRefund = (payableAmount * proportion) || 0;

  const isValidIFSC = (code) => {
    const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return regex.test(code.replace(/\s/g, ""));
  };

  const validateInputs = () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return false;
    }

    if (selectedReason === "Other" && !description.trim()) {
      setError("Please describe the issue");
      return false;
    }

    if (refundType === "bank") {
      if (!accountName.trim()) {
        setError("Please enter account holder name");
        return false;
      }
      if (!accountNumber.trim()) {
        setError("Please enter account number");
        return false;
      }
      if (!ifsc.trim()) {
        setError("Please enter IFSC code");
        return false;
      }
      if (!isValidIFSC(ifsc)) {
        setError("Invalid IFSC Code. Format: ABCD0123456");
        return false;
      }
    }

    if (!orderId) {
      setError("Order ID is missing");
      return false;
    }

    return true;
  };

  const submitReturnRequest = async () => {
    setError("");
    
    if (!validateInputs()) {
      return;
    }

    // Check if user is authenticated
    if (!auth.currentUser) {
      setError("You must be logged in");
      return;
    }

    try {
      setIsLoading(true);

      const userId = auth.currentUser.uid;

      // First, get the latest order data
      const orderRef = doc(db, "users", userId, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      let currentOrderData = orderSnap.exists() ? orderSnap.data() : null;
      
      if (!currentOrderData) {
        // Try main orders collection
        const mainOrderRef = doc(db, "orders", orderId);
        const mainOrderSnap = await getDoc(mainOrderRef);
        if (mainOrderSnap.exists()) {
          currentOrderData = mainOrderSnap.data();
        } else {
          setError("Order not found in database");
          return;
        }
      }

      // Create return request document
      const returnRef = doc(collection(db, "users", userId, "return_requests"));
      
      // Clean the product object - remove any undefined values
      const cleanProduct = {
        id: productId || "",
        name: product?.name || "",
        price: productAmount,
        quantity: Number(product?.quantity || 1),
        image: productImage || "",
        ...(product?.size && { size: product.size }),
        ...(product?.color && { color: product.color })
      };

      // Prepare return data - ensure no undefined values
      const returnData = {
        returnId: returnRef.id,
        userId: userId || "",
        orderId: orderId || "",
        productId: productId || "",
        productName: product?.name || "",
        quantity: Number(product?.quantity || 1),
        reason: selectedReason || "",
        description: description || "",
        refundType: refundType || "wallet",
        refundAmount: Number(amountToRefund.toFixed(2)) || 0,
        coinsToRefund: Number(coinsToRefund) || 0,
        orderStatus: "return_requested",
        status: "return_requested",
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        productImage: productImage || "",
        product: cleanProduct
      };

      // Add bank details only if bank refund type and all fields are filled
      if (refundType === "bank" && accountName && accountNumber && ifsc) {
        returnData.bankDetails = {
          accountName: accountName.trim() || "",
          accountNumber: accountNumber.trim() || "",
          ifsc: ifsc.trim().toUpperCase() || ""
        };
      }

      // Save return request
      await setDoc(returnRef, returnData);
      /* ===============================
   🔥 WALLET REFUND LOGIC
================================ */

if (refundType === "wallet") {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const currentCoins = Number(userSnap.data().walletCoins || 0);

    // ₹1 = 1 Coin conversion
    const coinsFromAmount = Math.round(amountToRefund);

    const newCoins = currentCoins + coinsFromAmount;

    console.log("Refund Amount:", amountToRefund);
    console.log("Coins Adding:", coinsFromAmount);
    console.log("New Wallet Coins:", newCoins);

    await updateDoc(userRef, {
      walletCoins: newCoins,
      walletBalance: newCoins,
      updatedAt: serverTimestamp(),
    });
  }
}

      // Update the order with return status
      const updatedProducts = (currentOrderData.products || []).map((p) => {
        const currentId = p?.id || p?.productId || p?.productid || "";
        const clickedId = productId;

        if (currentId === clickedId) {
          return {
            ...p,
            returnStatus: "return_requested",
            returnId: returnRef.id,
            image: p?.image || productImage || "",
            images: p?.images || [productImage || ""]
          };
        }
        return p;
      });

      await updateDoc(orderRef, {
        products: updatedProducts,
        orderStatus: "return_requested",
        updatedAt: serverTimestamp()
      }).catch(async (error) => {
        // If update fails, try to update in main orders collection
        if (error.code === 'not-found') {
          const mainOrderRef = doc(db, "orders", orderId);
          await updateDoc(mainOrderRef, {
            products: updatedProducts,
            orderStatus: "return_requested",
            updatedAt: serverTimestamp()
          });
        } else {
          throw error;
        }
      });

      alert("Return request submitted & Wallet credited successfully");
navigate("/wallet");
    } catch (error) {
      console.error("Return Error Details:", error);
      setError(`Failed to submit return request: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: "600px" }}>
      <h3 className="mb-4">Return Product</h3>

      {error && (
        <Alert variant="danger" className="mb-3" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      <Card className="p-3 mb-4">
        <Row>
          <Col xs={4}>
            <Image
              src={productImage}
              fluid
              style={{
                height: "100px",
                width: "100%",
                objectFit: "cover",
                borderRadius: "8px",
                backgroundColor: "#f8f9fa"
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/400x500?text=Product";
              }}
            />
          </Col>
          <Col xs={8}>
            <h5>{product?.name || "Product"}</h5>
            <p className="mb-1">Quantity: {product?.quantity || 1}</p>
            <p className="mb-1">Price: ₹{productAmount.toFixed(2)}</p>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col>
            <p className="mb-1">
              <strong>Product Amount:</strong> ₹{productAmount.toFixed(2)}
            </p>
            <p className="mb-1">
              <strong>Refund Amount:</strong>{" "}
              <span className="text-success">
                ₹{amountToRefund.toFixed(2)}
              </span>
            </p>
            <p className="mb-1">
              <strong>Coins to Refund:</strong> {coinsToRefund}
            </p>
          </Col>
        </Row>
      </Card>

      <Form.Group className="mb-3">
        <Form.Label>Refund Method</Form.Label>
        <Form.Check
          type="radio"
          id="wallet-refund"
          label="Wallet (Instant Refund)"
          checked={refundType === "wallet"}
          onChange={() => setRefundType("wallet")}
        />
        <Form.Check
          type="radio"
          id="bank-refund"
          label="Bank Account (2-3 business days)"
          checked={refundType === "bank"}
          onChange={() => setRefundType("bank")}
        />
      </Form.Group>

      {refundType === "bank" && (
        <>
          <Form.Control
            className="mb-2"
            placeholder="Account Holder Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
          <Form.Control
            className="mb-2"
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
          <Form.Control
            className="mb-3"
            placeholder="IFSC Code (e.g., SBIN0123456)"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
            required
          />
          <Form.Text className="text-muted mb-3 d-block">
            IFSC format: First 4 letters, then 0, then 6 alphanumeric characters
          </Form.Text>
        </>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Reason for Return</Form.Label>
        <Form.Select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
        >
          <option value="">Select Reason</option>
          <option value="Received wrong item">Received wrong item</option>
          <option value="Defective / Damaged">Defective / Damaged</option>
          <option value="Quality not as expected">Quality not as expected</option>
          <option value="Missing parts">Missing parts</option>
          <option value="Size issue">Size issue</option>
          <option value="Other">Other</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Additional Details (Optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide more details about the issue..."
        />
      </Form.Group>

      <Row>
        <Col>
          <Button
            variant="secondary"
            className="w-100"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </Col>
        <Col>
          <Button
            variant="warning"
            className="w-100"
            onClick={submitReturnRequest}
            disabled={isLoading}
            style={{
              backgroundColor: "#ffc107",
              borderColor: "#ffc107",
              color: "#000"
            }}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              "Submit Return Request"
            )}
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductReturnPage;