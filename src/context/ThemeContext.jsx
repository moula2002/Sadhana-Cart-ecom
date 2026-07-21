import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const applyThemeToDocument = (theme) => {
  const currentTheme = theme === "dark" ? "dark" : "light";
  const isDark = currentTheme === "dark";

  // Set attributes on root element
  document.documentElement.setAttribute("data-bs-theme", currentTheme);
  document.documentElement.setAttribute("data-theme", currentTheme);

  // Set attributes on body element
  document.body.setAttribute("data-bs-theme", currentTheme);
  document.body.setAttribute("data-theme", currentTheme);

  // Toggle CSS classes on root and body elements
  if (isDark) {
    document.documentElement.classList.add("dark-theme");
    document.documentElement.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  } else {
    document.documentElement.classList.add("light-theme");
    document.documentElement.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }

  // Dispatch custom event for non-react components or subscribers
  window.dispatchEvent(new CustomEvent("themeChange", { detail: { theme: currentTheme } }));
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    // ALWAYS default to light mode on initial visit, regardless of OS setting
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        const newTheme = e.newValue === "dark" ? "dark" : "light";
        setThemeState(newTheme);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyThemeToDocument(newTheme);
  };

  const setTheme = (newTheme) => {
    const validated = newTheme === "dark" ? "dark" : "light";
    setThemeState(validated);
    localStorage.setItem("theme", validated);
    applyThemeToDocument(validated);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    return {
      theme: isDark ? "dark" : "light",
      isDark,
      toggleTheme: () => {
        const nextTheme = isDark ? "light" : "dark";
        localStorage.setItem("theme", nextTheme);
        applyThemeToDocument(nextTheme);
      },
      setTheme: (t) => {
        const nextTheme = t === "dark" ? "dark" : "light";
        localStorage.setItem("theme", nextTheme);
        applyThemeToDocument(nextTheme);
      },
    };
  }
  return context;
};

export default ThemeContext;
