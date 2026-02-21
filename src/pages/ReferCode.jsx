// 👉 SAME IMPORTS – NO CHANGE
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaCopy, FaWallet, FaRupeeSign, FaGift, FaShareAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom"; // ✅ ADD

function ReferCode() {
  const { t } = useTranslation();
  const auth = getAuth();
  const navigate = useNavigate(); // ✅ ADD

  const [user, setUser] = useState(null);
  const [referralCode, setReferCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);

  const [walletData, setWalletData] = useState({
    walletBalance: 0,
    walletCoins: 0,
  });

  const generateReferCode = (input = "US") => {
    const cleanText = input.replace(/[^a-zA-Z]/g, "");
    const firstTwo = cleanText.substring(0, 2).toUpperCase() || "US";
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${firstTwo}${randomDigits}`;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      // 🚨 NOT LOGGED IN → REDIRECT
      if (!currentUser) {
        setLoading(false);
        navigate("/login", { replace: true }); // ✅ REDIRECT
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
          const base =
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "US";

          const code = generateReferCode(base);
          await updateDoc(userRef, {
            referralCode: code,
            updatedAt: serverTimestamp(),
          });
          setReferCode(code);
        }
      } else {
        const base =
          currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "US";

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

  /* 🔥 CONVERT WALLET BALANCE → WALLET COINS */
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

      toast.success(t("refer.convertSuccess"));
    } catch (err) {
      toast.error(t("refer.convertError"));
    } finally {
      setConverting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success(t("refer.copySuccess")), { autoClose: 2000 };
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const text = `Join SadhanaCart using my referral code ${referralCode} and get ₹50 bonus! 🛍️`;
    navigator.share
      ? navigator.share({ title: "Refer & Earn", text })
      : navigator.clipboard.writeText(text);
  };

 if (loading) return <div className="text-center py-5">{t("refer.loading")}</div>;

  return (
    <div className="container py-5">
      <ToastContainer />

      {/* 🔝 REFERRAL CODE – TOP */}
      <div className="row justify-content-center mb-5">
        <div className="col-md-8">
          <div className="card border-0 shadow-lg rounded-4">
            <div className="card-header bg-gradient-danger text-white py-4">
              <div className="d-flex align-items-center">
                <FaGift size={30} className="me-3" />
                <div>
                  <h3 className="fw-bold mb-0">{t("refer.codeTitle")}</h3>
                 <small>{t("refer.earnPerReferral")}</small>
                </div>
              </div>
            </div>

            <div className="card-body text-center p-5">
              <h1 className="fw-bold display-4 text-gradient-danger">
                {referralCode}
              </h1>

              <div className="d-flex justify-content-center gap-3 mt-4">
                <button className="btn btn-primary px-4" onClick={copyToClipboard}>
                  <FaCopy className="me-2" />
                  {copied ? t("refer.copied") : t("refer.copy")}
                </button>
                <button className="btn btn-outline-primary px-4" onClick={shareReferral}>
                  <FaShareAlt className="me-2" />
                  {t("refer.share")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔽 REFERRAL & EARNINGS */}
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card border-0 shadow-lg rounded-4">
            <div className="card-header bg-gradient-primary text-white py-4">
              <div className="d-flex align-items-center">
                <FaWallet size={30} className="me-3" />
                <h3 className="fw-bold mb-0">{t("refer.earningsTitle")}</h3>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center">
                  <div className="bg-success text-white rounded-circle p-3 me-3">
                    <FaRupeeSign size={22} />
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">{t("refer.walletBalance")}</h6>
                    <h2 className="fw-bold text-success mb-0">
                      ₹{walletData.walletBalance}
                    </h2>
                  </div>
                </div>

                <button
                  className="btn btn-outline-success px-4 py-2"
                  disabled={walletData.walletBalance === 0 || converting}
                  onClick={convertToWalletCoins}
                >
                  {converting ? t("refer.converting") : t("refer.convert")}

                </button>
              </div>

              <hr />
              <div className="text-muted">
                <strong>{t("refer.walletCoins")}:</strong>{walletData.walletCoins}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .text-gradient-danger {
          background: linear-gradient(45deg, #dc3545, #fd7e14);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bg-gradient-danger {
          background: linear-gradient(135deg, #dc3545, #fd7e14);
        }
        .bg-gradient-primary {
          background: linear-gradient(135deg, #007bff, #6610f2);
        }
      `}</style>
    </div>
  );
}

export default ReferCode;
