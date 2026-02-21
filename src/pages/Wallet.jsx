import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaCoins, FaWallet } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom"; // ✅ ADD

function Wallet() {
  const { t } = useTranslation();

  const auth = getAuth();
  const navigate = useNavigate(); // ✅ ADD

  const [user, setUser] = useState(null);
  const [walletCoins, setWalletCoins] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      // 🚨 NOT LOGGED IN → REDIRECT TO LOGIN
      if (!currentUser) {
        setLoading(false);
        navigate("/login", { replace: true }); // ✅ REDIRECT
        return;
      }

      setUser(currentUser);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setWalletCoins(data.walletCoins || 0);
          setWalletBalance(data.walletBalance || 0);
        }
      } catch (err) {
        console.error("Wallet fetch error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [navigate]);

  if (loading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner-border text-primary"></div>
        <p className="mt-3 text-muted">{t("wallet.loading")}</p>
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "30px",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderRadius: "14px",
          padding: "30px",
          background: "linear-gradient(135deg, #007bff, #6610f2)",
          color: "#fff",
          marginBottom: "30px",
        }}
      >
        <div className="d-flex align-items-center">
          <FaWallet size={32} className="me-3" />
          <div>
            <h3 className="fw-bold mb-0">{t("wallet.title")}</h3>
            <small>{t("wallet.subtitle")}</small> 
          </div>
        </div>
      </div>

      {/* Wallet Coins */}
      <div
        style={{
          borderRadius: "14px",
          padding: "25px",
          background: "#fff",
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <div className="d-flex align-items-center">
          <div
            style={{
              background: "linear-gradient(135deg, #ffc107, #fd7e14)",
              color: "#fff",
              borderRadius: "50%",
              padding: "15px",
              marginRight: "15px",
            }}
          >
            <FaCoins size={26} />
          </div>

          <div>
            <h6 className="text-muted mb-1">{t("wallet.coins")}</h6>
            <h2 className="fw-bold mb-0">{walletCoins}</h2>
           <small className="text-muted">
  {t("wallet.earnInfo")}
</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
