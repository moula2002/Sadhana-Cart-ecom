import React, { useEffect, useState } from "react";
import { Container, Card, Button, Badge } from "react-bootstrap";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBriefcase, FaMapMarkerAlt, FaPhone, FaUser, FaEnvelope, FaCity, FaGlobe, FaMapPin, FaStar, FaEdit, FaTrash, FaPlus, FaArrowLeft } from "react-icons/fa";
import "./AddressList.css";

function AddressList() {
  const [userId, setUserId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users", userId, "addresses"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAddresses(list);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Delete Address
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      await deleteDoc(doc(db, "users", userId, "addresses", id));
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      alert("Failed to delete address");
    }
  };

  // ⭐ Set Default Address
  const handleSetDefault = async (id) => {
    try {
      const snap = await getDocs(collection(db, "users", userId, "addresses"));

      // Remove default from all
      const updatePromises = snap.docs.map(async (d) => {
        if (d.id !== id) {
          await updateDoc(d.ref, { isDefault: false });
        }
      });
      
      await Promise.all(updatePromises);

      // Set selected as default
      await updateDoc(
        doc(db, "users", userId, "addresses", id),
        { isDefault: true }
      );

      fetchAddresses();
    } catch (error) {
      console.error("Error setting default address:", error);
      alert("Failed to set default address");
    }
  };

  // ✏️ Edit Address
  const handleEdit = (address) => {
    navigate("/address", { state: { address } });
  };

  // Get icon based on address type
  const getAddressIcon = (type) => {
    switch(type) {
      case "Home": return <FaHome className="address-type-icon" />;
      case "Work": return <FaBriefcase className="address-type-icon" />;
      default: return <FaMapMarkerAlt className="address-type-icon" />;
    }
  };

  return (
    <div className="address-list-container">
      {/* Background decoration */}
      <div className="address-bg-decoration">
        <div className="address-circle address-circle-1"></div>
        <div className="address-circle address-circle-2"></div>
      </div>

      <Container className="py-4" style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div className="address-header">
          <Card className="address-header-card mb-4">
            <div className="address-header-content">
              <div className="address-title-section">
                <Button
                  variant="outline-secondary"
                  className="btn-back"
                  onClick={() => navigate("/profile")}
                >
                  <FaArrowLeft /> Back
                </Button>
                <div className="address-icon-wrapper">
                  <FaMapMarkerAlt className="address-icon" />
                </div>
                <h4 className="address-title">My Addresses</h4>
                <Badge className="address-count-badge">
                  {addresses.length} {addresses.length === 1 ? 'Address' : 'Addresses'}
                </Badge>
              </div>

              <Button 
                className="btn-add"
                onClick={() => navigate("/address")}
              >
                <FaPlus /> Add New Address
              </Button>
            </div>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your addresses...</p>
          </div>
        )}

        {/* Address List */}
        {!loading && addresses.length > 0 && (
          <div className="address-list">
            {addresses.map((addr) => (
              <Card key={addr.id} className="address-card mb-3">
                <Card.Body className="address-card-content">
                  <div className="address-header-row">
                    <div className="address-name-section">
                      <span className="address-name">{addr.fullName}</span>
                      <Badge className="address-type-badge">
                        {getAddressIcon(addr.addressType)}
                        {addr.addressType}
                      </Badge>
                      {addr.isDefault && (
                        <Badge className="default-badge">
                          <FaStar /> Default
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="address-details">
                    <div className="address-phone">
                      <FaPhone /> {addr.phone}
                      {addr.email && (
                        <>
                          <span className="mx-2">•</span>
                          <FaEnvelope /> {addr.email}
                        </>
                      )}
                    </div>
                    
                    <div className="address-full">
                      <FaMapMarkerAlt />
                      <span className="address-line">
                        {addr.street}
                        {addr.apartment && `, ${addr.apartment}`}
                        {addr.landmark && `, near ${addr.landmark}`}
                        <br />
                        {addr.city}, {addr.state} - {addr.zip}
                        <br />
                        {addr.country}
                      </span>
                    </div>

                    {addr.landmark && (
                      <div className="address-landmark">
                        <FaMapPin /> Landmark: {addr.landmark}
                      </div>
                    )}
                  </div>

                  <div className="address-actions">
                    <Button
                      size="sm"
                      className="btn-action btn-edit"
                      onClick={() => handleEdit(addr)}
                    >
                      <FaEdit /> Edit
                    </Button>
                    
                    {!addr.isDefault && (
                      <Button
                        size="sm"
                        className="btn-action btn-set-default"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        <FaStar /> Set Default
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(addr.id)}
                    >
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && addresses.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-content">
              <FaMapMarkerAlt className="empty-state-icon" />
              <h3 className="empty-state-title">No Addresses Found</h3>
              <p className="empty-state-text">
                You haven't added any delivery addresses yet. Add your first address to start shopping!
              </p>
              <Button 
                className="empty-state-btn"
                onClick={() => navigate("/address")}
              >
                <FaPlus /> Add Your First Address
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default AddressList;