// AuthPage.jsx
// Home page with centered card:
// - Tabs: Sign In / Sign Up
// - Uses Firebase Auth
// - University email check
// - Sends verification email
// - Routes:
//    signup  → /verify
//    signin (not verified) → /verify
//    signin (verified)     → /home   (main page)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase"; // we only need auth here

// Simple university email checker
function isUniversityEmail(email) {
  const trimmed = email.trim().toLowerCase();
  const allowedEndings = [
    ".edu",
    ".edu.pl",
    ".edu.tr",
    ".ac.uk",
    ".ac.jp",
    ".ac.kr",
    ".edu.au",
    ".uni.it",
  ];
  return allowedEndings.some((ending) => trimmed.endsWith(ending));
}

function AuthPage() {
  const navigate = useNavigate();

  // "signin" or "signup"
  const [activeTab, setActiveTab] = useState("signin");

  // Sign In form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- SIGN UP (create account) ---
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // 1) Frontend checks
    if (!signUpEmail.trim()) {
      setErrorMsg("Please enter your university email.");
      return;
    }

    if (!isUniversityEmail(signUpEmail)) {
      setErrorMsg(
        "This platform is only for university students. Please use your university email (for example: name@school.edu)."
      );
      return;
    }

    if (!signUpPassword.trim()) {
      setErrorMsg("Please enter a password.");
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);

      // 2) Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        signUpEmail,
        signUpPassword
      );
      const user = userCred.user;

      // 3) Send verification email
      await sendEmailVerification(user);

      // 4) Notify and go to verify page
      alert(
        "Account created! We sent you a verification email. Please check your inbox and spam folder."
      );
      navigate("/verify");
    } catch (err) {
      console.error("Signup error:", err);

      if (err.code === "auth/email-already-in-use") {
        setErrorMsg(
          "This email is already registered. Try signing in instead or use a different university email."
        );
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("This email address is not valid.");
      } else if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Email/password sign-up is not enabled in Firebase.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("This password is too weak. Please choose a stronger one.");
      } else {
        setErrorMsg("Could not sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- SIGN IN (existing user) ---
  const handleSignin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!signInEmail.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }

    if (!signInPassword.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // 1) Sign in with Firebase Auth
      const userCred = await signInWithEmailAndPassword(
        auth,
        signInEmail,
        signInPassword
      );
      const user = userCred.user;

      // 2) Require email verification
      if (!user.emailVerified) {
        alert("Please verify your email before continuing.");
        navigate("/verify");
        return;
      }

      // ✅ 3) Already registered & verified → go straight to main page
      navigate("/home");
    } catch (err) {
      console.error("Signin error:", err);

      if (err.code === "auth/user-not-found") {
        setErrorMsg("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setErrorMsg("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("This email address is not valid.");
      } else {
        setErrorMsg("Could not sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8E1", // Gin Fizz
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // centered vertically
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
          padding: "28px 26px",
          textAlign: "left",
        }}
      >
        {/* Title */}
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "24px",
            color: "#333333", // Mine Shaft
            fontWeight: "bold",
          }}
        >
          Student Roommate Finder
        </h1>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "14px",
            color: "#555555",
          }}
        >
          Safe, student-only housing and roommate matching.
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            marginBottom: "20px",
            borderRadius: "999px",
            backgroundColor: "#F5F5F5",
            padding: "4px",
          }}
        >
          <TabButton
            label="Sign In"
            isActive={activeTab === "signin"}
            onClick={() => setActiveTab("signin")}
          />
          <TabButton
            label="Sign Up"
            isActive={activeTab === "signup"}
            onClick={() => setActiveTab("signup")}
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: "#FFD54F", // Mustard
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Forms */}
        {activeTab === "signin" ? (
          <form
            onSubmit={handleSignin}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <label style={{ fontSize: "13px" }}>
              University Email
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: "13px" }}>
              Password
              <input
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={primaryButtonStyle}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleSignup}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <label style={{ fontSize: "13px" }}>
              University Email
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ fontSize: "13px" }}>
              Password
              <input
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={primaryButtonStyle}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// Tab button (Sign In / Sign Up)
function TabButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 0",
        borderRadius: "999px",
        border: "none",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
        backgroundColor: isActive ? "#BBDEFB" : "transparent", // Sail
        color: "#333333",
      }}
    >
      {label}
    </button>
  );
}

// Shared styles
const inputStyle = {
  width: "100%",
  marginTop: "4px",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #D7CCC8", // Swirl
  fontSize: "14px",
  backgroundColor: "#FFFFFF",
  color: "#333333",
};

const primaryButtonStyle = {
  marginTop: "8px",
  padding: "10px",
  width: "100%",
  backgroundColor: "#C8D5B9", // Coriander
  border: "none",
  borderRadius: "999px",
  fontWeight: "bold",
  cursor: "pointer",
};

export default AuthPage;
