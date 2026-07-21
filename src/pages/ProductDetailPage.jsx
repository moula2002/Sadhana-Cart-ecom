import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Card, Button, Form, InputGroup, Modal, Badge, Accordion, Image } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../pages/Loading";
import {
    FaStar, FaRegStar, FaTruck, FaFileContract, FaCalendarAlt,
    FaShieldAlt, FaHeart, FaRegHeart, FaEdit, FaTrash, FaCamera,
    FaTimes, FaExpand, FaCheck, FaStore, FaBox, FaRupeeSign,
    FaArrowLeft, FaArrowRight, FaShoppingCart, FaBolt, FaTag,
    FaChevronLeft, FaChevronRight, FaImage, FaUser, FaThumbsUp, FaMoneyBillWave, FaUndo, FaHandHoldingUsd, FaBoxOpen
} from 'react-icons/fa';
import { db, storage } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where, limit, addDoc, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useTranslation } from "react-i18next";
import ProductSuggestions from "../pages/ProductSuggestions";
import LoginPage from "./LoginPage";
import RazorpayOffers from "./RazorpayOffers";
import FrequentlyBoughtTogether from "../components/category/FrequentlyBoughtTogether";
import RecentlyViewed from "../components/category/RecentlyViewed";
import { recordRecentlyViewed } from "../services/recentlyViewedService";
import { useTheme } from "../context/ThemeContext";


const EXCHANGE_RATE = 1;
const auth = getAuth();

