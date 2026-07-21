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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    if (!window.confirm(t("confirmDeleteAddress", "Are you sure you want to delete this address?"))) return;

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
    <div className="profile-dashboard-wrapper" style={{ padding: "20px" }}>
      <div className="profile-dashboard-container address-container" style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "10px", overflow: "hidden" }}>
        
        {/* Title */}
        <div className="profile-title-header d-flex align-items-center" style={{ gap: "12px", padding: "16px 24px", margin: 0, borderRadius: '10px 10px 0 0' }}>

          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{t("addressManagement", "Address Management Page")}</h2>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="dashboard-grid-layout" style={{ margin: 0, borderRadius: "0 0 10px 10px", gap: 0 }}>
          
          {/* Sidebar Menu */}
          <div className="dashboard-sidebar" style={{ padding: "24px 16px", minHeight: "600px", borderRadius: 0, marginTop: 0 }}>
            <h6 className="sidebar-title" style={{ fontWeight: '700', marginBottom: '20px', paddingLeft: '12px', fontSize: '15px' }}>{t("myAccount", "My Account")}</h6>
            <ul className="sidebar-menu-list" style={{ marginTop: "0" }}>
              <li className="sidebar-menu-item" onClick={() => navigate("/profile")}>
                <FaUser className="menu-icon" />
                <span>{t("myProfile", "My Profile")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/orders")}>
                <FaShoppingBag className="menu-icon" />
                <span>{t("myOrders", "My Orders")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/wishlist")}>
                <FaHeart className="menu-icon" />
                <span>{t("wishlistLabel", "Wishlist")}</span>
              </li>
              <li className="sidebar-menu-item active" onClick={() => navigate("/save-address")}>
                <FaMapMarkerAlt className="menu-icon" />
                <span style={{ fontWeight: "bold" }}>{t("myAddresses", "My Addresses")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/rewards")}>
                <FaGift className="menu-icon" />
                <span>{t("home.sadhanaRewardsPromo", "Sadhana Rewards")}</span>
              </li>
              <li className="sidebar-menu-item">
                <FaCreditCard className="menu-icon" />
                <span>{t("paymentMethods", "Payment Methods")}</span>
              </li>
              <li className="sidebar-menu-item">
                <FaCog className="menu-icon" />
                <span>{t("accountSettings", "Account Settings")}</span>
              </li>
              <li className="sidebar-menu-item logout-item" onClick={handleLogoutClick} style={{ marginTop: "40px" }}>
                <FaSignOutAlt className="menu-icon" />
                <span>{t("logout", "Logout")}</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content" style={{ padding: "32px", width: "100%", display: "block" }}>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ fontSize: "18px", color: '#111827' }}>{t("myAddresses", "My Addresses")}</h4>
              <Button 
                variant="outline-primary"
                style={{ fontWeight: '600', borderRadius: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate("/address")}
              >
                <FaPlus /> {t("addNewAddress", "Add New Address")}
              </Button>
            </div>

            <div className="d-flex flex-wrap gap-4">
              {addresses.length === 0 ? (
                 <div className="text-center w-100 py-5 empty-address-view" style={{ borderRadius: '8px' }}>
                   {t("noAddressesFound", "No addresses found. Click \"Add New Address\" to add one!")}
                 </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="address-card overview-card" style={{ 
                    flex: '1 1 calc(50% - 1rem)', 
                    minWidth: '280px', 
                    borderRadius: '12px', 
                    padding: '24px', 
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Header */}
                    <div className="d-flex align-items-center mb-3">
                      <h6 className="card-info" style={{ fontWeight: '700', fontSize: '15px', margin: 0, marginRight: '12px' }}>
                        {addr.addressType || t("homeLabel", "Home")}
                      </h6>
                      {addr.isDefault && (
                        <span className="status-pill delivered">
                          {t("defaultAddress", "Default")}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <p className="order-num-id" style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
                      {addr.fullName || "User"}
                    </p>

                    {/* Address Lines */}
                    <p className="order-item-date" style={{ fontSize: '13px', margin: 0, lineHeight: '1.6', flex: 1 }}>
                      {addr.street}
                      {addr.apartment && `, ${addr.apartment}`}
                      {addr.landmark && `, near ${addr.landmark}`}
                      <br />
                      {addr.city && `${addr.city}, `}{addr.state && `${addr.state},`}
                      <br />
                      {addr.country || "India"} - {addr.zip}
                      <br />
                      <span className="phone-text" style={{ display: 'inline-block', marginTop: '10px' }}>
                        +91 {addr.phone}
                      </span>
                    </p>

                    {/* Footer Actions */}
                    <div className="d-flex align-items-center mt-4 pt-3 gap-4 border-top">
                      <div 
                        className="text-primary"
                        style={{ cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleEdit(addr)}
                      >
                        <FaEdit /> {t("edit", "Edit")}
                      </div>
                      <div 
                        style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleDelete(addr.id)}
                      >
                        <FaTrash /> {t("delete", "Delete")}
                      </div>
                      {!addr.isDefault && (
                        <div 
                          style={{ cursor: 'pointer', color: '#10b981', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
                          onClick={() => handleSetDefault(addr.id)}
                        >
                          <FaStar /> {t("setDefault", "Set Default")}
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