import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AIChat from "./components/AI/AIChat";
import { AppProvider } from "./context/CombinedContext";

const App = () => {
  return (
    <AppProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Outlet />
      <AIChat />
    </AppProvider>
  );
};

export default App;

