// src/components/Cart/EmptyCart.jsx

import React from "react";
import "../cartPage/CartPage"; // Assuming CartPage.css is correctly referenced
import { IoArrowBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import cart from "../../Images/Sadhanacart1.png"


const EMPTY_CART_IMAGE_URL = {cart};

const EmptyCart = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
   const cartItems = useSelector((state) => state.cart.items || []);
   console.log(cartItems);
   console.log(cartItems.length);
   
   

  // New handler to navigate to the Login page
  const handleSignIn = () => {
    // Assuming you have a route '/login' defined in your App.js/router setup
    navigate("/login");
  };

  // New handler for Shop Today's Deals
  const handleShopDeals = () => {
    navigate("/"); // Navigate to the homepage or a deals page
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button className="back-button" onClick={handleBack}>
          <IoArrowBackOutline size={22} style={{ marginRight: '8px' }} />
          <h3 >My Cart</h3>
        </button>
      </div>

      <div className="cart-empty-container">
        <div className="cart-empty-image">
          <img src={cart} alt="Empty Cart" />
        </div>

        <p className="cart-empty-footer">
          The price and availability of items are subject to change. The shopping
          cart is a temporary place to store a list of your items and reflects
          each item's most recent price.
        </p>
      </div>
    </div>
  );
};

export default EmptyCart;