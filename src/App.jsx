// App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

/* ===== Common Components ===== */
import Header from "./components/Navbar";
import Footer from "./features/footer/Footer";

/* ===== Pages ===== */
import HomePage from "./pages/Home";
import ProductDetailPage from "./pages/ProductDetailPage";
import CustomerSupportCenter from "./pages/CustomerService";
import AuthPage from "./pages/LoginPage";
import CategoryPage from "./pages/CategoryPage";
import CategoryProducts from "./components/searchBar/CategoryProducts";
import AdvancedSearchPage from "./pages/AdvancedSearchPage";
import SearchResultsPage from "./pages/SearchResultsPage"; // ✅ ADDED

/* ===== Cart & Checkout ===== */
import CartPage from "./components/cartPage/CartPage";
import CheckoutPage from "./components/cartPage/CheckoutPage";
import CashOnDelivery from "./components/cartPage/CashOnDelivey";
import OrderConformPage from "./components/cartPage/OrderConformPage";
import ViewOrderDetails from "./components/cartPage/ViewOrderDetails";
import OrderDetails from "./components/cartPage/OrderDetails"
import CancelOrderPage from "./components/cartPage/CancelOrderPage";
import ProductReturnPage from "./components/cartPage/ProductReturnPage";

/* ===== Category Pages ===== */
import Fashion from "./components/category/Fashion";
import Accessories from "./components/category/Accessories";
import Cosmetics from "./components/category/Cosmetics";
import Toys from "./components/category/Toys";
import Stationary from "./components/category/Stationary";
import Book from "./components/category/Book";
import PhotoFrame from "./components/category/PhotoFrame";
import Footwears from "./components/category/Footwears";
import Jewellery from "./components/category/Jewellery";
import Mens from "./components/category/Mens";
import Kids from "./components/category/Kids";
import Electronics from "./components/category/Electronics";
import PersonalCare from "./components/category/PersonalCare";

/* ===== Footer Pages ===== */
import ReturnPolicy from "./features/footer/ReturnPolicy";
import ShippingPolicy from "./features/footer/ShippingPolicy";
import TermsAndConditions from "./features/footer/TermsAndConditions";
import AboutUs from "./features/footer/AboutUs";
import Faqs from "./features/footer/Faqs";
import ContactForm from "./features/footer/ContactSupport";

/* ===== User Pages ===== */
import ProfilePage from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import ReferCode from "./pages/ReferCode";
import Wallet from "./pages/Wallet";
import Theme from "./pages/Theme";
import SaveAddress from "./pages/SaveAddress";
import AddressList from "./pages/AddressList";

/* ================= APP CONTENT ================= */
const AppContent = () => {
  const location = useLocation();

  // Hide Header & Footer only on Login page
  const hideLayout = location.pathname === "/login";

  return (
    <>
      {!hideLayout && <Header />}

      <main>
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
          <Route path="/support" element={<CustomerSupportCenter />} />
          {/* 🔹 User Pages */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/address" element={<SaveAddress/>} />
          <Route path="/save-address" element={<AddressList/>} />

          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/refercode" element={<ReferCode />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/theme" element={<Theme />} />

          {/* 🔹 Search */}
          <Route path="/advanced-search" element={<AdvancedSearchPage />} />
          <Route path="/search-results" element={<SearchResultsPage />} /> {/* ✅ FIXED */}

          {/* 🔹 Product */}
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* 🔹 Dynamic Category */}
          <Route
            path="/category/:categoryId"
            element={<CategoryProducts />}
          />

          {/* 🔹 Category Pages */}
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/fashion" element={<Fashion />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/cosmetics" element={<Cosmetics />} />
          <Route path="/toys" element={<Toys />} />
          <Route path="/stationary" element={<Stationary />} />
          <Route path="/book" element={<Book />} />
          <Route path="/photoframe" element={<PhotoFrame />} />
          <Route path="/footwears" element={<Footwears />} />
          <Route path="/jewellery" element={<Jewellery />} />
          <Route path="/mens" element={<Mens />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/electronics" element={<Electronics />} />
          <Route path="/personal-care" element={<PersonalCare />} />

          {/* 🔹 Footer Policy Pages */}
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/contact" element={<ContactForm />} />

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
        </Routes>
      </main>

      {!hideLayout && <Footer />}
    </>
  );
};

/* ================= MAIN APP ================= */
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
