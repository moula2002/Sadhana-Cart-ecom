import React from 'react';
import { Container, Card } from 'react-bootstrap';
import './ReturnPolicy.css';

function ReturnPolicy() {
    // Dynamic theme-based colors - removed hardcoded colors
    const headerStyle = {
        backgroundColor: 'var(--header-bg)',
        color: 'var(--header-text)',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    };

    const helpCardStyle = {
        backgroundColor: 'var(--help-card-bg)',
        border: '1px solid var(--primary-orange)',
        borderRadius: '12px',
    };

    const contactButtonStyle = {
        backgroundColor: 'var(--contact-btn-bg)',
        borderColor: 'var(--primary-orange)',
        color: 'var(--contact-btn-text)',
        textDecoration: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
    };

    return (
        <div className="return-policy-page">
            {/* 🔸 Header Section */}
            <div className="policy-header py-5 mb-5 animate__header" style={headerStyle}>
                <Container className="text-center">
                    <div className="header-icon mb-3 animate__icon">
                        <i className="fas fa-undo fa-3x"></i>
                    </div>
                    <h1 className="display-4 fw-bold animate__text">Return & Refund Policy</h1>
                    <h3 className="fw-normal">Hassle-Free Returns</h3>
                </Container>
            </div>

            <Container className="py-4">
                {/* 🔸 Introduction */}
                <h2 className="text-orange fw-bold mb-3 policy-intro-title">Return & Refund Policy</h2>
                <p className="lead mb-5 text-muted theme-text">
                    We want you to be completely satisfied with your purchase. If you are not satisfied, our return and refund policy is designed to be simple and fair.
                </p>

                <div className="policy-sections">
                    {/* 1️⃣ Return Window */}
                    <Card className="policy-card mb-4 shadow-sm animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="far fa-calendar-alt fa-fw me-3"></i> 1. Return Window
                            </h4>
                            <ul className="policy-list">
                                <li className="theme-text">Products can be returned within 7 days of delivery</li>
                                <li className="theme-text">Items must be unused and in their original packaging</li>
                                <li className="theme-text">Return shipping label must be used if provided</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* 2️⃣ Not Eligible */}
                    <Card className="policy-card mb-4 shadow-sm animate__fadeInUp" style={{ borderLeft: '5px solid var(--secondary-orange)', animationDelay: '0.2s' }}>
                        <Card.Body>
                            <h4 className="card-title text-red-light mb-3 d-flex align-items-center">
                                <i className="fas fa-ban fa-fw me-3"></i> 2. Items Not Eligible for Return
                            </h4>
                            <ul className="policy-list red-bullets">
                                <li className="theme-text">Perishable goods</li>
                                <li className="theme-text">Personalized/custom products</li>
                                <li className="theme-text">Items marked as "Non-returnable"</li>
                                <li className="theme-text">Products without original tags or packaging</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* 3️⃣ How to Return */}
                    <Card className="policy-card mb-4 shadow-sm animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="fas fa-redo-alt fa-fw me-3"></i> 3. How to Initiate a Return
                            </h4>
                            <ul className="policy-list">
                                <li className="theme-text">Go to "My Orders" in the app</li>
                                <li className="theme-text">Select the item and tap "Request Return"</li>
                                <li className="theme-text">Follow the instructions and choose pickup/drop-off option</li>
                                <li className="theme-text">Print return label if required</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* 4️⃣ Refund Process */}
                    <Card className="policy-card mb-4 shadow-sm animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="fas fa-wallet fa-fw me-3"></i> 4. Refund Process
                            </h4>
                            <ul className="policy-list">
                                <li className="theme-text">Once the return is received and inspected, we will notify you</li>
                                <li className="theme-text">Refunds are typically processed within 5–7 business days</li>
                                <li className="theme-text">The refund will be credited back to your original payment method</li>
                                <li className="theme-text">Shipping charges (if any) are non-refundable</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* 5️⃣ Exchange Policy */}
                    <Card className="policy-card mb-4 shadow-sm animate__fadeInUp" style={{ animationDelay: '0.5s' }}>
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="fas fa-exchange-alt fa-fw me-3"></i> 5. Exchange Policy
                            </h4>
                            <ul className="policy-list">
                                <li className="theme-text">Exchanges allowed for size or defective issues</li>
                                <li className="theme-text">Subject to stock availability</li>
                                <li className="theme-text">Customer responsible for return shipping (unless defective)</li>
                                <li className="theme-text">New item will be shipped after receiving the original</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* 6️⃣ Damaged or Incorrect Items */}
                    <Card className="policy-card mb-4 shadow-sm animate__fadeInUp" style={{ borderLeft: '5px solid var(--danger-red)', animationDelay: '0.6s' }}>
                        <Card.Body>
                            <h4 className="card-title text-danger mb-3 d-flex align-items-center">
                                <i className="fas fa-exclamation-triangle fa-fw me-3"></i> 6. Damaged or Incorrect Items
                            </h4>
                            <ul className="policy-list red-bullets">
                                <li className="theme-text">If you receive a damaged or incorrect item, contact support within 48 hours</li>
                                <li className="theme-text">Provide photo evidence of the issue</li>
                                <li className="theme-text">We will arrange a free return pickup</li>
                                <li className="theme-text">Replacement or full refund will be processed immediately</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* 7️⃣ Need Help Section */}
                    <Card className="help-card my-5 text-center p-4 hover-lift" style={helpCardStyle}>
                        <Card.Body>
                            <h4 className="fw-bold mb-3 animate__pulse theme-text">
                                <span className="text-orange me-2">
                                    <i className="fas fa-headset fa-2x"></i>
                                </span>
                                Need Help with a Return?
                            </h4>
                            <p className="mb-3 theme-text">
                                For any return-related queries, contact our support team:
                            </p>
                            <p className="fw-bold mb-4 text-orange">
                                support@sadhanacart.com
                            </p>

                            {/* Gmail Direct Link */}
                            <a
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=support@sadhanacart.com&su=Return%20Request&body=Hello%20SadhanaCart%20Team,%0A%0AI%20would%20like%20to%20request%20a%20return%20for%20my%20order.%20Please%20assist.%0A%0AThank%20you!"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn contact-button hover-shadow"
                                style={contactButtonStyle}
                            >
                                <i className="fab fa-google me-2"></i> Contact via Gmail
                            </a>
                        </Card.Body>
                    </Card>
                </div>

                {/* Scroll-to-top button */}
                <a href="#" className="scroll-to-top-btn animate__bounceInRight">
                    <i className="fas fa-arrow-up"></i>
                </a>
            </Container>
        </div>
    );
}

export default ReturnPolicy;