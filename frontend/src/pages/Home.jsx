import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import FeaturedHotel from '../components/FeaturedHotel'
import PopularDestination from '../components/PopularDestination'
import WhyChooseStayNext from '../components/WhyChooseStayNext'
import Footer from '../components/Footer'
import PersonalizedRecommendations from '../components/Recommedations/PersonalizedRecommendations'
import RecommendationLayout from '../components/Recommedations/RecommendationLayout'

const Home = () => {
  return (
    <>
     
        <Hero />
        <FeaturedHotel />
        <PersonalizedRecommendations/>
  <RecommendationLayout
  title="Trending Hotels 🔥"
  endpoint="/recommendations/popular"
/>


  <RecommendationLayout
    title="Special Offers"
    endpoint="/recommendations/offers"
    transform={(h) => ({
      ...h,
      extra: `Save ${h.offer.discountPercent}% • ₹${h.offer.offerPrice}`,
      badge: "Offer",
    })}
  />




        <RecommendationLayout
    title="Newly Added Hotels 🆕"
    endpoint="/recommendations/new"
    badge="New"
  />
        <PopularDestination />
        <WhyChooseStayNext />
  
    </>
  )
}

export default Home