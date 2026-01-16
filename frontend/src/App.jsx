import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import HotelDetails from "./pages/HotelDetails";
import BookRoom from "./pages/BookRoom";
import AuthPage from "./pages/AuthPage";
import BookingDetails from "./components/BookingDetails";
import Profile from "./pages/Profile";
import Bookings from "./pages/Bookings";
import Coupons from "./pages/Coupons";
import Hotels from "./pages/Hotels";
import PaymentSuccess from "./pages/PaymentSuccess";
import { Toaster } from "react-hot-toast";
import PaymentPage from "./pages/PaymentPage";
import PaymentFailed from "./pages/PaymentFailed";
import WishlistPage from "./pages/WishlistPage";
import HotelChat from "./pages/HotelChat";

const App = () => {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/hotels/:hotelId" element={<HotelDetails />} />
        <Route path="/bookings/:hotelId/:roomId" element={<BookRoom />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/bookings/my/:bookingId" element={<BookingDetails />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/hotels/:hotelId/chat" element={<HotelChat />} />
      </Route>
    </Routes>
    </>
  );
};

export default App;
