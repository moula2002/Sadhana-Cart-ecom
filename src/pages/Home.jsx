import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import "./Home.css";
import SecondHeader from "../components/searchBar/SecondHeader";
import Banner from "../components/Banner";
import FeatureProducts from "../components/category/FeatureProducts";
import RecommendedProduct from "../components/category/RecommendedProduct";
import BestProducts from "../components/category/BestProducts";
import Loading from "../pages/Loading"; // 👈 ADD

function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fake loading (simulate API load)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 sec

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />; // 👈 SHOW SKELETON
  }

  return (
    <div className="homepage-content">
      {/* SECOND HEADER */}
      <SecondHeader />

      {/* Banner Section */}
      <section className="banner-fade-in mb-5">
        <Banner />
      </section>

      {/* Featured Products */}
      <section className="mb-5">
        <Container>
          <FeatureProducts />
        </Container>
      </section>

      {/* Recommended Products */}
      <section className="mb-5">
        <Container>
          <RecommendedProduct />
        </Container>
      </section>

      {/* Best Products (Infinite Scroll) */}
      <section className="mb-5">
        <Container>
          <BestProducts />
        </Container>
      </section>
    </div>
  );
}

export default Home;