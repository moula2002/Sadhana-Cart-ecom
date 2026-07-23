import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  FaCopy, FaWallet, FaGift, FaShareAlt, FaCheck, FaInfoCircle, FaUserPlus, 
  FaShoppingBag, FaCoins, FaLink, FaWhatsapp, FaFacebookF, FaFacebookMessenger, 
  FaEnvelope, FaCommentAlt, FaLinkedinIn, FaGoogle, FaEllipsisH 
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../pages/Loading";
import { useNavigate } from "react-router-dom";
import { Modal } from "react-bootstrap";

function ReferCode() {
  const { t } = useTranslation();
  const auth = getAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [referralCode, setReferCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [walletData, setWalletData] = useState({
    walletBalance: 0,
    walletCoins: 0,
  });

  const generateReferCode = (input = "US") => {
    const cleanText = input.replace(/[^a-zA-Z]/g, "");
    const firstTwo = cleanText.substring(0, 2).toUpperCase() || "US";
    const randomDigits = Math.random().toString().slice(2, 7);
    return `${firstTwo}${randomDigits}`;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      setUser(currentUser);
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setReferCode(data.referralCode || "");
        setWalletData({
          walletBalance: data.walletBalance || 0,
          walletCoins: data.walletCoins || 0,
        });

        if (!data.referralCode) {
          const base = currentUser.displayName || currentUser.email?.split("@")[0] || "US";
          const code = generateReferCode(base);
          await updateDoc(userRef, {
            referralCode: code,
            updatedAt: serverTimestamp(),
          });
          setReferCode(code);
        }
      } else {
        const base = currentUser.displayName || currentUser.email?.split("@")[0] || "US";
        const code = generateReferCode(base);

        await setDoc(userRef, {
          email: currentUser.email,
          name: currentUser.displayName || "",
          referralCode: code,
          walletBalance: 0,
          walletCoins: 0,
          createdAt: serverTimestamp(),
        });

        setReferCode(code);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const convertToWalletCoins = async () => {
    if (!user || walletData.walletBalance <= 0) return;

    try {
      setConverting(true);
      const userRef = doc(db, "users", user.uid);
      const newCoins = walletData.walletCoins + walletData.walletBalance;

      await updateDoc(userRef, {
        walletCoins: newCoins,
        walletBalance: 0,
        updatedAt: serverTimestamp(),
      });

      setWalletData({
        walletBalance: 0,
        walletCoins: newCoins,
      });

      toast.success(t("refer.convertSuccess", "Successfully converted balance to reward coins!"));
    } catch (err) {
      toast.error(t("refer.convertError", "Failed to convert balance. Please try again."));
    } finally {
      setConverting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success(t("refer.copySuccess", "Referral code copied!"), { autoClose: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    setShowShareModal(true);
  };

  if (loading) return <Loading />;

  return (
    <div className="referral-page-wrapper py-5">
      
      <div className="container" style={{ maxWidth: '950px' }}>
        
        {/* Header Header */}
        <div className="text-center mb-5 header-text-section">
          <h1 className="fw-extrabold main-title mb-2">{t("referAndEarn", "Refer & Earn")}</h1>
          <p className="text-muted subtitle">{t("referSubtitle", "Invite your friends and earn premium reward coins together!")}</p>
        </div>

        <div className="row g-4">
          
          {/* Left Column: Code and Share */}
          <div className="col-lg-6">
            <div className="referral-card card border-0 shadow-lg h-100 overflow-hidden">
              <div className="gradient-header-blue p-4 text-white d-flex align-items-center">
                <div className="icon-badge-round bg-white text-primary me-3">
                  <FaGift size={22} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{t("refer.codeTitle", "Your Referral Code")}</h5>
                  <small className="opacity-90">{t("refer.earnPerReferral", "Earn ₹50 per successful referral")}</small>
                </div>
              </div>

              <div className="card-body p-4 d-flex flex-column justify-content-between">
                <div className="code-display-box my-4 p-4 text-center" onClick={copyToClipboard} style={{ cursor: 'pointer' }}>
                  <span className="code-text font-monospace d-block mb-1">{referralCode}</span>
                  <span className="click-to-copy-text text-primary small d-inline-flex align-items-center gap-1">
                    {copied ? <FaCheck className="text-success" /> : <FaCopy />}
                    {copied ? t("refer.copied", "Copied!") : t("refer.clickToCopy", "Click to copy code")}
                  </span>
                </div>

                <div className="d-grid gap-3">
                  <button className="btn btn-primary-gradient btn-lg fw-bold d-flex align-items-center justify-content-center gap-2" onClick={copyToClipboard}>
                    <FaCopy size={16} />
                    {copied ? t("refer.copied", "Copied!") : t("refer.copy", "Copy Code")}
                  </button>
                  <button className="btn btn-share-outline btn-lg fw-bold d-flex align-items-center justify-content-center gap-2" onClick={shareReferral}>
                    <FaShareAlt size={16} />
                    {t("refer.share", "Share Invite Link")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Earnings Panel */}
          <div className="col-lg-6">
            <div className="referral-card card border-0 shadow-lg h-100 overflow-hidden">
              <div className="gradient-header-green p-4 text-white d-flex align-items-center">
                <div className="icon-badge-round bg-white text-success me-3">
                  <FaWallet size={22} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{t("refer.earningsTitle", "Referral Earnings")}</h5>
                  <small className="opacity-90">{t("refer.manageFunds", "Convert your balance to coins")}</small>
                </div>
              </div>

              <div className="card-body p-4 d-flex flex-column justify-content-between">
                {/* Wallet Widgets */}
                <div className="row g-3 my-2">
                  <div className="col-12 col-sm-6">
                    <div className="wallet-widget-card p-3 border-0 rounded-4 balance-green-bg text-center">
                      <span className="text-white small opacity-90 d-block mb-1">{t("refer.walletBalance", "Wallet Balance")}</span>
                      <h2 className="fw-bold text-white mb-0">₹{walletData.walletBalance}</h2>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="wallet-widget-card p-3 border-0 rounded-4 coins-orange-bg text-center">
                      <span className="text-white small opacity-90 d-block mb-1">{t("refer.walletCoins", "Reward Coins")}</span>
                      <h2 className="fw-bold text-white mb-0">
                        <FaCoins className="me-2 text-warning animate-bounce" size={20} />
                        {walletData.walletCoins}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Info alert / conversion helper */}
                <div className="info-badge-premium p-3 rounded-4 d-flex align-items-start gap-2 my-3">
                  <FaInfoCircle size={18} className="text-primary mt-1 flex-shrink-0" />
                  <span className="small text-dark font-medium">
                    {t("conversionNote", "Convert your referral balance to Reward Coins to apply them for instant discounts at checkout (1 Coin = ₹1).")}
                  </span>
                </div>

                <div className="d-grid mt-auto">
                  <button
                    className="btn btn-success-gradient btn-lg fw-bold"
                    disabled={walletData.walletBalance === 0 || converting}
                    onClick={convertToWalletCoins}
                    style={{ minHeight: '52px' }}
                  >
                    {converting ? t("refer.converting", "Converting...") : t("refer.convert", "Convert to Reward Coins")}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* How It Works Section */}
        <div className="how-it-works-section card border-0 shadow-lg p-4 mt-5">
          <h5 className="fw-bold text-dark mb-4 text-center" style={{ fontSize: '1.25rem', letterSpacing: '0.5px' }}>{t("howItWorks", "How it Works")}</h5>
          
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="step-icon-bg mx-auto mb-3 bg-blue-soft text-primary-gradient-icon">
                <FaShareAlt size={22} />
              </div>
              <h6 className="fw-bold text-dark">{t("step1", "1. Share Code")}</h6>
              <p className="text-muted small mb-0">{t("step1Desc", "Invite your friends using your unique referral code.")}</p>
            </div>
            <div className="col-md-4">
              <div className="step-icon-bg mx-auto mb-3 bg-green-soft text-success-gradient-icon">
                <FaUserPlus size={22} />
              </div>
              <h6 className="fw-bold text-dark">{t("step2", "2. Friend Joins")}</h6>
              <p className="text-muted small mb-0">{t("step2Desc", "Your friend signs up using your code and makes a purchase.")}</p>
            </div>
            <div className="col-md-4">
              <div className="step-icon-bg mx-auto mb-3 bg-orange-soft text-warning-gradient-icon">
                <FaShoppingBag size={22} />
              </div>
              <h6 className="fw-bold text-dark">{t("step3", "3. Earn Coins")}</h6>
              <p className="text-muted small mb-0">{t("step3Desc", "Once the order delivers successfully, both of you get cashback coins!")}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Share Via Dialog */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered className="share-popup-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold fs-5 text-dark w-100 text-center">{t("share.title", "Share Via")}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <div className="share-grid">
            
            {/* Copy Link */}
            <div className="share-item" onClick={() => { copyToClipboard(); setShowShareModal(false); }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#2563eb' }}>
                <FaLink size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.copyLink", "Copy Link")}</span>
            </div>

            {/* Whatsapp */}
            <div className="share-item" onClick={() => {
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join SadhanaCart using my referral code ${referralCode} and get ₹50 bonus! 🛍️`)}`, '_blank');
              setShowShareModal(false);
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#22c55e' }}>
                <FaWhatsapp size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.whatsapp", "Whatsapp")}</span>
            </div>

            {/* Facebook */}
            <div className="share-item" onClick={() => {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(`Join SadhanaCart using my referral code ${referralCode} and get ₹50 bonus! 🛍️`)}`, '_blank');
              setShowShareModal(false);
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#1877f2' }}>
                <FaFacebookF size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.facebook", "Facebook")}</span>
            </div>

            {/* Facebook Messenger */}
            <div className="share-item" onClick={() => {
              window.open(`https://www.facebook.com/dialog/send?app_id=123456789&link=${encodeURIComponent(window.location.origin)}&redirect_uri=${encodeURIComponent(window.location.origin)}`, '_blank');
              setShowShareModal(false);
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#00b2ff' }}>
                <FaFacebookMessenger size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.messenger", "Facebook messenger")}</span>
            </div>

            {/* Gmail */}
            <div className="share-item" onClick={() => {
              window.location.href = `mailto:?subject=${encodeURIComponent("Join SadhanaCart")}&body=${encodeURIComponent(`Join SadhanaCart using my referral code ${referralCode} and get ₹50 bonus! 🛍️`)}`;
              setShowShareModal(false);
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#ea4335' }}>
                <FaEnvelope size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.gmail", "Gmail")}</span>
            </div>

            {/* SMS */}
            <div className="share-item" onClick={() => {
              window.location.href = `sms:?&body=${encodeURIComponent(`Join SadhanaCart using my referral code ${referralCode} and get ₹50 bonus! 🛍️`)}`;
              setShowShareModal(false);
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#4f46e5' }}>
                <FaCommentAlt size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.sms", "SMS")}</span>
            </div>

            {/* LinkedIn */}
            <div className="share-item" onClick={() => {
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`, '_blank');
              setShowShareModal(false);
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#0077b5' }}>
                <FaLinkedinIn size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.linkedin", "LinkedIn")}</span>
            </div>

            {/* Hangouts */}
            <div className="share-item" onClick={() => {
              window.open(`https://hangouts.google.com/chat`, '_blank');
              setShowShareModal(false);
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#0f9d58' }}>
                <FaGoogle size={20} className="text-white" />
              </div>
              <span className="share-label">{t("share.hangouts", "Hangouts")}</span>
            </div>

            {/* More Apps */}
            <div className="share-item" onClick={() => {
              setShowShareModal(false);
              const text = `Join SadhanaCart using my referral code ${referralCode} and get ₹50 bonus! 🛍️`;
              if (navigator.share) {
                navigator.share({ title: "Refer & Earn", text });
              } else {
                navigator.clipboard.writeText(text);
                toast.success(t("refer.copySuccess", "Copied to clipboard!"));
              }
            }}>
              <div className="share-icon-circle" style={{ backgroundColor: '#cbd5e1' }}>
                <FaEllipsisH size={20} className="text-dark" />
              </div>
              <span className="share-label">{t("share.moreApps", "More Apps")}</span>
            </div>

          </div>
        </Modal.Body>
      </Modal>

      <style>{`
        .referral-page-wrapper {
          background-color: #f6f8fb;
          min-height: 100vh;
        }

        .main-title {
          color: #0a45bd;
          font-weight: 800;
          font-size: 2.5rem;
        }

        .subtitle {
          font-size: 1.05rem;
        }

        .referral-card {
          border-radius: 20px;
          background: #ffffff;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .referral-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
        }

        .gradient-header-blue {
          background: linear-gradient(135deg, #0a45bd 0%, #1e3a8a 100%);
        }

        .gradient-header-green {
          background: linear-gradient(135deg, #10b981 0%, #064e3b 100%);
        }

        .icon-badge-round {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .code-display-box {
          border: 2px dashed #0a45bd;
          border-radius: 16px;
          background-color: #f0f4ff;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .code-display-box:hover {
          border-color: #1e3a8a;
          background-color: #e0e7ff;
        }

        .code-text {
          font-size: 2.4rem;
          font-weight: 900;
          color: #0a45bd;
          letter-spacing: 3px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .click-to-copy-text {
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .wallet-widget-card {
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          transition: transform 0.2s;
        }

        .wallet-widget-card:hover {
          transform: scale(1.03);
        }

        .balance-green-bg {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .coins-orange-bg {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .info-badge-premium {
          background-color: #eff6ff;
          border-left: 5px solid #0a45bd;
          color: #1e3a8a;
        }

        .btn-primary-gradient {
          background: linear-gradient(135deg, #0a45bd 0%, #1e3a8a 100%);
          border: none;
          color: white;
          padding: 14px 20px;
          border-radius: 12px;
          transition: opacity 0.2s;
        }

        .btn-primary-gradient:hover {
          opacity: 0.9;
          color: white;
        }

        .btn-share-outline {
          background: transparent;
          border: 2px solid #0a45bd;
          color: #0a45bd;
          padding: 14px 20px;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .btn-share-outline:hover {
          background: #f0f4ff;
          color: #1e3a8a;
          border-color: #1e3a8a;
        }

        .btn-success-gradient {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: white;
          border-radius: 12px;
          transition: opacity 0.2s;
        }

        .btn-success-gradient:hover:not(:disabled) {
          opacity: 0.9;
          color: white;
        }

        .how-it-works-section {
          border-radius: 20px;
          background: #ffffff;
        }

        .step-icon-bg {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .bg-blue-soft {
          background-color: #eff6ff;
          color: #0a45bd;
        }

        .bg-green-soft {
          background-color: #ecfdf5;
          color: #10b981;
        }

        .bg-orange-soft {
          background-color: #fff7ed;
          color: #f59e0b;
        }

        .share-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px 10px;
          text-align: center;
        }

        .share-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .share-item:hover {
          transform: scale(1.08);
        }

        .share-icon-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .share-label {
          font-size: 0.75rem;
          color: #4b5563;
          font-weight: 500;
          line-height: 1.2;
        }

        /* ── Dark Theme Overrides ── */
        .dark-theme .referral-page-wrapper,
        [data-theme="dark"] .referral-page-wrapper {
          background-color: #0f172a;
        }

        .dark-theme .main-title,
        [data-theme="dark"] .main-title {
          color: #60a5fa;
        }

        .dark-theme .referral-card,
        .dark-theme .how-it-works-section,
        [data-theme="dark"] .referral-card,
        [data-theme="dark"] .how-it-works-section {
          background-color: #1e293b;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
        }

        .dark-theme .referral-card h5,
        .dark-theme .how-it-works-section h5,
        .dark-theme .how-it-works-section h6,
        [data-theme="dark"] .referral-card h5,
        [data-theme="dark"] .how-it-works-section h5,
        [data-theme="dark"] .how-it-works-section h6 {
          color: #f8fafc !important;
        }

        .dark-theme .code-display-box,
        [data-theme="dark"] .code-display-box {
          background-color: #0f172a;
          border-color: #3b82f6;
        }

        .dark-theme .code-text,
        [data-theme="dark"] .code-text {
          color: #60a5fa;
        }

        .dark-theme .info-badge-premium,
        [data-theme="dark"] .info-badge-premium {
          background-color: #1e3a8a;
          border-left-color: #60a5fa;
          color: #cbd5e1;
        }
        
        .dark-theme .info-badge-premium span,
        [data-theme="dark"] .info-badge-premium span {
          color: #cbd5e1 !important;
        }

        .dark-theme .btn-share-outline,
        [data-theme="dark"] .btn-share-outline {
          border-color: #60a5fa;
          color: #60a5fa;
        }

        .dark-theme .btn-share-outline:hover,
        [data-theme="dark"] .btn-share-outline:hover {
          background: #1e3a8a;
          color: #f8fafc;
        }

        .dark-theme .step-icon-bg,
        [data-theme="dark"] .step-icon-bg {
          background-color: #0f172a;
          box-shadow: none;
        }

        .dark-theme .share-label,
        [data-theme="dark"] .share-label {
          color: #cbd5e1;
        }

        .dark-theme .share-popup-modal .modal-content,
        [data-theme="dark"] .share-popup-modal .modal-content {
          background-color: #1e293b;
          color: #f8fafc;
        }

        .dark-theme .share-popup-modal .modal-header .btn-close,
        [data-theme="dark"] .share-popup-modal .modal-header .btn-close {
          filter: invert(1) grayscale(1) brightness(2);
        }
      `}</style>
    </div>
  );
}

export default ReferCode;
