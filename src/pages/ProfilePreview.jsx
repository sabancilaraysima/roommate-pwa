// ProfilePreview.jsx
// Shows the current user's profile (read-only view).
// - Loads users/{uid} from Firestore
// - Renders basic info + neighborhoods + roommate prefs
// - Shows home photos grid if they exist
// - Has "Edit profile" button that goes to /create-profile

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

function ProfilePreview() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) {
        navigate("/");
        return;
      }

      try {
        const uid = auth.currentUser.uid;
        const profileRef = doc(db, "users", uid);
        const snap = await getDoc(profileRef);

        if (!snap.exists()) {
          setErrorMsg("No profile found. Please create your profile first.");
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
        Loading profile…
      </div>
    );
  }

  // Safely normalize homePhotos:
  // - If array → use it
  // - If string → split by commas into array
  let homePhotos = [];
  if (profile && profile.homePhotos) {
    if (Array.isArray(profile.homePhotos)) {
      homePhotos = profile.homePhotos
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0);
    } else if (typeof profile.homePhotos === "string") {
      homePhotos = profile.homePhotos
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
  }

  const hasHouse = Boolean(profile?.hasHouse);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8E1",
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
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "22px",
            color: "#333333",
          }}
        >
          My profile
        </h1>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "#FFD54F",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "12px",
              fontSize: "14px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {profile && (
          <>
            {/* Name + age + gender */}
            <p
              style={{
                margin: "4px 0",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {profile.name || "No name set"}
            </p>

            <p style={{ margin: "4px 0", fontSize: "14px", color: "#555" }}>
              {profile.age && profile.gender
                ? `${profile.age} • ${profile.gender}`
                : profile.age || profile.gender || "Student"}
            </p>

            {/* Has house badge */}
            {hasHouse && (
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  backgroundColor: "#C8D5B9",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#333333",
                  marginTop: "4px",
                  marginBottom: "8px",
                }}
              >
                🏠 I have a place
              </div>
            )}

            {/* Bio */}
            <p
              style={{
                margin: "8px 0",
                fontSize: "14px",
                color: "#555",
              }}
            >
              {profile.bio || "You haven't written a bio yet."}
            </p>

            {/* Neighborhoods */}
            {profile.neighborhoods &&
              Array.isArray(profile.neighborhoods) &&
              profile.neighborhoods.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    Preferred neighborhoods
                  </div>
                  <TagRow items={profile.neighborhoods} />
                </div>
              )}

            {/* Roommate preferences */}
            {profile.roommatePreferences &&
              Array.isArray(profile.roommatePreferences) &&
              profile.roommatePreferences.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    Roommate preferences
                  </div>
                  <TagRow items={profile.roommatePreferences} />
                </div>
              )}

            {/* Home photos grid (house owners) */}
            {hasHouse && homePhotos.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                  }}
                >
                  Home photos
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {homePhotos.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Home ${index + 1}`}
                      style={{
                        width: "110px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        backgroundColor: "#EEE",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Buttons: Edit profile + Back */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/create-profile")}
                style={{
                  padding: "10px",
                  width: "100%",
                  backgroundColor: "#C8D5B9",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ✏️ Edit profile
              </button>

              <button
                type="button"
                onClick={() => navigate("/home")}
                style={{
                  padding: "10px",
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D7CCC8",
                  borderRadius: "999px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#333333",
                }}
              >
                ⬅ Back to main page
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Small reusable tag row component
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

export default ProfilePreview;
