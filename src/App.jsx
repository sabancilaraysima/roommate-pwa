// -------------------------------------------
// App.jsx
// Main entry:
// - Wraps app with BrowserRouter
// - Defines routes for all pages
// -------------------------------------------

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
 Route,
  Navigate,
} from "react-router-dom";

import AuthPage from "./pages/AuthPage.jsx";
import CreateProfile from "./pages/CreateProfile.jsx";
import ProfilePreview from "./pages/ProfilePreview.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Home from "./pages/Home.jsx";
import SwipeMatch from "./pages/SwipeMatch.jsx";
import Matches from "./pages/Matches.jsx";
import Messages from "./pages/Messages.jsx";
import Chat from "./pages/Chat.jsx";

function App() {
  return (
    <Router>
      {/* Global app background + font */}
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#FFF8E1", // Gin Fizz
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Routes>
          {/* Home = Sign In / Sign Up tabs */}
          <Route path="/" element={<AuthPage />} />

          {/* Email verification info page */}
          <Route path="/verify" element={<VerifyEmail />} />

          {/* Profile creation */}
          <Route path="/create-profile" element={<CreateProfile />} />

          {/* Profile preview */}
          <Route path="/profile" element={<ProfilePreview />} />

          <Route path="/home" element={<Home />} />

          <Route path="/swipe" element={<SwipeMatch />} />

          <Route path="/matches" element={<Matches />} />

          <Route path="/messages" element={<Messages />} />
          
          <Route path="/chat/:uid" element={<Chat />} />

          {/* Anything unknown → go home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
