import React from 'react';
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaUser, FaSearch, FaCreditCard } from "react-icons/fa";
import { FiTruck, FiRefreshCw, FiFileMinus, FiAward, FiHeadphones } from "react-icons/fi";
import { TbTicket } from "react-icons/tb";

const CustomerSupportCenter = () => {
  const navigate = useNavigate();

  const popularTopics = [
    { icon: <FiTruck style={{ color: "#0a45bd", fontSize: "22px" }} />, label: "Track My Order" },
    { icon: <FiRefreshCw style={{ color: "#0a45bd", fontSize: "22px" }} />, label: "Returns & Refunds" },
    { icon: <FiFileMinus style={{ color: "#0a45bd", fontSize: "22px" }} />, label: "Cancellation" },
    { icon: <FaCreditCard style={{ color: "#0a45bd", fontSize: "20px" }} />, label: "Payment Options" },
    { icon: <FaUser style={{ color: "#0a45bd", fontSize: "20px" }} />, label: "Account & Profile" },
    { icon: <TbTicket style={{ color: "#0a45bd", fontSize: "24px" }} />, label: "Offers & Coupons" }
  ];

  return (
    <div className="profile-dashboard-wrapper" style={{ background: "#f8f9fa", padding: "20px" }}>
      <div className="profile-dashboard-container" style={{ maxWidth: "1200px", margin: "0 auto", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden", background: "white" }}>
        
        {/* Title */}
        <div className="profile-title-header d-flex align-items-center" style={{ gap: "12px", background: "#0a45bd", color: "white", padding: "16px 24px", margin: 0, borderRadius: '10px 10px 0 0' }}>
          <h2 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: "bold" }}>Help & Support Page</h2>
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
              <li className="sidebar-menu-item" onClick={() => navigate("/rewards")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: '#4a5568' }}>
                <FiAward className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Account Rewards</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => navigate("/save-address")} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: '#4a5568' }}>
                <FaMapMarkerAlt className="menu-icon" style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Saved Addresses</span>
              </li>
              <li className="sidebar-menu-item active" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', background: "#e8f0fe", color: "#0a45bd", borderRadius: "6px" }}>
                <FiHeadphones className="menu-icon" style={{ color: "#0a45bd", fontSize: '16px' }} />
                <span style={{ fontWeight: "bold", fontSize: '14px' }}>Help Center</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content" style={{ padding: "40px 60px", flexGrow: 1, display: "block" }}>
            
            <h4 className="fw-bold mb-4 text-dark" style={{ fontSize: "20px" }}>How can we help you?</h4>
            
            {/* Search Input */}
            <div style={{ position: 'relative', maxWidth: '550px', marginBottom: '40px' }}>
              <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
              <input 
                type="text" 
                placeholder="Search for help topics..." 
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 48px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>

            <h5 className="fw-bold mb-3 text-dark" style={{ fontSize: "16px" }}>Popular Topics</h5>
            
            {/* Topics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '550px', marginBottom: '40px' }}>
              {popularTopics.map((topic, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '10px', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.05)' } }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: '#eef2ff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    {topic.icon}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d3748', textAlign: 'center' }}>
                    {topic.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Still Need Help Box */}
            <div style={{ 
              background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)', 
              borderRadius: '12px', 
              padding: '30px', 
              maxWidth: '550px' 
            }}>
              <h5 className="fw-bold mb-1" style={{ color: '#1e3a8a', fontSize: '16px' }}>Still need help?</h5>
              <p style={{ color: '#475569', fontSize: '13px', marginBottom: '20px' }}>Our support team is here for you</p>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <button style={{ 
                  background: '#0a45bd', 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 24px', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  Chat with Us
                </button>
                <button style={{ 
                  background: 'white', 
                  color: '#0a45bd', 
                  border: 'none', 
                  padding: '10px 24px', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}>
                  Contact Us
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportCenter;