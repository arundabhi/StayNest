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
import UserWaitlist from "./pages/UserWaitlist";
import ListProperty from "./pages/owner/ListProperty";

import HotelDashboard from "./pages/owner/HotelDashboard";
import AddRoom2 from "./pages/owner/AddRoom2";
import RoomList from "./pages/owner/ListRoom";
import HotelBookings from "./pages/owner/HotelBookings";
import OwnerHotelChat from "./pages/owner/HotelChat";
import OwnerHotelSettings from "./pages/owner/OwnerHotelSettings";
import RoomSetting from "./pages/owner/RoomSetting";
import OwnerPayments from "./pages/owner/OwnerPaymnets";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Pricing from "./pages/owner/Pricing";
import AIChat from "./components/AI/AIChat";

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
          <Route path="/reset-password" element={<AuthPage />} />
          <Route path="/bookings/my/:bookingId" element={<BookingDetails />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/hotels/chat/:hotelId" element={<HotelChat />} />
          <Route path="/user/waitlists" element={<UserWaitlist />} />
          <Route path="/list-property" element={<ListProperty />} />

          <Route path="/owner/dashboard" element={<HotelDashboard />} />
          <Route path="/owner/add-room" element={<AddRoom2 />} />
          <Route path="/owner/hotel/:hotelId/rooms" element={<RoomList />} />
          <Route path="/owner/bookings" element={<HotelBookings />} />
          <Route
            path="/owner/hotel/chat/:hotelId"
            element={<OwnerHotelChat />}
          />
          <Route path="/owner/setting" element={<OwnerHotelSettings />} />
          <Route
            path="/owner/hotel/:hotelId/room/:roomId/settings"
            element={<RoomSetting />}
          />
          <Route path="/owner/payments" element={<OwnerPayments />} />
          <Route path="/owner/pricing/:hotelId" element={<Pricing />} />
        </Route>

        <Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
      <AIChat />
    </>
  );
};

export default App;
