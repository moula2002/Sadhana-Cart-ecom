import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";

const Theme = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#121212" : "#f8f9fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.3s ease",
      }}
    >
      <Container style={{ maxWidth: "400px" }}>
        <Card
          className="text-center shadow"
          style={{
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            color: isDark ? "#ffffff" : "#000000",
            borderColor: isDark ? "#333333" : "#dee2e6",
            transition: "all 0.3s ease",
          }}
        >
          <Card.Body className="p-4">
            <h3 className="mb-3 fw-bold">
              {theme === "light" ? "Light Mode ☀️" : "Dark Mode 🌙"}
            </h3>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Currently using <strong>{theme === "light" ? "Light" : "Dark"}</strong> theme across SadhanaCart.
            </p>

            <Button
              variant={theme === "light" ? "dark" : "light"}
              onClick={toggleTheme}
              className="fw-bold px-4 py-2 shadow-sm rounded-pill"
            >
              Switch to {theme === "light" ? "Dark 🌙" : "Light ☀️"} Mode
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Theme;
