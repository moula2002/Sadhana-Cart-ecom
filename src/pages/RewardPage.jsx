import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FiAward, FiHeadphones } from "react-icons/fi";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

const RewardPage = () => {
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
    <div className="profile-dashboard-wrapper" style={{ background: "#f8f9fa", padding: "20px" }}>
      <div className="profile-dashboard-container" style={{ maxWidth: "1200px", margin: "0 auto", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden", background: "white" }}>
        
        {/* Title */}
        <div className="profile-title-header d-flex align-items-center" style={{ gap: "12px", background: "#0a45bd", color: "white", padding: "16px 24px", margin: 0, borderRadius: '10px 10px 0 0' }}>
          <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "bold" }}>Sadhana Rewards</h2>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="dashboard-grid-layout" style={{ margin: 0, borderRadius: "0 0 10px 10px", background: "white", gap: 0, display: 'flex', flexDirection: 'row' }}>
          
          {/* Sidebar Menu */}
          <div className="dashboard-sidebar" style={{ borderRight: "1px solid #e0e0e0", padding: "24px 16px", minHeight: "600px", borderRadius: 0, marginTop: 0, minWidth: '250px', flexShrink: 0 }}>
            <h6 style={{ fontWeight: '700', color: '#1a202c', marginBottom: '20px', paddingLeft: '12px', fontSize: '15px' }}>My Account</h6>
            <ul className="sidebar-menu-list" style={{ marginTop: "0", listStyle: "none", padding: 0 }}>
              <li className="sidebar-menu-item" onClick={() => navigate("/orders")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: '#4a5568' }}>
                <FaUser className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>My Orders</span>
              </li>
              <li className="sidebar-menu-item active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', background: "#e8f0fe", color: "#0a45bd", borderRadius: "6px" }}>
                <FiAward className="menu-icon" style={{ color: "#0a45bd", fontSize: '16px' }} />
                <span style={{ fontWeight: "bold", fontSize: '14px' }}>Account Rewards</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/save-address")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: '#4a5568' }}>
                <FaMapMarkerAlt className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Saved Addresses</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/support")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: '#4a5568' }}>
                <FiHeadphones className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Help Center</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content" style={{ padding: "40px 60px", flexGrow: 1, display: "block" }}>
            
            <h4 className="fw-bold mb-4 text-dark" style={{ fontSize: "20px" }}>Sadhana Rewards</h4>
            
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
                <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Available Points</p>
                <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: 1 }}>{walletBalance}</h1>
                <div style={{ background: '#fbbf24', color: '#92400e', padding: '4px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', fontSize: '14px' }}>
                  1 Point = ₹ 1
                </div>
              </div>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                 <div style={{ fontSize: '80px', position: 'absolute', right: '-10px', top: '-10px' }}>🎁</div>
              </div>
            </div>

            {/* 3 Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '550px', marginBottom: '40px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px', color: '#10b981' }}>💎</div>
                <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>How to Earn Points</h5>
                <a href="#" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>Show more</a>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px', color: '#f97316' }}>🛍️</div>
                <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>Redeem Points</h5>
                <a href="#" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>Explore offers</a>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px', color: '#3b82f6' }}>📋</div>
                <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>Rewards History</h5>
                <a href="#" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>View past rewards</a>
              </div>
            </div>

            <h5 className="fw-bold mb-3 text-dark" style={{ fontSize: "16px" }}>Recent Transactions</h5>
            
            {/* Transaction List */}
            <div style={{ maxWidth: '550px', marginBottom: '30px' }}>
              {loading ? (
                <div className="text-center py-4">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted">No transactions found</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #e2e8f0' }}></div>
                      <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>{tx.description || (tx.type === 'credit' ? 'Added to Wallet' : 'Redeemed')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <span style={{ color: tx.type === 'credit' ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{formatDate(tx.date || tx.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* View All Button */}
            {transactions.length > 0 && (
              <button style={{ 
                width: '100%', 
                maxWidth: '550px',
                padding: '14px', 
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0a45bd',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                View All Transactions
              </button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardPage;
