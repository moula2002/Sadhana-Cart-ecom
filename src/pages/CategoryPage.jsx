import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Card, Alert, Form, Button, Badge } from 'react-bootstrap';
import './CategoryPage.css'; // Custom CSS for animations

const EXCHANGE_RATE = 83;

function CategoryPage() {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('rating');
  const [filterPrice, setFilterPrice] = useState(50000);

  const pageTitle = categoryName
    ? categoryName.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : 'All Products';

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = categoryName
          ? `https://fakestoreapi.com/products/category/${categoryName}`
          : 'https://fakestoreapi.com/products';
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Failed to fetch category: ${response.statusText}`);
        const data = await response.json();
        const formattedData = data.map(product => ({
          ...product,
          priceINR: (product.price * EXCHANGE_RATE).toFixed(0),
          priceValue: product.price * EXCHANGE_RATE,
        }));
        setProducts(formattedData);
      } catch (err) {
        setError(err.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [categoryName]);

  const filteredAndSortedProducts = useMemo(() => {
    let currentProducts = [...products];
    currentProducts = currentProducts.filter(product => product.priceValue <= filterPrice);
    currentProducts.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.priceValue - b.priceValue;
        case 'price-desc': return b.priceValue - a.priceValue;
        case 'rating': return b.rating.rate - a.rating.rate;
        case 'name-asc': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
    return currentProducts;
  }, [products, sortBy, filterPrice]);

  if (loading) return (
    <Container className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <h4 className="mt-3">Loading {pageTitle} products...</h4>
    </Container>
  );

  if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;
  if (products.length === 0) return <Container className="py-5"><Alert variant="info">No products found in {pageTitle}</Alert></Container>;

  // Individual Product Card
  const ProductCard = ({ product }) => (
    <Card className="h-100 shadow-sm border-0 product-card fade-in">
      <Link to={`/product/${product.id}`} className="text-decoration-none text-dark">
        <div className="product-img-wrapper d-flex justify-content-center align-items-center p-3">
          <Card.Img variant="top" src={product.image} className="product-img"/>
        </div>
        <Card.Body className="d-flex flex-column">
          <Card.Title className="fs-6 fw-bold mb-1" style={{ minHeight: '40px' }}>
            {product.title.substring(0, 50)}...
          </Card.Title>
          <div className="mb-2">
            <Badge bg="warning" className="me-2">{product.rating.rate} ★</Badge>
            <span className="text-muted small">({product.rating.count})</span>
          </div>
          <Card.Text className="fw-bold text-danger fs-5 mt-auto">
            ₹{product.priceINR}
          </Card.Text>
        </Card.Body>
      </Link>
    </Card>
  );

  return (
    <Container className="py-5">
      <h1 className="mb-3 fw-light text-capitalize">{pageTitle}</h1>
      <p className="text-muted">{filteredAndSortedProducts.length} items found (out of {products.length})</p>

      <Row>
        {/* Sidebar Filters */}
        <Col md={3}>
          <Card className="shadow-sm p-3 mb-4 sticky-top">
            <h5 className="mb-3 fw-bold">Filters</h5>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Max Price (₹{filterPrice.toLocaleString()})</Form.Label>
              <Form.Range
                min={0} max={100000} step={100} value={filterPrice}
                onChange={(e) => setFilterPrice(Number(e.target.value))}
              />
            </Form.Group>
            <Button variant="outline-secondary" size="sm" onClick={() => setFilterPrice(100000)}>Clear Filter</Button>
          </Card>
        </Col>

        {/* Products */}
        <Col md={9}>
          {/* Sorting */}
          <div className="d-flex justify-content-end mb-4">
            <Form.Group as={Row} className="align-items-center">
              <Form.Label column sm="3" className="text-end fw-semibold">Sort By:</Form.Label>
              <Col sm="9">
                <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="rating">Top Rated (Default)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name (A-Z)</option>
                </Form.Select>
              </Col>
            </Form.Group>
          </div>

          <Row xs={1} sm={2} lg={3} className="g-4">
            {filteredAndSortedProducts.map(product => (
              <Col key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>

          {filteredAndSortedProducts.length === 0 && (
            <Alert variant="warning" className="mt-4 text-center">
              The current filters hide all products. Try lowering the max price.
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default CategoryPage;
