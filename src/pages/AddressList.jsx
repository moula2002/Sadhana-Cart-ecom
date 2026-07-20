import React, { useEffect, useState } from "react";
import { Container, Card, Button, Badge, Spinner } from "react-bootstrap";
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
import { 
  FaUser, 
  FaShoppingBag, 
  FaHeart, 
  FaMapMarkerAlt, 
  FaGift, 
  FaCreditCard, 
  FaCog, 
  FaSignOutAlt, 
  FaPlus,
  FaEdit,
  FaTrash,
  FaStar
} from "react-icons/fa";
import "./Profile.css"; // Reuse dashboard layout styles

function AddressList() {
  const [userId, setUserId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else navigate("/login");
    });

    return () => unsubscribe();
  }, [navigate]);

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

  const handleSetDefault = async (id) => {
    try {
      const snap = await getDocs(collection(db, "users", userId, "addresses"));
      const updatePromises = snap.docs.map(async (d) => {
        if (d.id !== id) {
          await updateDoc(d.ref, { isDefault: false });
        }
      });
      await Promise.all(updatePromises);
      await updateDoc(doc(db, "users", userId, "addresses", id), { isDefault: true });
      fetchAddresses();
    } catch (error) {
      console.error("Error setting default address:", error);
      alert("Failed to set default address");
    }
  };

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

  const handleEdit = (address) => {
    navigate("/address", { state: { address } });
  };

  const handleLogoutClick = () => {
    const auth = getAuth();
    auth.signOut().then(() => navigate("/login"));
  };

  if (loading) {
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
              <li className="sidebar-menu-item" onClick={() => navigate("/rewards")}>
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
          <div className="dashboard-main-content" style={{ padding: "32px", width: "100%", display: "block" }}>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ fontSize: "18px", color: '#111827' }}>My Addresses</h4>
              <Button 
                variant="outline-primary"
                style={{ fontWeight: '600', borderRadius: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate("/address")}
              >
                <FaPlus /> Add New Address
              </Button>
            </div>

            <div className="d-flex flex-wrap gap-4">
              {addresses.length === 0 ? (
                 <div className="text-center w-100 py-5" style={{ background: "#f9f9f9", borderRadius: '8px', color: '#6b7280' }}>
                   No addresses found. Click "Add New Address" to add one!
                 </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} style={{ 
                    flex: '1 1 calc(50% - 1rem)', 
                    minWidth: '280px', 
                    border: '1px solid #f3f4f6', 
                    borderRadius: '12px', 
                    padding: '24px', 
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Header */}
                    <div className="d-flex align-items-center mb-3">
                      <h6 style={{ fontWeight: '700', fontSize: '15px', color: '#111827', margin: 0, marginRight: '12px' }}>
                        {addr.addressType || "Home"}
                      </h6>
                      {addr.isDefault && (
                        <span style={{ backgroundColor: '#d1fae5', color: '#059669', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                          Default
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827', marginBottom: '12px' }}>
                      {addr.fullName || "User"}
                    </p>

                    {/* Address Lines */}
                    <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: '1.6', flex: 1 }}>
                      {addr.street}
                      {addr.apartment && `, ${addr.apartment}`}
                      {addr.landmark && `, near ${addr.landmark}`}
                      <br />
                      {addr.city && `${addr.city}, `}{addr.state && `${addr.state},`}
                      <br />
                      {addr.country || "India"} - {addr.zip}
                      <br />
                      <span style={{ display: 'inline-block', marginTop: '10px' }}>
                        +91 {addr.phone}
                      </span>
                    </p>

                    {/* Footer Actions */}
                    <div className="d-flex align-items-center mt-4 pt-3 gap-4">
                      <div 
                        style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleEdit(addr)}
                      >
                        <FaEdit /> Edit
                      </div>
                      <div 
                        style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleDelete(addr.id)}
                      >
                        <FaTrash /> Delete
                      </div>
                      {!addr.isDefault && (
                        <div 
                          style={{ cursor: 'pointer', color: '#10b981', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
                          onClick={() => handleSetDefault(addr.id)}
                        >
                          <FaStar /> Set Default
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AddressList;