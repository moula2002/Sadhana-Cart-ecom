import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FiAward, FiHeadphones } from "react-icons/fi";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import rewardsGiftBox from "../Images/rewards_gift_box.png";
import { Modal } from "react-bootstrap";
import "./Profile.css";

const RewardPage = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [walletCoins, setWalletCoins] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEarnModal, setShowEarnModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch wallet coins
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setWalletCoins(userData.walletCoins !== undefined ? userData.walletCoins : (userData.rewardsPoints || 0));
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

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    let date;
    if (typeof dateVal.toDate === 'function') {
      date = dateVal.toDate();
    } else {
      date = new Date(dateVal);
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getLocalizedReason = (reason) => {
    if (!reason) return "";
    if (reason === "Order Cashback") return t("orderCashback", "Order Cashback");
    if (reason === "Referral Reward") return t("referralReward", "Referral Reward");
    if (reason === "Signup Bonus") return t("signupBonus", "Signup Bonus");
    if (reason === "Coin Deduction") return t("coinDeduction", "Coin Deduction");
    return t(reason, reason);
  };

  return (
    <div className="profile-dashboard-wrapper">
      <div className="profile-dashboard-container address-container" style={{ maxWidth: "1200px", margin: "0 auto", borderRadius: "10px", overflow: "hidden" }}>
        
        {/* Title */}
        <div className="profile-title-header d-flex align-items-center" style={{ gap: "12px", padding: "16px 24px", margin: 0, borderRadius: '10px 10px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{t("sadhanaRewards", "Sadhana Rewards")}</h2>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="dashboard-grid-layout" style={{ margin: 0, borderRadius: "0 0 10px 10px", gap: '30px' }}>
          
          {/* Sidebar Menu */}
          <div className="dashboard-sidebar" style={{ padding: "24px 16px", minHeight: "600px", borderRadius: 0, marginTop: 0 }}>
            <h6 className="sidebar-title" style={{ fontWeight: '700', marginBottom: '20px', paddingLeft: '12px', fontSize: '15px' }}>{t("myAccount", "My Account")}</h6>
            <ul className="sidebar-menu-list">
              <li className="sidebar-menu-item" onClick={() => navigate("/orders")}>
                <FaUser className="menu-icon" />
                <span>{t("myOrders", "My Orders")}</span>
              </li>
              <li className="sidebar-menu-item active">
                <FiAward className="menu-icon" />
                <span>{t("accountRewards", "Account Rewards")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/save-address")}>
                <FaMapMarkerAlt className="menu-icon" />
                <span>{t("savedAddresses", "Saved Addresses")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/support")}>
                <FiHeadphones className="menu-icon" />
                <span>{t("helpCenter", "Help Center")}</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content" style={{ flexGrow: 1, display: "block" }}>
            
            <h4 className="fw-bold mb-4 order-num-id" style={{ fontSize: "20px" }}>{t("sadhanaRewards", "Sadhana Rewards")}</h4>
            
            {/* Top Blue Card */}
            <div className="rewards-blue-card" style={{ 
              background: 'linear-gradient(135deg, #0a45bd 0%, #1e3a8a 100%)', 
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '30px'
            }}>
              <div>
                <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>{t("availablePoints", "Available Points")}</p>
                <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: 1 }}>{walletCoins}</h1>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '4px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '12px' }}>
                    {t("pointValue", "1 Point = ₹ 1")}
                  </div>
                  <div style={{ background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#a7f3d0' : '#065f46', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{t("cashback10Enabled", "Cashback: 10% Enabled")}</span>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                  </div>
                </div>
              </div>
              <div>
                <img src={rewardsGiftBox} alt="rewards box" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              </div>
            </div>            {/* 3 Action Cards */}
            <div className="rewards-action-grid" style={{ gap: '20px', width: '100%', marginBottom: '40px' }}>
              <div className="overview-card" style={{ borderRadius: '12px', padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#10b981' }}>💎</div>
                <h5 className="card-info" style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>{t("howToEarnPoints", "How to Earn Points")}</h5>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowEarnModal(true); }} style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>{t("showMore", "Show more")}</a>
              </div>
              <div className="overview-card" style={{ borderRadius: '12px', padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#f97316' }}>🛍️</div>
                <h5 className="card-info" style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>{t("redeemPoints", "Redeem Points")}</h5>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowRedeemModal(true); }} style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>{t("exploreOffers", "Redeem Now")}</a>
              </div>
              <div className="overview-card" style={{ borderRadius: '12px', padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#3b82f6' }}>📋</div>
                <h5 className="card-info" style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>{t("rewardsHistory", "Rewards History")}</h5>
                <a href="#" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>{t("viewPastRewards", "View past rewards")}</a>
              </div>
            </div>

            <h5 className="fw-bold mb-3 order-num-id" style={{ fontSize: "16px" }}>{t("recentTransactions", "Recent Transactions")}</h5>
            
            {/* Transaction List */}
            <div style={{ width: '100%', marginBottom: '30px' }}>
              {loading ? (
                <div className="text-center py-4">{t("loadingTransactions", "Loading transactions...")}</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted">{t("noTransactionsFound", "No transactions found")}</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="transaction-row" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: isDark ? '16px 12px' : '16px 0', 
                    borderBottom: isDark ? '1px solid #334155' : '1px solid #eaeaea',
                    backgroundColor: isDark ? '#1e293b' : 'transparent',
                    borderRadius: isDark ? '8px' : '0',
                    marginBottom: isDark ? '8px' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: tx.type === 'credit' ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#7f1d1d' : '#fef2f2'), 
                        color: tx.type === 'credit' ? (isDark ? '#34d399' : '#10b981') : (isDark ? '#fca5a5' : '#ef4444'),
                        fontSize: '16px'
                      }}>
                        {tx.type === 'credit' ? '↑' : '↓'}
                      </div>
                      <div>
                        <span className="card-info d-block fw-bold" style={{ fontSize: '14px', color: isDark ? '#f8fafc' : '#1f2937' }}>
                          {getLocalizedReason(tx.reason || tx.description) || (tx.type === 'credit' ? t("addedToWallet", "Added to Wallet") : t("redeemed", "Redeemed"))}
                        </span>
                        {tx.orderId && (
                          <span className="text-muted small d-block" style={{ fontSize: '11px', marginTop: '2px', color: isDark ? '#94a3b8' : '#6b7280' }}>
                            Order #{tx.orderId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <span style={{ color: tx.type === 'credit' ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.coins !== undefined ? tx.coins : (tx.amount || 0)} Coins
                      </span>
                      <span className="email-text" style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#6b7280' }}>{formatDate(tx.createdAt || tx.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* View All Button */}
            {transactions.length > 0 && (
              <button 
                className="overview-card" 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  color: isDark ? '#60a5fa' : '#0a45bd',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f8fafc';
                  e.currentTarget.style.color = isDark ? '#93c5fd' : '#002d9c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#ffffff';
                  e.currentTarget.style.color = isDark ? '#60a5fa' : '#0a45bd';
                }}
              >
                {t("viewAllTransactions", "View All Transactions")}
              </button>
            )}
            
          </div>
        </div>
      <Modal show={showEarnModal} onHide={() => setShowEarnModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: 'bold', color: '#0a45bd' }}>
            {t("howToEarnPoints", "How to Earn Points")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
          <p style={{ fontWeight: '600', marginBottom: '12px' }}>
            {t("referAndEarnIntro", "Earn rewards easily by referring your friends to Sadhana Cart!")}
          </p>
          <ol style={{ paddingLeft: '20px', marginBottom: '15px' }}>
            <li>
              <strong>{t("shareCode", "Share Your Code")}:</strong> {t("shareCodeDesc", "Find your unique referral code in the 'Refer & Earn' section and share it with your friends.")}
            </li>
            <li style={{ marginTop: '8px' }}>
              <strong>{t("friendSignsUp", "Friend Signs Up")}:</strong> {t("friendSignsUpDesc", "Your friend signs up using your referral code.")}
            </li>
            <li style={{ marginTop: '8px' }}>
              <strong>{t("getRewarded", "Get Rewarded")}:</strong> {t("getRewardedDesc", "Once your friend places their first successful order, both you and your friend will receive rewards points automatically in your wallets!")}
            </li>
          </ol>
          <div style={{ background: isDark ? '#1e3a8a' : '#e0e7ff', padding: '12px', borderRadius: '8px', color: isDark ? '#93c5fd' : '#0369a1', fontWeight: '500', fontSize: '13px' }}>
            ℹ️ {t("coinsValueNote", "Each reward coin is equivalent to ₹1 and can be applied during checkout for discounts.")}
          </div>
          <button 
            className="btn btn-primary w-100 mt-3 fw-bold"
            onClick={() => {
              setShowEarnModal(false);
              navigate("/refercode");
            }}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0a45bd', borderColor: '#0a45bd' }}
          >
            {t("goToReferAndEarn", "Go to Refer & Earn")}
          </button>
        </Modal.Body>
      </Modal>

      <Modal show={showRedeemModal} onHide={() => { setShowRedeemModal(false); setRedeemInput(""); }} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: 'bold', color: '#f97316' }}>
            {t("redeemPoints", "Redeem Points")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <span className="text-muted fw-bold">{t("availablePoints", "Available Points")}:</span>
            <span className="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill" style={{ fontSize: '13px' }}>
              {walletCoins} Points
            </span>
          </div>

          <div className="mb-4">
            <label className="fw-bold text-dark small mb-2">{t("enterPointsToRedeem", "Enter Points to Redeem")}:</label>
            <input
              type="number"
              className="form-control fw-bold"
              placeholder={t("enterPointsPlaceholder", "e.g. 20")}
              value={redeemInput}
              onChange={(e) => {
                const val = e.target.value;
                if (Number(val) > walletCoins) {
                  setRedeemInput(walletCoins.toString());
                } else if (Number(val) < 0) {
                  setRedeemInput("0");
                } else {
                  setRedeemInput(val);
                }
              }}
              style={{ padding: '12px', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          {Number(redeemInput) > 0 && (
            <div className="mt-3 p-3 rounded-4 mb-3" style={{ backgroundColor: isDark ? '#064e3b' : '#f0fdf4', border: isDark ? '1px solid #047857' : '1px solid #bbf7d0', color: isDark ? '#a7f3d0' : '#15803d' }}>
              <div className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: '14.5px' }}>
                <span className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '18px', height: '18px', fontSize: '10px' }}>✓</span>
                {t("redeem.saveMessage", "You will save ₹{{amount}}", { amount: redeemInput })}
              </div>
              <div className="d-flex align-items-center gap-2 fw-semibold" style={{ fontSize: '13px', color: isDark ? '#34d399' : '#16a34a' }}>
                <span>🪙</span>
                {t("redeem.receiveMessage", "You will receive {{cashback}} coins cashback after delivery", { cashback: Math.floor(Number(redeemInput) * 0.1) })}
              </div>
            </div>
          )}

          <button 
            className="btn btn-warning text-dark w-100 mt-3 fw-bold"
            onClick={() => {
              setShowRedeemModal(false);
              navigate("/checkout");
            }}
            style={{ padding: '12px', borderRadius: '8px' }}
          >
            {t("applyPoints", "Apply Points")}
          </button>
          
          <div className="mt-3 text-muted small" style={{ fontSize: '11px', display: 'flex', alignItems: 'start', gap: '6px' }}>
            <span>ℹ️</span>
            <span>{t("redeemNote", "Note: Applied points will be auto-calculated and deducted from your cart total on the Checkout Page. Check 'Use Wallet Points' switch during payment.")}</span>
          </div>
        </Modal.Body>
      </Modal>
      </div>
    </div>
  );
};

export default RewardPage;
