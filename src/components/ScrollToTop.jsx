import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable the browser's default scroll restoration behavior
    // This ensures that navigating back will also automatically scroll to the top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (
      pathname === '/' ||
      pathname === '/browse-categories' ||
      pathname === '/categories' ||
      pathname.startsWith('/category/')
    ) {
      // These pages handle their own scroll restoration
      return;
    }

    // Scroll to the top of the page on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
