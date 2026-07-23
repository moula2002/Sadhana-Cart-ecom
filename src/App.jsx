import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import "./pages/Home.css";
import { ToastContainer } from "react-toastify";

/* ===== Common Components & Loader ===== */
import Header from "./components/Navbar";
import Footer from "./features/footer/Footer";
import StickyHeader from "./components/StickyHeader";
import Loading from "./pages/Loading";

/* ===== Lazy Loaded Pages ===== */
const HomePage = lazy(() => import("./pages/Home"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CustomerSupportCenter = lazy(() => import("./pages/CustomerService"));
const RewardPage = lazy(() => import("./pages/RewardPage"));
const OffersPage = lazy(() => import("./pages/OffersPage"));
const AuthPage = lazy(() => import("./pages/LoginPage"));
const ProductListingPage = lazy(() => import("./pages/Productlistingpage"));
const AdvancedSearchPage = lazy(() => import("./pages/AdvancedSearchPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const BrowseCategory = lazy(() => import("./pages/BrowseCategory"));
const BestProductsPage = lazy(() => import("./pages/BestProductsPage"));
const NewArrivalsPage = lazy(() => import("./pages/NewArrivalsPage"));
const FlashDealsPage = lazy(() => import("./pages/FlashDealsPage"));
const MapPage = lazy(() => import("./components/Map"));

/* ===== Cart & Checkout ===== */
const CartPage = lazy(() => import("./components/cartPage/CartPage"));
const CheckoutPage = lazy(() => import("./components/cartPage/CheckoutPage"));
const CashOnDelivery = lazy(() => import("./components/cartPage/CashOnDelivey"));
const OrderConformPage = lazy(() => import("./components/cartPage/OrderConformPage"));
const ViewOrderDetails = lazy(() => import("./components/cartPage/ViewOrderDetails"));
const OrderDetails = lazy(() => import("./components/cartPage/OrderDetails"));
const CancelOrderPage = lazy(() => import("./components/cartPage/CancelOrderPage"));
const ProductReturnPage = lazy(() => import("./components/cartPage/ProductReturnPage"));
const TrackOrder = lazy(() => import("./components/cartPage/TrackOrder"));

/* ===== Footer Policy Pages ===== */
const ReturnPolicy = lazy(() => import("./features/footer/ReturnPolicy"));
const ShippingPolicy = lazy(() => import("./features/footer/ShippingPolicy"));
const TermsAndConditions = lazy(() => import("./features/footer/TermsAndConditions"));
const AboutUs = lazy(() => import("./features/footer/AboutUs"));
const Faqs = lazy(() => import("./features/footer/Faqs"));
const ContactForm = lazy(() => import("./features/footer/ContactSupport"));
const PrivacyPolicy = lazy(() => import("./features/PrivacyPolicy"));
const Careers = lazy(() => import("./features/footer/Careers"));
const Blog = lazy(() => import("./features/footer/Blog"));

/* ===== User Pages ===== */
const ProfilePage = lazy(() => import("./pages/Profile"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const ReferCode = lazy(() => import("./pages/ReferCode"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Theme = lazy(() => import("./pages/Theme"));
const SaveAddress = lazy(() => import("./pages/SaveAddress"));
const BrandDetails = lazy(() => import("./pages/BrandDetails"));
const AddressList = lazy(() => import("./pages/AddressList"));
const Coupens = lazy(() => import("./pages/Coupens"));
const RecentlyViewed = lazy(() => import("./pages/RecentlyViewed"));

/* ================= APP CONTENT ================= */
const AppContent = () => {
  const location = useLocation();

  // Hide Header & Footer only on Login and Search pages
  const hideLayout = location.pathname === "/login" || location.pathname === "/search";
  const isHomePage = location.pathname === "/";

  return (
    <>
      {isHomePage && <StickyHeader />}
      {!hideLayout && <Header />}

      <main>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* 🔹 Main Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cod" element={<CashOnDelivery />} />
            <Route path="/order-confirm" element={<OrderConformPage />} />
            <Route path="/orders" element={<ViewOrderDetails />} />
            <Route path="/order-details" element={<OrderDetails />} />
            <Route path="/cancel-order" element={<CancelOrderPage />} />
            <Route path="/return-order" element={<ProductReturnPage />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/support" element={<CustomerSupportCenter />} />

            {/* 🔹 User Pages */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/address" element={<SaveAddress />} />
            <Route path="/save-address" element={<AddressList />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/refercode" element={<ReferCode />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/theme" element={<Theme />} />
            <Route path="/recently-viewed" element={<RecentlyViewed />} />

            {/* 🔹 Search */}
            <Route path="/advanced-search" element={<AdvancedSearchPage />} />
            <Route path="/search-results" element={<SearchResultsPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* 🔹 Browse Category */}
            <Route path="/browse-categories" element={<BrowseCategory />} />
            <Route path="/categories" element={<BrowseCategory />} />

            {/* 🔹 Product */}
            <Route path="/product/:id" element={<ProductDetailPage />} />

            {/* 🔹 Brand */}
            <Route path="/brand/:id" element={<BrandDetails />} />

            {/* 🔹 Dynamic Category */}
            <Route
              path="/category/:categoryId"
              element={<ProductListingPage />}
            />

            {/* 🔹 Footer Policy Pages */}
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/coupens" element={<Coupens />} />
            <Route path="/sitemap" element={<MapPage />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />

            {/* 🔹 404 */}
            <Route
              path="*"
              element={
                <div className="text-center mt-5 p-5">
                  <h2>404 - Page Not Found</h2>
                  <p className="text-muted">
                    The page you are looking for doesn't exist.
                  </p>
                </div>
              }
            />
            <Route path="/rewards" element={<RewardPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/best-sellers" element={<BestProductsPage />} />
            <Route path="/new-arrivals" element={<NewArrivalsPage />} />
            <Route path="/flash-deals" element={<FlashDealsPage />} />
          </Routes>
        </Suspense>
      </main>

      {!hideLayout && <Footer />}

      {/* Global Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="sc-toast"
        bodyClassName="sc-toast-body"
        progressClassName="sc-toast-progress"
      />
    </>
  );
};

import { ThemeProvider } from "./context/ThemeContext";

/* ================= MAIN APP ================= */
function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;