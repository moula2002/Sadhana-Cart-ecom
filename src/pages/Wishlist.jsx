// Wishlist.jsx
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaHeart, FaShoppingCart, FaTrash, FaStar, FaTag } from 'react-icons/fa';
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();

function Wishlist() {
  const { t } = useTranslation();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        navigate('/login', { state: { from: '/wishlist' } });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(
          collection(db, "users", currentUser.uid, "favorites")
        );

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFavorites(data);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        toast.error("Failed to load wishlist", { position: "top-right" });
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser]);

  const removeFromWishlist = async (favId, productName) => {
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "favorites", favId));
      setFavorites(favorites.filter((item) => item.id !== favId));
      toast.success(`"${productName}" removed from wishlist`, { position: "top-right", autoClose: 2000 });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist", { position: "top-right" });
    }
  };

  const addToCartFromWishlist = (item) => {
    dispatch(
      addToCart({
        id: item.productId,
        title: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        size: item.size || null,
        sellerId: item.sellerId || "default_seller"
      })
    );
    toast.success(`"${item.name}" added to cart!`, { position: "top-right", autoClose: 2000 });
  };

  const moveAllToCart = () => {
    favorites.forEach(item => {
      dispatch(
        addToCart({
          id: item.productId,
          title: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
          size: item.size || null,
          sellerId: item.sellerId || "default_seller"
        })
      );
    });
    toast.success(`All ${favorites.length} items added to cart!`, { position: "top-right", autoClose: 3000 });
  };

  const clearWishlist = async () => {
    if (favorites.length === 0) return;

    try {
      for (const item of favorites) {
        await deleteDoc(doc(db, "users", currentUser.uid, "favorites", item.id));
      }
      setFavorites([]);
      toast.success("Wishlist cleared", { position: "top-right", autoClose: 2000 });
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      toast.error("Failed to clear wishlist", { position: "top-right" });
    }
  };

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">{t("wishlist.loading")}</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <ToastContainer />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold">
            <FaHeart className="text-danger me-2" />
            {t("wishlist.title")}
          </h1>
          <p className="text-muted">
            {t("wishlist.itemsSaved", { count: favorites.length })}
          </p>
        </div>

        {favorites.length > 0 && (
          <div>
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={moveAllToCart}
            >
              <FaShoppingCart className="me-2" />
              {t("wishlist.addAll")}
            </Button>
            <Button
              variant="outline-danger"
              onClick={clearWishlist}
            >
              <FaTrash className="me-2" />
              {t("wishlist.clearAll")}
            </Button>
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <FaHeart className="text-muted" size={80} />
            <h3 className="mt-4 mb-3">{t("wishlist.emptyTitle")}</h3>
            <p className="text-muted mb-4">
              {t("wishlist.emptySubtitle")}
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
              size="lg"
            >
              {t("wishlist.startShopping")}
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row xs={1} sm={2} lg={3} xl={4} className="g-4">
            {favorites.map((item) => {
              const discount = calculateDiscount(item.price, item.originalPrice);

              return (
                <Col key={item.id}>
                  <Card className="h-100 shadow-sm border-0">
                    <div className="position-relative">
                      <Link to={`/product/${item.productId}`}>
                        <Card.Img
                          variant="top"
                          src={item.image || "https://via.placeholder.com/300x200"}
                          alt={item.name}
                          style={{ height: "200px", objectFit: "contain", padding: "20px" }}
                          className="p-3"
                        />
                      </Link>
                      {discount > 0 && (
                        <Badge bg="danger" className="position-absolute top-0 start-0 m-2">
                          <FaTag className="me-1" />
                          {discount}% OFF
                        </Badge>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-2 rounded-circle"
                        onClick={() => removeFromWishlist(item.id, item.name)}
                        title={t("wishlist.remove")}
                      >
                        <FaTrash size={14} />
                      </Button>
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Link
                        to={`/product/${item.productId}`}
                        className="text-decoration-none text-dark"
                      >
                        <Card.Title className="fs-6 fw-bold text-truncate">
                          {item.name}
                        </Card.Title>
                        {item.category && (
                          <Badge bg="light" text="dark" className="mb-2">
                            {item.category}
                          </Badge>
                        )}
                      </Link>

                      <div className="mt-auto">
                        <div className="d-flex align-items-center mb-2">
                          <span className="text-danger fw-bold fs-5">₹{item.price}</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-muted text-decoration-line-through ms-2">
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>

                        {item.size && (
                          <div className="mb-3">
                            <small className="text-muted"><small className="text-muted">{t("wishlist.size")}</small> </small>
                            <Badge bg="secondary" className="ms-1">
                              {item.size}
                            </Badge>
                          </div>
                        )}

                        <div className="d-grid gap-2">
                          <Button
                            variant="warning"
                            onClick={() => addToCartFromWishlist(item)}
                          >
                            <FaShoppingCart className="me-2" />
                            {t("wishlist.addToCart")}
                          </Button>
                          <Button
                            variant="outline-dark"
                            onClick={() => navigate(`/product/${item.productId}`)}
                          >
                            {t("wishlist.viewDetails")}
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </Container>
  );
}

export default Wishlist;