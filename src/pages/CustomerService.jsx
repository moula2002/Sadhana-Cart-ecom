import React from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  InputGroup, 
  Button 
} from 'react-bootstrap';
import { 
  FaSearch, 
  FaShippingFast, 
  FaRedoAlt, 
  FaUserCog, 
  FaLock,
  FaQuestionCircle
} from 'react-icons/fa';

const CustomerSupportCenter = () => {
  const quickLinks = [
    { icon: FaShippingFast, title: "Track a Package", description: "See when your order will arrive.", href: "#" },
    { icon: FaRedoAlt, title: "Returns & Refunds", description: "Start a return or view refund status.", href: "#" },
    { icon: FaUserCog, title: "Manage Account", description: "Update your profile, login, and security.", href: "#" },
    { icon: FaLock, title: "Payment Settings", description: "Add, edit, or manage payment methods.", href: "#" },
  ];

  const popularTopics = [
    "Changing Shipping Address",
    "Report a Scam or Fraud",
    "Digital Services & Device Support",
    "View Billing and Transaction History",
    "Cancel an Item or Order",
    "Update Contact Information",
  ];
  
  // 💥 ALL STYLES DEFINED HERE 💥
  const styles = {
    // --- Colors & Variables ---
    amazonBlue: '#007185',
    amazonOrange: '#ff9900',
    lightGrayBg: '#f3f3f3',

    // --- Container & Header ---
    supportContainer: {
      paddingTop: '30px',
      paddingBottom: '50px',
    },
    supportTitle: {
      color: '#333',
      fontWeight: 700,
      fontSize: '2.2rem',
    },
    supportSectionTitle: {
      color: '#555',
      fontSize: '1.6rem',
      fontWeight: 600,
      marginBottom: '25px',
      borderBottom: '2px solid #f3f3f3',
      paddingBottom: '10px',
      display: 'inline-block',
    },

    // --- Search Bar ---
    searchBarInput: {
      borderRadius: '5px 0 0 5px',
      borderColor: '#ccc',
      fontSize: '1rem',
      padding: '10px 15px',
    },
    searchButton: {
      backgroundColor: '#ff9900',
      borderColor: '#ff9900',
      color: 'white',
      fontWeight: 600,
      borderRadius: '0 5px 5px 0',
    },

    // --- Quick Links Card ---
    cardLink: {
      border: '1px solid #ddd',
      cursor: 'pointer',
      borderRadius: '8px',
      height: '100%',
      // Note: Hover effects must be handled via component state or pure CSS,
      // which is why this approach is limited for attractive animations.
    },
    cardLinkIcon: {
      color: '#007185',
      marginBottom: '15px',
    },
    cardLinkButtonOutline: {
        color: '#007185',
        borderColor: '#007185',
    },

    // --- Popular Topics List ---
    topicsCard: {
      border: '1px solid #eee',
      backgroundColor: '#fafafa',
      borderRadius: '10px',
    },
    topicLink: {
      color: '#444',
      textDecoration: 'none',
      fontSize: '1rem',
      padding: '8px 0',
      borderBottom: '1px dotted #ddd',
      display: 'flex',
      alignItems: 'center',
    },
    topicIcon: {
        marginRight: '8px',
        color: '#999',
    }
  };


  return (
    <Container style={styles.supportContainer} className="my-5">
      {/* HEADER: Support Title and Search Bar */}
      <Row className="justify-content-center mb-4">
        <Col md={8} lg={6}>
          <h1 style={styles.supportTitle} className="text-center mb-4">
            Welcome to the Support Center
          </h1>
          <InputGroup size="lg" className="shadow-sm">
            <Form.Control
              placeholder="Search for help on orders, returns, or devices"
              aria-label="Search help"
              style={styles.searchBarInput}
            />
            {/* Note: Hover/Focus effects are now absent due to inline limitations */}
            <Button variant="warning" style={styles.searchButton}>
              <FaSearch className="me-1" /> Search
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {/* QUICK LINKS: Iconic Card Section */}
      <Row className="mt-5">
        <Col className="text-center mb-4">
          <h2 style={styles.supportSectionTitle}>Common Issues & Quick Actions</h2>
        </Col>
      </Row>
      <Row className="g-4 mb-5">
        {quickLinks.map((link, index) => (
          <Col md={6} lg={3} key={index}>
            <Card style={styles.cardLink} className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column align-items-center text-center">
                <link.icon size={36} style={styles.cardLinkIcon} />
                <Card.Title className="fw-bold">{link.title}</Card.Title>
                <Card.Text className="text-muted flex-grow-1">
                  {link.description}
                </Card.Text>
                {/* Note: Only static styles applied here */}
                <Button 
                    variant="outline-primary" 
                    size="sm" 
                    href={link.href} 
                    style={styles.cardLinkButtonOutline}
                >
                  Start
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* POPULAR TOPICS: List Section */}
      <Row className="mt-5">
        <Col className="text-center mb-4">
          <h2 style={styles.supportSectionTitle}>Browse Help Topics</h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card style={styles.topicsCard} className="p-4 shadow-sm">
            <Row>
              {popularTopics.map((topic, index) => (
                <Col md={6} key={index} className="py-2">
                  {/* Note: Hover effects are lost here */}
                  <a href="#" style={styles.topicLink}>
                    <FaQuestionCircle size={14} style={styles.topicIcon} />
                    {topic}
                  </a>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
      
    </Container>
  );
};

export default CustomerSupportCenter;