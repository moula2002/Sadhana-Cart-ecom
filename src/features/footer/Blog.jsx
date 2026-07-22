import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Modal, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FaBookOpen, FaCalendarAlt, FaUser } from "react-icons/fa";
import "./Blog.css";

const Blog = () => {
  const { t } = useTranslation();
  const [selectedTag, setSelectedTag] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [activePost, setActivePost] = useState(null);

  const posts = [
    {
      id: 1,
      title: t("blogPage.post1Title", "Embracing Mindfulness in Daily Life"),
      tag: "lifestyle",
      tagLabel: t("blogPage.lifestyle", "Lifestyle"),
      excerpt: t("blogPage.post1Excerpt", "Simple ways to practice mindfulness, stay calm, and bring peace to your busy modern schedule."),
      content: t("blogPage.post1Content", "Mindfulness is not about sitting silently on a cushion for hours..."),
      author: "Aditi Sharma",
      date: "May 15, 2026",
      readTime: "5 min",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 2,
      title: t("blogPage.post2Title", "Sourcing Authentic Spiritual & Pooja Essentials"),
      tag: "shopping",
      tagLabel: t("blogPage.shopping", "Shopping Guides"),
      excerpt: t("blogPage.post2Excerpt", "A comprehensive guide to identifying high-quality, genuine traditional products and supporting local artisans."),
      content: t("blogPage.post2Content", "Spiritual items and pooja essentials carry deep traditional..."),
      author: "Rajesh Iyer",
      date: "June 2, 2026",
      readTime: "8 min",
      image: "https://images.unsplash.com/photo-1609137144813-2d54406a461b?w=500&auto=format&fit=crop&q=60"
    },
    {
      id: 3,
      title: t("blogPage.post3Title", "SadhanaCart 2.0: What is New?"),
      tag: "tech",
      tagLabel: t("blogPage.tech", "Tech & Updates"),
      excerpt: t("blogPage.post3Excerpt", "A walkthrough of our latest features including localized language support, dynamic greetings, and wallet rewards."),
      content: t("blogPage.post3Content", "We are thrilled to launch SadhanaCart 2.0..."),
      author: "Sadhana Dev Team",
      date: "July 20, 2026",
      readTime: "4 min",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60"
    }
  ];

  const filteredPosts = selectedTag === "all" ? posts : posts.filter(p => p.tag === selectedTag);

  const handleOpenPost = (post) => {
    setActivePost(post);
    setShowModal(true);
  };

  return (
    <div className="blog-page-wrapper">
      {/* Hero Header */}
      <div className="blog-hero text-center py-5">
        <Container>
          <div className="hero-badge mb-3">
            <FaBookOpen className="me-2" />
            {t("blogPage.title", "Sadhana Insights")}
          </div>
          <h1 className="display-4 fw-bold mb-3">{t("blogPage.title", "Sadhana Insights")}</h1>
          <p className="lead mx-auto text-white-50" style={{ maxWidth: "600px" }}>
            {t("blogPage.subtitle", "Life, Conscious Shopping & Tech Updates")}
          </p>
        </Container>
      </div>

      <Container className="py-5">
        {/* Tag Filters */}
        <div className="d-flex justify-content-center gap-2 mb-5 flex-wrap">
          <Button
            variant={selectedTag === "all" ? "primary" : "outline-primary"}
            onClick={() => setSelectedTag("all")}
            className="rounded-pill px-4"
          >
            {t("blogPage.all", "All Articles")}
          </Button>
          <Button
            variant={selectedTag === "lifestyle" ? "primary" : "outline-primary"}
            onClick={() => setSelectedTag("lifestyle")}
            className="rounded-pill px-4"
          >
            {t("blogPage.lifestyle", "Lifestyle")}
          </Button>
          <Button
            variant={selectedTag === "shopping" ? "primary" : "outline-primary"}
            onClick={() => setSelectedTag("shopping")}
            className="rounded-pill px-4"
          >
            {t("blogPage.shopping", "Shopping Guides")}
          </Button>
          <Button
            variant={selectedTag === "tech" ? "primary" : "outline-primary"}
            onClick={() => setSelectedTag("tech")}
            className="rounded-pill px-4"
          >
            {t("blogPage.tech", "Tech & Updates")}
          </Button>
        </div>

        {/* Post Grid */}
        <Row className="g-4">
          {filteredPosts.map(post => (
            <Col lg={4} md={6} key={post.id}>
              <Card className="blog-card border-0 shadow-sm h-100">
                <div className="blog-card-img-wrap">
                  <Card.Img variant="top" src={post.image} className="blog-card-img" />
                  <Badge bg="primary" className="category-badge position-absolute m-3">
                    {post.tagLabel}
                  </Badge>
                </div>
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex gap-3 text-muted small mb-3">
                    <span className="d-flex align-items-center">
                      <FaCalendarAlt className="me-1.5" />
                      {post.date}
                    </span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h4 className="fw-bold mb-3 text-dark text-hover-primary" style={{ fontSize: "1.25rem", lineHeight: "1.4" }}>
                    {post.title}
                  </h4>
                  <Card.Text className="text-secondary small mb-4 flex-grow-1" style={{ lineHeight: "1.6" }}>
                    {post.excerpt}
                  </Card.Text>
                  <Button variant="outline-primary" className="w-100 py-2 fw-bold" onClick={() => handleOpenPost(post)}>
                    {t("blogPage.readMore", "Read Full Article")}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Article Reader Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        {activePost && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <Badge bg="primary" className="px-3 py-2">{activePost.tagLabel}</Badge>
            </Modal.Header>
            <Modal.Body className="px-4 pb-5 pt-3">
              <h2 className="fw-bold mb-3 text-dark">{activePost.title}</h2>
              
              <div className="d-flex align-items-center gap-3 text-muted small mb-4">
                <span className="d-flex align-items-center">
                  <FaUser className="me-1.5" />
                  {t("blogPage.author", "By {{name}}").replace("{{name}}", activePost.author)}
                </span>
                <span>•</span>
                <span className="d-flex align-items-center">
                  <FaCalendarAlt className="me-1.5" />
                  {activePost.date}
                </span>
                <span>•</span>
                <span>{activePost.readTime}</span>
              </div>

              <img 
                src={activePost.image} 
                alt={activePost.title} 
                className="w-100 rounded-3 mb-4 object-fit-cover" 
                style={{ maxHeight: "350px" }}
              />

              <p className="text-secondary fs-6" style={{ lineHeight: "2.0", textAlign: "justify" }}>
                {activePost.content}
              </p>

              <div className="d-flex justify-content-end mt-4">
                <Button variant="outline-secondary" className="px-4" onClick={() => setShowModal(false)}>
                  {t("blogPage.backToBlog", "Back to Blog")}
                </Button>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Blog;
