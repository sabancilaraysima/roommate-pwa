// ----------------------------------------------------------
// Home.jsx
//
// Main page after login + profile creation.
// Shows:
//   - Welcome message with student's name
//   - Quick summary of match preferences
//   - Buttons:
//        🔍 Find roommates   → /swipe
//        💜 View matches     → /matches
//        💬 Messages         → /messages
//        👤 View my profile  → /profile
//        🚪 Log out          → /
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

function Home() {
  const navigate = useNavigate();

  // Store the logged-in user's profile from Firestore
  const [profile, setProfile] = useState(null);

  // Loading + error states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Load profile when page opens
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // If there is no logged-in user, go back to auth page
        if (!auth.currentUser) {
          navigate("/");
          return;
        }

        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          setErrorMsg("We couldn't find your profile. Please create it first.");
          // You could also navigate("/create-profile") here if you want
        } else {
          setProfile(snap.data());
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setErrorMsg("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  // Go to swipe / matching page
  const handleFindRoommates = () => {
    navigate("/swipe");
  };

  // Log out and go back to sign-in page
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      navigate("/");
    }
  };

  // --------------- RENDER ---------------

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#FFF8E1",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading your home…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8E1", // Gin Fizz
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          padding: "20px 20px 24px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "22px",
            color: "#333333",
          }}
        >
          Welcome{profile?.name ? `, ${profile.name}` : ""} 👋
        </h1>

        <p
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            color: "#555555",
          }}
        >
          This is your student-only roommate hub. From here you can find
          roommates, see your matches, chat, and manage your profile.
        </p>

        {/* Error message, if any */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: "#FFD54F",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "12px",
              fontSize: "14px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Quick summary card (only if profile exists) */}
        {profile && (
          <div
            style={{
              padding: "12px",
              borderRadius: "14px",
              backgroundColor: "#F7F2E7",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: "#555555",
                marginBottom: "4px",
              }}
            >
              Your match preferences
            </div>

            {/* Neighborhoods */}
            {profile.neighborhoods && profile.neighborhoods.length > 0 && (
              <div style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "2px",
                  }}
                >
                  Preferred neighborhoods
                </div>
                <TagRow items={profile.neighborhoods} />
              </div>
            )}

            {/* Roommate preferences */}
            {profile.roommatePreferences &&
              profile.roommatePreferences.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "2px",
                    }}
                  >
                    Roommate preferences
                  </div>
                  <TagRow items={profile.roommatePreferences} />
                </div>
              )}
          </div>
        )}

        {/* Main action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={handleFindRoommates}
            style={{
              padding: "12px",
              width: "100%",
              backgroundColor: "#BBDEFB", // Sail
              border: "none",
              borderRadius: "999px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🔍 Find roommates
          </button>

          <button
            type="button"
            onClick={() => navigate("/matches")}
            style={{
              padding: "12px",
              width: "100%",
              backgroundColor: "#FFD54F", // Mustard
              border: "none",
              borderRadius: "999px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            💜 View matches
          </button>

          <button
            type="button"
            onClick={() => navigate("/messages")}
            style={{
              padding: "12px",
              width: "100%",
              backgroundColor: "#C8D5B9", // Coriander
              border: "none",
              borderRadius: "999px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            💬 Messages
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{
              padding: "12px",
              width: "100%",
              backgroundColor: "#E3F2FD",
              border: "none",
              borderRadius: "999px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            👤 View my profile
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "10px",
              width: "100%",
              backgroundColor: "#FFFFFF",
              borderRadius: "999px",
              border: "1px solid #D7CCC8",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px",
              color: "#333333",
            }}
          >
            🚪 Log out
          </button>
        </div>
      </div>
    </div>
  );
}

// Renders a simple row of tags (used for neighborhoods + preferences)
function TagRow({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {items.map((item, idx) => (
        <span
          key={idx}
          style={{
            padding: "4px 10px",
            borderRadius: "999px",
            backgroundColor: "#E3F2FD",
            fontSize: "12px",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default Home;
