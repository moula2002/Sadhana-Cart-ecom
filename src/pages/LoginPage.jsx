import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Form,
  Alert,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../Images/Sadhanacart1.png"

/* CSS */
import "./LoginPage.css";

/* Firebase */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged
} from "firebase/auth";

import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc 
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

export default function LoginPage({ onClose }) {
  const { t } = useTranslation(); 
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /* Generate unique referral code */
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'IN';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  /* Check auth state and redirect */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (onClose) {
          onClose();
        }
      }
    });

    return () => unsubscribe();
  }, [onClose]);

  /* Cleanup reCAPTCHA */
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  /* Process referral for email signup */
  const processReferral = async (userId, userReferralCode) => {
    let referredBy = null;
    let walletBalance = 0;
    let walletCoins = 0;
    let referralMessage = "";

    if (referralCode.trim()) {
      try {
        // Find user with the provided referral code
        const q = query(collection(db, "users"), where("referralCode", "==", referralCode.trim().toUpperCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          const referrerData = referrerDoc.data();
          referredBy = referrerDoc.id;
          
          // Credit ₹50 to new user
          walletBalance = 50;
          
          // Credit ₹50 to referrer
          const referrerNewBalance = (referrerData.walletBalance || 0) + 50;
          await updateDoc(doc(db, "users", referrerDoc.id), {
            walletBalance: referrerNewBalance,
            updatedAt: serverTimestamp()
          });

          referralMessage = `🎉 You received ₹50 for using referral code!`;
        } else {
          setError("Invalid referral code. Please check and try again.");
          return null;
        }
      } catch (err) {
        console.error("Error processing referral:", err);
        setError("Failed to process referral. Please try again.");
        return null;
      }
    }

    return { referredBy, walletBalance, walletCoins, referralMessage };
  };

  /* Process referral for Google signup */
  const processGoogleReferral = async (userId) => {
    if (referralCode.trim()) {
      try {
        const q = query(collection(db, "users"), where("referralCode", "==", referralCode.trim().toUpperCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          const referrerData = referrerDoc.data();
          
          // Credit ₹50 to new user
          await updateDoc(doc(db, "users", userId), {
            walletBalance: 50,
            referredBy: referrerDoc.id,
            updatedAt: serverTimestamp()
          });
          
          // Credit ₹50 to referrer
          const referrerNewBalance = (referrerData.walletBalance || 0) + 50;
          await updateDoc(doc(db, "users", referrerDoc.id), {
            walletBalance: referrerNewBalance,
            updatedAt: serverTimestamp()
          });

          return `🎉 You received ₹50 for using referral code!`;
        }
      } catch (err) {
        console.error("Error processing Google referral:", err);
      }
    }
    return null;
  };

  /* ================= EMAIL LOGIN / SIGNUP ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Login successful 🎉");
        if (onClose) {
          onClose();
        }
        navigate("/", { replace: true });
      } else {
        // Validate name
        if (!name.trim()) {
          setError("Full Name is required");
          setIsLoading(false);
          return;
        }

        // Create user
        const res = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Generate referral code for new user
        const userReferralCode = generateReferralCode();
        
        // Process referral if code provided
        const referralResult = await processReferral(res.user.uid, userReferralCode);
        if (referralResult === null) {
          setIsLoading(false);
          return;
        }

        // Create user document
        await setDoc(doc(db, "users", res.user.uid), {
          name: name.trim(),
          email,
          profileImage: "",
          referralCode: userReferralCode,
          referredBy: referralResult.referredBy,
          walletBalance: referralResult.walletBalance,
          walletCoins: referralResult.walletCoins,
          provider: "password",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        showToast(`Account created ✅ ${referralResult.referralMessage || ""}`);
        
        // Clear form after successful signup
        setName("");
        setEmail("");
        setPassword("");
        setReferralCode("");
        
        // Switch to login mode
        setIsLogin(true);
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const ref = doc(db, "users", res.user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // Generate referral code for new user
        const userReferralCode = generateReferralCode();
        
        // Process referral if code provided
        const referralMessage = await processGoogleReferral(res.user.uid);
        
        await setDoc(ref, {
          name: res.user.displayName,
          email: res.user.email,
          profileImage: res.user.photoURL || "",
          referralCode: userReferralCode,
          referredBy: referralMessage ? referralCode.trim().toUpperCase() : null,
          walletBalance: referralMessage ? 50 : 0,
          walletCoins: 0,
          provider: "google",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        if (referralMessage) {
          showToast(`Google Login Successful 🚀 ${referralMessage}`);
        } else {
          showToast("Google Login Successful 🚀");
        }
      } else {
        // Update last login time for existing user
        await setDoc(ref, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        showToast("Welcome back! 👋");
      }

      if (onClose) {
        onClose();
      }
      
      navigate("/", { replace: true });
      
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setGoogleLoading(false);
      setReferralCode(""); // Clear referral code after use
    }
  };

  /* ================= PHONE OTP ================= */
  const sendOtp = async () => {
    setError("");

    // Validate phone number
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(
          "recaptcha-container",
          { 
            size: "invisible",
            callback: () => {
              console.log("reCAPTCHA verified");
            }
          },
          auth
        );
      }

      const formattedPhone = phone.startsWith("+91")
        ? phone
        : `+91${phone}`;

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaRef.current
      );

      setConfirmation(result);
      showToast("OTP sent to your phone 📲");
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  const verifyOtp = async () => {
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const res = await confirmation.confirm(otp);
      const ref = doc(db, "users", res.user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // Generate referral code for new user
        const userReferralCode = generateReferralCode();
        
        // Process referral if code provided (for phone signup)
        let referredBy = null;
        let walletBalance = 0;
        
        if (referralCode.trim()) {
          const q = query(collection(db, "users"), where("referralCode", "==", referralCode.trim().toUpperCase()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            const referrerData = referrerDoc.data();
            referredBy = referrerDoc.id;
            walletBalance = 50;
            
            // Credit ₹50 to referrer
            const referrerNewBalance = (referrerData.walletBalance || 0) + 50;
            await updateDoc(doc(db, "users", referrerDoc.id), {
              walletBalance: referrerNewBalance,
              updatedAt: serverTimestamp()
            });
          }
        }

        await setDoc(ref, {
          name: "User", // Default name for phone signup
          phone: res.user.phoneNumber,
          profileImage: "",
          referralCode: userReferralCode,
          referredBy: referredBy,
          walletBalance: walletBalance,
          walletCoins: 0,
          provider: "phone",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        if (walletBalance > 0) {
          showToast("Login successful 🎉 + ₹50 referral bonus!");
        } else {
          showToast("Login successful 🎉");
        }
      } else {
        await setDoc(ref, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        showToast("Welcome back! 👋");
      }

      if (onClose) {
        onClose();
      }
      
      navigate("/", { replace: true });
      
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  /* Helper function to format error messages */
  const getFirebaseErrorMessage = (errorCode) => {
    const messages = {
      "auth/invalid-credential": "Invalid email or password",
      "auth/wrong-password": "Invalid email or password",
      "auth/user-not-found": "User not found. Please sign up first.",
      "auth/email-already-in-use": "Email already in use. Please login instead.",
      "auth/weak-password": "Password should be at least 6 characters",
      "auth/invalid-email": "Invalid email address",
      "auth/popup-closed-by-user": "Google sign-in was cancelled",
      "auth/cancelled-popup-request": "Google sign-in was cancelled",
      "auth/invalid-phone-number": "Invalid phone number",
      "auth/invalid-verification-code": "Invalid OTP",
      "auth/code-expired": "OTP has expired. Please request a new one.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
    };
    
    return messages[errorCode] || "An error occurred. Please try again.";
  };

  /* Reset form when switching between login/signup */
  const toggleLoginMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setOtp("");
    setReferralCode("");
    setConfirmation(null);
  };

  return (
    <div className="flipkart-auth-wrapper">
      <AnimatePresence>
        <motion.div
          className="auth-box"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
        >
          {/* LEFT PANEL */}
          <div className="auth-left">
            <div>
              <h2>{isLogin ? t("auth.login") : t("auth.joinUs")}</h2>
              <p>
                {isLogin
                 ? t("auth.accessText")
: t("auth.signupText")
}
              </p>
              {!isLogin && (
                <div className="referral-benefit">
                  <small>
                    <strong>🎁 {t("auth.referralBonus")}:</strong> {t("auth.referralText")}
                  </small>
                </div>
              )}
            </div>
            <img
              src={logo}
              alt="login"
              className="auth-image"
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="auth-right">
            <Button
              variant="link"
              className="close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </Button>

            {error && (
              <Alert variant="danger" className="py-2 small alert-custom" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Control
                      placeholder={t("auth.fullName")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="custom-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Control
                     placeholder={t("auth.referralCode")}
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="custom-input"
                    />
                    {referralCode && (
                      <small className="referral-success">
                        🎉 You'll get ₹50 bonus after signup!
                      </small>
                    )}
                  </Form.Group>
                </>
              )}

              <Form.Group className="mb-3">
                <Form.Control
                  type="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="custom-input"
                />
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="custom-input"
                />
                <span
                  className="pass-toggle cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </span>
              </Form.Group>

              <Button 
                type="submit" 
                className="w-100 mb-3 auth-btn"
                disabled={isLoading}
              >
                {isLoading
  ? t("auth.processing")
  : (isLogin ? t("auth.login") : t("auth.signup"))}

              </Button>
            </Form>

            <div className="text-center separator-or">{t("auth.or")}</div>

            {/* PHONE OTP */}
            <div className="mb-3">
              <Form.Control
                placeholder="Mobile Number"
                className="custom-input mb-2"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />

              {!isLogin && (
                <Form.Control
                  placeholder="Referral Code (Optional)"
                  className="custom-input mb-2"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                />
              )}

              {!confirmation ? (
                <Button 
                  className="w-100 otp-btn" 
                  onClick={sendOtp}
                  disabled={!phone || phone.length !== 10}
                >
                 {t("auth.requestOtp")}
                </Button>
              ) : (
                <>
                  <Form.Control
                    placeholder="Enter 6-digit OTP"
                    className="custom-input mb-2"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-secondary" 
                      className="flex-grow-1 change-number-btn"
                      onClick={() => {
                        setConfirmation(null);
                        setOtp("");
                      }}
                    >
                      {t("auth.changeNumber")}
                    </Button>
                    <Button 
                      className="flex-grow-1 auth-btn"
                      onClick={verifyOtp}
                      disabled={!otp || otp.length !== 6}
                    >
                      {t("auth.verifyOtp")}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* GOOGLE BUTTON */}
            <Button
              variant="outline-secondary"
              className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2 google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <FcGoogle size={20} /> 
              {googleLoading ? "Signing in..." : t("auth.continueGoogle")}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="toggle-mode-btn"
                onClick={toggleLoginMode}
              >
                {isLogin
                  ? t("auth.newUser")
: t("auth.alreadyUser")
}
              </Button>
            </div>

            <div className="mt-3 text-center">
              <small className="terms-text">
                {t("auth.termsText")}
              </small>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div id="recaptcha-container"></div>

      <ToastContainer position="bottom-center" className="p-3">
        <Toast show={!!toast} bg="dark" autohide>
          <Toast.Body className="text-white text-center">
            {toast}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}