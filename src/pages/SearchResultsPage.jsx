// pages/SearchResultsPage.jsx

import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Badge,
  Button,
} from "react-bootstrap";
import { useLocation, Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { 
  FaStar, 
  FaRupeeSign, 
  FaFilter, 
  FaShoppingBag,
  FaSearch,
  FaBoxOpen 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./SearchResultsPage.css";

const SearchResultsPage = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams(location.search);
  const category = params.get("category");
  const maxPrice = params.get("maxPrice");
  const rating = params.get("rating");
  const sortBy = params.get("sortBy");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "products"));

        let productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ CATEGORY FILTER (Safe for string or object)
        if (category) {
          productList = productList.filter((p) => {
            if (!p.category) return false;

            if (typeof p.category === "string") {
              return p.category.toLowerCase() === category.toLowerCase();
            }

            if (typeof p.category === "object" && p.category.category) {
              return (
                p.category.category.toLowerCase() === category.toLowerCase()
              );
            }

            return false;
          });
        }

        // ✅ MAX PRICE
        if (maxPrice) {
          productList = productList.filter(
            (p) => Number(p.price) <= Number(maxPrice)
          );
        }

        // ✅ RATING
        if (rating) {
          productList = productList.filter(
            (p) => Number(p.rating) >= Number(rating)
          );
        }

        // ✅ SORTING
        if (sortBy === "priceLow") {
          productList.sort((a, b) => a.price - b.price);
        }

        if (sortBy === "priceHigh") {
          productList.sort((a, b) => b.price - a.price);
        }

        if (sortBy === "rating") {
          productList.sort((a, b) => b.rating - a.rating);
        }

        setProducts(productList);
      } catch (error) {
        console.error("Firestore Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [location.search]);

  // Helper function to format category name
  const formatCategory = (cat) => {
    if (!cat) return "";
    if (typeof cat === "object" && cat.category) return cat.category;
    return cat;
  };

  if (loading) {
    return (
      <div className="search-loading-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="loading-spinner-wrapper">
            <Spinner 
              animation="border" 
              variant="primary" 
              className="search-spinner"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="loading-text mt-3"
          >
            Finding the best products for you...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="search-results-page"
    >
      <Container className="py-5">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="search-header mb-5"
        >
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <div className="header-icon-wrapper">
                <FaSearch className="header-icon" />
              </div>
              <div className="ms-3">
                <h1 className="search-title mb-1">
                  {category ? `${formatCategory(category)}` : "All Products"}
                </h1>
                <div className="search-breadcrumb">
                  <span>Home</span>
                  <span className="mx-2">/</span>
                  <span className="text-muted">Search Results</span>
                </div>
              </div>
            </div>
            
            <div className="d-flex align-items-center">
              <div className="filter-badge me-3">
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <FaShoppingBag className="me-2" />
                  {products.length} {products.length === 1 ? 'Product' : 'Products'} Found
                </Badge>
              </div>
              
              <Button
                variant="outline-primary"
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-2" />
                Filters
                {showFilters ? ' Hide' : ' Show'}
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(category || maxPrice || rating || sortBy) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="active-filters mt-4"
            >
              <span className="me-2 text-muted">Active Filters:</span>
              {category && (
                <Badge bg="primary" className="filter-tag me-2">
                  Category: {formatCategory(category)}
                </Badge>
              )}
              {maxPrice && (
                <Badge bg="success" className="filter-tag me-2">
                  <FaRupeeSign className="me-1" />
                  Max: ₹{maxPrice}
                </Badge>
              )}
              {rating && (
                <Badge bg="warning" text="dark" className="filter-tag me-2">
                  <FaStar className="me-1" />
                  {rating}+ Stars
                </Badge>
              )}
              {sortBy && (
                <Badge bg="info" className="filter-tag me-2">
                  Sort: {sortBy === 'priceLow' ? 'Price: Low to High' : 
                         sortBy === 'priceHigh' ? 'Price: High to Low' : 
                         sortBy === 'rating' ? 'Top Rated' : sortBy}
                </Badge>
              )}
            </motion.div>
          )}
        </motion.div>

        {products.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Alert 
              variant="light" 
              className="no-products-alert text-center border-0 shadow-sm"
            >
              <div className="empty-state-wrapper">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FaBoxOpen className="empty-state-icon" />
                </motion.div>
                <h3 className="mt-4 fw-bold">No Products Found</h3>
                <p className="text-muted mb-4">
                  We couldn't find any products matching your criteria.
                </p>
                <Button 
                  as={Link} 
                  to="/" 
                  variant="primary" 
                  className="px-4 py-2"
                >
                  Browse All Products
                </Button>
              </div>
            </Alert>
          </motion.div>
        ) : (
          <Row>
            <AnimatePresence>
              {products.map((product, index) => (
                <Col md={4} key={product.id} className="mb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="h-100"
                  >
                    <Link
                      to={`/product/${product.id}`}
                      className="text-decoration-none"
                    >
                      <Card className="product-card h-100 shadow-sm">
                        <div className="product-image-wrapper">
                          <Card.Img
                            variant="top"
                            src={
                              product.images?.[0] ||
                              product.image ||
                              "https://via.placeholder.com/300/ffffff?text=Product+Image"
                            }
                            height="280"
                            className="product-image"
                          />
                          {product.discount && (
                            <Badge 
                              bg="danger" 
                              className="discount-badge"
                            >
                              {product.discount}% OFF
                            </Badge>
                          )}
                          {product.stock && product.stock < 10 && (
                            <Badge 
                              bg="warning" 
                              text="dark" 
                              className="stock-badge"
                            >
                              Only {product.stock} left
                            </Badge>
                          )}
                        </div>
                        
                        <Card.Body className="d-flex flex-column">
                          <div className="mb-2">
                            {product.category && (
                              <Badge 
                                bg="light" 
                                text="secondary" 
                                className="category-badge"
                              >
                                {typeof product.category === 'object' 
                                  ? product.category.category 
                                  : product.category}
                              </Badge>
                            )}
                          </div>
                          
                          <Card.Title className="product-title fw-bold mb-2">
                            {product.name || "Product Name"}
                          </Card.Title>

                          <div className="product-rating mb-2">
                            <div className="d-flex align-items-center">
                              <div className="rating-stars">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar
                                    key={i}
                                    className={`star-icon ${
                                      i < Math.floor(product.rating || 0)
                                        ? "filled"
                                        : "empty"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="rating-value ms-2">
                                {product.rating || 0}
                              </span>
                            </div>
                          </div>

                          <div className="product-price-wrapper mt-auto">
                            <div className="d-flex align-items-center">
                              <FaRupeeSign className="price-icon" />
                              <span className="product-price fw-bold">
                                {product.price || 0}
                              </span>
                            </div>
                            
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="view-product-btn"
                            >
                              View Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </motion.div>
                </Col>
              ))}
            </AnimatePresence>
          </Row>
        )}
      </Container>
    </motion.div>
  );
};

export default SearchResultsPage;   