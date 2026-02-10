import React, { useState, useEffect } from "react";
import { Container, Card, Button } from "react-bootstrap";

const Theme = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#121212" : "#f8f9fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container style={{ maxWidth: "400px" }}>
        <Card
          className="text-center shadow"
          style={{
            backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
            color: theme === "dark" ? "#ffffff" : "#000000",
          }}
        >
          <Card.Body>
            <h3 className="mb-3">
              {theme === "light" ? "White Mode 🤍" : "Black Mode 🖤"}
            </h3>

            <Button
              variant={theme === "light" ? "dark" : "light"}
              onClick={toggleTheme}
            >
              Switch to {theme === "light" ? "Black" : "White"} Mode
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Theme;
