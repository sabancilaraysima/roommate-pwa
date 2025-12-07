// ----------------------------------------------------------
// Messages.jsx
//
// Shows a list of people you have mutual likes with
// (same logic as Matches page), but focused on starting chats:
//   - You liked them
//   - They liked you back
// Each row has a "Chat" button → /chat/:uid
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

function Messages() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]); // mutual match profiles
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadMatches = async () => {
      try {
        // Must be logged in
        if (!auth.currentUser) {
          navigate("/");
          return;
        }

        const myUid = auth.currentUser.uid;

        // 1) Likes I sent
        const likesRef = collection(db, "likes");
        const iLikedQuery = query(likesRef, where("fromUid", "==", myUid));
        const iLikedSnap = await getDocs(iLikedQuery);
        const iLikedSet = new Set();
        iLikedSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.toUid) iLikedSet.add(data.toUid);
        });

        // 2) Likes sent to me
        const likedMeQuery = query(likesRef, where("toUid", "==", myUid));
        const likedMeSnap = await getDocs(likedMeQuery);
        const likedMeSet = new Set();
        likedMeSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.fromUid) likedMeSet.add(data.fromUid);
        });

        // 3) Mutual matches = intersection of both sets
        const mutualIds = [...iLikedSet].filter((uid) => likedMeSet.has(uid));

        if (mutualIds.length === 0) {
          setMatches([]);
          setErrorMsg(
            "No mutual matches yet. Keep connecting with students on the swipe page."
          );
          return;
        }

        // 4) Load each matched user's profile
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
        console.error("Error loading matches for messages:", err);
        setErrorMsg("Could not load your matches.");
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
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
        Loading your conversations…
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
          Messages 💬
        </h1>

        <p
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            color: "#555555",
          }}
        >
          These are your mutual matches. Tap "Chat" to start a conversation
          about living together.
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
            You don’t have any chat-ready matches yet. Use the swipe page to
            connect with more students.
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
              <MatchRow
                key={m.id}
                profile={m}
                onOpenChat={() => navigate(`/chat/${m.id}`)}
              />
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

// A single row for a match with a Chat button
function MatchRow({ profile, onOpenChat }) {
  const hasPhoto = !!profile.profilePhoto;
  const firstLetter = profile.name
    ? profile.name.charAt(0).toUpperCase()
    : "U";

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px",
        borderRadius: "14px",
        backgroundColor: "#F7F2E7",
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
      </div>

      {/* Chat button */}
      <button
        type="button"
        onClick={onOpenChat}
        style={{
          padding: "8px 12px",
          borderRadius: "999px",
          border: "none",
          backgroundColor: "#C8D5B9",
          fontSize: "13px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Chat
      </button>
    </div>
  );
}

export default Messages;
