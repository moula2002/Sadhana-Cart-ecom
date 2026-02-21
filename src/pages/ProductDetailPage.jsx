import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Card, Button, Form, InputGroup, Modal, Badge, Accordion, Image } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaStar, FaRegStar, FaTruck, FaFileContract, FaCalendarAlt,
    FaShieldAlt, FaHeart, FaRegHeart, FaEdit, FaTrash, FaCamera,
    FaTimes, FaExpand, FaCheck, FaStore, FaBox, FaRupeeSign,
    FaArrowLeft, FaArrowRight, FaShoppingCart, FaBolt,
    FaChevronLeft, FaChevronRight, FaImage, FaUser
} from 'react-icons/fa';
import { db, storage } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where, limit, addDoc, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useTranslation } from "react-i18next";
import ProductSuggestions from "../pages/ProductSuggestions";

const EXCHANGE_RATE = 1;
const auth = getAuth();

function ProductDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Auth
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Product states
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [catLoading, setCatLoading] = useState(true);
    const [catError, setCatError] = useState(null);

    // Image gallery
    const [mainImage, setMainImage] = useState(null);
    const [productImages, setProductImages] = useState([]);

    // Filter/sort
    const [sortBy, setSortBy] = useState("rating");
    const [filterPrice, setFilterPrice] = useState(50000);

    // Quantity state
    const [quantity, setQuantity] = useState(1);

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
        setCategoryProducts([]);
        setCatLoading(true);
        setCatError(null);
    }, [id, resetProductStates]);

    // Professional styles object
    const styles = {
        productDetailContainer: {
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            marginTop: "25px",
            border: "none",
            overflow: "hidden"
        },
        detailImg: {
            maxHeight: "450px",
            width: "auto",
            objectFit: "contain",
            transition: "transform 0.3s ease-in-out",
        },
        productImageCol: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "#fafafa",
        },
        productPrice: {
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#2c3e50",
            marginTop: "15px",
            marginBottom: "15px",
        },
        thumbnail: {
            width: "70px",
            height: "70px",
            objectFit: "contain",
            cursor: "pointer",
            border: "2px solid #e9ecef",
            margin: "0 5px",
            padding: "5px",
            transition: "all 0.2s",
            borderRadius: "8px",
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
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px'
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

            try {
                const sellersQuery = query(collection(db, "sellers"), limit(50));
                const sellersSnapshot = await getDocs(sellersQuery);
                const allSellers = sellersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setSellerInfo(prev => ({ ...prev, allSellers }));
            } catch (sellersError) {
                console.error("Error fetching all sellers:", sellersError);
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
                    date: review.createdAT?.toDate ? review.createdAT.toDate().toISOString() : new Date().toISOString()
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

                await fetchSellerInfo(data);
                await fetchDeliveryTerms(id);
                await fetchReviews(id);
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
            } catch (err) {
                console.error("🔥 Error fetching product details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProductAndReviews();
    }, [id]);

    // --- Fetch Similar Products ---
    useEffect(() => {
        if (!product?.category) return;
        const fetchCategoryProducts = async () => {
            try {
                setCatLoading(true);
                const q = query(collection(db, "products"), where("category", "==", product.category), limit(10));
                const querySnapshot = await getDocs(q);
                const fetched = querySnapshot.docs.map((d) => {
                    const data = d.data();
                    const priceValue = (data.price || 0) * EXCHANGE_RATE;
                    return {
                        id: d.id,
                        ...data,
                        priceINR: priceValue.toFixed(0),
                        priceValue,
                        rating: data.rating || { rate: 4.0, count: 100 },
                    };
                });
                setCategoryProducts(fetched.filter((p) => p.id !== product.id));
            } catch (err) {
                console.error("🔥 Error fetching category products:", err);
                setCatError(err.message);
            } finally {
                setCatLoading(false);
            }
        };
        fetchCategoryProducts();
    }, [product]);

    const currentVariant = useMemo(() => {
        if (productVariants.length === 0 || !selectedSize || selectedSize === "N/A") return null;
        return productVariants.find(v => v.size === selectedSize) || null;
    }, [selectedSize, productVariants]);

    const calculatedPriceINR = useMemo(() => {
        if (!product) return 0;
        const basePrice = currentVariant?.price || product.price || 0;
        return (basePrice * EXCHANGE_RATE).toFixed(0);
    }, [currentVariant, product]);

    const calculatedOriginalPriceINR = useMemo(() => {
        return (Number(calculatedPriceINR) * 1.5).toFixed(0);
    }, [calculatedPriceINR]);

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
        const maxStock = productVariants.length > 0 ? (currentVariant?.stock || Infinity) : (product?.stock || Infinity);

        if (quantity >= maxStock) {
            toast.info(`Maximum stock achieved! Only ${maxStock} units available.`, {
                position: "top-right",
                autoClose: 3000
            });
            return;
        }

        setQuantity(q => q + 1);
    };

    // Function to handle quantity input change
    const handleQuantityChange = (e) => {
        const value = Math.max(1, parseInt(e.target.value) || 1);
        const maxStock = productVariants.length > 0 ? (currentVariant?.stock || Infinity) : (product?.stock || Infinity);

        if (value > maxStock) {
            toast.info(`Maximum stock achieved! Only ${maxStock} units available.`, {
                position: "top-right",
                autoClose: 3000
            });
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
            navigate("/login", { state: { from: "/checkout", paymentMethod: "online", product: productForCheckout, quantity } });
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
                createdAT: serverTimestamp(),
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
        let list = [...categoryProducts];
        list = list.filter((p) => p.priceValue <= filterPrice);

        switch (sortBy) {
            case "price-asc":
                list.sort((a, b) => a.priceValue - b.priceValue);
                break;
            case "price-desc":
                list.sort((a, b) => b.priceValue - a.priceValue);
                break;
            case "name-asc":
                list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            default:
                list.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
        }
        return list;
    }, [categoryProducts, sortBy, filterPrice]);

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

    // Check if delivery or terms info exists
    const hasDeliveryInfo = deliveryTerms.deliveryDate && deliveryTerms.deliveryDate.trim() !== "";
    const hasTermsInfo = deliveryTerms.termsConditions && deliveryTerms.termsConditions.trim() !== "";

    // --- Render Checks ---
    if (loading || !isAuthReady)
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">{t("loading")}...</p>
            </div>
        );
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
                <Button variant="primary" onClick={() => navigate('/')}>Go to Home</Button>
            </Alert>
        </Container>
    );

    const discountPercentage = (((calculatedOriginalPriceINR - calculatedPriceINR) / calculatedOriginalPriceINR) * 100).toFixed(0);
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

            {/* Breadcrumb */}
            <nav className="mb-4" style={{ fontSize: '0.9rem' }}>
                <Link to="/" className="text-decoration-none text-muted">Home</Link>
                <span className="mx-2 text-muted">/</span>
                <Link to={`/category/${product?.category}`} className="text-decoration-none text-muted">{product?.category}</Link>
                <span className="mx-2 text-muted">/</span>
                <span className="text-dark">{product?.name?.substring(0, 30)}...</span>
            </nav>

            {/* Main Product Card */}
            <Card style={styles.productDetailContainer} className="mb-5">
                <Row className="g-0">
                    <Col md={5} style={styles.productImageCol}>
                        <div className="position-relative">
                            <img
                                src={mainImage}
                                alt={product.name}
                                className="img-fluid mb-3"
                                style={styles.detailImg}
                            />
                            {discountPercentage > 0 && (
                                <Badge
                                    bg="danger"
                                    className="position-absolute top-0 start-0 m-3"
                                    style={{ fontSize: '1rem', padding: '8px 12px' }}
                                >
                                    {discountPercentage}% OFF
                                </Badge>
                            )}
                        </div>
                        <div className="d-flex justify-content-center flex-wrap mt-3 mb-3">
                            {productImages.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={`Thumbnail ${i + 1}`}
                                    onClick={() => setMainImage(img)}
                                    style={{
                                        ...styles.thumbnail,
                                        ...(mainImage === img ? styles.activeThumbnail : {}),
                                    }}
                                />
                            ))}
                        </div>
                    </Col>

                    <Col md={7} className="p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h1 className="fw-bold h2 mb-2">{product.name || product.title}</h1>
                                <Badge bg="light" text="dark" className="text-uppercase px-3 py-2">
                                    <FaStore className="me-2" />
                                    {product.category}
                                </Badge>
                            </div>

                            {/* Wishlist Heart Button */}
                            <button
                                onClick={toggleWishlist}
                                disabled={wishlistLoading}
                                style={styles.wishlistButton}
                                className="wishlist-heart-btn"
                                title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                            >
                                {wishlistLoading ? (
                                    <Spinner animation="border" size="sm" variant="danger" />
                                ) : isInWishlist ? (
                                    <FaHeart className="text-danger" />
                                ) : (
                                    <FaRegHeart className="text-secondary" />
                                )}
                            </button>
                        </div>

                        {/* Seller Information */}
                        {sellerInfo.currentProductSeller && (
                            <div className="mb-3 d-flex align-items-center">
                                <div className="bg-light rounded-circle p-2 me-2">
                                    <FaUser className="text-secondary" />
                                </div>
                                <span className="fw-semibold me-2">{sellerInfo.currentProductSeller.name}</span>
                                {sellerInfo.currentProductSeller.rating > 0 && (
                                    <Badge bg="warning" text="dark" className="px-2 py-1">
                                        <FaStar className="me-1" size={12} /> {sellerInfo.currentProductSeller.rating.toFixed(1)}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Rating */}
                        <div className="product-rating mb-3">
                            <span className="fw-bold me-2" style={{ fontSize: '1.2rem' }}>
                                {rating.rate.toFixed(1)}
                            </span>
                            {[...Array(5)].map((_, i) => (
                                i < Math.round(rating.rate) ?
                                    <FaStar key={i} className="text-warning me-1" size={16} /> :
                                    <FaRegStar key={i} className="text-muted me-1" size={16} />
                            ))}
                            <span className="text-muted ms-2">({rating.count} reviews)</span>
                        </div>

                        <hr />

                        {/* Price */}
                        <div className="mb-4">
                            <div className="d-flex align-items-baseline">
                                <h2 style={styles.productPrice} className="mb-0">
                                    <FaRupeeSign size={24} className="me-1" />
                                    {calculatedPriceINR}
                                </h2>
                                <span className="text-muted ms-3 fs-5 text-decoration-line-through">
                                    <FaRupeeSign size={16} />{calculatedOriginalPriceINR}
                                </span>
                            </div>
                            <p className="text-success mt-2 mb-0">
                                <FaCheck className="me-2" />
                                You save <FaRupeeSign size={12} />{(calculatedOriginalPriceINR - calculatedPriceINR)} ({discountPercentage}% OFF)
                            </p>
                        </div>

                        {/* Description */}
                        <p className="text-muted mb-4" style={{ lineHeight: '1.8' }}>
                            {product.description || "No description available."}
                        </p>

                        {/* Size Selector */}
                        {sortedVariants.length > 0 && (
                            <div className="mb-4">
                                <Form.Label className="fw-bold mb-3">
                                    <FaBox className="me-2" />
                                    Select Size
                                </Form.Label>
                                <div className="d-flex flex-wrap">
                                    {sortedVariants.map((variant) => (
                                        <Button
                                            key={variant.size}
                                            onClick={() => handleSizeSelect(variant.size)}
                                            variant="light"
                                            style={{
                                                ...styles.sizeButton,
                                                ...(selectedSize === variant.size ? styles.activeSizeButton : {}),
                                                ...((variant.stock || 0) === 0 ? styles.outOfStock : {}),
                                            }}
                                            disabled={(variant.stock || 0) === 0}
                                        >
                                            {variant.size}
 
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        {/* Attractive Quantity Selector */}
                        <div className="mb-4">
                            <Form.Label className="fw-bold mb-3 fs-5">Quantity</Form.Label>

                            <div
                                className="d-flex align-items-center justify-content-between px-3 py-2"
                                style={{
                                    width: "220px",
                                    borderRadius: "12px",
                                    border: "2px solid #f0f0f0",
                                    background: "#fafafa",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                            >
                                <Button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={isOutOfStock}
                                    style={{
                                        borderRadius: "10px",
                                        width: "40px",
                                        height: "40px",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                    }}
                                    variant="light"
                                >
                                    -
                                </Button>

                                <span
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "600",
                                        minWidth: "40px",
                                        textAlign: "center",
                                    }}
                                >
                                    {quantity}
                                </span>

                                <Button
                                    onClick={handleIncrementQuantity}
                                    disabled={isOutOfStock}
                                    style={{
                                        borderRadius: "10px",
                                        width: "40px",
                                        height: "40px",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                    }}
                                    variant="warning"
                                >
                                    +
                                </Button>
                            </div>

                        </div>


                        {/* Delivery Information */}
                        <div className="mb-4 p-3 bg-light rounded">
                            {hasDeliveryInfo ? (
                                <div className="d-flex align-items-center">
                                    <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                                        <FaTruck className="text-success" />
                                    </div>
                                    <div>
                                        <span className="fw-bold text-success d-block">
                                            {formatDeliveryInfo(deliveryTerms.deliveryDate)}
                                        </span>
                                        <small className="text-muted">
                                            <FaCalendarAlt className="me-1" size={12} />
                                            Estimated delivery date
                                        </small>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center">
                                    <div className="bg-secondary bg-opacity-10 p-2 rounded-circle me-3">
                                        <FaTruck className="text-secondary" />
                                    </div>
                                    <div>
                                        <span className="fw-bold d-block">Standard delivery</span>
                                        <small className="text-muted">5-7 Business Days</small>
                                    </div>
                                </div>
                            )}
                        </div>

                        <hr />

                        {/* Action Buttons */}
                        <div className="d-flex gap-3 pt-3">
                            <Button
                                variant="warning"
                                size="lg"
                                className="flex-grow-1 fw-bold py-3"
                                onClick={handleAddToCart}
                                disabled={isCartBuyDisabled}
                            >
                                <FaShoppingCart className="me-2" />
                                {t("addToCart")}
                            </Button>
                            <Button
                                variant="success"
                                size="lg"
                                className="flex-grow-1 fw-bold py-3"
                                onClick={handleBuyNow}
                                disabled={isCartBuyDisabled}
                            >
                                <FaBolt className="me-2" />
                                {t("buyNow")}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Delivery & Terms Information Section */}
            {(hasDeliveryInfo || hasTermsInfo) && (
                <Card className="mb-5 border-0 shadow-sm">
                    <Card.Body className="p-4">
                        <h3 className="fw-bold mb-4">
                            <FaShieldAlt className="text-primary me-2" />
                            Product Policies
                        </h3>

                        <Row>
                            {/* Delivery Information */}
                            {hasDeliveryInfo && (
                                <Col md={6} className="mb-4 mb-md-0">
                                    <div className="border rounded p-4 h-100">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                                                <FaTruck className="text-primary" size={24} />
                                            </div>
                                            <h5 className="mb-0 fw-bold">Delivery Information</h5>
                                        </div>
                                        <div className="ms-5">
                                            <div className="alert alert-success border-0 bg-success bg-opacity-10">
                                                <FaCalendarAlt className="me-2" />
                                                <span className="fw-semibold">
                                                    {deliveryTerms.deliveryDate.includes("day") || deliveryTerms.deliveryDate.includes("Day")
                                                        ? deliveryTerms.deliveryDate
                                                        : `Delivery within ${deliveryTerms.deliveryDate} days`}
                                                </span>
                                            </div>
                                            <p className="text-muted small mb-0">
                                                <FaTruck className="me-1" />
                                                This information is provided by the seller
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                            )}

                            {/* Terms & Conditions */}
                            {hasTermsInfo && (
                                <Col md={hasDeliveryInfo ? 6 : 12}>
                                    <div className="border rounded p-4 h-100">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
                                                <FaFileContract className="text-warning" size={24} />
                                            </div>
                                            <h5 className="mb-0 fw-bold">Terms & Conditions</h5>
                                        </div>
                                        <div className="ms-5">
                                            <div className="terms-content" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {parseTermsConditions(deliveryTerms.termsConditions).map((term, index) => (
                                                    <div key={index} className="mb-2 d-flex">
                                                        <span className="text-primary me-2">•</span>
                                                        <span>{term.trim()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-muted small mb-0 mt-2">
                                                <FaShieldAlt className="me-1" />
                                                Please review these terms before purchasing
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Similar Products */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">More from {product.category}</h3>
                    <Link to={`/category/${product.category}`} className="text-decoration-none">
                        View All <FaArrowRight size={14} />
                    </Link>
                </div>

                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Label className="fw-semibold">
                            Max Price: <FaRupeeSign size={12} />{filterPrice.toLocaleString()}
                        </Form.Label>
                        <Form.Range
                            min={0}
                            max={100000}
                            step={100}
                            value={filterPrice}
                            onChange={(e) => setFilterPrice(Number(e.target.value))}
                        />
                    </Col>
                    <Col md={6}>
                        <Form.Label className="fw-semibold">Sort By:</Form.Label>
                        <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="rating">Top Rated</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name-asc">Name A-Z</option>
                        </Form.Select>
                    </Col>
                </Row>

                {catLoading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : catError ? (
                    <Alert variant="warning">{catError}</Alert>
                ) : filteredAndSortedCategory.length === 0 ? (
                    <Alert variant="info">No products found in this category.</Alert>
                ) : (
                    <Row xs={1} sm={2} lg={4} className="g-4">
                        {filteredAndSortedCategory.map((p) => (
                            <Col key={p.id}>
                                <Card className="h-100 border-0 shadow-sm hover-shadow">
                                    <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
                                        <div className="d-flex justify-content-center align-items-center p-4" style={{ height: "200px", backgroundColor: '#f8f9fa' }}>
                                            <Card.Img
                                                src={p.images || p.image || "https://via.placeholder.com/150"}
                                                style={{ height: "150px", objectFit: "contain" }}
                                            />
                                        </div>
                                        <Card.Body>
                                            <Card.Title className="fw-bold text-truncate">{p.name || p.title}</Card.Title>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="fw-bold me-2">
                                                    {p.rating.rate.toFixed(1)}
                                                </span>
                                                {[...Array(5)].map((_, i) => (
                                                    i < Math.round(p.rating.rate) ?
                                                        <FaStar key={i} className="text-warning me-1" size={12} /> :
                                                        <FaRegStar key={i} className="text-muted me-1" size={12} />
                                                ))}
                                                <span className="text-muted small ms-2">({p.rating.count})</span>
                                            </div>
                                            {p.sellerId && (
                                                <div className="mb-2">
                                                    <Badge bg="light" text="dark" className="small">
                                                        <FaStore className="me-1" size={10} />
                                                        {p.sellerId.substring(0, 8)}...
                                                    </Badge>
                                                </div>
                                            )}
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <span className="fw-bold text-danger fs-5">
                                                    <FaRupeeSign size={14} />{p.priceINR}
                                                </span>
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="rounded-pill"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        dispatch(addToCart({
                                                            id: p.id,
                                                            title: p.name || p.title,
                                                            price: p.priceValue,
                                                            image: p.images || p.image,
                                                            quantity: 1,
                                                            sellerId: p.sellerId || "default_seller"
                                                        }));
                                                        toast.success(`Added "${p.name || p.title}" to cart!`, { position: "top-right", autoClose: 2000 });
                                                    }}
                                                >
                                                    <FaShoppingCart className="me-1" size={12} />
                                                    Add
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Link>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Reviews Section */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <Row>
                        <Col md={4} className="border-end">
                            <h3 className="fw-bold mb-4">Ratings & Reviews</h3>

                            {/* Average Rating */}
                            <div className="text-center mb-4">
                                <span className="display-1 fw-bold">{reviewsData.averageRating.toFixed(1)}</span>
                                <div className="my-2">
                                    {[...Array(5)].map((_, i) => (
                                        i < Math.round(reviewsData.averageRating) ?
                                            <FaStar key={i} className="text-warning mx-1" size={20} /> :
                                            <FaRegStar key={i} className="text-muted mx-1" size={20} />
                                    ))}
                                </div>
                                <p className="text-muted mb-0">{reviewsData.totalRatings} total ratings</p>
                            </div>

                            {/* Rating Distribution */}
                            <div className="mb-4">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = reviewsData.distribution[star];
                                    const percentage = reviewsData.totalRatings > 0 ? (count / reviewsData.totalRatings) * 100 : 0;
                                    return (
                                        <div key={star} className="d-flex align-items-center mb-2">
                                            <span className="me-2" style={{ minWidth: '40px' }}>{star} <FaStar className="text-warning ms-1" size={12} /></span>
                                            <div className="flex-grow-1 mx-2">
                                                <div style={styles.ratingBar}>
                                                    <div style={{ ...styles.ratingBarFill, width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                            <span className="text-muted small" style={{ minWidth: '40px' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Write Review Button */}
                            <div className="text-center">
                                <h5 className="fw-bold mb-3">Share Your Experience</h5>
                                <p className="text-muted small mb-3">Help other customers make better decisions</p>
                                <Button
                                    variant="dark"
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
                            <h3 className="fw-bold mb-4">Customer Reviews</h3>

                            {reviewsData.reviews.length === 0 ? (
                                <div className="text-center py-5 bg-light rounded">
                                    <FaRegStar size={40} className="text-muted mb-3" />
                                    <h5 className="text-muted">No reviews yet</h5>
                                    <p className="text-muted small">Be the first to review this product</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {reviewsData.reviews.map((review, index) => (
                                        <div key={index} className="border-bottom pb-4 mb-4">
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
                                                        <div className="bg-secondary bg-opacity-10 rounded-circle p-2 me-2">
                                                            <FaUser size={14} className="text-secondary" />
                                                        </div>
                                                        <span className="fw-semibold me-2">{review.userName || 'Customer'}</span>
                                                        <span className="text-muted small">
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

                                            <p className="mb-3" style={{ lineHeight: '1.8' }}>{review.comment}</p>

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

            {/* Product Suggestions */}
            {product && <ProductSuggestions currentProductId={product.id} category={product.category} />}

            {/* Custom CSS for hover effects */}
            <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
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
      `}</style>
        </Container>
    );
}

export default ProductDetailPage;