function ProductDetailPage() {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Auth
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    // Product states
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Image gallery
    const [mainImage, setMainImage] = useState(null);
    const [productImages, setProductImages] = useState([]);

    const [quantity, setQuantity] = useState(1);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [descExpanded, setDescExpanded] = useState(true);
    const [detailsExpanded, setDetailsExpanded] = useState(true);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [compareProducts, setCompareProducts] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [availOffers, setAvailOffers] = useState([]);

    // Recently Viewed & Explore More states
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const rvSliderRef = useRef(null);
    const scrollRvLeft = () => { if (rvSliderRef.current) rvSliderRef.current.scrollBy({ left: -264, behavior: 'smooth' }); };
    const scrollRvRight = () => { if (rvSliderRef.current) rvSliderRef.current.scrollBy({ left: 264, behavior: 'smooth' }); };

    const [exploreProducts, setExploreProducts] = useState([]);
    const [exploreFilter, setExploreFilter] = useState("value"); // "value" | "trends" | "rated"

    const sortedExploreProducts = useMemo(() => {
        let list = [...exploreProducts];
        if (exploreFilter === "value") {
            list.sort((a, b) => {
                const finalA = Number(a.offerprice || a.price || 0);
                const originalA = a.price && a.offerprice ? Number(a.price) : finalA * 1.5;
                const discA = ((originalA - finalA) / originalA);

                const finalB = Number(b.offerprice || b.price || 0);
                const originalB = b.price && b.offerprice ? Number(b.price) : finalB * 1.5;
                const discB = ((originalB - finalB) / originalB);

                return discB - discA;
            });
        } else if (exploreFilter === "trends") {
            list.sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0));
        } else if (exploreFilter === "rated") {
            list.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
        }
        return list;
    }, [exploreProducts, exploreFilter]);

    // Variant (Size/Stock) states
    const [productVariants, setProductVariants] = useState([]);
    const [selectedSize, setSelectedSize] = useState("N/A");

    // Reviews and Ratings State
    const [reviewsData, setReviewsData] = useState({
        averageRating: 0.0,
        totalRatings: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: []
    });

    // Review Modal States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // Edit Review States
    const [editingReview, setEditingReview] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editRating, setEditRating] = useState(0);
    const [editText, setEditText] = useState('');
    const [editImages, setEditImages] = useState([]);
    const [editImageUrls, setEditImageUrls] = useState([]);
    const [deletingImages, setDeletingImages] = useState([]);

    // Image Viewer Modal State
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [currentReviewImages, setCurrentReviewImages] = useState([]);

    // Seller Information State
    const [sellerInfo, setSellerInfo] = useState({
        currentProductSeller: null,
        allSellers: [],
        loadingSellers: false
    });

    // Delivery & Terms State
    const [deliveryTerms, setDeliveryTerms] = useState({
        deliveryDate: "",
        termsConditions: "",
        loading: false
    });

    // Wishlist State
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlistId, setWishlistId] = useState(null);

    // Reset function for product-specific states
    const resetProductStates = useCallback(() => {
        setProduct(null);
        setMainImage(null);
        setProductImages([]);
        setProductVariants([]);
        setSelectedSize("N/A");
        setQuantity(1);
        setReviewsData({
            averageRating: 0.0,
            totalRatings: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            reviews: []
        });
        setSellerInfo({
            currentProductSeller: null,
            allSellers: [],
            loadingSellers: false
        });
        setDeliveryTerms({
            deliveryDate: "",
            termsConditions: "",
            loading: false
        });
        setIsInWishlist(false);
        setWishlistId(null);
        setShowImageModal(false);
        setSelectedImage(null);
        setSelectedImageIndex(0);
        setCurrentReviewImages([]);
    }, []);

    // Use effect to reset when product ID changes
    useEffect(() => {
        resetProductStates();
        setLoading(true);
        setError(null);
    }, [id, resetProductStates]);

    // Professional styles object
    const styles = {
        productDetailContainer: {
            borderRadius: "16px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            marginTop: "10px",
            border: "none",
            overflow: "hidden",
            padding: "5px",
        },
        detailImg: {
            maxHeight: "480px",
            width: "100%",
            objectFit: "contain",
            transition: "transform 0.3s ease-in-out",
            backgroundColor: "#fff",
            borderRadius: "12px",
        },
        descriptionBox: {
            fontSize: "13px",
            lineHeight: "1.5",
            color: "#6c757d",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
        },

        descriptionBoxExpanded: {
            fontSize: "13px",
            lineHeight: "1.5",
            color: "#6c757d",
        },
        productImageCol: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "20px",
            backgroundColor: "transparent",
            position: "sticky",
            top: "20px",
            height: "fit-content",
        },
        productPrice: {
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#2c3e50",
            marginTop: "15px",
            marginBottom: "15px",
        },
        thumbnail: {
            width: "60px",
            height: "60px",
            objectFit: "contain",
            cursor: "pointer",
            border: "1px solid #dee2e6",
            margin: "0 6px",
            padding: "2px",
            transition: "all 0.3s ease",
            borderRadius: "8px",
            backgroundColor: "#fff",
        },
        activeThumbnail: {
            borderColor: "#3498db",
            boxShadow: "0 0 0 3px rgba(52, 152, 219, 0.2)",
        },
        sizeButton: {
            padding: '10px 20px',
            marginRight: '10px',
            marginBottom: '10px',
            border: '2px solid #e9ecef',
            backgroundColor: '#fff',
            color: '#2c3e50',
            cursor: 'pointer',
            borderRadius: '8px',
            minWidth: '60px',
            textAlign: 'center',
            transition: 'all 0.2s',
            fontWeight: '600',
        },
        activeSizeButton: {
            borderColor: '#3498db',
            backgroundColor: '#f0f7ff',
            color: '#3498db',
        },
        outOfStock: {
            backgroundColor: '#f8f9fa',
            color: '#adb5bd',
            cursor: 'not-allowed',
            textDecoration: 'line-through',
            borderColor: '#dee2e6',
        },
        sellerBadge: {
            backgroundColor: '#e9ecef',
            color: '#495057',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600'
        },
        wishlistButton: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '2rem',
            transition: 'transform 0.2s',
            padding: '10px',
        },
        reviewImage: {
            width: '80px',
            height: '80px',
            objectFit: 'cover',
            borderRadius: '10px',
            marginRight: '10px',
            marginBottom: '10px',
            cursor: 'pointer',
            border: '2px solid #e9ecef',
            transition: 'all 0.3s'
        },
        imagePreviewContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '15px'
        },
        imagePreview: {
            width: '100px',
            height: '100px',
            objectFit: 'cover',
            borderRadius: '10px',
            position: 'relative',
            border: '2px solid #e9ecef'
        },
        removeImageBtn: {
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: '#dc3545',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
            border: '2px solid white',
            color: 'white'
        },
        imageModalContent: {
            maxWidth: '90vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            margin: 'auto',
            display: 'block',
            borderRadius: '8px'
        },
        thumbnailContainer: {
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "10px",
        },
        modalThumbnail: {
            width: '70px',
            height: '70px',
            objectFit: 'cover',
            borderRadius: '8px',
            cursor: 'pointer',
            border: '3px solid transparent',
            opacity: 0.7,
            transition: 'all 0.3s'
        },
        activeModalThumbnail: {
            borderColor: '#3498db',
            opacity: 1,
            transform: 'scale(1.05)',
        },
        ratingBar: {
            height: '8px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden'
        },
        ratingBarFill: {
            height: '100%',
            backgroundColor: '#f1c40f',
            borderRadius: '4px'
        },
        infoCard: {
            borderRadius: '12px',
            border: '1px solid #e9ecef',
            padding: '20px',
            backgroundColor: '#fff',
            transition: 'transform 0.2s',
        },
        iconCircle: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa'
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setIsLoggedIn(!!user);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // Record Recently Viewed product when product state updates
    useEffect(() => {
        if (product && (product.id || product.productid)) {
            recordRecentlyViewed(product, auth.currentUser);
        }
    }, [product]);

    // Function to open image viewer
    const openImageViewer = (images, index = 0) => {
        setCurrentReviewImages(images);
        setSelectedImage(images[index]);
        setSelectedImageIndex(index);
        setShowImageModal(true);
    };

    // Function to navigate to next image
    const nextImage = () => {
        if (currentReviewImages.length > 0) {
            const nextIndex = (selectedImageIndex + 1) % currentReviewImages.length;
            setSelectedImage(currentReviewImages[nextIndex]);
            setSelectedImageIndex(nextIndex);
        }
    };

    // Function to navigate to previous image
    const prevImage = () => {
        if (currentReviewImages.length > 0) {
            const prevIndex = (selectedImageIndex - 1 + currentReviewImages.length) % currentReviewImages.length;
            setSelectedImage(currentReviewImages[prevIndex]);
            setSelectedImageIndex(prevIndex);
        }
    };

    // Function to select image from thumbnails
    const selectImage = (image, index) => {
        setSelectedImage(image);
        setSelectedImageIndex(index);
    };

    // Function to close image viewer
    const closeImageViewer = () => {
        setShowImageModal(false);
        setSelectedImage(null);
        setSelectedImageIndex(0);
        setCurrentReviewImages([]);
    };

    // Function to check if product is in wishlist
    const checkWishlistStatus = useCallback(async () => {
        if (!currentUser || !product) return;

        try {
            setWishlistLoading(true);
            const wishlistRef = collection(db, "users", currentUser.uid, "favorites");
            const q = query(wishlistRef, where("productId", "==", product.id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                setWishlistId(doc.id);
                setIsInWishlist(true);
            } else {
                setWishlistId(null);
                setIsInWishlist(false);
            }
        } catch (error) {
            console.error("Error checking wishlist:", error);
        } finally {
            setWishlistLoading(false);
        }
    }, [currentUser, product]);

    // Effect to check wishlist when user or product changes
    useEffect(() => {
        if (currentUser && product) {
            checkWishlistStatus();
        }
    }, [currentUser, product, checkWishlistStatus]);

    // Function to add to wishlist
    const addToWishlist = async () => {
        if (!currentUser) {
            toast.error("Please login to add to wishlist", { position: "top-right", autoClose: 3000 });
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }

        if (!product) return;

        try {
            setWishlistLoading(true);
            const wishlistRef = collection(db, "users", currentUser.uid, "favorites");

            const q = query(wishlistRef, where("productId", "==", product.id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setIsInWishlist(true);
                toast.info("Product is already in your wishlist", { position: "top-right", autoClose: 3000 });
                return;
            }

            const wishlistItem = {
                productId: product.id,
                name: product.name || product.title,
                image: mainImage || product.image || "https://via.placeholder.com/150",
                price: Number(calculatedPriceINR),
                originalPrice: Number(calculatedOriginalPriceINR),
                category: product.category,
                createdAt: serverTimestamp(),
                size: selectedSize !== "N/A" ? selectedSize : null,
                sellerId: sellerInfo.currentProductSeller?.id || product.sellerId || "default_seller"
            };

            const docRef = await addDoc(wishlistRef, wishlistItem);
            setWishlistId(docRef.id);
            setIsInWishlist(true);

            toast.success("Added to wishlist!", {
                position: "top-right",
                autoClose: 2000
            });

        } catch (error) {
            console.error("Error adding to wishlist:", error);
            toast.error("Failed to add to wishlist", { position: "top-right", autoClose: 3000 });
        } finally {
            setWishlistLoading(false);
        }
    };

    // Function to remove from wishlist
    const removeFromWishlist = async () => {
        if (!currentUser || !wishlistId) return;

        try {
            setWishlistLoading(true);
            await deleteDoc(doc(db, "users", currentUser.uid, "favorites", wishlistId));
            setWishlistId(null);
            setIsInWishlist(false);
            toast.success("Removed from wishlist", { position: "top-right", autoClose: 2000 });
        } catch (error) {
            console.error("Error removing from wishlist:", error);
            toast.error("Failed to remove from wishlist", { position: "top-right", autoClose: 3000 });
        } finally {
            setWishlistLoading(false);
        }
    };

    // Function to toggle wishlist
    const toggleWishlist = () => {
        if (isInWishlist) {
            removeFromWishlist();
        } else {
            addToWishlist();
        }
    };

    const handleShare = () => {
        setShowShareModal(true);
    };

    const shareToWhatsApp = () => {
        const text = `Check out this amazing product: ${product?.name || product?.title} - ${window.location.href}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    };

    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
    };

    const shareToMessenger = () => {
        window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.href)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.href)}`, "_blank");
    };

    const shareToGmail = () => {
        window.open(`mailto:?subject=${encodeURIComponent(product?.name || product?.title)}&body=${encodeURIComponent("Check this out: " + window.location.href)}`, "_blank");
    };

    const shareToSMS = () => {
        window.open(`sms:?body=${encodeURIComponent("Check this out: " + window.location.href)}`, "_blank");
    };

    const shareToLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");
    };

    const shareToHangouts = () => {
        window.open(`https://plus.google.com/share?url=${encodeURIComponent(window.location.href)}`, "_blank");
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Product link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy link:", err);
            toast.error("Failed to copy link.");
        }
    };

    const shareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product?.name || product?.title,
                    text: `Check out this amazing product: ${product?.name || product?.title}`,
                    url: window.location.href
                });
            } catch (err) {
                console.error("Error with native share", err);
            }
        } else {
            copyToClipboard();
        }
    };

    const handleCompare = async () => {
        if (!product) return;
        setShowCompareModal(true);
        setCompareLoading(true);
        try {
            const conditions = [
                where("category", "==", product.category)
            ];
            const subcat = product.subcategory || product.subCategory || product.sub_category;
            if (subcat) {
                conditions.push(where("subcategory", "==", subcat));
            }

            const q = query(
                collection(db, "products"),
                ...conditions,
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(p => p.id !== product.id)
                .slice(0, 3);

            setCompareProducts([product, ...list]);
        } catch (error) {
            console.error("Error fetching compare products:", error);
            toast.error("Failed to load similar products for comparison.");
        } finally {
            setCompareLoading(false);
        }
    };

    // Function to fetch seller information
    const fetchSellerInfo = async (productData) => {
        try {
            setSellerInfo(prev => ({ ...prev, loadingSellers: true }));

            const currentSellerId = productData.sellerId || productData.sellerid || productData.vendorId || productData.vendor_id || productData.sellersid;

            if (currentSellerId) {
                try {
                    const sellerRef = doc(db, "sellers", currentSellerId);
                    const sellerSnap = await getDoc(sellerRef);

                    if (sellerSnap.exists()) {
                        const sellerData = sellerSnap.data();
                        setSellerInfo(prev => ({
                            ...prev,
                            currentProductSeller: {
                                id: currentSellerId,
                                name: sellerData.businessName || sellerData.name || currentSellerId,
                                email: sellerData.email || 'Not available',
                                phone: sellerData.phone || 'Not available',
                                address: sellerData.address || 'Not available',
                                rating: sellerData.rating || 0,
                                totalSales: sellerData.totalSales || 0
                            }
                        }));
                    } else {
                        setSellerInfo(prev => ({
                            ...prev,
                            currentProductSeller: {
                                id: currentSellerId,
                                name: currentSellerId,
                                email: 'Not available',
                                phone: 'Not available',
                                address: 'Not available',
                                rating: 0,
                                totalSales: 0
                            }
                        }));
                    }
                } catch (sellerError) {
                    console.error("Error fetching seller details:", sellerError);
                    setSellerInfo(prev => ({
                        ...prev,
                        currentProductSeller: {
                            id: currentSellerId,
                            name: currentSellerId,
                            email: 'Not available',
                            phone: 'Not available',
                            address: 'Not available',
                            rating: 0,
                            totalSales: 0
                        }
                    }));
                }
            }

        } catch (error) {
            console.error("Error in fetchSellerInfo:", error);
        } finally {
            setSellerInfo(prev => ({ ...prev, loadingSellers: false }));
        }
    };

    // Function to fetch delivery and terms information
    const fetchDeliveryTerms = async (productId) => {
        try {
            setDeliveryTerms(prev => ({ ...prev, loading: true }));
            const productRef = doc(db, "products", productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                const data = productSnap.data();
                setDeliveryTerms({
                    deliveryDate: data.deliveryDate || "",
                    termsConditions: data.termsConditions || "",
                    loading: false
                });
            } else {
                setDeliveryTerms({
                    deliveryDate: "",
                    termsConditions: "",
                    loading: false
                });
            }
        } catch (error) {
            console.error("Error fetching delivery & terms:", error);
            setDeliveryTerms({
                deliveryDate: "",
                termsConditions: "",
                loading: false
            });
        }
    };

    const fetchReviews = async (productId) => {
        const reviewsQuery = query(collection(db, "rating"), where("productId", "==", productId));
        try {
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const fetchedReviews = reviewsSnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                images: Array.isArray(d.data().images) ? d.data().images :
                    d.data().image ? [d.data().image] : []
            }));

            let totalRatings = fetchedReviews.length;
            let totalStars = 0;
            let distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

            fetchedReviews.forEach(review => {
                const rating = review.rating || 0;
                totalStars += rating;
                if (rating >= 1 && rating <= 5) {
                    distribution[rating] += 1;
                }
            });

            const averageRating = totalRatings > 0 ? (totalStars / totalRatings) : 0.0;

            setReviewsData({
                averageRating: averageRating,
                totalRatings: totalRatings,
                distribution: distribution,
                reviews: fetchedReviews.map(review => ({
                    ...review,
                    date: review.createdAt?.toDate
                        ? review.createdAt.toDate().toISOString()
                        : review.createdAT?.toDate
                            ? review.createdAT.toDate().toISOString()
                            : new Date().toISOString()
                }))
            });
        } catch (err) {
            console.error("🔥 Error fetching reviews:", err);
        }
    }

    // --- Fetch Product and Initial Ratings ---
    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProductAndReviews = async () => {
            try {
                setLoading(true);
                const productRef = doc(db, "products", id);
                const productSnap = await getDoc(productRef);

                if (!productSnap.exists()) throw new Error(`Product with ID ${id} not found.`);

                const data = { id: productSnap.id, ...productSnap.data() };
                setProduct(data);
                // Set Product States and unblock UI IMMEDIATELY
                const fetchedVariants = Array.isArray(data.sizevariants) ? data.sizevariants : [];
                setProductVariants(fetchedVariants);
                if (fetchedVariants.length > 0) {
                    setSelectedSize(fetchedVariants[0].size || null);
                } else {
                    setSelectedSize("N/A");
                }

                let images = [];
                if (Array.isArray(data.images) && data.images.length > 0) images = data.images;
                else if (data.image) images = [data.image];
                else images = ["https://via.placeholder.com/350?text=No+Image"];

                setProductImages(images);
                setMainImage(images[0]);
                setLoading(false); // 🔥 Product is ready to render instantly!

                // Add to Recently Viewed in background
                try {
                    const rvStr = localStorage.getItem("recentlyViewed");
                    let rvList = rvStr ? JSON.parse(rvStr) : [];
                    rvList = rvList.filter(p => p.id !== data.id);
                    rvList.unshift(data);
                    if (rvList.length > 20) rvList = rvList.slice(0, 20);
                    localStorage.setItem("recentlyViewed", JSON.stringify(rvList));
                    setRecentlyViewed(rvList.filter(p => p.id !== id));
                } catch (e) {
                    console.error("Error saving/loading recently viewed", e);
                }

                // Load Secondary Information asynchronously in parallel in background
                Promise.allSettled([
                    // 1. Explore products
                    (async () => {
                        try {
                            const exploreQ = query(
                                collection(db, "products"),
                                where("category", "==", data.category),
                                limit(35)
                            );
                            const exploreSnap = await getDocs(exploreQ);
                            const exploreList = exploreSnap.docs.map(doc => {
                                const pData = doc.data();
                                const priceValue = (pData.price || 0) * EXCHANGE_RATE;
                                return {
                                    id: doc.id,
                                    ...pData,
                                    priceINR: priceValue.toFixed(0),
                                    priceValue,
                                    rating: pData.rating || { rate: 4.0, count: 100 }
                                };
                            }).filter(p => p.id !== id);
                            setExploreProducts(exploreList.slice(0, 30));
                        } catch (exploreErr) {
                            console.error("Error fetching explore products:", exploreErr);
                        }
                    })(),

                    // 2. Seller info
                    fetchSellerInfo(data),

                    // 3. Delivery terms
                    fetchDeliveryTerms(id),

                    // 4. Reviews & Ratings
                    fetchReviews(id),

                    // 5. Offers & Coupons
                    (async () => {
                        try {
                            const querySnapshot = await getDocs(collection(db, "razorpay_offers"));
                            const offerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'offer' }));
                            const enabledOffers = offerList.filter(o => o.status === "Enabled" || o.isActive !== false);

                            const couponsSnapshot = await getDocs(collection(db, "coupons"));
                            const couponList = couponsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'coupon' }));
                            const enabledCoupons = couponList.filter(c => c.status === "Enabled" || c.isActive !== false);

                            setAvailOffers([...enabledOffers, ...enabledCoupons]);
                        } catch (offerErr) {
                            console.error("Error fetching offers:", offerErr);
                        }
                    })()
                ]);

            } catch (err) {
                console.error("🔥 Error fetching product details:", err);
                setError(err.message);
                setLoading(false);
            }
        };
        fetchProductAndReviews();
    }, [id]);

    const currentVariant = useMemo(() => {
        if (productVariants.length === 0 || !selectedSize || selectedSize === "N/A") return null;
        return productVariants.find(v => v.size === selectedSize) || null;
    }, [selectedSize, productVariants]);

    const calculatedPriceINR = useMemo(() => {
        if (!product) return 0;

        const basePrice =
            product.offerprice ||
            currentVariant?.price ||
            product.price ||
            0;

        return (basePrice * EXCHANGE_RATE).toFixed(0);
    }, [currentVariant, product]);

    const calculatedOriginalPriceINR = useMemo(() => {
        if (!product) return 0;

        return (product.price || 0) * EXCHANGE_RATE;
    }, [product]);

    const sortedVariants = useMemo(() => {
        const sizeOrder = ["S", "M", "L", "XL", "XXL", "XXXL"];
        const sizeIndexMap = sizeOrder.reduce((acc, size, index) => {
            acc[size] = index;
            return acc;
        }, {});

        return [...productVariants].sort((a, b) => {
            const indexA = sizeIndexMap[a.size?.toUpperCase()] ?? Infinity;
            const indexB = sizeIndexMap[b.size?.toUpperCase()] ?? Infinity;
            return indexA - indexB;
        });
    }, [productVariants]);

    const handleSizeSelect = (size) => {
        setSelectedSize(size);

        if (productVariants.length > 0) {
            const variant = productVariants.find(v => v.size === size);
            if (variant && (variant.stock || 0) === 0) {
                toast.error(`Size ${size} is currently out of stock.`, { position: "top-right", autoClose: 3000 });
            }
            if (variant && quantity > (variant.stock || 0)) {
                setQuantity(1);
            }
        }
    };

    // Function to handle quantity increment
    const handleIncrementQuantity = () => {
        const maxStock = productVariants.length > 0 ? (currentVariant?.stock ?? 0) : (product?.stock ?? 0);

        if (quantity >= maxStock) {
            toast.error(
                `Sorry! You can't increase the quantity any further. Only ${maxStock} items are currently available in stock.`,
                {
                    position: "top-center",
                    autoClose: 3500,
                    theme: "colored"
                }
            );
            return;
        }

        setQuantity(q => q + 1);
    };

    // Function to handle quantity input change
    const handleQuantityChange = (e) => {
        const value = Math.max(1, parseInt(e.target.value) || 1);
        const maxStock = productVariants.length > 0 ? (currentVariant?.stock ?? 0) : (product?.stock ?? 0);

        if (value > maxStock) {
            toast.error(
                `Sorry! You can't increase the quantity any further. Only ${maxStock} items are currently available in stock.`,
                {
                    position: "top-center",
                    autoClose: 3500,
                    theme: "colored"
                }
            );
            setQuantity(maxStock);
        } else {
            setQuantity(value);
        }
    };

    const handleAddToCart = () => {
        if (!product || (productVariants.length > 0 && !selectedSize) || selectedSize === null) {
            if (productVariants.length > 0) {
                toast.error("Please select a size before adding to cart.", { position: "top-right", autoClose: 3000 });
            } else {
                toast.error("Product data is incomplete.", { position: "top-right", autoClose: 3000 });
            }
            return;
        }

        let itemTitle, itemSize, itemVariant;

        if (productVariants.length > 0) {
            if (!currentVariant) {
                toast.error("Selected size variant details are missing.", { position: "top-right", autoClose: 3000 });
                return;
            }
            if ((currentVariant.stock || 0) === 0) {
                toast.error(`Size ${selectedSize} is out of stock.`, { position: "top-right", autoClose: 3000 });
                return;
            }
            itemTitle = `${product.name || product.title} (${selectedSize})`;
            itemSize = selectedSize;
            itemVariant = currentVariant;
        } else {
            if ((product.stock || 0) === 0) {
                toast.error(`This product is out of stock.`, { position: "top-right", autoClose: 3000 });
                return;
            }
            itemTitle = product.name || product.title;
            itemSize = selectedSize;
            itemVariant = undefined;
        }

        dispatch(
            addToCart({
                id: product.id,
                title: itemTitle,
                price: Number(calculatedPriceINR),
                image: mainImage || product.image || "https://via.placeholder.com/150",
                quantity: quantity,
                size: itemSize,
                variant: itemVariant,
                sellerId: sellerInfo.currentProductSeller?.id || product.sellerId || "default_seller"
            })
        );

        toast.success(`Added ${quantity} x "${itemTitle}" to cart!`, {
            position: "top-right",
            autoClose: 1000,
            theme: "colored",
        });
    };

    const handleBuyNow = () => {
        if (!product || (productVariants.length > 0 && !selectedSize) || selectedSize === null) {
            if (productVariants.length > 0) {
                toast.error("Please select a size to Buy Now.", { position: "top-center", autoClose: 3000 });
            } else {
                toast.error("Product data is incomplete.", { position: "top-center", autoClose: 3000 });
            }
            return;
        }

        let productTitle, checkoutSize, checkoutVariant;

        if (productVariants.length > 0) {
            if (currentVariant && (currentVariant.stock || 0) === 0) {
                toast.error(`Size ${selectedSize} is out of stock.`, { position: "top-center", autoClose: 3000 });
                return;
            }
            productTitle = `${product.name || product.title} (${selectedSize})`;
            checkoutSize = selectedSize;
            checkoutVariant = currentVariant;
        } else {
            if ((product.stock || 0) === 0) {
                toast.error(`This product is out of stock.`, { position: "top-center", autoClose: 3000 });
                return;
            }
            productTitle = product.name || product.title;
            checkoutSize = selectedSize;
            checkoutVariant = undefined;
        }

        toast.info("Proceeding directly to Checkout...", { position: "top-center", autoClose: 1000 });

        const productForCheckout = {
            ...product,
            title: productTitle,
            size: checkoutSize,
            price: Number(calculatedPriceINR),
            variant: checkoutVariant,
            sellerId: sellerInfo.currentProductSeller?.id || product.sellerId || "default_seller"
        };

        if (isLoggedIn) {
            navigate("/checkout", { state: { paymentMethod: "online", product: productForCheckout, quantity } });
        } else {
            setShowLogin(true);
            return;
        }
    };

    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setUserRating(0);
        setReviewText('');
        setReviewImages([]);
    };

    const handleWriteReviewClick = () => {
        if (!isLoggedIn) {
            toast.error("Please log in to write a review.", { position: "top-center" });
            navigate('/login', { state: { from: `/product/${id}` } });
            return;
        }
        setShowReviewModal(true);
    };

    // Function to handle image upload
    const handleImageUpload = async (files) => {
        const uploadedUrls = [];
        setUploadingImages(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                const fileName = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`;
                const storageRef = ref(storage, `review-images/${fileName}`);

                await uploadBytes(storageRef, file);

                const downloadURL = await getDownloadURL(storageRef);
                uploadedUrls.push(downloadURL);
            }

            if (showEditModal) {
                setEditImageUrls(prev => [...prev, ...uploadedUrls]);
            } else {
                setReviewImages(prev => [...prev, ...uploadedUrls]);
            }

            toast.success(`Uploaded ${uploadedUrls.length} image(s) successfully!`, { position: "top-right" });
        } catch (error) {
            console.error("Error uploading images:", error);
            toast.error("Failed to upload images", { position: "top-right" });
        } finally {
            setUploadingImages(false);
        }
    };

    // Function to remove image from preview
    const handleRemoveImage = (index, isEdit = false) => {
        if (isEdit) {
            const newImages = [...editImageUrls];
            newImages.splice(index, 1);
            setEditImageUrls(newImages);
        } else {
            const newImages = [...reviewImages];
            newImages.splice(index, 1);
            setReviewImages(newImages);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (userRating === 0) {
            toast.error("Please select a star rating.", { position: "top-center" });
            return;
        }
        if (!auth.currentUser) {
            toast.error("User not authenticated. Please log in.", { position: "top-center" });
            return;
        }

        try {
            const reviewRef = collection(db, "rating");
            const newReview = {
                rating: userRating,
                comment: reviewText,
                productId: product.id,
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || auth.currentUser.email || 'Customer',
                createdAt: serverTimestamp(),
                images: reviewImages,
                image: reviewImages.length > 0 ? reviewImages[0] : ""
            };

            await addDoc(reviewRef, newReview);

            toast.success("Review submitted successfully! Refreshing reviews...", { position: "top-center", autoClose: 3000 });
            handleCloseReviewModal();
            await fetchReviews(id);
        } catch (error) {
            console.error("🔥 Error submitting review:", error);
            toast.error(`Failed to submit review: ${error.message}`, { position: "top-center", autoClose: 5000 });
        }
    };

    // Function to open edit review modal
    const handleEditReview = (review) => {
        setEditingReview(review);
        setEditRating(review.rating);
        setEditText(review.comment || '');
        setEditImageUrls(Array.isArray(review.images) ? review.images : review.image ? [review.image] : []);
        setShowEditModal(true);
    };

    // Function to close edit review modal
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingReview(null);
        setEditRating(0);
        setEditText('');
        setEditImageUrls([]);
        setDeletingImages([]);
    };

    // Function to submit edited review
    const handleSubmitEditReview = async (e) => {
        e.preventDefault();

        if (editRating === 0) {
            toast.error("Please select a star rating.", { position: "top-center" });
            return;
        }

        if (!editingReview) return;

        try {
            const reviewRef = doc(db, "rating", editingReview.id);

            for (const imageUrl of deletingImages) {
                try {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                } catch (error) {
                    console.error("Error deleting image:", error);
                }
            }

            const updatedReview = {
                rating: editRating,
                comment: editText,
                images: editImageUrls,
                image: editImageUrls[0] || "",
                updatedAt: serverTimestamp()
            };

            await updateDoc(reviewRef, updatedReview);

            toast.success("Review updated successfully!", { position: "top-center", autoClose: 3000 });
            handleCloseEditModal();
            await fetchReviews(id);
        } catch (error) {
            console.error("🔥 Error updating review:", error);
            toast.error(`Failed to update review: ${error.message}`, { position: "top-center", autoClose: 5000 });
        }
    };

    // Function to delete review
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;

        try {
            const reviewToDelete = reviewsData.reviews.find(r => r.id === reviewId);
            if (reviewToDelete && reviewToDelete.images && reviewToDelete.images.length > 0) {
                for (const imageUrl of reviewToDelete.images) {
                    try {
                        const imageRef = ref(storage, imageUrl);
                        await deleteObject(imageRef);
                    } catch (error) {
                        console.error("Error deleting image:", error);
                    }
                }
            }

            await deleteDoc(doc(db, "rating", reviewId));

            toast.success("Review deleted successfully!", { position: "top-center", autoClose: 3000 });
            await fetchReviews(id);
        } catch (error) {
            console.error("🔥 Error deleting review:", error);
            toast.error(`Failed to delete review: ${error.message}`, { position: "top-center", autoClose: 5000 });
        }
    };

    // Function to mark image for deletion in edit mode
    const handleMarkImageForDeletion = (imageUrl) => {
        setDeletingImages(prev => [...prev, imageUrl]);
        setEditImageUrls(prev => prev.filter(img => img !== imageUrl));
    };

    const filteredAndSortedCategory = useMemo(() => {
        return [];
    }, []);

    // Helper function to format delivery date info
    const formatDeliveryInfo = (deliveryDate) => {
        if (!deliveryDate || deliveryDate.trim() === "") return null;

        if (!isNaN(deliveryDate) && deliveryDate.trim() !== "") {
            const days = parseInt(deliveryDate);
            if (days === 1) {
                return "Same day delivery";
            } else if (days <= 3) {
                return `Delivery within ${days} days`;
            } else if (days <= 7) {
                return `Delivery within ${days} business days`;
            } else {
                return `Delivery within ${days} days`;
            }
        }

        return deliveryDate;
    };

    // Helper function to parse terms conditions
    const parseTermsConditions = (termsConditions) => {
        if (!termsConditions || termsConditions.trim() === "") return [];

        const lines = termsConditions.split(/\n|(?=\d+\.)/).filter(line => line.trim() !== "");

        if (lines.length === 1 && !/\d+\./.test(termsConditions)) {
            return [termsConditions];
        }

        return lines;
    };

    const hasValue = (val) => {
        if (val === undefined || val === null) return false;
        const str = String(val).trim();
        return str !== "" && str.toUpperCase() !== "N/A";
    };

    // Check if delivery or terms info exists
    const hasDeliveryInfo = deliveryTerms.deliveryDate && deliveryTerms.deliveryDate.trim() !== "";
    const hasTermsInfo = deliveryTerms.termsConditions && deliveryTerms.termsConditions.trim() !== "";

    // --- Render Checks ---
    if (loading || !isAuthReady) {
        return <Loading />;
    }
    if (error) return (
        <Container className="py-5">
            <Alert variant="danger" className="text-center shadow-sm">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
            </Alert>
        </Container>
    );
    if (!product) return (
        <Container className="py-5">
            <Alert variant="info" className="text-center shadow-sm">
                <Alert.Heading>Product Not Found</Alert.Heading>
                <p>The product you're looking for doesn't exist or has been removed.</p>
                <Button variant="" onClick={() => navigate('/')}>Go to Home</Button>
            </Alert>
        </Container>
    );

    const discountPercentage =
        calculatedOriginalPriceINR > 0
            ? (((calculatedOriginalPriceINR - calculatedPriceINR) / calculatedOriginalPriceINR) * 100).toFixed(0)
            : 0;
    const rating = { rate: reviewsData.averageRating, count: reviewsData.totalRatings };

    const isOutOfStock = productVariants.length > 0
        ? (currentVariant?.stock || 0) === 0
        : (product?.stock || 0) === 0;

    const maxStock = productVariants.length > 0
        ? (currentVariant?.stock || Infinity)
        : (product?.stock || Infinity);

    const isCartBuyDisabled =
        (productVariants.length > 0 && !selectedSize) ||
        (productVariants.length > 0 && isOutOfStock) ||
        (!productVariants.length && isOutOfStock);

    return (
        <Container className="py-4">

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            {showLogin && (
                <LoginPage onClose={() => setShowLogin(false)} />
            )}

            {/* Breadcrumb */}
            <nav className="mb-4" style={{ fontSize: '0.9rem' }}>
                <Link to="/" className="text-decoration-none text-muted">Home</Link>
                <span className="mx-2 text-muted">/</span>
                <Link to={`/category/${product?.category}`} className="text-decoration-none text-muted">{product?.category}</Link>
                <span className="mx-2 text-muted">/</span>
                <span className="text-dark">{product?.name?.substring(0, 30)}...</span>
            </nav>

            {/* Main Product Card */}
            <Card style={{ border: 'none', background: 'transparent' }} className="mb-5">
                <Row className="g-4">
                    {/* LEFT COLUMN: Gallery, Delivery & Product Details */}
                    <Col lg={6} md={12}>
                        {/* Image Gallery */}
                        <div className="d-flex gap-3 mb-4">
                            {/* Vertical Thumbnail List */}
                            <div className="d-flex flex-column gap-2" style={{ width: '60px', flexShrink: 0 }}>
                                {productImages.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt={`Thumbnail ${i + 1}`}
                                        onClick={() => setMainImage(img)}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            cursor: 'pointer',
                                            border: mainImage === img ? '2px solid #2874f0' : '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            padding: '2px',
                                            backgroundColor: '#fff',
                                            transition: 'all 0.15s ease'
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Main Product Image Container */}
                            <div className="position-relative flex-grow-1 d-flex align-items-center justify-content-center bg-light border" style={{ borderRadius: '12px', minHeight: '380px', maxHeight: '480px', overflow: 'hidden' }}>
                                <img
                                    src={mainImage}
                                    alt={product.name}
                                    className="img-fluid"
                                    style={{ maxWidth: '100%', maxHeight: '460px', objectFit: 'contain' }}
                                />
                                {discountPercentage > 0 && (
                                    <Badge
                                        bg="danger"
                                        className="position-absolute top-0 start-0 m-3"
                                        style={{ fontSize: '0.9rem', padding: '6px 10px' }}
                                    >
                                        {discountPercentage}% OFF
                                    </Badge>
                                )}
                                {isOutOfStock && (
                                    <Badge
                                        bg="dark"
                                        className="position-absolute top-0 end-0 m-3"
                                        style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                                    >
                                        Out of Stock
                                    </Badge>
                                )}
                            </div>
                        </div>



                    </Col>
                    {/* RIGHT COLUMN: Product Metadata, Options, CTAs */}
                    <Col lg={6} md={12} className="ps-lg-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h1 className="fw-bold mb-2" style={{ fontSize: '24px', color: isDark ? '#f8fafc' : '#111' }}>{product.name || product.title}</h1>
                                <span className="text-uppercase" style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', color: isDark ? '#94a3b8' : '#6c757d' }}>
                                    Category: {product.category}
                                </span>
                            </div>
                        </div>

                        {/* Rating Row */}
                        <div className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: '14px' }}>
                            <div className="d-flex align-items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    i < Math.round(rating.rate) ? (
                                        <FaStar key={i} className="text-warning" />
                                    ) : (
                                        <FaRegStar key={i} style={{ color: isDark ? '#64748b' : '#cbd5e1' }} />
                                    )
                                ))}
                            </div>
                            <span style={{ color: isDark ? '#cbd5e1' : '#4a5568', fontWeight: '600' }}>
                                {rating.rate.toFixed(1)} ({rating.count} Reviews)
                            </span>
                        </div>

                        {/* Price Block */}
                        <div className="mb-4">
                            <div className="d-flex align-items-center gap-2">
                                <h2 style={{ fontSize: '32px', fontWeight: '800', color: isDark ? '#ffffff' : '#111', margin: 0 }}>
                                    ₹{calculatedPriceINR}
                                </h2>
                                <span className="text-decoration-line-through" style={{ fontSize: '18px', color: isDark ? '#94a3b8' : '#6c757d' }}>
                                    ₹{calculatedOriginalPriceINR}
                                </span>
                                {discountPercentage > 0 && (
                                    <span style={{ backgroundColor: isDark ? 'rgba(5, 150, 105, 0.25)' : '#e6fffa', color: isDark ? '#34d399' : '#0d9488', fontSize: '13px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' }}>
                                        {discountPercentage}% OFF
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#718096', display: 'block', marginTop: '4px' }}>{t("productDetail.inclusiveOfTaxes", "Inclusive of all taxes")}</span>
                        </div>

                        {/* Size Selector */}
                        {sortedVariants.length > 0 && (
                            <div className="mb-4">
                                <label className="fw-bold mb-2" style={{ fontSize: '14px', color: isDark ? '#f8fafc' : '#333' }}>{t("productDetail.selectSize", "Select Size")}</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {sortedVariants.map((variant) => (
                                        <button
                                            key={variant.size}
                                            type="button"
                                            onClick={() => handleSizeSelect(variant.size)}
                                            style={{
                                                border: selectedSize === variant.size ? '2px solid #3b82f6' : (isDark ? '1px solid #334155' : '1px solid #cbd5e0'),
                                                backgroundColor: selectedSize === variant.size ? (isDark ? '#1e3a8a' : '#f0f7ff') : (isDark ? '#1e293b' : '#ffffff'),
                                                color: selectedSize === variant.size ? (isDark ? '#93c5fd' : '#2874f0') : (isDark ? '#f8fafc' : '#2d3748'),
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: (variant.stock || 0) === 0 ? 'not-allowed' : 'pointer',
                                                textDecoration: (variant.stock || 0) === 0 ? 'line-through' : 'none',
                                                opacity: (variant.stock || 0) === 0 ? 0.5 : 1
                                            }}
                                            disabled={(variant.stock || 0) === 0}
                                        >
                                            {variant.size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="mb-4">
                            <label className="fw-bold mb-2" style={{ fontSize: '14px', color: isDark ? '#f8fafc' : '#333' }}>{t("productDetail.quantity", "Quantity")}</label>
                            <div className="d-flex align-items-center border" style={{ width: '120px', height: '38px', borderRadius: '6px', overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : '#fcfcfc', borderColor: isDark ? '#334155' : '#dee2e6' }}>
                                <button
                                    type="button"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={isOutOfStock}
                                    style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', fontSize: '18px', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#111' }}
                                >
                                    -
                                </button>
                                <span style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: '14px', color: isDark ? '#f8fafc' : '#111' }}>
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleIncrementQuantity}
                                    disabled={isOutOfStock}
                                    style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', fontSize: '18px', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#111' }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {/* Call to Action Buttons */}
                        <div className="d-flex gap-3 mb-4">
                            <Button
                                size="lg"
                                className="fw-bold"
                                style={{
                                    flex: 1,
                                    height: '50px',
                                    border: isDark ? '2px solid #3b82f6' : '2px solid #2874f0',
                                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                    color: isDark ? '#60a5fa' : '#2874f0',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onClick={handleAddToCart}
                                disabled={isCartBuyDisabled}
                            >
                                <FaShoppingCart />
                                {t("addToCart")}
                            </Button>

                            <Button
                                size="lg"
                                className="fw-bold"
                                style={{
                                    flex: 1,
                                    height: '50px',
                                    backgroundColor: '#fb641b',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={handleBuyNow}
                                disabled={isCartBuyDisabled}
                            >
                                Buy Now
                            </Button>
                        </div>

                        {/* Action Links Footer */}
                        <div className="d-flex align-items-center gap-4 pt-2 border-top" style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#4a5568', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#dee2e6' }}>
                            <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={toggleWishlist}>
                                {isInWishlist ? (
                                    <FaHeart className="text-danger" />
                                ) : (
                                    <FaRegHeart />
                                )}
                                <span>{t("wishList", "Wishlist")}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={handleCompare}>
                                <i className="fas fa-exchange-alt"></i>
                                <span>{t("productDetail.compare", "Compare")}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={handleShare}>
                                <i className="fas fa-share-alt"></i>
                                <span>{t("productDetail.share", "Share")}</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Description & Details Accordions */}
            <Row className="g-4 mb-5">
                {/* Description Card */}
                <Col md={6} xs={12}>
                    <Card className="border shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                        <div
                            className="d-flex align-items-center justify-content-between p-3"
                            style={{ cursor: 'pointer', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderBottom: descExpanded ? (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0') : 'none' }}
                            onClick={() => setDescExpanded(!descExpanded)}
                        >
                            <h3 className="mb-0 fw-bold" style={{ fontSize: '18px', color: isDark ? '#f8fafc' : '#111' }}>{t("productDetail.description", "Description")}</h3>
                            <i className={`fas ${descExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: '#3b82f6', transition: 'transform 0.2s' }}></i>
                        </div>
                        {descExpanded && (
                            <Card.Body className="p-3" style={{ fontSize: '14px', lineHeight: '1.6', color: isDark ? '#cbd5e1' : '#4a5568' }}>
                                {product.description || "No description available."}
                            </Card.Body>
                        )}
                    </Card>
                </Col>

                {/* Details Card */}
                <Col md={6} xs={12}>
                    <Card className="border shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                        <div
                            className="d-flex align-items-center justify-content-between p-3"
                            style={{ cursor: 'pointer', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderBottom: detailsExpanded ? (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0') : 'none' }}
                            onClick={() => setDetailsExpanded(!detailsExpanded)}
                        >
                            <h3 className="mb-0 fw-bold" style={{ fontSize: '18px', color: isDark ? '#f8fafc' : '#111' }}>{t("productDetail.details", "Details")}</h3>
                            <i className={`fas ${detailsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: '#3b82f6', transition: 'transform 0.2s' }}></i>
                        </div>
                        {detailsExpanded && (
                            <Card.Body className="p-3">
                                <div className="d-flex flex-column gap-3" style={{ fontSize: '14px', color: isDark ? '#f8fafc' : '#333' }}>
                                    {hasValue(product.brand) && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.brand", "brand")}:</span>
                                            <span>{product.brand}</span>
                                        </div>
                                    )}
                                    {(hasValue(product.material) || hasValue(product.fabric)) && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.material", "material")}:</span>
                                            <span>{product.material || product.fabric}</span>
                                        </div>
                                    )}
                                    {hasValue(product.pattern) && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.pattern", "pattern")}:</span>
                                            <span>{product.pattern}</span>
                                        </div>
                                    )}
                                    {hasValue(product.hsncode) && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.hsncode", "hsncode")}:</span>
                                            <span>{product.hsncode}</span>
                                        </div>
                                    )}
                                    {hasValue(product.gender) && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.gender", "gender")}:</span>
                                            <span>{product.gender}</span>
                                        </div>
                                    )}
                                    {hasValue(product.closuretype) && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>closuretype :</span>
                                            <span>{product.closuretype}</span>
                                        </div>
                                    )}
                                    {hasValue(product.color) && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.color", "color")}:</span>
                                            <span>{product.color}</span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                        <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.ratingLabel", "rating")}:</span>
                                        <span>{rating.rate.toFixed(1)}</span>
                                    </div>
                                    {discountPercentage > 0 && (
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                                            <span className="fw-bold" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.discountLabel", "discount")}:</span>
                                            <span>{discountPercentage}%</span>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Available Offers & Delivery Section */}
            <div className="mb-5 mt-4 p-4 border" style={{ borderRadius: '12px', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: isDark ? '#f8fafc' : '#111', fontSize: '18px' }}>
                    <FaTag style={{ color: '#3b82f6' }} />{t("productDetail.availableOffers", "Available Offers")}</h5>

                {/* Horizontal Scrolling Offers */}
                <div className="d-flex gap-3 overflow-auto pb-3 custom-horizontal-scroller" style={{ scrollbarWidth: 'thin' }}>
                    {availOffers.length === 0 ? (
                        <div className="p-3 border rounded" style={{ minWidth: '280px', backgroundColor: isDark ? '#0f172a' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#94a3b8' : '#6c757d' }}>
                            No active offers available
                        </div>
                    ) : (
                        availOffers.map((offer) => (
                            <div
                                key={offer.id}
                                className="p-3 border rounded position-relative d-inline-block"
                                style={{
                                    minWidth: '280px',
                                    maxWidth: '280px',
                                    backgroundColor: isDark ? '#0f172a' : '#fff',
                                    borderRadius: '12px',
                                    border: isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)'
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span style={{ backgroundColor: isDark ? '#1e3a8a' : '#e0f2fe', color: isDark ? '#60a5fa' : '#0369a1', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>
                                        {offer.code || offer.offerName || "OFFER"}
                                    </span>
                                    <div className="d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                                        <i className="fas fa-bolt text-warning"></i>
                                        <i className="fas fa-university text-secondary"></i>
                                    </div>
                                </div>
                                <h6 className="fw-bold mb-1" style={{ fontSize: '14px', whiteSpace: 'normal', lineHeight: '1.4', color: isDark ? '#f8fafc' : '#0f172a' }}>
                                    {offer.title || offer.bankName || offer.displayText1 || "Special Discount"}
                                </h6>
                                {offer.minOrderAmount && (
                                    <div className="mt-1" style={{ fontSize: '11px', fontWeight: '500', color: isDark ? '#f87171' : '#dc2626' }}>
                                        Min order ₹{offer.minOrderAmount}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Dark Green Delivery Banner (as per screenshot) */}
                <div
                    className="d-flex align-items-center gap-3 p-3 mt-4 mb-4"
                    style={{
                        backgroundColor: isDark ? '#1b2e2d' : '#173b37',
                        border: isDark ? '1px solid #14532d' : '1px solid #173b37',
                        borderRadius: '8px'
                    }}
                >
                    <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: '32px', height: '32px', backgroundColor: '#115e59' }}
                    >
                        <FaTruck style={{ color: '#34d399', fontSize: '14px' }} />
                    </div>
                    <span className="fw-bold" style={{ color: '#f1f5f9', fontSize: '15px' }}>
                        {hasDeliveryInfo ? `Delivery in ${deliveryTerms.deliveryDate.replace(/days/i, '').trim()} business days` : t("productDetail.deliveryDays", "Delivery in 5-7 business days")}
                    </span>
                </div>

                {/* Badges Section: {t("productDetail.lowestPrice", "Lowest Price")}, COD, {t("productDetail.sevenDayReturns", "7-day Returns")} */}
                <div 
                    className="d-flex justify-content-between align-items-center px-4 py-3 mb-4 w-100" 
                    style={{ 
                        backgroundColor: isDark ? '#1e293b' : '#f1f5f9', 
                        borderRadius: '12px',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
                    }}
                >
                    {/* {t("productDetail.lowestPrice", "Lowest Price")} */}
                    <div className="d-flex flex-column align-items-center flex-fill position-relative">
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm bg-white" 
                            style={{ width: '56px', height: '56px' }}
                        >
                            <FaTag style={{ color: '#10b981', fontSize: '24px' }} />
                        </div>
                        <span className="fw-bold text-center" style={{ fontSize: '13px', color: isDark ? '#f1f5f9' : '#334155' }}>
                            {t("productDetail.lowestPrice", "Lowest Price")}
                        </span>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '40px', backgroundColor: isDark ? '#334155' : '#cbd5e1' }}></div>

                    {/* Cash on Delivery */}
                    <div className="d-flex flex-column align-items-center flex-fill position-relative">
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm bg-white" 
                            style={{ width: '56px', height: '56px' }}
                        >
                            <FaHandHoldingUsd style={{ color: '#10b981', fontSize: '28px' }} />
                        </div>
                        <span className="fw-bold text-center" style={{ fontSize: '13px', color: isDark ? '#f1f5f9' : '#334155' }}>{t("productDetail.cashOnDelivery", "Cash on Delivery")}</span>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '40px', backgroundColor: isDark ? '#334155' : '#cbd5e1' }}></div>

                    {/* {t("productDetail.sevenDayReturns", "7-day Returns")} */}
                    <div className="d-flex flex-column align-items-center flex-fill position-relative">
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm bg-white" 
                            style={{ width: '56px', height: '56px' }}
                        >
                            <FaBoxOpen style={{ color: '#f59e0b', fontSize: '26px' }} />
                        </div>
                        <span className="fw-bold text-center" style={{ fontSize: '13px', color: isDark ? '#f1f5f9' : '#334155' }}>
                            {t("productDetail.sevenDayReturns", "7-day Returns")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <Card className="border shadow-sm mb-5" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: isDark ? '#f8fafc' : '#212529', borderRadius: '16px' }}>
                <Card.Body className="p-4">
                    <Row>
                        <Col md={4} className="border-end" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#dee2e6' }}>
                            <h3 className="fw-bold mb-4" style={{ color: isDark ? '#f8fafc' : '#111' }}>{t("productDetail.ratingsAndReviews", "Ratings & Reviews")}</h3>

                            {/* Average Rating */}
                            <div className="text-center mb-4">
                                <span className="display-1 fw-bold" style={{ color: isDark ? '#ffffff' : '#111' }}>{reviewsData.averageRating.toFixed(1)}</span>
                                <div className="my-2">
                                    {[...Array(5)].map((_, i) => (
                                        i < Math.round(reviewsData.averageRating) ?
                                            <FaStar key={i} className="text-warning mx-1" size={20} /> :
                                            <FaRegStar key={i} className="text-muted mx-1" size={20} />
                                    ))}
                                </div>
                                <p className="mb-0" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{reviewsData.totalRatings} {t("productDetail.totalRatings", "total ratings")}</p>
                            </div>

                            {/* Rating Distribution */}
                            <div className="mb-4">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = reviewsData.distribution[star];
                                    const percentage = reviewsData.totalRatings > 0 ? (count / reviewsData.totalRatings) * 100 : 0;
                                    return (
                                        <div key={star} className="d-flex align-items-center mb-2">
                                            <span className="me-2" style={{ minWidth: '40px', color: isDark ? '#cbd5e1' : '#4a5568' }}>{star} <FaStar className="text-warning ms-1" size={12} /></span>
                                            <div className="flex-grow-1 mx-2">
                                                <div style={{ ...styles.ratingBar, backgroundColor: isDark ? '#334155' : '#e2e8f0' }}>
                                                    <div style={{ ...styles.ratingBarFill, width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                            <span className="small" style={{ minWidth: '40px', color: isDark ? '#94a3b8' : '#6c757d' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Write Review Button */}
                            <div className="text-center">
                                <h5 className="fw-bold mb-3" style={{ color: isDark ? '#f8fafc' : '#111' }}>Share Your Experience</h5>
                                <p className="small mb-3" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>Help other customers make better decisions</p>
                                <Button
                                    variant={isDark ? "primary" : "dark"}
                                    size="lg"
                                    onClick={handleWriteReviewClick}
                                    className="px-5 rounded-pill"
                                >
                                    Write a Review
                                </Button>
                            </div>
                        </Col>

                        {/* Reviews List */}
                        <Col md={8} className="ps-md-5">
                            <h3 className="fw-bold mb-4" style={{ color: isDark ? '#f8fafc' : '#111' }}>{t("productDetail.customerReviews", "Customer Reviews")}</h3>

                            {reviewsData.reviews.length === 0 ? (
                                <div className="text-center py-5 rounded" style={{ backgroundColor: isDark ? '#0f172a' : '#f8f9fa', border: isDark ? '1px solid #334155' : 'none' }}>
                                    <FaRegStar size={40} className="mb-3" style={{ color: isDark ? '#64748b' : '#6c757d' }} />
                                    <h5 style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>{t("productDetail.noReviewsYet", "No reviews yet")}</h5>
                                    <p className="small" style={{ color: isDark ? '#64748b' : '#6c757d' }}>{t("productDetail.beFirstToReview", "Be the first to review this product")}</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {reviewsData.reviews.map((review, index) => (
                                        <div key={index} className="border-bottom pb-4 mb-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#dee2e6' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <div className="d-flex align-items-center mb-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            i < review.rating ?
                                                                <FaStar key={i} className="text-warning me-1" size={14} /> :
                                                                <FaRegStar key={i} className="text-muted me-1" size={14} />
                                                        ))}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <div className="rounded-circle p-2 me-2" style={{ backgroundColor: isDark ? '#334155' : 'rgba(108, 117, 125, 0.1)' }}>
                                                            <FaUser size={14} style={{ color: isDark ? '#94a3b8' : '#6c757d' }} />
                                                        </div>
                                                        <span className="fw-semibold me-2" style={{ color: isDark ? '#f8fafc' : '#212529' }}>{review.userName || 'Customer'}</span>
                                                        <span className="small" style={{ color: isDark ? '#94a3b8' : '#6c757d' }}>
                                                            {new Date(review.date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Edit/Delete buttons for user's own reviews */}
                                                {currentUser && review.userId === currentUser.uid && (
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEditReview(review)}
                                                            className="rounded-circle"
                                                            style={{ width: '36px', height: '36px' }}
                                                        >
                                                            <FaEdit size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            className="rounded-circle"
                                                            style={{ width: '36px', height: '36px' }}
                                                        >
                                                            <FaTrash size={14} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="mb-3" style={{ lineHeight: '1.8', color: isDark ? '#cbd5e1' : '#212529' }}>{review.comment}</p>

                                            {/* Display Review Images */}
                                            {review.images && review.images.length > 0 && (
                                                <div className="d-flex flex-wrap gap-2 mt-3">
                                                    {review.images.map((img, imgIndex) => (
                                                        <div key={imgIndex} className="position-relative">
                                                            <Image
                                                                src={img}
                                                                alt={`Review ${index + 1} - Image ${imgIndex + 1}`}
                                                                style={styles.reviewImage}
                                                                onClick={() => openImageViewer(review.images, imgIndex)}
                                                                className="review-thumbnail"
                                                            />
                                                            <div className="position-absolute bottom-0 end-0 m-1 bg-dark bg-opacity-50 rounded-circle p-1">
                                                                <FaExpand size={10} className="text-white" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* {t("productDetail.frequentlyBoughtTogether", "Frequently Bought Together")} */}
            {product && <FrequentlyBoughtTogether currentProduct={product} />}

            {/* Recently Viewed Products */}
            <RecentlyViewed currentProductId={id} />

            {/* Similar Products */}
            {product && (
                <ProductSuggestions
                    currentProductId={product.id}
                    category={product.category}
                    subcategory={product.subcategory}
                />
            )}



            {/* Explore more like this */}
            {exploreProducts.length > 0 && (
                <div className="mt-5 mb-5 explore-more-container">
                    <h3 className="fw-bold mb-3" style={{ color: isDark ? '#f8fafc' : '#111' }}>{t("productDetail.exploreMore", "Explore more like this")}</h3>

                    {/* Filter Pills */}
                    <div className="d-flex gap-3 mb-4 flex-wrap">
                        <button
                            onClick={() => setExploreFilter("value")}
                            type="button"
                            className="btn btn-light d-flex align-items-center gap-2 px-3 py-2 rounded shadow-sm border"
                            style={{
                                backgroundColor: exploreFilter === "value" ? (isDark ? '#1e3a8a' : "#eff6ff") : (isDark ? '#1e293b' : "#fff"),
                                borderColor: exploreFilter === "value" ? "#3b82f6" : (isDark ? '#334155' : "#e5e7eb"),
                                color: exploreFilter === "value" ? (isDark ? '#93c5fd' : "#1e40af") : (isDark ? '#f8fafc' : "#4b5563"),
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            <i className="fas fa-th-large" style={{ color: '#3b82f6' }}></i> {t("productDetail.value365", "Value 365")} </button>

                        <button
                            onClick={() => setExploreFilter("trends")}
                            type="button"
                            className="btn btn-light d-flex align-items-center gap-2 px-3 py-2 rounded shadow-sm border"
                            style={{
                                backgroundColor: exploreFilter === "trends" ? (isDark ? '#581c87' : "#faf5ff") : (isDark ? '#1e293b' : "#fff"),
                                borderColor: exploreFilter === "trends" ? "#a855f7" : (isDark ? '#334155' : "#e5e7eb"),
                                color: exploreFilter === "trends" ? (isDark ? '#e9d5ff' : "#6b21a8") : (isDark ? '#f8fafc' : "#4b5563"),
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            <i className="fas fa-fire" style={{ color: '#a855f7' }}></i> {t("productDetail.latestTrends", "Latest Trends")} </button>

                        <button
                            onClick={() => setExploreFilter("rated")}
                            type="button"
                            className="btn btn-light d-flex align-items-center gap-2 px-3 py-2 rounded shadow-sm border"
                            style={{
                                backgroundColor: exploreFilter === "rated" ? (isDark ? '#713f12' : "#fefcbf") : (isDark ? '#1e293b' : "#fff"),
                                borderColor: exploreFilter === "rated" ? "#eab308" : (isDark ? '#334155' : "#e5e7eb"),
                                color: exploreFilter === "rated" ? (isDark ? '#fef08a' : "#854d0e") : (isDark ? '#f8fafc' : "#4b5563"),
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            <i className="fas fa-star" style={{ color: '#eab308' }}></i> {t("productDetail.topRated", "Top Rated")} </button>
                    </div>

                    {/* Grid Layout of 5 columns */}
                    <div className="row g-4 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-5 row-cols-xxl-5">
                        {sortedExploreProducts.slice(0, 10).map((p) => {
                            const finalPrice = Number(p.offerprice || p.price || 0);
                            const originalPrice = p.price && p.offerprice ? Number(p.price) : Math.round(finalPrice * 1.5);
                            const discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

                            const getExploreImage = (item) => {
                                if (!item) return "https://via.placeholder.com/200";
                                if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
                                if (item.image) return item.image;
                                return "https://via.placeholder.com/200";
                            };

                            return (
                                <div key={p.id} className="col">
                                    <Card className="h-100 border shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }}>
                                        <Link to={`/product/${p.id}`} className="text-decoration-none" onClick={() => window.scrollTo(0, 0)}>
                                            {/* Image container */}
                                            <div className="d-flex justify-content-center align-items-center p-3" style={{ height: "180px", backgroundColor: '#ffffff', borderRadius: '12px 12px 0 0' }}>
                                                <Card.Img
                                                    src={getExploreImage(p)}
                                                    style={{ height: "140px", width: 'auto', objectFit: "contain" }}
                                                />
                                            </div>

                                            {/* Card body */}
                                            <Card.Body className="p-3 d-flex flex-column justify-content-between" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff' }}>
                                                <div>
                                                    <Card.Title className="fw-bold mb-1" style={{ fontSize: '0.88rem', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '800', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.4em' }}>
                                                        {p.name || p.title}
                                                    </Card.Title>

                                                    <div className="d-flex align-items-baseline gap-2 mt-2">
                                                        {/* Bold final price */}
                                                        <span className="fw-bold" style={{ fontSize: '1rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                                                            ₹{finalPrice.toLocaleString()}
                                                        </span>

                                                        {/* Original struck price */}
                                                        {originalPrice > finalPrice && (
                                                            <span className="text-decoration-line-through" style={{ fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                                                ₹{originalPrice.toLocaleString()}
                                                            </span>
                                                        )}

                                                        {/* Down arrow icon and discount percentage */}
                                                        {discountPercent > 0 && (
                                                            <span className="fw-bold" style={{ fontSize: '0.75rem', color: isDark ? '#34d399' : '#059669' }}>
                                                                ↓{discountPercent}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    className="sc-add-btn mt-2 w-100"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        dispatch(addToCart({
                                                            id: p.id,
                                                            title: p.name || p.title,
                                                            price: finalPrice,
                                                            image: getExploreImage(p),
                                                            quantity: 1,
                                                        }));
                                                        toast.success(`Added ${p.name || p.title} to cart!`, { position: "bottom-right", autoClose: 2000 });
                                                    }}
                                                >
                                                    <i className="fas fa-shopping-cart me-1"></i> {t("addToCart", "Add to Cart")}
                                                </button>
                                            </Card.Body>
                                        </Link>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            <Modal
                show={showImageModal}
                onHide={closeImageViewer}
                centered
                size="lg"
                fullscreen="md-down"
                className="image-viewer-modal"
            >
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">
                        Image {selectedImageIndex + 1} of {currentReviewImages.length}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    <div className="position-relative">
                        {/* Previous Button */}
                        {currentReviewImages.length > 1 && (
                            <Button
                                variant="light"
                                className="position-absolute start-0 top-50 translate-middle-y ms-3 rounded-circle shadow"
                                onClick={prevImage}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                }}
                            >
                                <FaChevronLeft />
                            </Button>
                        )}

                        {/* Main Image */}
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Review full size"
                                style={styles.imageModalContent}
                                className="img-fluid"
                            />
                        )}

                        {/* Next Button */}
                        {currentReviewImages.length > 1 && (
                            <Button
                                variant="light"
                                className="position-absolute end-0 top-50 translate-middle-y me-3 rounded-circle shadow"
                                onClick={nextImage}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                }}
                            >
                                <FaChevronRight />
                            </Button>
                        )}

                        {/* Expand Icon */}
                        <div className="position-absolute top-0 end-0 m-3">
                            <Button
                                variant="light"
                                size="sm"
                                className="rounded-circle"
                                onClick={() => window.open(selectedImage, '_blank')}
                                title="Open in new tab"
                            >
                                <FaExpand size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {currentReviewImages.length > 1 && (
                        <div style={styles.thumbnailContainer}>
                            {currentReviewImages.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`Thumbnail ${index + 1}`}
                                    style={{
                                        ...styles.modalThumbnail,
                                        ...(index === selectedImageIndex ? styles.activeModalThumbnail : {})
                                    }}
                                    onClick={() => selectImage(img, index)}
                                />
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center">
                    <small className="text-muted">
                        Use arrow keys or click thumbnails to navigate
                    </small>
                </Modal.Footer>
            </Modal>

            {/* Write Review Modal */}
            <Modal show={showReviewModal} onHide={handleCloseReviewModal} centered size="lg">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Write a Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitReview}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">Your Rating</Form.Label>
                            <div className="d-flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => setUserRating(star)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {star <= userRating ?
                                            <FaStar className="text-warning" size={32} /> :
                                            <FaRegStar className="text-muted" size={32} />
                                        }
                                    </span>
                                ))}
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">Your Review</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="What did you like or dislike about the product? Share your experience..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Image Upload Section */}
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">
                                <FaCamera className="me-2" />
                                Add Images (Optional)
                            </Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                                disabled={uploadingImages}
                            />
                            <Form.Text className="text-muted">
                                You can upload up to 5 images. Supported formats: JPG, PNG, GIF
                            </Form.Text>

                            {/* Image Preview */}
                            {reviewImages.length > 0 && (
                                <div style={styles.imagePreviewContainer}>
                                    {reviewImages.map((img, index) => (
                                        <div key={index} style={{ position: 'relative' }}>
                                            <Image
                                                src={img}
                                                alt={`Preview ${index + 1}`}
                                                style={styles.imagePreview}
                                            />
                                            <div
                                                style={styles.removeImageBtn}
                                                onClick={() => handleRemoveImage(index, false)}
                                            >
                                                <FaTimes size={12} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploadingImages && (
                                <div className="mt-3 text-center">
                                    <Spinner animation="border" size="sm" />
                                    <span className="ms-2">Uploading images...</span>
                                </div>
                            )}
                        </Form.Group>

                        <div className="d-flex gap-3">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={userRating === 0 || uploadingImages}
                                className="px-4"
                            >
                                {uploadingImages ? 'Uploading...' : 'Submit Review'}
                            </Button>
                            <Button variant="outline-secondary" onClick={handleCloseReviewModal}>
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit Review Modal */}
            <Modal show={showEditModal} onHide={handleCloseEditModal} centered size="lg">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Edit Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitEditReview}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">Your Rating</Form.Label>
                            <div className="d-flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => setEditRating(star)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {star <= editRating ?
                                            <FaStar className="text-warning" size={32} /> :
                                            <FaRegStar className="text-muted" size={32} />
                                        }
                                    </span>
                                ))}
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">Your Review</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Edit Image Upload Section */}
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">
                                <FaCamera className="me-2" />
                                Review Images
                            </Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                                disabled={uploadingImages}
                            />
                            <Form.Text className="text-muted">
                                Add new images or remove existing ones
                            </Form.Text>

                            {/* Current Images with Delete Option */}
                            {editImageUrls.length > 0 && (
                                <div style={styles.imagePreviewContainer} className="mt-3">
                                    {editImageUrls.map((img, index) => (
                                        <div key={index} style={{ position: 'relative' }}>
                                            <Image
                                                src={img}
                                                alt={`Image ${index + 1}`}
                                                style={styles.imagePreview}
                                            />
                                            <div
                                                style={styles.removeImageBtn}
                                                onClick={() => handleMarkImageForDeletion(img)}
                                                title="Delete this image"
                                            >
                                                <FaTimes size={12} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Deleted Images Notice */}
                            {deletingImages.length > 0 && (
                                <Alert variant="warning" className="mt-3 py-2">
                                    <FaTrash className="me-2" />
                                    {deletingImages.length} image(s) will be deleted
                                </Alert>
                            )}

                            {uploadingImages && (
                                <div className="mt-3 text-center">
                                    <Spinner animation="border" size="sm" />
                                    <span className="ms-2">Uploading images...</span>
                                </div>
                            )}
                        </Form.Group>

                        <div className="d-flex gap-3">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={editRating === 0 || uploadingImages}
                                className="px-4"
                            >
                                {uploadingImages ? 'Uploading...' : 'Update Review'}
                            </Button>
                            <Button variant="outline-secondary" onClick={handleCloseEditModal}>
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Compare Modal */}
            <Modal show={showCompareModal} onHide={() => setShowCompareModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Compare Products</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {compareLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Loading product comparison...</p>
                        </div>
                    ) : compareProducts.length === 0 ? (
                        <p className="text-center text-muted">No similar products found to compare.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered align-middle text-center" style={{ fontSize: '13px' }}>
                                <thead>
                                    <tr className="bg-light">
                                        <th style={{ width: '150px' }}>Feature</th>
                                        {compareProducts.map((p, index) => (
                                            <th key={p.id} style={{ minWidth: '150px' }}>
                                                {index === 0 ? (
                                                    <span className="badge bg-primary mb-2 d-block">Current Item</span>
                                                ) : (
                                                    <span className="badge bg-secondary mb-2 d-block">Similar Product</span>
                                                )}
                                                <img
                                                    src={p.images?.[0] || p.image || "https://via.placeholder.com/100"}
                                                    alt={p.name}
                                                    style={{ width: '80px', height: '80px', objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                                                />
                                                <div className="text-truncate fw-bold" style={{ maxWidth: '160px' }}>{p.name || p.title}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="fw-bold text-secondary text-start ps-3">Price</td>
                                        {compareProducts.map(p => (
                                            <td key={p.id} className="fw-bold text-dark fs-6">
                                                ₹{p.offerprice || p.price}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary text-start ps-3">Brand</td>
                                        {compareProducts.map(p => (
                                            <td key={p.id}>{p.brand || "Generic"}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary text-start ps-3">Material</td>
                                        {compareProducts.map(p => (
                                            <td key={p.id}>{p.material || p.fabric || "N/A"}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary text-start ps-3">Pattern</td>
                                        {compareProducts.map(p => (
                                            <td key={p.id}>{p.pattern || "N/A"}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary text-start ps-3">Fit Type</td>
                                        {compareProducts.map(p => (
                                            <td key={p.id}>{p.fittype || "N/A"}</td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="fw-bold text-secondary text-start ps-3">Action</td>
                                        {compareProducts.map((p, idx) => (
                                            <td key={p.id}>
                                                {idx === 0 ? (
                                                    <span className="text-muted small">Viewing</span>
                                                ) : (
                                                    <Link
                                                        to={`/product/${p.id}`}
                                                        className="btn btn-sm btn-outline-primary rounded-pill fw-bold"
                                                        onClick={() => setShowCompareModal(false)}
                                                    >
                                                        View Product
                                                    </Link>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Share Modal */}
            <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered size="md">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold" style={{ fontSize: '18px' }}>{t("productDetail.share", "Share")}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {product && (
                        <div className="d-flex align-items-center gap-3 p-3 bg-light rounded mb-4" style={{ border: '1px solid #e2e8f0' }}>
                            <img
                                src={mainImage || product.image || "https://via.placeholder.com/60"}
                                alt={product.name}
                                style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                            />
                            <div className="overflow-hidden">
                                <div className="fw-bold text-truncate" style={{ fontSize: '14px', color: '#111' }}>
                                    {product.name || product.title}
                                </div>
                                <div className="text-muted text-truncate" style={{ fontSize: '12px' }}>
                                    {product.category}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="row g-4 text-center">
                        <div className="col-4">
                            <div
                                onClick={copyToClipboard}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#2874f0', color: '#fff', fontSize: '20px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fas fa-link"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>Copy Link</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareToWhatsApp}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#25d366', color: '#fff', fontSize: '22px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fab fa-whatsapp"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>Whatsapp</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareToFacebook}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#1877f2', color: '#fff', fontSize: '20px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fab fa-facebook-f"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>Facebook</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareToMessenger}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#0084ff', color: '#fff', fontSize: '20px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fab fa-facebook-messenger"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>Facebook messenger</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareToGmail}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#ea4335', color: '#fff', fontSize: '18px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="far fa-envelope"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>Gmail</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareToSMS}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#4f46e5', color: '#fff', fontSize: '20px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fas fa-comment-alt"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>SMS</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareToLinkedIn}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#0077b5', color: '#fff', fontSize: '20px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fab fa-linkedin-in"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>LinkedIn</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareToHangouts}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#0f9d58', color: '#fff', fontSize: '20px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fab fa-google"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>Hangouts</span>
                        </div>

                        <div className="col-4">
                            <div
                                onClick={shareNative}
                                className="d-flex align-items-center justify-content-center mx-auto rounded-circle cursor-pointer"
                                style={{ width: '50px', height: '50px', backgroundColor: '#e2e8f0', color: '#4a5568', fontSize: '20px', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fas fa-ellipsis-h"></i>
                            </div>
                            <span className="d-block mt-2 text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>More Apps</span>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>


            {/* Custom CSS for hover effects */}
            <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        .hover-shadow-premium:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.12) !important;
        }
        .hover-premium-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(13, 110, 253, 0.25) !important;
        }
        .transition-all {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .transition-transform {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        /* Custom horizontal scroller styling */
        .custom-horizontal-scroller::-webkit-scrollbar {
          height: 6px;
        }
        .custom-horizontal-scroller::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-horizontal-scroller::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-horizontal-scroller::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
        .extra-small {
          font-size: 0.7rem;
        }
        .no-wrap {
          white-space: nowrap;
        }
        @media (min-width: 992px) {
          .border-start-lg {
            border-left: 1px solid rgba(0,0,0,0.1) !important;
          }
          .explore-more-container .row > .col {
            flex: 0 0 20% !important;
            max-width: 20% !important;
            width: 20% !important;
          }
        }
        .custom-premium-range {
          cursor: pointer;
        }
        .custom-premium-range::-webkit-slider-thumb {
          background: #0d6efd;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(13, 110, 253, 0.3);
        }
        .custom-premium-range::-moz-range-thumb {
          background: #0d6efd;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(13, 110, 253, 0.3);
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .review-thumbnail:hover {
          transform: scale(1.05);
          border-color: #3498db;
        }
        .wishlist-heart-btn:hover {
          transform: scale(1.1);
        }
        .wishlist-heart-btn:active {
          transform: scale(0.95);
        }
      .buy-now-btn{
background:#1b1b8f !important;
border:3px solid #1b1b8f !important;
color:#ffffff !important;
border-radius:14px !important;
font-size:18px !important;
box-shadow:none !important;
transition:none !important;
}

      `}</style>
        </Container>
    );
}

export default ProductDetailPage;