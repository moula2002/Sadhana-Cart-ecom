import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Spinner } from "react-bootstrap";
import { 
  FaUser, FaShoppingBag, FaHeart, FaMapMarkerAlt, FaGift, FaCreditCard, FaCog, FaSignOutAlt,
  FaHome, FaBriefcase
} from "react-icons/fa";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, updateDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import "./Profile.css"; // Reuse dashboard layout styles

function SaveAddress() {
  const navigate = useNavigate();
  const location = useLocation();
  const existingAddress = location.state?.address || null;

  const [userId, setUserId] = useState(null);
  const [addressType, setAddressType] = useState("Home");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    street: "",
    apartment: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    zip: "",
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        if (user.email && !existingAddress) {
          setFormData(prev => ({ ...prev, email: user.email }));
        }
      } else {
        navigate("/login");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate, existingAddress]);

  useEffect(() => {
    if (existingAddress) {
      setFormData({
        fullName: existingAddress.fullName || "",
        phone: existingAddress.phone || "",
        email: existingAddress.email || "",
        street: existingAddress.street || "",
        apartment: existingAddress.apartment || "",
        landmark: existingAddress.landmark || "",
        city: existingAddress.city || "",
        state: existingAddress.state || "",
        country: existingAddress.country || "India",
        zip: existingAddress.zip || "",
      });
      setAddressType(existingAddress.addressType || "Home");
    }
  }, [existingAddress]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    // Allow empty string or exactly digits
    if (val === "" || /^[0-9]+$/.test(val)) {
      setFormData({ ...formData, phone: val });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const addressData = {
        ...formData,
        addressType,
        updatedAt: serverTimestamp(),
      };

      if (existingAddress?.id) {
        const addressRef = doc(db, "users", userId, "addresses", existingAddress.id);
        await updateDoc(addressRef, addressData);
      } else {
        const addressCollection = collection(db, "users", userId, "addresses");
        const snap = await getDocs(addressCollection);
        await addDoc(addressCollection, {
          ...addressData,
          createdAt: serverTimestamp(),
          isDefault: snap.empty ? true : false,
        });
      }
      navigate("/save-address");
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address");
    }
    setLoading(false);
  };

  const handleLogoutClick = () => {
    const auth = getAuth();
    auth.signOut().then(() => navigate("/login"));
  };

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="profile-dashboard-wrapper" style={{ background: "#f8f9fa", padding: "20px" }}>
      <div className="profile-dashboard-container" style={{ maxWidth: "1200px", margin: "0 auto", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden", background: "white" }}>
        
        {/* Title */}
        <div className="profile-title-header d-flex align-items-center" style={{ gap: "12px", background: "#0a45bd", color: "white", padding: "16px 24px", margin: 0, borderRadius: '10px 10px 0 0' }}>

          <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "bold" }}>Address Management Page</h2>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="dashboard-grid-layout" style={{ margin: 0, borderRadius: "0 0 10px 10px", background: "white", gap: 0 }}>
          
          {/* Sidebar Menu */}
          <div className="dashboard-sidebar" style={{ borderRight: "1px solid #e0e0e0", padding: "24px 16px", minHeight: "600px", borderRadius: 0, marginTop: 0 }}>
            <h6 style={{ fontWeight: '700', color: '#1a202c', marginBottom: '20px', paddingLeft: '12px', fontSize: '15px' }}>My Account</h6>
            <ul className="sidebar-menu-list" style={{ marginTop: "0" }}>
              <li className="sidebar-menu-item" onClick={() => navigate("/profile")}>
                <FaUser className="menu-icon" />
                <span>My Profile</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/orders")}>
                <FaShoppingBag className="menu-icon" />
                <span>My Orders</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/wishlist")}>
                <FaHeart className="menu-icon" />
                <span>Wishlist</span>
              </li>
              <li className="sidebar-menu-item active" onClick={() => navigate("/save-address")} style={{ background: "#e8f0fe", color: "#0a45bd", borderRadius: "6px" }}>
                <FaMapMarkerAlt className="menu-icon" style={{ color: "#0a45bd" }} />
                <span style={{ fontWeight: "bold" }}>My Addresses</span>
              </li>
              <li className="sidebar-menu-item">
                <FaGift className="menu-icon" />
                <span>Sadhana Rewards</span>
              </li>
              <li className="sidebar-menu-item">
                <FaCreditCard className="menu-icon" />
                <span>Payment Methods</span>
              </li>
              <li className="sidebar-menu-item">
                <FaCog className="menu-icon" />
                <span>Account Settings</span>
              </li>
              <li className="sidebar-menu-item logout-item" onClick={handleLogoutClick} style={{ marginTop: "40px" }}>
                <FaSignOutAlt className="menu-icon" />
                <span>Logout</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content" style={{ padding: "32px", display: "block", width: "100%" }}>
            
            <div className="mb-4">
              <h4 className="fw-bold m-0" style={{ fontSize: "18px", color: '#111827' }}>
                {existingAddress ? "Edit Address" : "Add New Address"}
              </h4>
            </div>

            <Form onSubmit={handleSave} style={{ maxWidth: '800px' }}>
              
              <div className="mb-4">
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#4b5563", marginBottom: "12px", display: "block" }}>Address Type</label>
                <div className="d-flex gap-3 flex-wrap">
                  {["Home", "Work", "Other"].map((type) => (
                    <div
                      key={type}
                      onClick={() => setAddressType(type)}
                      style={{
                        padding: "10px 24px",
                        border: addressType === type ? "1px solid #0a45bd" : "1px solid #e5e7eb",
                        borderRadius: "8px",
                        cursor: "pointer",
                        backgroundColor: addressType === type ? "#eff4ff" : "white",
                        color: addressType === type ? "#0a45bd" : "#4b5563",
                        fontWeight: "600",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s"
                      }}
                    >
                      {type === "Home" && <FaHome />}
                      {type === "Work" && <FaBriefcase />}
                      {type === "Other" && <FaMapMarkerAlt />}
                      {type}
                    </div>
                  ))}
                </div>
              </div>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. John Doe"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Phone Number (10 digits) *</Form.Label>
                    <div className="d-flex align-items-center">
                      <span style={{ padding: "9px 14px", background: "#f3f4f6", border: "1px solid #ced4da", borderRight: "none", borderRadius: "6px 0 0 6px", fontSize: "14px", color: "#4b5563", fontWeight: "500" }}>
                        +91
                      </span>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        maxLength={10}
                        required
                        placeholder="Mobile Number"
                        style={{ padding: "10px 14px", borderRadius: "0 6px 6px 0", fontSize: "14px" }}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Email (Optional)</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. email@example.com"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Street Address *</Form.Label>
                    <Form.Control
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      required
                      placeholder="House No, Building, Street Area"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Apartment, Suite, etc (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleChange}
                      placeholder="Apartment or Suite number"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Landmark (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder="E.g. near Apollo Hospital"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>City *</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="City Name"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>State *</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      placeholder="State Name"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Country *</Form.Label>
                    <Form.Select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    >
                      <option value="India">India</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-4">
                  <Form.Group>
                    <Form.Label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>ZIP / PIN Code *</Form.Label>
                    <Form.Control
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 560038"
                      style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex gap-3 pt-4 mt-2 border-top">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate("/save-address")}
                  style={{ fontWeight: "600", padding: "10px 24px", borderRadius: "6px" }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading}
                  style={{ fontWeight: "600", padding: "10px 32px", borderRadius: "6px", backgroundColor: "#0a45bd", borderColor: "#0a45bd" }}
                >
                  {loading ? (
                    <Spinner size="sm" animation="border" />
                  ) : existingAddress ? "Update Address" : "Save Address"}
                </Button>
              </div>

            </Form>

          </div>
        </div>
      </div>
    </div>
  );
}

export default SaveAddress;