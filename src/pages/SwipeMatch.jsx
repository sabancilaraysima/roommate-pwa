// ----------------------------------------------------------
// SwipeMatch.jsx
//
// Real roommate browser with SIMPLE MATCHING:
//  - Loads other student profiles from Firestore ("users" collection)
//  - Skips the current logged-in user
//  - Computes a "matchScore" (0–100) for each profile based on:
//      • Budget similarity
//      • Shared neighborhoods
//      • Shared roommate preferences
//  - Sorts profiles by matchScore (best matches first)
//  - Shows one profile at a time with "Skip" + "Connect"
//  - Saves likes into "likes" collection for future matching
//  - NEW: shows "has house" badge + home photos (if any)
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";

function SwipeMatch() {
  const navigate = useNavigate();

  // My own profile (from Firestore)
  const [myProfile, setMyProfile] = useState(null);

  // List of other student profiles (with matchScore included)
  const [profiles, setProfiles] = useState([]);

  // Current index in the profiles array
  const [currentIndex, setCurrentIndex] = useState(0);

  // UI states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastAction, setLastAction] = useState("");

  // Load my profile + other profiles when page opens
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!auth.currentUser) {
          navigate("/");
          return;
        }

        const uid = auth.currentUser.uid;

        // 1) Load my profile
        const myRef = doc(db, "users", uid);
        const mySnap = await getDoc(myRef);

        if (!mySnap.exists()) {
          // If I don't have a profile yet, force me to create one
          navigate("/create-profile");
          return;
        }

        const myData = mySnap.data();
        setMyProfile(myData);

        // 2) Load ALL users
        const usersRef = collection(db, "users");
        const usersSnap = await getDocs(usersRef);

        const others = [];
        usersSnap.forEach((d) => {
          if (d.id !== uid) {
            others.push({
              id: d.id,
              ...d.data(),
            });
          }
        });

        if (others.length === 0) {
          setErrorMsg(
            "No other verified student profiles yet. Invite your friends to sign up!"
          );
        }

        // 3) Compute matchScore for each "other" profile and sort by score
        const ranked = rankProfilesWithMatchScore(myData, others);
        setProfiles(ranked);
      } catch (err) {
        console.error("Error loading swipe data:", err);
        setErrorMsg("Could not load roommate profiles.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const noMoreProfiles = currentIndex >= profiles.length;
  const currentProfile = !noMoreProfiles ? profiles[currentIndex] : null;

  // When user skips a profile
  const handleSkip = () => {
    if (!currentProfile) return;
    setLastAction(`You skipped ${currentProfile.name || "this profile"}.`);
    setCurrentIndex((prev) => prev + 1);
  };

  // When user "connects" (likes) a profile
  const handleConnect = async () => {
    if (!currentProfile || !auth.currentUser) return;

    try {
      await addDoc(collection(db, "likes"), {
        fromUid: auth.currentUser.uid,
        toUid: currentProfile.id,
        createdAt: Date.now(),
      });

      setLastAction(
        `You liked ${currentProfile.name || "this student"}. We'll use this for matching later.`
      );
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Error saving like:", err);
      setLastAction("Could not save your like. Please try again.");
    }
  };

  // --------------- RENDER ----------------

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
        Loading roommate suggestions…
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "10px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "22px",
              color: "#333333",
            }}
          >
            Find roommates
          </h1>

          <span style={{ fontSize: "12px", color: "#777" }}>
            {profiles.length === 0
              ? "0 profiles"
              : noMoreProfiles
              ? "0 left"
              : `${currentIndex + 1} of ${profiles.length}`}
          </span>
        </div>

        <p
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            color: "#555555",
          }}
        >
          You’re seeing the best matches first, based on your neighborhoods,
          budget, and roommate preferences.
        </p>

        {/* Error / info */}
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

        {/* If no profiles */}
        {noMoreProfiles || profiles.length === 0 ? (
          <div
            style={{
              padding: "18px",
              borderRadius: "16px",
              backgroundColor: "#F7F2E7",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#444" }}>
              You’ve reached the end of available profiles.
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
              As more students create profiles, the best matches will appear
              here first.
            </p>
          </div>
        ) : (
          <ProfileCard profile={currentProfile} />
        )}

        {/* Last action note */}
        {lastAction && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "999px",
              backgroundColor: "#E3F2FD",
              fontSize: "13px",
            }}
          >
            {lastAction}
          </div>
        )}

        {/* Action buttons */}
        {!noMoreProfiles && profiles.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <button
              type="button"
              onClick={handleSkip}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "999px",
                border: "1px solid #D7CCC8",
                backgroundColor: "#FFFFFF",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleConnect}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#C8D5B9", // Coriander
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Connect
            </button>
          </div>
        )}

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate("/home")}
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
          ⬅ Back to main page
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Helper: rankProfilesWithMatchScore(myProfile, others)
// ----------------------------------------------------------
//
// Takes your profile and all other profiles, and returns a NEW array:
//   [{ ...otherProfile, matchScore: number }, ...]
// sorted by matchScore descending.
//
// The matching is SIMPLE and EXPLAINABLE for now:
//   - Budget similarity: up to 40 points
//   - Shared neighborhoods: up to 35 points
//   - Shared roommate preferences: up to 25 points
// ----------------------------------------------------------

function rankProfilesWithMatchScore(myProfile, others) {
  return (
    others
      // Add a matchScore field to each profile
      .map((p) => ({
        ...p,
        matchScore: calculateMatchScore(myProfile, p),
      }))
      // Sort from best match (highest score) to worst
      .sort((a, b) => b.matchScore - a.matchScore)
  );
}

function calculateMatchScore(me, other) {
  let score = 0;

  // --- 1) Budget similarity (0–40) ---
  const myBudget = toNumber(me.budget);
  const theirBudget = toNumber(other.budget);

  if (myBudget && theirBudget) {
    const diff = Math.abs(myBudget - theirBudget);
    const maxDiff = myBudget * 0.5; // 50% difference considered "bad"
    const ratio = Math.max(0, 1 - diff / maxDiff); // from 0 to 1
    score += ratio * 40; // scale to 0–40
  } else {
    // If one of budgets is missing, give a neutral middle score
    score += 20;
  }

  // --- 2) Shared neighborhoods (0–35) ---
  const myNeighborhoods = asArrayOfLowercase(me.neighborhoods);
  const theirNeighborhoods = asArrayOfLowercase(other.neighborhoods);

  if (myNeighborhoods.length > 0 && theirNeighborhoods.length > 0) {
    const shared = myNeighborhoods.filter((n) =>
      theirNeighborhoods.includes(n)
    );
    const ratio = Math.min(shared.length / myNeighborhoods.length, 1);
    score += ratio * 35; // more shared areas → closer to 35
  } else {
    // No neighborhoods set → neutral
    score += 18;
  }

  // --- 3) Roommate preferences overlap (0–25) ---
  const myPrefs = asArrayOfLowercase(me.roommatePreferences);
  const theirPrefs = asArrayOfLowercase(other.roommatePreferences);

  if (myPrefs.length > 0 && theirPrefs.length > 0) {
    const sharedPrefs = myPrefs.filter((p) => theirPrefs.includes(p));
    const ratio = Math.min(sharedPrefs.length / myPrefs.length, 1);
    score += ratio * 25;
  } else {
    score += 12; // neutral
  }

  // Clamp 0–100 and return integer
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helpers to safely read arrays / numbers

function asArrayOfLowercase(value) {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v).trim().toLowerCase())
    .filter((v) => v.length > 0);
}

function toNumber(value) {
  if (!value && value !== 0) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}

// ----------------------------------------------------------
// ProfileCard component
// ----------------------------------------------------------
//
// Displays a single roommate profile card, including:
//   - avatar (photo or first letter)
//   - name, age, gender, budget
//   - bio
//   - neighborhoods
//   - roommate preferences
//   - matchScore badge
//   - NEW: "Has a house" badge + home photo preview
// ----------------------------------------------------------

function ProfileCard({ profile }) {
  const hasPhoto = !!profile.profilePhoto;
  const matchScore = profile.matchScore ?? null;

  // Home photos (array of URLs)
  const homePhotos =
    Array.isArray(profile.homePhotos) && profile.homePhotos.length > 0
      ? profile.homePhotos
      : [];

  const hasHouse = Boolean(profile.hasHouse);

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "16px",
        backgroundColor: "#F7F2E7",
        marginBottom: "14px",
      }}
    >
      {/* Top row: avatar + basic info + match badge */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        {/* Avatar */}
        {hasPhoto ? (
          <img
            src={profile.profilePhoto}
            alt={profile.name}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#BBDEFB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "bold",
              color: "#333333",
            }}
          >
            {profile.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}

        {/* Name + details */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#333333",
            }}
          >
            {profile.name || "Unnamed"}
            {profile.age ? `, ${profile.age}` : ""}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#555555",
            }}
          >
            {profile.gender || "Student"}
          </div>

          {/* Budget */}
          {profile.budget && (
            <div
              style={{
                fontSize: "13px",
                color: "#666666",
                marginTop: "4px",
              }}
            >
              Budget: ₺{profile.budget}
            </div>
          )}

          {/* Has house badge */}
          {hasHouse && (
            <div
              style={{
                marginTop: "4px",
                display: "inline-block",
                padding: "3px 8px",
                borderRadius: "999px",
                backgroundColor: "#C8D5B9",
                fontSize: "11px",
                fontWeight: "bold",
                color: "#333333",
              }}
            >
              🏠 Has a place
            </div>
          )}
        </div>

        {/* Match score badge */}
        {matchScore !== null && (
          <div
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              backgroundColor: "#C8D5B9",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#333333",
              minWidth: "72px",
              textAlign: "center",
            }}
          >
            {matchScore}%
          </div>
        )}
      </div>

      {/* Home photo preview (first photo) */}
      {hasHouse && homePhotos.length > 0 && (
        <div
          style={{
            marginBottom: "10px",
          }}
        >
          <img
            src={homePhotos[0]}
            alt="Home preview"
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover",
              borderRadius: "12px",
              backgroundColor: "#EEE",
            }}
          />
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <p
          style={{
            fontSize: "14px",
            color: "#444444",
            marginTop: 0,
            marginBottom: "10px",
            lineHeight: 1.4,
          }}
        >
          {profile.bio}
        </p>
      )}

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
            Prefers neighborhoods:
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
              Roommate vibe:
            </div>
            <TagRow items={profile.roommatePreferences} />
          </div>
        )}
    </div>
  );
}

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

export default SwipeMatch;
