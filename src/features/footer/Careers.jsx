import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { FaBriefcase, FaMapMarkerAlt, FaUsers, FaHeart, FaGraduationCap, FaCheckCircle } from "react-icons/fa";
import "./Careers.css";

const Careers = () => {
  const { t } = useTranslation();
  const [selectedDept, setSelectedDept] = useState("all");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: "",
    cover: ""
  });

  const jobs = [
    {
      id: 1,
      title: t("careersPage.job1Title", "Lead React Developer"),
      dept: "engineering",
      location: t("careersPage.job1Loc", "Remote / Bengaluru"),
      desc: t("careersPage.job1Desc", "Build and scale high-performance user interfaces. Experience with React, Redux, and Bootstrap required.")
    },
    {
      id: 2,
      title: t("careersPage.job2Title", "Vendor Relations Manager"),
      dept: "marketing",
      location: t("careersPage.job2Loc", "Hybrid / Bengaluru"),
      desc: t("careersPage.job2Desc", "Onboard new verified vendors and manage store setups. Strong communication and coordination required.")
    },
    {
      id: 3,
      title: t("careersPage.job3Title", "Digital Marketing Specialist"),
      dept: "marketing",
      location: t("careersPage.job3Loc", "Remote"),
      desc: t("careersPage.job3Desc", "Drive customer acquisition, SEO, and social media campaigns to promote local products.")
    },
    {
      id: 4,
      title: t("careersPage.job4Title", "Customer Support Executive"),
      dept: "operations",
      location: t("careersPage.job4Loc", "Remote / Gangawati"),
      desc: t("careersPage.job4Desc", "Assist users with order details, returns, and query resolutions 24/7.")
    }
  ];

  const filteredJobs = selectedDept === "all" ? jobs : jobs.filter(j => j.dept === selectedDept);

  const handleOpenApply = (job) => {
    setActiveJob(job);
    setShowApplyModal(true);
    setSuccess(false);
  };

  const handleCloseApply = () => {
    setShowApplyModal(false);
    setFormData({ name: "", email: "", phone: "", resume: "", cover: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      handleCloseApply();
    }, 2000);
  };

  return (
    <div className="careers-page-wrapper">
      {/* Hero Header Banner */}
      <div className="careers-hero text-center py-5">
        <Container>
          <div className="hero-badge mb-3">
            <FaBriefcase className="me-2" />
            {t("careersPage.title", "Join Our Team")}
          </div>
          <h1 className="display-4 fw-bold mb-3">{t("careersPage.subtitle", "Build the Future of Conscious Commerce")}</h1>
          <p className="lead mx-auto" style={{ maxWidth: "700px" }}>
            {t("careersPage.intro", "At SadhanaCart, we are on a mission to connect authentic vendors with conscious buyers. We are looking for passionate, driven individuals to join our growing team.")}
          </p>
        </Container>
      </div>

      {/* Why Work With Us Section */}
      <Container className="py-5">
        <h2 className="text-center fw-bold mb-5 section-title-styled">{t("careersPage.whyWorkTitle", "Why Work With Us?")}</h2>
        <Row className="g-4 justify-content-center">
          <Col md={4}>
            <Card className="value-card h-100 border-0 text-center p-4">
              <Card.Body>
                <div className="icon-circle mx-auto bg-primary bg-opacity-10 text-primary mb-4">
                  <FaUsers size={28} />
                </div>
                <h5 className="fw-bold mb-3">{t("careersPage.value1Title", "Purpose Driven")}</h5>
                <p className="text-muted mb-0">{t("careersPage.value1Desc", "Be part of a business focused on ethical sourcing and supporting local artisans.")}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="value-card h-100 border-0 text-center p-4">
              <Card.Body>
                <div className="icon-circle mx-auto bg-success bg-opacity-10 text-success mb-4">
                  <FaHeart size={28} />
                </div>
                <h5 className="fw-bold mb-3">{t("careersPage.value2Title", "Work-Life Balance")}</h5>
                <p className="text-muted mb-0">{t("careersPage.value2Desc", "We value your personal time and promote a healthy, balanced lifestyle.")}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="value-card h-100 border-0 text-center p-4">
              <Card.Body>
                <div className="icon-circle mx-auto bg-warning bg-opacity-10 text-warning mb-4">
                  <FaGraduationCap size={28} />
                </div>
                <h5 className="fw-bold mb-3">{t("careersPage.value3Title", "Continuous Growth")}</h5>
                <p className="text-muted mb-0">{t("careersPage.value3Desc", "Get access to training, mentorship, and opportunities to advance your career.")}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Jobs Openings Filter / Grid */}
      <div className="bg-light-styled py-5">
        <Container>
          <h2 className="text-center fw-bold mb-4">{t("careersPage.openingsTitle", "Current Openings")}</h2>

          {/* Filter Pills */}
          <div className="d-flex justify-content-center gap-2 mb-5 flex-wrap">
            <Button
              variant={selectedDept === "all" ? "primary" : "outline-primary"}
              onClick={() => setSelectedDept("all")}
              className="rounded-pill px-4"
            >
              {t("careersPage.allDepartments", "All Departments")}
            </Button>
            <Button
              variant={selectedDept === "engineering" ? "primary" : "outline-primary"}
              onClick={() => setSelectedDept("engineering")}
              className="rounded-pill px-4"
            >
              {t("careersPage.engineering", "Engineering")}
            </Button>
            <Button
              variant={selectedDept === "marketing" ? "primary" : "outline-primary"}
              onClick={() => setSelectedDept("marketing")}
              className="rounded-pill px-4"
            >
              {t("careersPage.marketing", "Marketing & Relations")}
            </Button>
            <Button
              variant={selectedDept === "operations" ? "primary" : "outline-primary"}
              onClick={() => setSelectedDept("operations")}
              className="rounded-pill px-4"
            >
              {t("careersPage.operations", "Operations")}
            </Button>
          </div>

          {/* Job List cards */}
          <Row className="g-4">
            {filteredJobs.map(job => (
              <Col md={6} key={job.id}>
                <Card className="job-card border shadow-sm h-100 p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="fw-bold mb-1 text-dark">{job.title}</h4>
                      <div className="d-flex gap-3 text-muted small">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border-0 px-2.5 py-1 text-capitalize">{job.dept}</span>
                        <span className="d-flex align-items-center">
                          <FaMapMarkerAlt className="me-1.5" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-secondary small line-height-relaxed flex-grow-1">{job.desc}</p>
                  <Button variant="primary" className="apply-btn mt-3" onClick={() => handleOpenApply(job)}>
                    {t("careersPage.applyNow", "Apply Now")}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* Application Modal */}
      <Modal show={showApplyModal} onHide={handleCloseApply} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{t("careersPage.applyModalTitle", "Apply for {{position}}").replace("{{position}}", activeJob?.title || "")}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          {success ? (
            <div className="text-center py-4">
              <FaCheckCircle className="text-success mb-3" size={60} />
              <h4>{t("careersPage.successMsg", "Application submitted successfully! We will contact you soon.")}</h4>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">{t("careersPage.fullName", "Full Name")}</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">{t("careersPage.email", "Email Address")}</Form.Label>
                    <Form.Control
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">{t("careersPage.phone", "Phone Number")}</Form.Label>
                    <Form.Control
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">{t("careersPage.resume", "Resume Link / Portfolio")}</Form.Label>
                    <Form.Control
                      type="url"
                      required
                      value={formData.resume}
                      onChange={e => setFormData({ ...formData, resume: e.target.value })}
                      placeholder="https://drive.google.com/..."
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold small">{t("careersPage.coverLetter", "Cover Letter (Brief)")}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={formData.cover}
                      onChange={e => setFormData({ ...formData, cover: e.target.value })}
                      placeholder="Why do you want to join SadhanaCart?"
                    />
                  </Form.Group>
                </Col>
                <Col md={12} className="d-flex justify-content-end gap-2 mt-4">
                  <Button variant="outline-secondary" onClick={handleCloseApply}>
                    {t("careersPage.close", "Close")}
                  </Button>
                  <Button variant="primary" type="submit">
                    {t("careersPage.submitApp", "Submit Application")}
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Careers;
