import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FiAward, FiHeadphones } from "react-icons/fi";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";

const RewardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch wallet balance
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setWalletBalance(userDoc.data().walletBalance || 0);
          }

          // Fetch transactions
          const transSnapshot = await getDocs(collection(db, "users", user.uid, "wallet_transactions"));
          const transData = [];
          transSnapshot.forEach(doc => {
            transData.push({ id: doc.id, ...doc.data() });
          });
          
          // Sort by date descending
          transData.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
          setTransactions(transData);
        } catch (error) {
          console.error("Error fetching rewards data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="profile-dashboard-wrapper" style={{ padding: "20px" }}>
      <div className="profile-dashboard-container address-container" style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "10px", overflow: "hidden" }}>
        
        {/* Title */}
        <div className="profile-title-header d-flex align-items-center" style={{ gap: "12px", padding: "16px 24px", margin: 0, borderRadius: '10px 10px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{t("sadhanaRewards", "Sadhana Rewards")}</h2>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="dashboard-grid-layout" style={{ margin: 0, borderRadius: "0 0 10px 10px", gap: 0, display: 'flex', flexDirection: 'row' }}>
          
          {/* Sidebar Menu */}
          <div className="dashboard-sidebar" style={{ padding: "24px 16px", minHeight: "600px", borderRadius: 0, marginTop: 0, minWidth: '250px', flexShrink: 0 }}>
            <h6 className="sidebar-title" style={{ fontWeight: '700', marginBottom: '20px', paddingLeft: '12px', fontSize: '15px' }}>{t("myAccount", "My Account")}</h6>
            <ul className="sidebar-menu-list" style={{ marginTop: "0", listStyle: "none", padding: 0 }}>
              <li className="sidebar-menu-item" onClick={() => navigate("/orders")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer' }}>
                <FaUser className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t("myOrders", "My Orders")}</span>
              </li>
              <li className="sidebar-menu-item active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer' }}>
                <FiAward className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontWeight: "bold", fontSize: '14px' }}>{t("accountRewards", "Account Rewards")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/save-address")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer' }}>
                <FaMapMarkerAlt className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t("savedAddresses", "Saved Addresses")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/support")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer' }}>
                <FiHeadphones className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t("helpCenter", "Help Center")}</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content" style={{ padding: "40px 60px", flexGrow: 1, display: "block" }}>
            
            <h4 className="fw-bold mb-4 order-num-id" style={{ fontSize: "20px" }}>{t("sadhanaRewards", "Sadhana Rewards")}</h4>
            
            {/* Top Blue Card */}
            <div style={{ 
              background: '#0a45bd', 
              borderRadius: '12px', 
              padding: '30px', 
              maxWidth: '550px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '30px'
            }}>
              <div>
                <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>{t("availablePoints", "Available Points")}</p>
                <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: 1 }}>{walletBalance}</h1>
                <div style={{ background: '#fbbf24', color: '#92400e', padding: '4px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', fontSize: '14px' }}>
                  {t("pointValue", "1 Point = ₹ 1")}
                </div>
              </div>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                 <div style={{ fontSize: '80px', position: 'absolute', right: '-10px', top: '-10px' }}>🎁</div>
              </div>
            </div>

            {/* 3 Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '550px', marginBottom: '40px' }}>
              <div className="overview-card" style={{ borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px', color: '#10b981' }}>💎</div>
                <h5 className="card-info" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>{t("howToEarnPoints", "How to Earn Points")}</h5>
                <a href="#" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>{t("showMore", "Show more")}</a>
              </div>
              <div className="overview-card" style={{ borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px', color: '#f97316' }}>🛍️</div>
                <h5 className="card-info" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>{t("redeemPoints", "Redeem Points")}</h5>
                <a href="#" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>{t("exploreOffers", "Explore offers")}</a>
              </div>
              <div className="overview-card" style={{ borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px', color: '#3b82f6' }}>📋</div>
                <h5 className="card-info" style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>{t("rewardsHistory", "Rewards History")}</h5>
                <a href="#" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>{t("viewPastRewards", "View past rewards")}</a>
              </div>
            </div>

            <h5 className="fw-bold mb-3 order-num-id" style={{ fontSize: "16px" }}>{t("recentTransactions", "Recent Transactions")}</h5>
            
            {/* Transaction List */}
            <div style={{ maxWidth: '550px', marginBottom: '30px' }}>
              {loading ? (
                <div className="text-center py-4">{t("loadingTransactions", "Loading transactions...")}</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted">{t("noTransactionsFound", "No transactions found")}</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="sidebar-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid', borderBottomColor: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="sidebar-divider" style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid' }}></div>
                      <span className="card-info" style={{ fontSize: '14px', fontWeight: '500' }}>{tx.description || (tx.type === 'credit' ? t("addedToWallet", "Added to Wallet") : t("redeemed", "Redeemed"))}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <span style={{ color: tx.type === 'credit' ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                      </span>
                      <span className="email-text" style={{ fontSize: '13px' }}>{formatDate(tx.date || tx.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* View All Button */}
            {transactions.length > 0 && (
              <button className="overview-card text-primary" style={{ 
                width: '100%', 
                maxWidth: '550px',
                padding: '14px', 
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                border: '1px solid transparent'
              }}>
                {t("viewAllTransactions", "View All Transactions")}
              </button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardPage;
