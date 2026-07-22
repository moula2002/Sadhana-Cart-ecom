import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { auth, storage, db } from "../firebase";
import { updateProfile, onAuthStateChanged, signOut, deleteUser, updatePassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  deleteDoc
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../pages/Loading";
import {
  FaUser,
  FaEnvelope,
  FaCamera,
  FaSave,
  FaEdit,
  FaTimesCircle,
  FaLock,
  FaArrowRight,
  FaVenusMars,
  FaCheckCircle,
  FaArrowLeft,
  FaShoppingBag,
  FaGift,
  FaHeart,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCog,
  FaBell,
  FaQuestionCircle,
  FaSignOutAlt,
  FaChevronRight,
  FaCalendarAlt,
  FaPhoneAlt,
  FaTrash
} from "react-icons/fa";
import "./Profile.css";
import rewardsGiftBox from "../Images/rewards_gift_box.png";

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Profile data state
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [joinedOn, setJoinedOn] = useState("");

  // Counts
  const [ordersCount, setOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);
  const [rewardsPoints, setRewardsPoints] = useState(250); // Mock default or load from db

  // Recent Orders
  const [recentOrders, setRecentOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [docId, setDocId] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isEditing]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  
  // Cropper State
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStartCrop, setDragStartCrop] = useState({ x: 0, y: 0 });
  const [cropBoxSize, setCropBoxSize] = useState(200);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setName(user.displayName || "");
        setPhoto(user.photoURL || "");
        setPreviewPhoto(user.photoURL || "");
        setEmail(user.email || "");

        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        let data = null;
        let actualDocId = user.uid;

        if (docSnap.exists()) {
          data = docSnap.data();
        } else {
          // Fallback: Check local storage for phone to see if a record exists
          const storedPhone = localStorage.getItem("userPhone");
          if (storedPhone) {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("contactNo", "==", String(storedPhone)));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const foundDoc = querySnapshot.docs[0];
              data = foundDoc.data();
              actualDocId = foundDoc.id;
            }
          }
        }

        if (data) {
          setDocId(actualDocId);
          setName(data.name || user.displayName || "");
          setEmail(data.email || user.email || "");
          setGender(data.gender || "");
          setPhone(data.contactNo || data.phone || "");
          setDob(data.dob || "");
          
          // Format Joined Date
          if (data.createdAt) {
            const dateVal = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            setJoinedOn(dateVal.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            }));
          } else {
            setJoinedOn("Joined recently");
          }

          setRewardsPoints(data.walletCoins !== undefined ? data.walletCoins : (data.rewardsPoints || 0));

          setPhoto(data.profileImage || user.photoURL || "");
          setPreviewPhoto(data.profileImage || user.photoURL || "");
        } else {
          setDocId(user.uid);
          setJoinedOn("Joined recently");
        }

        // Fetch dynamic counts & recent orders
        fetchCountsAndRecentOrders(user.uid);
      } else {
        setCurrentUser(null);
        navigate("/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchCountsAndRecentOrders = async (uid) => {
    try {
      // 1. Orders Count & Recent Orders
      const ordersRef = collection(db, "users", uid, "orders");
      const ordersSnap = await getDocs(ordersRef);
      setOrdersCount(ordersSnap.size);

      // Fetch latest 3 orders
      const recentOrdersQuery = query(ordersRef, orderBy("orderDate", "desc"), limit(3));
      const recentOrdersSnap = await getDocs(recentOrdersQuery);
      const ordersList = recentOrdersSnap.docs.map(doc => {
        const orderData = doc.data();
        let dateStr = "N/A";
        if (orderData.orderDate) {
          const dateVal = orderData.orderDate.toDate ? orderData.orderDate.toDate() : new Date(orderData.orderDate);
          dateStr = dateVal.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
        }
        
        const products = orderData.products || [];
        const firstProduct = products[0] || {};
        let image = "";
        if (firstProduct.images && Array.isArray(firstProduct.images) && firstProduct.images.length > 0) {
          image = firstProduct.images[0];
        } else if (firstProduct.image) {
          image = firstProduct.image;
        } else if (firstProduct.productImage) {
          image = firstProduct.productImage;
        } else if (firstProduct.thumbnail) {
          image = firstProduct.thumbnail;
        } else {
          image = "https://via.placeholder.com/60?text=Product";
        }
        
        return {
          id: doc.id,
          orderId: orderData.orderId || doc.id,
          date: dateStr,
          status: orderData.orderStatus || "Pending",
          total: orderData.payableAmount || orderData.totalAmount || 0,
          itemCount: products.reduce((acc, p) => acc + (p.quantity || 1), 0),
          image
        };
      });
      setRecentOrders(ordersList);

      // 2. Wishlist (Favorites) Count
      const favoritesRef = collection(db, "users", uid, "favorites");
      const favoritesSnap = await getDocs(favoritesRef);
      setWishlistCount(favoritesSnap.size);

      // 3. Addresses Count
      const addressesRef = collection(db, "users", uid, "addresses");
      const addressesSnap = await getDocs(addressesRef);
      setAddressesCount(addressesSnap.size);

    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, JPEG, PNG, or WEBP)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setCropImageSrc(URL.createObjectURL(file));
    setCropZoom(1);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
    setShowCropModal(true);

    // Clear value to trigger change event next time
    e.target.value = "";
  };

  const handleDragStart = (e) => {
    setIsDraggingCrop(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    setDragStartCrop({
      x: clientX - cropOffset.x,
      y: clientY - cropOffset.y
    });
  };

  const handleDragMove = (e) => {
    if (!isDraggingCrop) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    setCropOffset({
      x: clientX - dragStartCrop.x,
      y: clientY - dragStartCrop.y
    });
  };

  const handleDragEnd = () => {
    setIsDraggingCrop(false);
  };

  const handleCropZoomChange = (e) => {
    setCropZoom(parseFloat(e.target.value));
  };

  const handleCropRotate = () => {
    setCropRotation((prev) => (prev + 90) % 360);
  };

  const getCroppedImageBlob = () => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = cropImageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const cropSize = 300; // Output cropped image resolution: 300x300 px
        canvas.width = cropSize;
        canvas.height = cropSize;

        // Use dynamic cropBoxSize state
        const targetCropBoxSize = cropBoxSize;
        
        ctx.clearRect(0, 0, cropSize, cropSize);
        ctx.save();
        ctx.translate(cropSize / 2, cropSize / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        ctx.scale(cropZoom, cropZoom);

        // Determine target rendering dimensions within our box (preserving aspect ratio)
        let renderWidth = targetCropBoxSize;
        let renderHeight = targetCropBoxSize;
        if (image.width > image.height) {
          renderWidth = targetCropBoxSize * (image.width / image.height);
          renderHeight = targetCropBoxSize;
        } else {
          renderWidth = targetCropBoxSize;
          renderHeight = targetCropBoxSize * (image.height / image.width);
        }

        const scaleFactor = cropSize / targetCropBoxSize;
        const dx = cropOffset.x * scaleFactor;
        const dy = cropOffset.y * scaleFactor;

        ctx.drawImage(
          image,
          -renderWidth / 2 + dx / cropZoom,
          -renderHeight / 2 + dy / cropZoom,
          renderWidth,
          renderHeight
        );

        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas crop failed"));
            }
          },
          "image/jpeg",
          0.85
        );
      };
      image.onerror = (err) => reject(err);
    });
  };

  const handleCropSave = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // 1. Get cropped image blob
      const croppedBlob = await getCroppedImageBlob();
      
      // 2. Delete old avatar from Firebase Storage if it exists
      if (photo && photo.includes("firebasestorage.googleapis.com")) {
        try {
          const oldStorageRef = ref(storage, photo);
          await deleteObject(oldStorageRef);
        } catch (error) {
          console.warn("Could not delete old profile photo:", error);
        }
      }

      // 3. Upload new cropped image to Firebase Storage
      // Generate a unique path with a timestamp to avoid caching/browser refresh delays
      const uniqueFilename = `profiles/${currentUser.uid}_${Date.now()}.jpg`;
      const newStorageRef = ref(storage, uniqueFilename);
      await uploadBytes(newStorageRef, croppedBlob);
      const finalPhotoURL = await getDownloadURL(newStorageRef);

      // 4. Update Firebase Auth Profile
      await updateProfile(currentUser, {
        photoURL: finalPhotoURL,
      });

      // 5. Update Firestore Database
      await setDoc(
        doc(db, "users", docId),
        {
          profileImage: finalPhotoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 6. Update local state
      setPhoto(finalPhotoURL);
      setPreviewPhoto(finalPhotoURL);
      setSelectedFile(null); // Clear form selection
      
      toast.success("Profile photo updated successfully!");
      setShowCropModal(false);
    } catch (error) {
      console.error("Error cropping and uploading image:", error);
      toast.error("Failed to crop and upload image: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);

      // Handle password update if provided
      if (newPassword) {
        if (newPassword.length < 6) {
          toast.error("Password must be at least 6 characters long");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        try {
          await updatePassword(currentUser, newPassword);
          toast.success("Password updated successfully!");
        } catch (pwError) {
          console.error("Password update error:", pwError);
          if (pwError.code === "auth/requires-recent-login") {
            toast.error("For security, changing password requires a recent login. Please log out and log back in, then try again.");
            setLoading(false);
            return;
          } else {
            toast.error(pwError.message || "Failed to update password.");
            setLoading(false);
            return;
          }
        }
      }

      let finalPhotoURL = photo;

      if (selectedFile) {
        const storageRef = ref(storage, `profiles/${currentUser.uid}`);
        await uploadBytes(storageRef, selectedFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(currentUser, {
        displayName: name,
        photoURL: finalPhotoURL,
      });

      await setDoc(
        doc(db, "users", docId),
        {
          name,
          email,
          gender,
          contactNo: phone,
          dob,
          profileImage: finalPhotoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPhoto(finalPhotoURL);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      setShowLogoutConfirmModal(false);
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Check if session is recent (Firebase requires session to be < 5 minutes old for user deletion)
      const idTokenResult = await currentUser.getIdTokenResult(true);
      const authTime = idTokenResult.claims.auth_time * 1000; // convert to ms
      const currentTime = Date.now();
      const diffMinutes = (currentTime - authTime) / 60000;

      if (diffMinutes > 5) {
        toast.error(
          "For security reasons, deleting your account requires a recent login. Please log out and log back in, then try again."
        );
        setShowDeleteConfirmModal(false);
        return;
      }

      // 1. Delete Firestore user record
      await deleteDoc(doc(db, "users", currentUser.uid));

      // 2. Delete Firebase Auth user record
      await deleteUser(currentUser);

      toast.success("Account deleted successfully.");
      setShowDeleteConfirmModal(false);
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === "auth/requires-recent-login") {
        toast.error(
          "For security reasons, please log out and log back in before deleting your account."
        );
      } else {
        toast.error(error.message || "Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(val || 0));

  const getOrderStatusDisplay = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "pending" || statusLower === "order placed") {
      return t("orderStatus.placed", "Order Placed");
    }
    if (statusLower === "placed") {
      return t("orderStatus.placed", "Order Placed");
    }
    if (statusLower === "return_requested" || statusLower === "returnrequested") {
      return t("orderStatus.returnRequested", "Return Requested");
    }
    if (statusLower === "return_approved" || statusLower === "returnapproved") {
      return t("orderStatus.returnApproved", "Return Approved");
    }
    if (statusLower === "refund_completed" || statusLower === "refundcompleted" || statusLower === "refunded") {
      return t("orderStatus.refundCompleted", "Refund Completed");
    }
    if (statusLower === "cancelled") {
      return t("orderStatus.cancelled", "Order Cancelled");
    }
    if (statusLower === "delivered") {
      return t("orderStatus.delivered", "Order Delivered");
    }
    if (statusLower === "shipped") {
      return t("orderStatus.shipped", "Shipped");
    }
    if (statusLower === "processing") {
      return t("orderStatus.processing", "Processing");
    }
    return t(`orderStatus.${statusLower}`, status);
  };

  if (authLoading) {
    return <Loading />;
  }

  return (
    <div className="profile-dashboard-wrapper">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Main container */}
      <div className="profile-dashboard-container">
        
        {/* Breadcrumbs */}
        <div className="profile-breadcrumbs">
          <Link to="/">{t("homeLabel", "Home")}</Link>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-active">{t("myAccount", "My Account")}</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-active">{t("myProfile", "My Profile")}</span>
        </div>

        {/* Title */}
        <div className="profile-title-header">
          <h2>{t("myProfile", "My Profile")}</h2>
        </div>

        {/* Top Summary Stats Cards */}
        <div className="profile-stats-grid">
          <div className="stat-card" onClick={() => navigate("/orders")}>
            <div className="stat-icon-wrapper blue-bg">
              <FaShoppingBag />
            </div>
            <div className="stat-details">
              <span className="stat-label">{t("ordersLabel", "Orders")}</span>
              <span className="stat-count">{ordersCount}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper orange-bg">
              <FaGift />
            </div>
            <div className="stat-details">
              <span className="stat-label">{t("rewardsPoints", "Rewards Points")}</span>
              <span className="stat-count">{rewardsPoints}</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate("/wishlist")}>
            <div className="stat-icon-wrapper pink-bg">
              <FaHeart />
            </div>
            <div className="stat-details">
              <span className="stat-label">{t("wishlistItems", "Wishlist Items")}</span>
              <span className="stat-count">{wishlistCount}</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate("/save-address")}>
            <div className="stat-icon-wrapper teal-bg">
              <FaMapMarkerAlt />
            </div>
            <div className="stat-details">
              <span className="stat-label">{t("savedAddresses", "Saved Addresses")}</span>
              <span className="stat-count">{addressesCount}</span>
            </div>
          </div>
        </div>

        {/* Outer Dashboard Grid */}
        <div className="dashboard-grid-layout">
          
          {/* Sidebar Menu */}
          <div className="dashboard-sidebar">
            <h3 className="sidebar-title">{t("myAccount", "My Account")}</h3>
            <ul className="sidebar-menu-list">
              <li className="sidebar-menu-item active">
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
              <li className="sidebar-menu-item" onClick={() => navigate("/save-address")}>
                <FaMapMarkerAlt className="menu-icon" />
                <span>{t("myAddresses", "My Addresses")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => toast.info("Rewards section clicked")}>
                <FaGift className="menu-icon" />
                <span>{t("home.sadhanaRewardsPromo", "Sadhana Rewards")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => setShowPaymentModal(true)}>
                <FaCreditCard className="menu-icon" />
                <span>{t("paymentMethods", "Payment Methods")}</span>
              </li>
              <li className="sidebar-menu-item" onClick={() => setIsEditing(true)}>
                <FaCog className="menu-icon" />
                <span>{t("accountSettings", "Account Settings")}</span>
              </li>
              <li className="sidebar-divider"></li>
              <li className="sidebar-menu-item logout-item" onClick={handleLogoutClick}>
                <FaSignOutAlt className="menu-icon" />
                <span>{t("logout", "Logout")}</span>
              </li>
            </ul>
          </div>

          {/* Main Dashboard Section */}
          <div className="dashboard-main-content">
            
            {/* Left Content Area (User details & Account overview) */}
            <div className="content-left-block">
              
              {/* User Identity Info Card */}
              <div className="user-identity-card">
                <div className="avatar-side">
                  <div className="avatar-circle">
                    {previewPhoto ? (
                      <img src={previewPhoto} alt={name} className="profile-img" />
                    ) : (
                      <div className="profile-icon-placeholder">
                        <FaUser />
                      </div>
                    )}
                  </div>
                  <h3>{name || "User Name"}</h3>
                  <p className="email-text">{email}</p>
                  {phone && <p className="phone-text">{phone}</p>}
                  <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                    <FaEdit /> {t("editProfile", "Edit Profile")}
                  </button>
                </div>

                <div className="details-side">
                  <div className="detail-row">
                    <span className="detail-icon"><FaCalendarAlt /></span>
                    <div className="detail-info">
                      <span className="detail-label">{t("dateOfBirth", "Date of Birth")}</span>
                      <span className="detail-value">{dob ? new Date(dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : t("notSpecified", "Not specified")}</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon"><FaVenusMars /></span>
                    <div className="detail-info">
                      <span className="detail-label">{t("gender", "Gender")}</span>
                      <span className="detail-value">{gender || t("notSpecified", "Not specified")}</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon"><FaCheckCircle /></span>
                    <div className="detail-info">
                      <span className="detail-label">{t("joinedOn", "Joined On")}</span>
                      <span className="detail-value">{joinedOn}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Overview Grid */}
              <h3 className="section-subtitle">{t("accountOverview", "Account Overview")}</h3>
              <div className="account-overview-grid">
                <div className="overview-card" onClick={() => navigate("/orders")}>
                  <div className="card-left">
                    <div className="card-icon-container blue-bg">
                      <FaShoppingBag />
                    </div>
                    <div className="card-info">
                      <h4>{t("myOrders", "My Orders")}</h4>
                      <p>{t("myOrdersDesc", "Track, return or buy again")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={() => navigate("/save-address")}>
                  <div className="card-left">
                    <div className="card-icon-container teal-bg">
                      <FaMapMarkerAlt />
                    </div>
                    <div className="card-info">
                      <h4>{t("myAddresses", "My Addresses")}</h4>
                      <p>{t("myAddressesDesc", "Manage saved addresses")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={() => setShowPaymentModal(true)}>
                  <div className="card-left">
                    <div className="card-icon-container purple-bg">
                      <FaCreditCard />
                    </div>
                    <div className="card-info">
                      <h4>{t("paymentMethods", "Payment Methods")}</h4>
                      <p>{t("paymentMethodsDesc", "Manage cards, UPI & wallets")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={() => toast.info("Rewards clicked")}>
                  <div className="card-left">
                    <div className="card-icon-container yellow-bg">
                      <FaGift />
                    </div>
                    <div className="card-info">
                      <h4>{t("home.sadhanaRewardsPromo", "Sadhana Rewards")}</h4>
                      <p>{t("rewardsDesc", "View points, rewards & offers")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={() => navigate("/wishlist")}>
                  <div className="card-left">
                    <div className="card-icon-container pink-bg">
                      <FaHeart />
                    </div>
                    <div className="card-info">
                      <h4>{t("wishlistLabel", "Wishlist")}</h4>
                      <p>{t("wishlistDesc", "View items you saved")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={() => setIsEditing(true)}>
                  <div className="card-left">
                    <div className="card-icon-container settings-bg">
                      <FaCog />
                    </div>
                    <div className="card-info">
                      <h4>{t("accountSettings", "Account Settings")}</h4>
                      <p>{t("accountSettingsDesc", "Change password & preferences")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={() => toast.info("Notifications clicked")}>
                  <div className="card-left">
                    <div className="card-icon-container orange-bg">
                      <FaBell />
                    </div>
                    <div className="card-info">
                      <h4>{t("notifications", "Notifications")}</h4>
                      <p>{t("manageNotifications", "Manage your notifications")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={() => navigate("/support")}>
                  <div className="card-left">
                    <div className="card-icon-container support-bg">
                      <FaQuestionCircle />
                    </div>
                    <div className="card-info">
                      <h4>{t("helpCenter", "Help Center")}</h4>
                      <p>{t("getHelpSupport", "Get help & support")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>

                <div className="overview-card" onClick={handleLogoutClick}>
                  <div className="card-left">
                    <div className="card-icon-container logout-bg">
                      <FaSignOutAlt />
                    </div>
                    <div className="card-info">
                      <h4>{t("logout", "Logout")}</h4>
                      <p>{t("signOutFromAccount", "Sign out from your account")}</p>
                    </div>
                  </div>
                  <FaChevronRight className="chevron-right-icon" />
                </div>
              </div>
            </div>

            {/* Right Side Content Block (Sadhana Rewards Card & Recent Orders) */}
            <div className="content-right-block">
              
              {/* Rewards Points Card */}
              <div className="rewards-promo-card">
                <div className="rewards-card-header">
                  <div className="rewards-title-wrapper">
                    <FaGift className="reward-icon-svg" />
                    <span>{t("home.sadhanaRewardsPromo", "Sadhana Rewards")}</span>
                  </div>
                  <FaChevronRight className="rewards-chevron" onClick={() => toast.info("View Rewards History")} />
                </div>
                
                <div className="rewards-card-body">
                  <div className="body-left">
                    <span className="body-label">{t("availablePoints", "Available Points")}</span>
                    <span className="points-number">{rewardsPoints}</span>
                    <span className="points-badge">{t("pointsRatio", "1 Point = ₹1")}</span>
                  </div>
                  <div className="body-right">
                    <img 
                      src={rewardsGiftBox} 
                      alt="Gift box illustration" 
                      className="gift-illustration-img"
                    />
                  </div>
                </div>

                <div className="rewards-card-footer" onClick={() => toast.info("Rewards History details")}>
                  <span>{t("viewRewardsHistory", "View Rewards History")}</span>
                  <FaChevronRight />
                </div>
              </div>

              {/* Recent Orders List Card */}
              <div className="recent-orders-card">
                <div className="orders-card-header">
                  <h3>{t("recentOrders", "Recent Orders")}</h3>
                  <Link to="/orders" className="view-all-link">{t("viewAll", "View All")}</Link>
                </div>

                <div className="orders-list-body">
                  {recentOrders.length === 0 ? (
                    <div className="empty-orders-view">
                      <p>{t("noRecentOrders", "No recent orders found")}</p>
                    </div>
                  ) : (
                    recentOrders.map((order, idx) => (
                      <div className="recent-order-item" key={order.id || idx} onClick={() => navigate("/orders")}>
                        <div className="order-item-left">
                          <img 
                            src={order.image} 
                            alt={`Order product`} 
                            className="order-product-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/60?text=Product";
                            }}
                          />
                          <div className="order-details-meta">
                            <span className="order-num-id">{t("orderHash", "Order #")}{order.orderId.substring(0, 10)}...</span>
                            <span className="order-meta-desc">{order.itemCount} {t("itemsLabel", "Items")} | {formatCurrency(order.total)}</span>
                          </div>
                        </div>
                        <div className="order-item-right">
                          <span className={`status-pill ${order.status.toLowerCase()}`}>
                            {getOrderStatusDisplay(order.status)}
                          </span>
                          <span className="order-item-date">{order.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="orders-card-footer" onClick={() => navigate("/orders")}>
                  <span>{t("viewAllOrders", "View All Orders")}</span>
                  <FaChevronRight />
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Edit Profile Modal Dialog Overlay */}
      <AnimatePresence>
        {isEditing && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>{t("editProfileDetails", "Edit Profile Details")}</h3>
                <button className="close-modal-btn" onClick={() => setIsEditing(false)}>
                  <FaTimesCircle />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="edit-profile-form">
                <div className="form-avatar-edit">
                  <div className="edit-avatar-circle">
                    <img src={previewPhoto || "https://via.placeholder.com/100"} alt="preview" />
                    <label className="camera-badge">
                      <FaCamera />
                      <input type="file" onChange={handlePhotoChange} accept="image/*" />
                    </label>
                  </div>
                  <span className="helper-txt">{t("maxFileSize", "Max file size: 2MB")}</span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>{t("fullName", "Full Name")}</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("emailAddress", "Email Address")}</label>
                    <input 
                      type="email" 
                      value={email} 
                      disabled 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("phoneNumber", "Phone Number")}</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label>{t("gender", "Gender")}</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">{t("selectGender", "Select Gender")}</option>
                      <option value="Male">{t("male", "Male")}</option>
                      <option value="Female">{t("female", "Female")}</option>
                      <option value="Other">{t("otherLabel", "Other")}</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>{t("dateOfBirth", "Date of Birth")}</label>
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)} 
                    />
                  </div>

                  {currentUser?.providerData?.some(p => p.providerId === 'password') && (
                    <>
                      <div className="form-group">
                        <label>{t("newPassword", "New Password (Optional)")}</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div className="form-group">
                        <label>{t("confirmPassword", "Confirm New Password")}</label>
                        <input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="Confirm password"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="form-action-buttons">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? t("saving", "Saving...") : <><FaSave /> {t("saveChanges", "Save Changes")}</>}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                    {t("cancel", "Cancel")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Methods Modal Dialog */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <motion.div 
              className="modal-box payment-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{t("paymentMethods", "Payment Methods")}</h3>
                <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>
                  <FaTimesCircle />
                </button>
              </div>

              <div className="payment-modal-body">
                <p className="payment-modal-subtitle">{t("weAccept", "WE ACCEPT")}</p>
                <div className="profile-payments-container">
                  <div className="prof-pay-card prof-visa">VISA</div>
                  <div className="prof-pay-card prof-mc">
                    <div className="prof-mc-circle red"></div>
                    <div className="prof-mc-circle yellow"></div>
                  </div>
                  <div className="prof-pay-card prof-rupay">RuPay</div>
                  <div className="prof-pay-card prof-upi">UPI</div>
                  <div className="prof-pay-card prof-paytm">
                    <span style={{ color: '#00b9f1', fontWeight: 'bold' }}>Pay</span><span style={{ color: '#002970', fontWeight: 'bold' }}>tm</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Image Cropper Modal */}
      <AnimatePresence>
        {showCropModal && (
          <div className="modal-overlay crop-modal-overlay">
            <motion.div 
              className="modal-box crop-modal-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>{t("cropProfilePhoto", "Crop Profile Photo")}</h3>
                <button className="close-modal-btn" onClick={() => setShowCropModal(false)}>
                  <FaTimesCircle />
                </button>
              </div>

              <div className="crop-modal-body">
                {/* Crop container box */}
                <div 
                  className="crop-workspace-container"
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchStart={handleDragStart}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                >
                  <div 
                    className="crop-image-wrapper"
                    style={{
                      transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom}) rotate(${cropRotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <img src={cropImageSrc} alt="raw source" className="crop-raw-image" draggable="false" />
                  </div>
                  <div 
                    className="crop-circle-mask"
                    style={{
                      width: `${cropBoxSize}px`,
                      height: `${cropBoxSize}px`,
                      top: `${(280 - cropBoxSize) / 2}px`,
                      left: `${(280 - cropBoxSize) / 2}px`
                    }}
                  ></div>
                </div>

                {/* Range Zoom & Crop Frame Sizer Slider */}
                <div className="crop-controls-wrapper">
                  <div className="zoom-slider-row">
                    <span>{t("zoom", "Zoom")}:</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.05" 
                      value={cropZoom} 
                      onChange={handleCropZoomChange} 
                      className="crop-zoom-range"
                    />
                  </div>

                  <div className="zoom-slider-row">
                    <span>{t("cropSize", "Crop Size")}:</span>
                    <input 
                      type="range" 
                      min="100" 
                      max="280" 
                      step="5" 
                      value={cropBoxSize} 
                      onChange={(e) => setCropBoxSize(parseInt(e.target.value))} 
                      className="crop-zoom-range"
                    />
                  </div>

                  <button type="button" className="rotate-btn" onClick={handleCropRotate}>
                    <i className="fas fa-sync-alt"></i> {t("rotate90", "Rotate 90°")}
                  </button>
                </div>
              </div>

              <div className="form-action-buttons px-4 pb-4">
                <button type="button" className="save-btn" onClick={handleCropSave} disabled={loading}>
                  {loading ? t("uploading", "Uploading...") : t("saveImage", "Save Image")}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowCropModal(false)} disabled={loading}>
                  {t("cancel", "Cancel")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirmModal && (
          <div className="modal-overlay logout-confirm-overlay" onClick={() => setShowLogoutConfirmModal(false)}>
            <motion.div 
              className="modal-box logout-confirm-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px' }}
            >
              <div className="modal-header">
                <h3>{t("confirmLogOut", "Confirm Log Out")}</h3>
                <button className="close-modal-btn" onClick={() => setShowLogoutConfirmModal(false)}>
                  <FaTimesCircle />
                </button>
              </div>

              <div className="logout-confirm-body text-center p-4">
                <h4 className="fw-bold mb-2 text-dark" style={{ textAlign: 'left', fontSize: '18px', fontWeight: '700', color: '#1a202c', margin: '0' }}>
                  {t("areYouSureLogout", "Are you sure you want to log out?")}
                </h4>
                <p className="text-muted text-sm" style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.6', color: '#4a5568', margin: '12px 0 0 0' }}>
                  {t("logoutConfirmDesc", "You'll be signed out of your account and will need to log in again to access your profile, bookings, and other personalized features.")}
                </p>
              </div>

              <div className="form-action-buttons px-4 pb-4" style={{ gap: '12px', padding: '16px 24px 24px 24px', display: 'flex' }}>
                <button type="button" className="save-btn logout-confirm-btn-primary" onClick={handleLogoutConfirm} style={{ flex: '1', backgroundColor: '#e53e3e', color: '#ffffff', border: 'none', height: '42px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
                  {t("logout", "Log Out")}
                </button>
                <button type="button" className="cancel-btn logout-confirm-btn-secondary" onClick={() => setShowLogoutConfirmModal(false)} style={{ flex: '1', backgroundColor: '#38a169', color: '#ffffff', border: 'none', height: '42px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
                  {t("staySignedIn", "Stay Signed In")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;