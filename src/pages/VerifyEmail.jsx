// VerifyEmail.jsx
// Tells user to check their inbox and verify email.
// Has a button to re-check verification status.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

function VerifyEmail() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage("");

    try {
      await auth.currentUser?.reload();
      const user = auth.currentUser;

      if (user && user.emailVerified) {
        setMessage("Email verified! Redirecting to profile setup...");
        setTimeout(() => {
          navigate("/create-profile");
        }, 800);
      } else {
        setMessage("Not verified yet. Please click the link in your email.");
      }
    } catch (err) {
      console.error("Error checking verification:", err);
      setMessage("Could not check verification status.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8E1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
          padding: "24px 22px",
          textAlign: "left",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: "20px",
            color: "#333333",
          }}
        >
          Verify your email ✉️
        </h2>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "14px",
            color: "#555555",
          }}
        >
          We sent a verification link to your university email. Please open your
          inbox, click the link, then return here.
        </p>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: "13px",
            color: "#777777",
          }}
        >
          This step keeps the platform safe and student-only.
        </p>

        <button
          onClick={handleCheckStatus}
          disabled={checking}
          style={{
            padding: "10px",
            width: "100%",
            backgroundColor: "#C8D5B9",
            border: "none",
            borderRadius: "999px",
            fontWeight: "bold",
            cursor: checking ? "default" : "pointer",
          }}
        >
          {checking ? "Checking..." : "I verified my email"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "12px",
              fontSize: "13px",
              color: "#555555",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
