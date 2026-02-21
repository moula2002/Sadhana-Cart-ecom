import React, { useState, useEffect } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import { FaHome, FaBriefcase, FaMapMarkerAlt, FaCrosshairs, FaUser, FaPhone, FaEnvelope, FaCity, FaGlobe, FaMapPin } from "react-icons/fa";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import "./SaveAddress.css"; // Create this CSS file for enhanced styles

function SaveAddress() {
  const navigate = useNavigate();
  const location = useLocation();

  const existingAddress = location.state?.address || null;

  const [userId, setUserId] = useState(null);
  const [addressType, setAddressType] = useState("Home");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // For multi-step form animation
  const [focusedField, setFocusedField] = useState(null);

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

  // 🔐 Get Logged User
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        // Pre-fill email if available
        if (user.email) {
          setFormData(prev => ({ ...prev, email: user.email }));
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 📝 If Editing
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  // Get current location (simulated)
  const getCurrentLocation = () => {
    // This would use geolocation API in a real app
    alert("Location feature would use browser geolocation");
  };

  // 💾 SAVE FUNCTION
  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    try {
      const addressData = {
        ...formData,
        addressType,
        updatedAt: serverTimestamp(),
      };

      if (existingAddress?.id) {
        // 🔄 UPDATE
        const addressRef = doc(
          db,
          "users",
          userId,
          "addresses",
          existingAddress.id
        );

        await updateDoc(addressRef, addressData);
      } else {
        // ➕ ADD NEW
        const addressCollection = collection(
          db,
          "users",
          userId,
          "addresses"
        );

        // 🔥 Check if first address
        const snap = await getDocs(addressCollection);

        await addDoc(addressCollection, {
          ...addressData,
          createdAt: serverTimestamp(),
          isDefault: snap.empty ? true : false, // First address = default
        });
      }

      // Show success message
      alert("Address Saved Successfully ✅");

      // 🔥 Go to Address List page
      navigate("/save-address");

    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address ❌");
    }

    setLoading(false);
  };

  return (
    <div className="save-address-page">
      {/* Background decoration */}
      <div className="address-bg-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <Container className="py-5" style={{ maxWidth: "600px" }}>
        {/* Header Card */}
        <Card className="address-header-card border-0 shadow-lg mb-4">
          <Card.Body className="p-4 text-center">
            <div className="address-icon-wrapper mb-3">
              <FaMapMarkerAlt className="address-main-icon" />
            </div>
            <h2 className="fw-bold mb-2 gradient-text">
              {existingAddress ? "✏️ Edit Address" : "📍 Add New Address"}
            </h2>
            <p className="text-muted mb-0">
              {existingAddress 
                ? "Update your delivery address details" 
                : "Fill in your address details for seamless delivery"}
            </p>
          </Card.Body>
        </Card>

        {/* Address Type Selection */}
        <Card className="address-type-card border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h6 className="fw-bold mb-3 text-uppercase small text-primary">
              <FaMapMarkerAlt className="me-2" /> Address Type
            </h6>
            <div className="d-flex justify-content-between gap-3">
              {["Home", "Work", "Other"].map((type) => (
                <Card
                  key={type}
                  onClick={() => setAddressType(type)}
                  className={`address-type-option flex-fill ${
                    addressType === type ? "active" : ""
                  }`}
                >
                  <Card.Body className="text-center p-3">
                    <div className="type-icon mb-2">
                      {type === "Home" && <FaHome size={24} className={addressType === type ? "text-white" : "text-primary"} />}
                      {type === "Work" && <FaBriefcase size={24} className={addressType === type ? "text-white" : "text-primary"} />}
                      {type === "Other" && <FaMapMarkerAlt size={24} className={addressType === type ? "text-white" : "text-primary"} />}
                    </div>
                    <div className={`fw-semibold ${addressType === type ? "text-white" : "text-dark"}`}>
                      {type}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Address Form */}
        <Card className="address-form-card border-0 shadow">
          <Card.Body className="p-4">
            <Form onSubmit={handleSave}>
              {/* Progress Steps */}
              <div className="form-progress mb-4">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Contact</span>
                </div>
                <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Address</span>
                </div>
                <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Location</span>
                </div>
              </div>

              {/* Step 1: Contact Information */}
              <div className={`form-step ${step === 1 ? 'active' : ''}`}>
                <h6 className="fw-bold mb-3">Contact Information</h6>
                
                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'fullName' || formData.fullName ? 'focused' : ''}`}>
                    <FaUser className="input-icon" />
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onFocus={() => handleFocus('fullName')}
                      onBlur={handleBlur}
                      required
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.fullName ? 'filled' : ''}`}>
                      Full Name *
                    </label>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'phone' || formData.phone ? 'focused' : ''}`}>
                    <FaPhone className="input-icon" />
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onFocus={() => handleFocus('phone')}
                      onBlur={handleBlur}
                      required
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.phone ? 'filled' : ''}`}>
                      Phone Number *
                    </label>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'email' || formData.email ? 'focused' : ''}`}>
                    <FaEnvelope className="input-icon" />
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={handleBlur}
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.email ? 'filled' : ''}`}>
                      Email (Optional)
                    </label>
                  </div>
                </Form.Group>

                <div className="step-navigation mt-4">
                  <Button 
                    variant="primary" 
                    className="next-step-btn"
                    onClick={() => setStep(2)}
                  >
                    Next Step <i className="fas fa-arrow-right ms-2"></i>
                  </Button>
                </div>
              </div>

              {/* Step 2: Address Details */}
              <div className={`form-step ${step === 2 ? 'active' : ''}`}>
                <h6 className="fw-bold mb-3">Address Details</h6>

                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'street' || formData.street ? 'focused' : ''}`}>
                    <FaMapMarkerAlt className="input-icon" />
                    <Form.Control
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      onFocus={() => handleFocus('street')}
                      onBlur={handleBlur}
                      required
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.street ? 'filled' : ''}`}>
                      Street Address *
                    </label>
                    <FaCrosshairs
                      className="location-icon"
                      onClick={getCurrentLocation}
                      title="Use current location"
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'apartment' || formData.apartment ? 'focused' : ''}`}>
                    <FaHome className="input-icon" />
                    <Form.Control
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleChange}
                      onFocus={() => handleFocus('apartment')}
                      onBlur={handleBlur}
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.apartment ? 'filled' : ''}`}>
                      Apartment, Suite, etc (Optional)
                    </label>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'landmark' || formData.landmark ? 'focused' : ''}`}>
                    <FaMapPin className="input-icon" />
                    <Form.Control
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      onFocus={() => handleFocus('landmark')}
                      onBlur={handleBlur}
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.landmark ? 'filled' : ''}`}>
                      Landmark (Optional)
                    </label>
                  </div>
                </Form.Group>

                <div className="step-navigation d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setStep(1)}
                  >
                    <i className="fas fa-arrow-left me-2"></i> Back
                  </Button>
                  <Button 
                    variant="primary" 
                    className="next-step-btn"
                    onClick={() => setStep(3)}
                  >
                    Next Step <i className="fas fa-arrow-right ms-2"></i>
                  </Button>
                </div>
              </div>

              {/* Step 3: Location & Save */}
              <div className={`form-step ${step === 3 ? 'active' : ''}`}>
                <h6 className="fw-bold mb-3">Location Details</h6>

                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'city' || formData.city ? 'focused' : ''}`}>
                    <FaCity className="input-icon" />
                    <Form.Control
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      onFocus={() => handleFocus('city')}
                      onBlur={handleBlur}
                      required
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.city ? 'filled' : ''}`}>
                      City *
                    </label>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'state' || formData.state ? 'focused' : ''}`}>
                    <FaMapMarkerAlt className="input-icon" />
                    <Form.Control
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      onFocus={() => handleFocus('state')}
                      onBlur={handleBlur}
                      required
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.state ? 'filled' : ''}`}>
                      State *
                    </label>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <div className="country-select-wrapper">
                    <FaGlobe className="select-icon" />
                    <Form.Select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="styled-select"
                    >
                      <option>India</option>
                      <option>USA</option>
                      <option>UK</option>
                      <option>Canada</option>
                      <option>Australia</option>
                    </Form.Select>
                  </div>
                </Form.Group>

                <Form.Group className="mb-4 floating-label-group">
                  <div className={`floating-input-wrapper ${focusedField === 'zip' || formData.zip ? 'focused' : ''}`}>
                    <FaMapPin className="input-icon" />
                    <Form.Control
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      onFocus={() => handleFocus('zip')}
                      onBlur={handleBlur}
                      required
                      className="floating-input"
                    />
                    <label className={`floating-label ${formData.zip ? 'filled' : ''}`}>
                      ZIP / Postcode *
                    </label>
                  </div>
                </Form.Group>

                <div className="step-navigation d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setStep(2)}
                  >
                    <i className="fas fa-arrow-left me-2"></i> Back
                  </Button>
                  <Button
                    type="submit"
                    className="save-address-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle me-2"></i>
                        {existingAddress ? "Update Address" : "Save Address"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default SaveAddress;