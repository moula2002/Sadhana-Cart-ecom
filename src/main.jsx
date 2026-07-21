// index.js - Main entry point
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./redux/store";
import "./index.css"; // Global styles
import "./language/i18n";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { applyThemeToDocument } from "./context/ThemeContext";

// Apply theme on initial load (strictly defaults to light unless explicitly set to dark in localStorage)
const initialTheme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
applyThemeToDocument(initialTheme);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);