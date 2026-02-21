// pages/AdvancedSearchPage.jsx

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { 
  FaSearch, 
  FaFilter, 
  FaTag, 
  FaRupeeSign, 
  FaStar, 
  FaSortAmountDown,
  FaTimes,
  FaChevronRight,
  FaSlidersH
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./AdvancedSearchPage.css";

const AdvancedSearchPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const [filters, setFilters] = useState({
    category: "",
    maxPrice: "",
    rating: "",
    sortBy: "",
  });

  // Fetch categories from category collection
  useEffect(() => {
    const fetchCategories = async () => {
      const snapshot = await getDocs(collection(db, "category"));
      const categoryList = snapshot.docs.map(doc => doc.data().name);
      setCategories(categoryList);
      setLoading(false);
    };

    fetchCategories();
  }, []);

  // Update active filter count
  useEffect(() => {
    const count = Object.values(filters).filter(value => value !== "").length;
    setActiveFilterCount(count);
  }, [filters]);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Remove empty values from URL
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );

    const params = new URLSearchParams(cleanFilters).toString();
    navigate(`/search-results?${params}`);
  };

  const clearAllFilters = () => {
    setFilters({
      category: "",
      maxPrice: "",
      rating: "",
      sortBy: "",
    });
  };

  const clearFilter = (filterName) => {
    setFilters({
      ...filters,
      [filterName]: "",
    });
  };

  if (loading) {
    return (
      <div className="advanced-search-loading">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="loading-spinner-advanced">
            <Spinner 
              animation="border" 
              variant="primary" 
              className="advanced-spinner"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="loading-text-advanced mt-3"
          >
            Loading categories...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="advanced-search-wrapper"
    >
      <Container fluid className="px-4 py-5 advanced-search-container">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="advanced-search-card border-0 shadow-lg">
                {/* Header Section */}
                <Card.Header className="advanced-search-header border-0">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="header-icon-container">
                        <FaSlidersH className="header-icon" />
                      </div>
                      <div className="ms-3">
                        <h2 className="text-white mb-1 fw-bold">
                          Advanced Search
                        </h2>
                        <p className="text-white-50 mb-0">
                          Find exactly what you're looking for
                        </p>
                      </div>
                    </div>
                    
                    {activeFilterCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="active-filters-badge"
                      >
                        <Badge className="filter-count-badge">
                          {activeFilterCount} Active {activeFilterCount === 1 ? 'Filter' : 'Filters'}
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </Card.Header>

                <Card.Body className="advanced-search-body p-4 p-lg-5">
                  {/* Active Filters Display */}
                  <AnimatePresence>
                    {activeFilterCount > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="active-filters-container mb-4"
                      >
                        <div className="d-flex flex-wrap align-items-center">
                          <span className="active-filters-label me-3">
                            <FaFilter className="me-2" />
                            Active Filters:
                          </span>
                          
                          {filters.category && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="filter-badge-wrapper"
                            >
                              <Badge className="filter-badge-active">
                                <FaTag className="me-2" />
                                {filters.category}
                                <Button
                                  variant="link"
                                  className="filter-remove-btn p-0 ms-2"
                                  onClick={() => clearFilter('category')}
                                >
                                  <FaTimes />
                                </Button>
                              </Badge>
                            </motion.div>
                          )}
                          
                          {filters.maxPrice && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="filter-badge-wrapper"
                            >
                              <Badge className="filter-badge-active">
                                <FaRupeeSign className="me-1" />
                                Max: ₹{filters.maxPrice}
                                <Button
                                  variant="link"
                                  className="filter-remove-btn p-0 ms-2"
                                  onClick={() => clearFilter('maxPrice')}
                                >
                                  <FaTimes />
                                </Button>
                              </Badge>
                            </motion.div>
                          )}
                          
                          {filters.rating && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="filter-badge-wrapper"
                            >
                              <Badge className="filter-badge-active">
                                <FaStar className="me-2" />
                                {filters.rating}★ & above
                                <Button
                                  variant="link"
                                  className="filter-remove-btn p-0 ms-2"
                                  onClick={() => clearFilter('rating')}
                                >
                                  <FaTimes />
                                </Button>
                              </Badge>
                            </motion.div>
                          )}
                          
                          {filters.sortBy && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="filter-badge-wrapper"
                            >
                              <Badge className="filter-badge-active">
                                <FaSortAmountDown className="me-2" />
                                {filters.sortBy === 'priceLow' ? 'Price: Low to High' :
                                 filters.sortBy === 'priceHigh' ? 'Price: High to Low' :
                                 filters.sortBy === 'rating' ? 'Top Rated' : filters.sortBy}
                                <Button
                                  variant="link"
                                  className="filter-remove-btn p-0 ms-2"
                                  onClick={() => clearFilter('sortBy')}
                                >
                                  <FaTimes />
                                </Button>
                              </Badge>
                            </motion.div>
                          )}
                          
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ms-auto"
                          >
                            <Button
                              variant="link"
                              className="clear-all-btn"
                              onClick={clearAllFilters}
                            >
                              Clear All
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Form onSubmit={handleSubmit}>
                    <Row className="g-4">
                      {/* Category Filter */}
                      <Col lg={6}>
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Form.Group className="filter-group">
                            <div className="filter-label-wrapper">
                              <FaTag className="filter-icon" />
                              <Form.Label className="filter-label">
                                Category
                              </Form.Label>
                            </div>
                            <Form.Select
                              name="category"
                              value={filters.category}
                              onChange={handleChange}
                              className="filter-select"
                              size="lg"
                            >
                              <option value="">All Categories</option>
                              {categories.map((cat, i) => (
                                <option key={i} value={cat}>{cat}</option>
                              ))}
                            </Form.Select>
                            <div className="filter-hint">
                              Select a specific category
                            </div>
                          </Form.Group>
                        </motion.div>
                      </Col>

                      {/* Max Price Filter */}
                      <Col lg={6}>
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Form.Group className="filter-group">
                            <div className="filter-label-wrapper">
                              <FaRupeeSign className="filter-icon" />
                              <Form.Label className="filter-label">
                                Maximum Price
                              </Form.Label>
                            </div>
                            <div className="price-input-wrapper">
                              <span className="price-currency">₹</span>
                              <Form.Control
                                type="number"
                                name="maxPrice"
                                value={filters.maxPrice}
                                onChange={handleChange}
                                className="filter-input price-input"
                                placeholder="Enter max price"
                                size="lg"
                              />
                            </div>
                            <div className="filter-hint">
                              Products under this price
                            </div>
                          </Form.Group>
                        </motion.div>
                      </Col>

                      {/* Rating Filter */}
                      <Col lg={6}>
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Form.Group className="filter-group">
                            <div className="filter-label-wrapper">
                              <FaStar className="filter-icon" />
                              <Form.Label className="filter-label">
                                Minimum Rating
                              </Form.Label>
                            </div>
                            <Form.Select
                              name="rating"
                              value={filters.rating}
                              onChange={handleChange}
                              className="filter-select"
                              size="lg"
                            >
                              <option value="">Any Rating</option>
                              <option value="4">4★ & above (Excellent)</option>
                              <option value="3">3★ & above (Good)</option>
                              <option value="2">2★ & above (Average)</option>
                            </Form.Select>
                            <div className="filter-hint">
                              Customer satisfaction level
                            </div>
                          </Form.Group>
                        </motion.div>
                      </Col>

                      {/* Sort By Filter */}
                      <Col lg={6}>
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Form.Group className="filter-group">
                            <div className="filter-label-wrapper">
                              <FaSortAmountDown className="filter-icon" />
                              <Form.Label className="filter-label">
                                Sort By
                              </Form.Label>
                            </div>
                            <Form.Select
                              name="sortBy"
                              value={filters.sortBy}
                              onChange={handleChange}
                              className="filter-select"
                              size="lg"
                            >
                              <option value="">Relevance (Default)</option>
                              <option value="priceLow">Price: Low to High</option>
                              <option value="priceHigh">Price: High to Low</option>
                              <option value="rating">Top Rated First</option>
                            </Form.Select>
                            <div className="filter-hint">
                              Order your search results
                            </div>
                          </Form.Group>
                        </motion.div>
                      </Col>

                      {/* Submit Button */}
                      <Col xs={12}>
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-center mt-4"
                        >
                          <Button
                            type="submit"
                            className="search-submit-btn"
                            size="lg"
                          >
                            <span className="btn-content">
                              <FaSearch className="me-2" />
                              Search Products
                              <FaChevronRight className="ms-2 btn-arrow" />
                            </span>
                          </Button>
                          
                          <div className="search-info mt-3">
                            <small className="text-muted">
                              <FaFilter className="me-1" />
                              Found {categories.length} categories available
                            </small>
                          </div>
                        </motion.div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </motion.div>
  );
};

export default AdvancedSearchPage;