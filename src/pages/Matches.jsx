// ----------------------------------------------------------
// Matches.jsx
//
// Shows mutual matches:
//   - You liked them  (likes.fromUid == currentUser.uid)
//   - They liked you  (likes.toUid == currentUser.uid)
//
// Steps:
//   1) Load all likes where fromUid = me  → myLikes
//   2) Load all likes where toUid = me    → likesMe
//   3) Find intersection of user IDs
//   4) Load those users' profiles from "users" collection
//   5) Display them in a nice centered card
//   6) NEW: Show "has house" badge + home photo preview
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

function Matches() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]); // list of profiles
  const [loading, setLoading] = useState(true); // loading state
  const [errorMsg, setErrorMsg] = useState(""); // error / info text

  useEffect(() => {
    const loadMatches = async () => {
      try {
        // 1) Must be logged in
        if (!auth.currentUser) {
          navigate("/");
          return;
        }

        const myUid = auth.currentUser.uid;

        // 2) Load likes I sent
        const likesRef = collection(db, "likes");
        const myLikesQuery = query(likesRef, where("fromUid", "==", myUid));
        const myLikesSnap = await getDocs(myLikesQuery);

        const iLikedSet = new Set();
        myLikesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.toUid) {
            iLikedSet.add(data.toUid);
          }
        });

        // 3) Load likes sent to me
        const likesMeQuery = query(likesRef, where("toUid", "==", myUid));
        const likesMeSnap = await getDocs(likesMeQuery);

        const likedMeSet = new Set();
        likesMeSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.fromUid) {
            likedMeSet.add(data.fromUid);
          }
        });

        // 4) Intersection: IDs that are in both sets
        const mutualIds = [...iLikedSet].filter((uid) => likedMeSet.has(uid));

        if (mutualIds.length === 0) {
          setMatches([]);
          setErrorMsg(
            "No mutual matches yet. Keep swiping and connecting with students!"
          );
          return;
        }

        // 5) Load profile for each matched user
        const results = [];
        for (const uid of mutualIds) {
          const userRef = doc(db, "users", uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            results.push({
              id: uid,
              ...snap.data(),
            });
          }
        }

        setMatches(results);

        if (results.length === 0) {
          setErrorMsg(
            "You have some likes, but we couldn't load the other profiles."
          );
        }
      } catch (err) {
        console.error("Error loading matches:", err);
        setErrorMsg("Could not load your matches.");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [navigate]);

  // ---------- RENDER ----------

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
        Loading your matches…
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
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "22px",
            color: "#333333",
          }}
        >
          Your matches 💜
        </h1>

        <p
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            color: "#555555",
          }}
        >
          These are students you liked and who liked you back. In the future,
          this page can become your chat list.
        </p>

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

        {matches.length === 0 ? (
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              backgroundColor: "#F7F2E7",
              textAlign: "center",
              marginBottom: "16px",
              fontSize: "14px",
              color: "#444",
            }}
          >
            No mutual matches yet. Keep using the swipe page to connect with
            other students.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {matches.map((m) => (
              <MatchCard key={m.id} profile={m} />
            ))}
          </div>
        )}

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

// A single match row card (avatar + summary + home photo)
function MatchCard({ profile }) {
  const hasPhoto = !!profile.profilePhoto;
  const firstLetter = profile.name
    ? profile.name.charAt(0).toUpperCase()
    : "U";

  const hasHouse = Boolean(profile.hasHouse);
  const homePhotos =
    Array.isArray(profile.homePhotos) && profile.homePhotos.length > 0
      ? profile.homePhotos
      : [];

  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "14px",
        backgroundColor: "#F7F2E7",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Top row: avatar + info */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        {/* Avatar */}
        {hasPhoto ? (
          <img
            src={profile.profilePhoto}
            alt={profile.name}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#BBDEFB",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: "22px",
              color: "#333333",
            }}
          >
            {firstLetter}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#333333",
            }}
          >
            {profile.name || "Unnamed student"}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#555555",
              marginTop: "2px",
            }}
          >
            {profile.age && profile.gender
              ? `${profile.age} • ${profile.gender}`
              : profile.age || profile.gender || "Student"}
          </div>

          {profile.neighborhoods && profile.neighborhoods.length > 0 && (
            <div
              style={{
                fontSize: "12px",
                color: "#666666",
                marginTop: "4px",
              }}
            >
              Areas: {profile.neighborhoods.slice(0, 3).join(", ")}
              {profile.neighborhoods.length > 3 ? "..." : ""}
            </div>
          )}

          {profile.roommatePreferences &&
            profile.roommatePreferences.length > 0 && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#666666",
                  marginTop: "2px",
                }}
              >
                Vibe: {profile.roommatePreferences.slice(0, 3).join(", ")}
                {profile.roommatePreferences.length > 3 ? "..." : ""}
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
      </div>

      {/* Home photo preview under the row */}
      {hasHouse && homePhotos.length > 0 && (
        <img
          src={homePhotos[0]}
          alt="Home preview"
          style={{
            width: "100%",
            height: "140px",
            objectFit: "cover",
            borderRadius: "12px",
            backgroundColor: "#EEE",
          }}
        />
      )}
    </div>
  );
}

export default Matches;
