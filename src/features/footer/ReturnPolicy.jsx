import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { useTranslation } from "react-i18next";
import './ReturnPolicy.css';

function ReturnPolicy() {
    const { t } = useTranslation();

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

            {/* Header */}
            <div className="policy-header py-5 mb-5 animate__header" style={headerStyle}>
                <Container className="text-center">
                    <div className="header-icon mb-3 animate__icon">
                        <i className="fas fa-undo fa-3x"></i>
                    </div>

                    <h1 className="display-4 fw-bold animate__text">
                        {t("returnPolicy.title")}
                    </h1>

                    <h3 className="fw-normal">
                        {t("returnPolicy.subtitle")}
                    </h3>
                </Container>
            </div>

            <Container className="py-4">

                {/* Intro */}
                <h2 className="text-orange fw-bold mb-3 policy-intro-title">
                    {t("returnPolicy.title")}
                </h2>

                <p className="lead mb-5 text-muted theme-text">
                    {t("returnPolicy.intro")}
                </p>

                <div className="policy-sections">

                    {/* Section 1 */}
                    <Card className="policy-card mb-4 shadow-sm">
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="far fa-calendar-alt fa-fw me-3"></i>
                                {t("returnPolicy.section1.title")}
                            </h4>

                            <ul className="policy-list">
                                <li className="theme-text">{t("returnPolicy.section1.point1")}</li>
                                <li className="theme-text">{t("returnPolicy.section1.point2")}</li>
                                <li className="theme-text">{t("returnPolicy.section1.point3")}</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Section 2 */}
                    <Card className="policy-card mb-4 shadow-sm">
                        <Card.Body>
                            <h4 className="card-title text-red-light mb-3 d-flex align-items-center">
                                <i className="fas fa-ban fa-fw me-3"></i>
                                {t("returnPolicy.section2.title")}
                            </h4>

                            <ul className="policy-list red-bullets">
                                <li className="theme-text">{t("returnPolicy.section2.point1")}</li>
                                <li className="theme-text">{t("returnPolicy.section2.point2")}</li>
                                <li className="theme-text">{t("returnPolicy.section2.point3")}</li>
                                <li className="theme-text">{t("returnPolicy.section2.point4")}</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Section 3 */}
                    <Card className="policy-card mb-4 shadow-sm">
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="fas fa-redo-alt fa-fw me-3"></i>
                                {t("returnPolicy.section3.title")}
                            </h4>

                            <ul className="policy-list">
                                <li className="theme-text">{t("returnPolicy.section3.point1")}</li>
                                <li className="theme-text">{t("returnPolicy.section3.point2")}</li>
                                <li className="theme-text">{t("returnPolicy.section3.point3")}</li>
                                <li className="theme-text">{t("returnPolicy.section3.point4")}</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Section 4 */}
                    <Card className="policy-card mb-4 shadow-sm">
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="fas fa-wallet fa-fw me-3"></i>
                                {t("returnPolicy.section4.title")}
                            </h4>

                            <ul className="policy-list">
                                <li className="theme-text">{t("returnPolicy.section4.point1")}</li>
                                <li className="theme-text">{t("returnPolicy.section4.point2")}</li>
                                <li className="theme-text">{t("returnPolicy.section4.point3")}</li>
                                <li className="theme-text">{t("returnPolicy.section4.point4")}</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Section 5 */}
                    <Card className="policy-card mb-4 shadow-sm">
                        <Card.Body>
                            <h4 className="card-title text-orange mb-3 d-flex align-items-center">
                                <i className="fas fa-exchange-alt fa-fw me-3"></i>
                                {t("returnPolicy.section5.title")}
                            </h4>

                            <ul className="policy-list">
                                <li className="theme-text">{t("returnPolicy.section5.point1")}</li>
                                <li className="theme-text">{t("returnPolicy.section5.point2")}</li>
                                <li className="theme-text">{t("returnPolicy.section5.point3")}</li>
                                <li className="theme-text">{t("returnPolicy.section5.point4")}</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Section 6 */}
                    <Card className="policy-card mb-4 shadow-sm">
                        <Card.Body>
                            <h4 className="card-title text-danger mb-3 d-flex align-items-center">
                                <i className="fas fa-exclamation-triangle fa-fw me-3"></i>
                                {t("returnPolicy.section6.title")}
                            </h4>

                            <ul className="policy-list red-bullets">
                                <li className="theme-text">{t("returnPolicy.section6.point1")}</li>
                                <li className="theme-text">{t("returnPolicy.section6.point2")}</li>
                                <li className="theme-text">{t("returnPolicy.section6.point3")}</li>
                                <li className="theme-text">{t("returnPolicy.section6.point4")}</li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Help Section */}
                    <Card className="help-card my-5 text-center p-4" style={helpCardStyle}>
                        <Card.Body>

                            <h4 className="fw-bold mb-3 theme-text">
                                {t("returnPolicy.help.title")}
                            </h4>

                            <p className="mb-3 theme-text">
                                {t("returnPolicy.help.description")}
                            </p>

                            <p className="fw-bold mb-4 text-orange">
                                support@sadhanacart.com
                            </p>

                            <a
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=support@sadhanacart.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn contact-button"
                                style={contactButtonStyle}
                            >
                                {t("returnPolicy.help.contactButton")}
                            </a>

                        </Card.Body>
                    </Card>

                </div>
            </Container>
        </div>
    );
}

export default ReturnPolicy;
