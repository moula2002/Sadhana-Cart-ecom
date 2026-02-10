// src/pages/Home.jsx
import React from "react";
import { Container } from "react-bootstrap";
import "./Home.css";
import Banner from "../components/Banner";

// Import all category components
import HomeFashionSection from "../components/category/HomeFashionSection";
import HomeAccessoriesSection from "../components/category/HomeAccessoriesSection";
import HomeToysSection from "../components/category/HomeToysSection";
import HomeStationarySection from "../components/category/HomeStationarySection";
import HomePhotoFrameSection from "../components/category/HomePhotoFrameSection";
import HomeFootWearsSection from "../components/category/HomeFootWearsSection";
import HomeJewellerySection from "../components/category/HomeJewellerySection";
import HomeMensSection from "../components/category/HomeMensSection";
import HomeKidsSection from "../components/category/HomeKidsSection";
import HomePersonalCareSection from "../components/category/HomePersonalCareSection";
import HomeCosmeticsSection from "../components/category/HomeCosmeticsSection";

import HomeBookSection from "../components/category/HomeBookSection";

function Home() {
  return (
    <div className="homepage-content">
      {/* Banner Section */}
      <section className="banner-fade-in mb-5">
        <Banner />
      </section>

      {/* All Category Sections */}
      <section className="category-section fashion mb-5">
        <Container>
          <HomeFashionSection />
        </Container>
      </section>

      <section className="category-section accessories mb-5">
        <Container>
          <HomeAccessoriesSection />
        </Container>
      </section>

      <section className="category-section cosmetics mb-5">
        <Container>
          <HomeCosmeticsSection />
        </Container>
      </section>

      <section className="category-section toys mb-5">
        <Container>
          <HomeToysSection />
        </Container>
      </section>

      <section className="category-section stationary mb-5">
        <Container>
          <HomeStationarySection />
        </Container>
      </section>

      <section className="category-section books mb-5">
        <Container>
          <HomeBookSection />
        </Container>
      </section>

      <section className="category-section photo-frames mb-5">
        <Container>
          <HomePhotoFrameSection />
        </Container>
      </section>

      <section className="category-section footwear mb-5">
        <Container>
          <HomeFootWearsSection />
        </Container>
      </section>

      <section className="category-section jewellery mb-5">
        <Container>
          <HomeJewellerySection />
        </Container>
      </section>

      <section className="category-section mens mb-5">
        <Container>
          <HomeMensSection />
        </Container>
      </section>

      <section className="category-section kids mb-5">
        <Container>
          <HomeKidsSection />
        </Container>
      </section>

 

      <section className="category-section personal-care mb-5">
        <Container>
          <HomePersonalCareSection />
        </Container>
      </section>
    </div>
  );
}

export default Home;