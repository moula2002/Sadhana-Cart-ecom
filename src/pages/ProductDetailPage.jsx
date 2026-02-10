import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Card, Button, Form, InputGroup, Modal, Badge, Accordion, Image } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaStar, FaRegStar, FaTruck, FaFileContract, FaCalendarAlt, FaShieldAlt, FaHeart, FaRegHeart, FaEdit, FaTrash, FaCamera, FaTimes, FaExpand } from 'react-icons/fa';
import { db, storage } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where, limit, addDoc, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ProductSuggestions from "../pages/ProductSuggestions";

const EXCHANGE_RATE = 1;
const auth = getAuth();

function ProductDetailPage() {
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

    // ⭐ Quantity state
    const [quantity, setQuantity] = useState(1);

    // 🚀 Variant (Size/Stock) states - Now dynamic
    const [productVariants, setProductVariants] = useState([]);
    const [selectedSize, setSelectedSize] = useState("N/A");

    // ⭐ MERGED REVIEWS: Reviews and Ratings State
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

    // 🆕 Image Viewer Modal State
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [currentReviewImages, setCurrentReviewImages] = useState([]);

    // 🆕 Seller Information State
    const [sellerInfo, setSellerInfo] = useState({
        currentProductSeller: null,
        allSellers: [],
        loadingSellers: false
    });

    // 🆕 Delivery & Terms State
    const [deliveryTerms, setDeliveryTerms] = useState({
        deliveryDate: "",
        termsConditions: "",
        loading: false
    });

    // 🆕 Wishlist State
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlistId, setWishlistId] = useState(null);

    // 🆕 Reset function for product-specific states
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
        // 🆕 Reset image viewer states
        setShowImageModal(false);
        setSelectedImage(null);
        setSelectedImageIndex(0);
        setCurrentReviewImages([]);
    }, []);

    // 🆕 Use effect to reset when product ID changes
    useEffect(() => {
        resetProductStates();
        setLoading(true);
        setError(null);
        setCategoryProducts([]);
        setCatLoading(true);
        setCatError(null);
    }, [id, resetProductStates]);

    const styles = {
        productDetailContainer: {
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            marginTop: "25px",
        },
        detailImg: {
            maxHeight: "400px",
            width: "auto",
            objectFit: "contain",
            transition: "transform 0.3s ease-in-out",
        },
        productImageCol: {
            borderRight: "1px solid #eee",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        },
        productPrice: {
            fontSize: "2.2rem",
            fontWeight: 800,
            color: "#dc3545",
            marginTop: "15px",
            marginBottom: "15px",
        },
        thumbnail: {
            width: "60px",
            height: "60px",
            objectFit: "contain",
            cursor: "pointer",
            border: "1px solid #ddd",
            margin: "0 5px",
            padding: "3px",
            transition: "border-color 0.2s",
        },
        activeThumbnail: {
            borderColor: "#dc3545",
            boxShadow: "0 0 5px rgba(220, 53, 69, 0.5)",
        },
        sizeButton: {
            padding: '8px 15px',
            marginRight: '10px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            color: '#333',
            cursor: 'pointer',
            borderRadius: '5px',
            minWidth: '50px',
            textAlign: 'center',
            transition: 'all 0.1s',
            fontWeight: '600',
        },
        activeSizeButton: {
            borderColor: '#333',
            backgroundColor: '#f8f8f8',
            boxShadow: '0 0 0 2px #333',
        },
        outOfStock: {
            backgroundColor: '#f0f0f0',
            color: '#999',
            cursor: 'not-allowed',
            textDecoration: 'line-through'
        },
        sellerBadge: {
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: '600'
        },
        wishlistButton: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.8rem',
            transition: 'transform 0.2s'
        },
        wishlistButtonHover: {
            transform: 'scale(1.1)'
        },
        reviewImage: {
            width: '80px',
            height: '80px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginRight: '10px',
            marginBottom: '10px',
            cursor: 'pointer',
            border: '2px solid #ddd',
            transition: 'all 0.3s'
        },
        reviewImageHover: {
            transform: 'scale(1.05)',
            borderColor: '#007bff'
        },
        imagePreviewContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '10px'
        },
        imagePreview: {
            width: '100px',
            height: '100px',
            objectFit: 'cover',
            borderRadius: '8px',
            position: 'relative'
        },
        removeImageBtn: {
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            border: '1px solid #ddd'
        },
        // 🆕 Image Viewer Modal Styles
        imageModalContent: {
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            margin: 'auto',
            display: 'block'
        },
        thumbnailContainer: {
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '20px'
        },
        modalThumbnail: {
            width: '60px',
            height: '60px',
            objectFit: 'cover',
            borderRadius: '5px',
            cursor: 'pointer',
            border: '2px solid transparent',
            opacity: 0.7,
            transition: 'all 0.3s'
        },
        activeModalThumbnail: {
            borderColor: '#007bff',
            opacity: 1,
            transform: 'scale(1.1)'
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

    // 🆕 Function to open image viewer
    const openImageViewer = (images, index = 0) => {
        setCurrentReviewImages(images);
        setSelectedImage(images[index]);
        setSelectedImageIndex(index);
        setShowImageModal(true);
    };

    // 🆕 Function to navigate to next image
    const nextImage = () => {
        if (currentReviewImages.length > 0) {
            const nextIndex = (selectedImageIndex + 1) % currentReviewImages.length;
            setSelectedImage(currentReviewImages[nextIndex]);
            setSelectedImageIndex(nextIndex);
        }
    };

    // 🆕 Function to navigate to previous image
    const prevImage = () => {
        if (currentReviewImages.length > 0) {
            const prevIndex = (selectedImageIndex - 1 + currentReviewImages.length) % currentReviewImages.length;
            setSelectedImage(currentReviewImages[prevIndex]);
            setSelectedImageIndex(prevIndex);
        }
    };

    // 🆕 Function to select image from thumbnails
    const selectImage = (image, index) => {
        setSelectedImage(image);
        setSelectedImageIndex(index);
    };

    // 🆕 Function to close image viewer
    const closeImageViewer = () => {
        setShowImageModal(false);
        setSelectedImage(null);
        setSelectedImageIndex(0);
        setCurrentReviewImages([]);
    };

    // 🆕 Function to check if product is in wishlist
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

    // 🆕 Effect to check wishlist when user or product changes
    useEffect(() => {
        if (currentUser && product) {
            checkWishlistStatus();
        }
    }, [currentUser, product, checkWishlistStatus]);

    // 🆕 Function to add to wishlist
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

    // 🆕 Function to remove from wishlist
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

    // 🆕 Function to toggle wishlist
    const toggleWishlist = () => {
        if (isInWishlist) {
            removeFromWishlist();
        } else {
            addToWishlist();
        }
    };

    // 🆕 Function to fetch seller information
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

    // 🆕 Function to fetch delivery and terms information
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

    // 🆕 Function to handle image upload
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

    // 🆕 Function to remove image from preview
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

    // 🆕 Function to open edit review modal
    const handleEditReview = (review) => {
        setEditingReview(review);
        setEditRating(review.rating);
        setEditText(review.comment || '');
        setEditImageUrls(Array.isArray(review.images) ? review.images : review.image ? [review.image] : []);
        setShowEditModal(true);
    };

    // 🆕 Function to close edit review modal
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingReview(null);
        setEditRating(0);
        setEditText('');
        setEditImageUrls([]);
        setDeletingImages([]);
    };

    // 🆕 Function to submit edited review
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

    // 🆕 Function to delete review
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

    // 🆕 Function to mark image for deletion in edit mode
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

    // 🆕 Helper function to format delivery date info
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

    // 🆕 Helper function to parse terms conditions
    const parseTermsConditions = (termsConditions) => {
        if (!termsConditions || termsConditions.trim() === "") return [];

        const lines = termsConditions.split(/\n|(?=\d+\.)/).filter(line => line.trim() !== "");

        if (lines.length === 1 && !/\d+\./.test(termsConditions)) {
            return [termsConditions];
        }

        return lines;
    };

    // 🆕 Check if delivery or terms info exists
    const hasDeliveryInfo = deliveryTerms.deliveryDate && deliveryTerms.deliveryDate.trim() !== "";
    const hasTermsInfo = deliveryTerms.termsConditions && deliveryTerms.termsConditions.trim() !== "";

    // --- Render Checks ---
    if (loading || !isAuthReady)
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    if (error) return <Alert variant="danger" className="mt-4 text-center">{error}</Alert>;
    if (!product) return <p className="text-center py-5">No product found.</p>;

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
            <ToastContainer />

            <Card style={styles.productDetailContainer} className="p-4 mb-5">
                <Row>
                    <Col md={5} style={styles.productImageCol}>
                        <img src={mainImage} alt={product.name} className="img-fluid mb-3" style={styles.detailImg} />
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

                    <Col md={7}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h2 className="fw-bold">{product.name || product.title}</h2>
                                <p className="text-primary fw-semibold text-uppercase">{product.category}</p>
                            </div>

                            {/* 🆕 Wishlist Heart Button */}
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

                        {/* 🆕 Display Seller Information if available */}
                        {sellerInfo.currentProductSeller && (
                            <div className="mb-3">
                                {sellerInfo.currentProductSeller.rating > 0 && (
                                    <span className="ms-2 small">
                                        <FaStar className="text-warning" size={12} /> {sellerInfo.currentProductSeller.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="product-rating mb-3">
                            <span className="text-warning fw-bold me-2">
                                {rating.rate.toFixed(1)} <i className="fas fa-star small"></i>
                            </span>
                            <span className="text-muted small">({rating.count} reviews)</span>
                        </div>
                        <hr />
                        <h2 style={styles.productPrice}>
                            ₹{calculatedPriceINR} /-
                            <small className="text-muted ms-3 fs-6 text-decoration-line-through">₹{calculatedOriginalPriceINR}</small>
                        </h2>
                        <span className="badge bg-danger fs-6 mb-3">{discountPercentage}% OFF!</span>
                        <p className="text-muted small">{product.description || "No description available."}</p>

                        {/* 🚀 Size Selector */}
                        <div className="mb-4 pt-3 border-top">
                            {sortedVariants.length > 0 && (
                                <Form.Label className="fw-semibold">Select Size:</Form.Label>
                            )}
                            <div className="d-flex align-items-center flex-wrap">
                                {sortedVariants.length > 0 ? (
                                    sortedVariants.map((variant) => (
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
                                    ))
                                ) : (
                                    null
                                )}
                            </div>
                        </div>

                        {/* ⭐ Quantity Selector */}
                        <div className="mb-4 pt-3 border-top">
                            <Form.Label className="fw-semibold">Quantity:</Form.Label>
                            <InputGroup style={{ width: '150px' }}>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={isOutOfStock}
                                >
                                    -
                                </Button>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    style={{ textAlign: 'center' }}
                                    disabled={isOutOfStock}
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleIncrementQuantity}
                                    disabled={isOutOfStock}
                                >
                                    +
                                </Button>
                            </InputGroup>
                        </div>

                        {/* 🆕 Display Delivery Information from Firebase */}
                        <div className="mb-3">
                            {hasDeliveryInfo ? (
                                <div className="d-flex align-items-center">
                                    <FaTruck className="text-success me-2" />
                                    <span className="text-success fw-semibold">
                                        {formatDeliveryInfo(deliveryTerms.deliveryDate)}
                                        <span className="delivery-date-badge ms-2">
                                            <FaCalendarAlt className="me-1" />
                                        </span>
                                    </span>
                                </div>
                            ) : (
                                <div className="d-flex align-items-center">
                                    <FaTruck className="text-secondary me-2" />
                                    <span className="text-muted">Standard delivery: 2–5 Business Days</span>
                                </div>
                            )}
                        </div>

                        <hr />
                        <div className="d-grid gap-3 d-md-block pt-3 border-top mt-4">
                            <Button
                                variant="warning"
                                className="fw-bold me-3"
                                onClick={handleAddToCart}
                                disabled={isCartBuyDisabled}
                            >
                                <i className="fas fa-shopping-cart me-2"></i> ADD TO CART
                            </Button>
                            <Button
                                variant="success"
                                className="fw-bold"
                                onClick={handleBuyNow}
                                disabled={productVariants.length > 0 && (!selectedSize || isOutOfStock) || (!productVariants.length && isOutOfStock)}
                            >
                                <i className="fas fa-bolt me-2"></i> BUY NOW
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* 🆕 Delivery & Terms Information Section */}
            {(hasDeliveryInfo || hasTermsInfo) && (
                <Card className="mb-5 border-0 shadow-sm">
                    <Card.Body>
                        <h3 className="fw-bold mb-4">
                            <FaShieldAlt className="text-primary me-2" />
                            Product Information & Policies
                        </h3>

                        <Row>
                            {/* Delivery Information */}
                            {hasDeliveryInfo && (
                                <Col md={6} className="mb-4 mb-md-0">
                                    <div className="border rounded p-3 h-100">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                                                <FaTruck className="text-primary" size={20} />
                                            </div>
                                            <h5 className="mb-0 fw-bold">Delivery Information</h5>
                                        </div>
                                        <div className="ms-5">
                                            <p className="mb-2">
                                                <strong>Delivery Timeline:</strong>
                                            </p>
                                            <div className="alert alert-success py-2">
                                                <FaCalendarAlt className="me-2" />
                                                {deliveryTerms.deliveryDate.includes("day") || deliveryTerms.deliveryDate.includes("Day")
                                                    ? deliveryTerms.deliveryDate
                                                    : `Delivery within ${deliveryTerms.deliveryDate} days`}
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
                                <Col md={6}>
                                    <div className="border rounded p-3 h-100">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-3">
                                                <FaFileContract className="text-warning" size={20} />
                                            </div>
                                            <h5 className="mb-0 fw-bold">Terms & Conditions</h5>
                                        </div>
                                        <div className="ms-5">
                                            <p className="mb-2">
                                                <strong>Product Policies:</strong>
                                            </p>
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

                        {/* Accordion for mobile view */}
                        <div className="d-md-none mt-3">
                            <Accordion>
                                {hasDeliveryInfo && (
                                    <Accordion.Item eventKey="0">
                                        <Accordion.Header>
                                            <FaTruck className="text-primary me-2" />
                                            Delivery Information
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="alert alert-success py-2">
                                                <FaCalendarAlt className="me-2" />
                                                {deliveryTerms.deliveryDate.includes("day") || deliveryTerms.deliveryDate.includes("Day")
                                                    ? deliveryTerms.deliveryDate
                                                    : `Delivery within ${deliveryTerms.deliveryDate} days`}
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                )}
                                {hasTermsInfo && (
                                    <Accordion.Item eventKey="1">
                                        <Accordion.Header>
                                            <FaFileContract className="text-warning me-2" />
                                            Terms & Conditions
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="terms-content" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                {parseTermsConditions(deliveryTerms.termsConditions).map((term, index) => (
                                                    <div key={index} className="mb-2 d-flex">
                                                        <span className="text-primary me-2">•</span>
                                                        <span>{term.trim()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                )}
                            </Accordion>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Similar Products */}
            <h3 className="mb-4 fw-bold">More from the {product.category} category</h3>

            <Row className="mb-3 align-items-end">
                <Col md={4}>
                    <Form.Label>Max Price (₹): ₹{filterPrice.toLocaleString()}</Form.Label>
                    <Form.Range min={0} max={100000} step={100} value={filterPrice} onChange={(e) => setFilterPrice(Number(e.target.value))} />
                </Col>
                <Col md={4}>
                    <Form.Label>Sort By:</Form.Label>
                    <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="rating">Top Rated</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Name A-Z</option>
                    </Form.Select>
                </Col>
            </Row>

            {catLoading ? (
                <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                </div>
            ) : catError ? (
                <Alert variant="warning">{catError}</Alert>
            ) : filteredAndSortedCategory.length === 0 ? (
                <Alert variant="info">No products found in this category.</Alert>
            ) : (
                <Row xs={1} sm={2} lg={4} className="g-4">
                    {filteredAndSortedCategory.map((p) => (
                        <Col key={p.id}>
                            <Card className="h-100 shadow-sm border-0">
                                <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
                                    <div className="d-flex justify-content-center align-items-center p-3" style={{ height: "150px" }}>
                                        <Card.Img src={p.images || p.image || "https://via.placeholder.com/120"} style={{ height: "120px", objectFit: "contain" }} />
                                    </div>
                                    <Card.Body>
                                        <Card.Title className="fs-6 fw-bold text-truncate">{p.name || p.title}</Card.Title>
                                        <div className="d-flex align-items-center mb-2">
                                            <span className="text-warning fw-bold me-2">
                                                {p.rating.rate.toFixed(1)} <i className="fas fa-star small"></i>
                                            </span>
                                            <span className="text-muted small">({p.rating.count})</span>
                                        </div>
                                        {/* 🆕 Display seller info for similar products */}
                                        {p.sellerId && (
                                            <div className="mb-2">
                                                <small className="text-muted">Seller: </small>
                                                <Badge bg="light" text="dark" className="ms-1 small">
                                                    {p.sellerId}
                                                </Badge>
                                            </div>
                                        )}
                                        <Card.Text className="fw-bold text-danger fs-5 mt-auto">₹{p.priceINR}</Card.Text>
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="mt-2"
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
                                            Add to Cart
                                        </Button>
                                    </Card.Body>
                                </Link>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Reviews Section */}
            <Card className="p-4 mt-5 border-0 shadow-sm">
                <Row>
                    <Col md={4} className="border-end">
                        <h3 className="fw-bold mb-4">Ratings</h3>
                        <div className="d-flex align-items-center mb-3">
                            <span className="display-4 fw-bold me-3">{reviewsData.averageRating.toFixed(1)}</span>
                            <div>
                                <p className="mb-0 fw-bold">{reviewsData.totalRatings} Product Ratings</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            {Object.entries(reviewsData.distribution).sort(([a], [b]) => b - a).map(([star, count]) => {
                                const total = reviewsData.totalRatings;
                                const percentage = total > 0 ? (count / total) * 100 : 0;
                                return (
                                    <Row key={star} className="align-items-center my-1 g-1">
                                        <Col xs={1} className="text-end small text-muted">{star}<FaStar className="text-warning ms-1" size={10} /></Col>
                                        <Col xs={9}>
                                            <div className="progress" style={{ height: '8px', backgroundColor: '#e9ecef' }}>
                                                <div
                                                    className="progress-bar bg-warning"
                                                    role="progressbar"
                                                    style={{ width: `${percentage}%` }}
                                                    aria-valuenow={percentage}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                ></div>
                                            </div>
                                        </Col>
                                        <Col xs={2} className="text-start small text-muted ps-2">{count}</Col>
                                    </Row>
                                )
                            })}
                        </div>

                        <h4 className="fw-bold mt-4 mb-3">Review this product</h4>
                        <p className="text-muted small">Share your thoughts with other customers</p>
                        <Button
                            variant="dark"
                            onClick={handleWriteReviewClick}
                            className="fw-bold"
                        >
                            Write a review
                        </Button>
                    </Col>

                    {/* Reviews List */}
                    <Col md={8} className="ps-md-5">
                        <h3 className="fw-bold mb-4">Reviews</h3>

                        {reviewsData.reviews.length === 0 ? (
                            <div className="p-3 text-center" style={{ backgroundColor: '#e6f7ff', borderRadius: '5px' }}>
                                <p className="text-info fw-semibold mb-0">There are no reviews yet.</p>
                            </div>
                        ) : (
                            reviewsData.reviews.map((review, index) => (
                                <div key={index} className="border-bottom pb-3 mb-3">
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <div className="d-flex align-items-center">
                                            {[...Array(5)].map((_, i) => (
                                                i < review.rating ? <FaStar key={i} className="text-warning me-1" size={14} /> : <FaRegStar key={i} className="text-muted me-1" size={14} />
                                            ))}
                                            <span className="fw-bold ms-2"></span>
                                        </div>

                                        {/* Edit/Delete buttons for user's own reviews */}
                                        {currentUser && review.userId === currentUser.uid && (
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleEditReview(review)}
                                                    title="Edit Review"
                                                >
                                                    <FaEdit size={12} />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    title="Delete Review"
                                                >
                                                    <FaTrash size={12} />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mb-1 small text-muted">by {review.userName || 'Customer'} on {new Date(review.date).toLocaleDateString()}</p>
                                    <p className="small mb-3">{review.comment}</p>

                                    {/* Display Review Images */}
                                    {review.images && review.images.length > 0 && (
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                            {review.images.map((img, imgIndex) => (
                                                <Image
                                                    key={imgIndex}
                                                    src={img}
                                                    alt={`Review ${index + 1} - Image ${imgIndex + 1}`}
                                                    style={styles.reviewImage}
                                                    onClick={() => openImageViewer(review.images, imgIndex)}
                                                    title="Click to view full size"
                                                    className="review-thumbnail"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </Col>
                </Row>
            </Card>

            {/* 🆕 Image Viewer Modal */}
            <Modal
                show={showImageModal}
                onHide={closeImageViewer}
                centered
                size="lg"
                fullscreen="md-down"
                className="image-viewer-modal"
            >
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold small">
                        Image {selectedImageIndex + 1} of {currentReviewImages.length}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    <div className="position-relative">
                        {/* Previous Button */}
                        {currentReviewImages.length > 1 && (
                            <Button
                                variant="light"
                                className="position-absolute start-0 top-50 translate-middle-y ms-3 rounded-circle"
                                onClick={prevImage}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                }}
                            >
                                <i className="fas fa-chevron-left"></i>
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
                                className="position-absolute end-0 top-50 translate-middle-y me-3 rounded-circle"
                                onClick={nextImage}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                }}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </Button>
                        )}

                        {/* Expand Icon */}
                        <div className="position-absolute top-0 end-0 m-3">
                            <FaExpand
                                className="text-white bg-dark bg-opacity-50 rounded p-1"
                                size={24}
                                style={{ cursor: 'pointer' }}
                                onClick={() => window.open(selectedImage, '_blank')}
                                title="Open in new tab"
                            />
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
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Write a Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitReview}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Your Rating</Form.Label>
                            <div>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => setUserRating(star)}
                                        style={{ cursor: 'pointer' }}
                                        className="me-1"
                                    >
                                        {star <= userRating ? <FaStar className="text-warning" size={24} /> : <FaRegStar className="text-muted" size={24} />}
                                    </span>
                                ))}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Your Review</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="What did you like or dislike about the product?"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Image Upload Section */}
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
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
                                You can upload multiple images. Maximum 5 images allowed.
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
                                                thumbnail
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
                                <div className="mt-2">
                                    <Spinner animation="border" size="sm" />
                                    <span className="ms-2">Uploading images...</span>
                                </div>
                            )}
                        </Form.Group>

                        <div className="d-flex gap-2">
                            <Button variant="danger" type="submit" disabled={userRating === 0 || uploadingImages}>
                                {uploadingImages ? 'Uploading...' : 'Submit Review'}
                            </Button>
                            <Button variant="secondary" onClick={handleCloseReviewModal}>
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit Review Modal */}
            <Modal show={showEditModal} onHide={handleCloseEditModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Edit Review</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitEditReview}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Your Rating</Form.Label>
                            <div>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => setEditRating(star)}
                                        style={{ cursor: 'pointer' }}
                                        className="me-1"
                                    >
                                        {star <= editRating ? <FaStar className="text-warning" size={24} /> : <FaRegStar className="text-muted" size={24} />}
                                    </span>
                                ))}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Your Review</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="What did you like or dislike about the product?"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Edit Image Upload Section */}
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
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
                                You can add new images or remove existing ones.
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
                                                thumbnail
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
                                <Alert variant="warning" className="mt-2 py-2">
                                    <FaTrash className="me-2" />
                                    {deletingImages.length} image(s) will be deleted
                                </Alert>
                            )}

                            {uploadingImages && (
                                <div className="mt-2">
                                    <Spinner animation="border" size="sm" />
                                    <span className="ms-2">Uploading images...</span>
                                </div>
                            )}
                        </Form.Group>

                        <div className="d-flex gap-2">
                            <Button variant="danger" type="submit" disabled={editRating === 0 || uploadingImages}>
                                {uploadingImages ? 'Uploading...' : 'Update Review'}
                            </Button>
                            <Button variant="secondary" onClick={handleCloseEditModal}>
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {product && <ProductSuggestions currentProductId={product.id} category={product.category} />}
        </Container>
    );
}

export default ProductDetailPage;