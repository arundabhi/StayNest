import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AIChat from "./components/AI/AIChat";

const App = () => {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Outlet />
      <AIChat />
    </>
  );
};

export default App;

