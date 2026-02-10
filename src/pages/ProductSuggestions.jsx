import React, { useState, useEffect } from "react";
import { Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaStar, FaShoppingCart, FaEye } from "react-icons/fa";

function ProductSuggestions({ currentProductId, category }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    if (!category) return;

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using FakeStoreAPI for fetching suggestions
        const response = await fetch(`https://fakestoreapi.com/products/category/${category}`);
        
        if (!response.ok) throw new Error("Failed to fetch suggestions");
        
        const data = await response.json();
        const exchangeRate = 1;

        // Fetch ratings for each product
        const ratingsData = {};
        const productsWithRatings = await Promise.all(
          data.map(async (product) => {
            const ratingResponse = await fetch(`https://fakestoreapi.com/products/${product.id}`);
            const productData = await ratingResponse.json();
            ratingsData[product.id] = productData.rating;
            return product;
          })
        );

        setRatings(ratingsData);

        const filteredSuggestions = productsWithRatings
          .filter((product) => product.id !== currentProductId)
          .slice(0, 4)
          .map((product) => ({
            id: product.id,
            image: product.image,
            title: product.title,
            price: (product.price * exchangeRate).toFixed(0),
            rating: ratingsData[product.id] || { rate: 0, count: 0 }
          }));

        setSuggestions(filteredSuggestions);
      } catch (err) {
        console.error(err);
        setError("Could not load related products.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [category, currentProductId]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-500" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-yellow-500 opacity-70" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-gray-500">Loading suggestions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="warning" className="text-center">
        {error}
      </Alert>
    );
  }

  return (
    <div className="mt-8 pt-8 bg-gradient-to-b from-gray-50 to-white px-4 py-8 rounded-2xl">
      {/* Section Header */}
      <div className="text-center mb-8 relative">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 inline-block relative">
          People Also Viewed
          <span className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded"></span>
        </h2>
        <p className="text-gray-600 mt-4">Discover similar products you might love</p>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {suggestions.map((item) => (
          <Link 
            to={`/product/${item.id}`} 
            key={item.id}
            className="block h-full transition-transform duration-300 hover:-translate-y-1"
            onClick={() => window.scrollTo(0, 0)}
          >
            {/* Product Card */}
            <div className="h-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
              {/* Image Container */}
              <div className="relative h-52 bg-white overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-blue-600 bg-opacity-90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="text-white text-center transform translate-y-5 group-hover:translate-y-0 transition-transform duration-300">
                    <FaEye className="inline-block text-xl mb-1" />
                    <span className="ml-2">Quick View</span>
                  </div>
                </div>
                
                {/* Discount Badge */}
                <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  {Math.floor(Math.random() * 50) + 10}% OFF
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-4 flex flex-col h-[calc(100%-208px)]">
                {/* Category */}
                <span className="text-blue-600 uppercase font-semibold text-xs mb-1">
                  {category}
                </span>
                
                {/* Title */}
                <h3 
                  className="font-bold text-gray-800 mb-2 text-sm line-clamp-2 h-12"
                  title={item.title}
                >
                  {item.title.length > 50 ? item.title.substring(0, 50) + "..." : item.title}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div className="flex mr-2">
                    {renderStars(item.rating?.rate || 0)}
                  </div>
                  <span className="text-gray-500 text-xs">
                    ({item.rating?.count || 0})
                  </span>
                </div>
                
                {/* Price and Actions */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between">
                    {/* Price */}
                    <div>
                      <p className="text-red-600 font-bold text-lg">
                        ₹{item.price}
                      </p>
                      <p className="text-gray-400 text-sm line-through">
                        ₹{(item.price * 1.2).toFixed(0)}
                      </p>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:from-blue-600 hover:to-blue-700"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Add to cart:", item.id);
                      }}
                    >
                      <FaShoppingCart className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-4 pb-4 pt-0">
                <div className="flex items-center text-green-600 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  In Stock • Free Shipping
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* View All Button */}
      <div className="text-center mt-10">
        <Link 
          to={`/category/${category}`}
          className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-500 text-blue-600 font-medium rounded-full hover:bg-blue-50 hover:border-blue-600 transition-all duration-300 hover:shadow-md"
        >
          View All in {category}
        </Link>
      </div>
    </div>
  );
}

export default ProductSuggestions;