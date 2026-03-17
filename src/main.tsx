import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "@/hooks/useAuth"; // 👈 ADD THIS

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>   {/* 👈 ADD THIS */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);