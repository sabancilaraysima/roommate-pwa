// ----------------------------------------------------------
// Chat.jsx
//
// One-to-one chat between the current user and a match.
// URL format: /chat/:uid
//   - :uid is the OTHER user's uid
//
// Firestore structure:
//   chats/{chatId}         → { participants: [uid1, uid2], createdAt? }
//   chats/{chatId}/messages/{messageId} → {
//      text, fromUid, toUid, createdAt
//   }
//
// chatId is deterministic so both sides join the same room:
//   chatId = smallerUid + "_" + largerUid
// ----------------------------------------------------------

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

function Chat() {
  const navigate = useNavigate();
  const { uid: otherUid } = useParams(); // uid from URL
  const [chatId, setChatId] = useState(null);

  const [otherProfile, setOtherProfile] = useState(null); // other student's profile
  const [messages, setMessages] = useState([]); // chat messages
  const [newMessage, setNewMessage] = useState(""); // input text

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const messagesEndRef = useRef(null); // for auto-scroll

  // Helper: build a stable chat ID from two user IDs
  const getChatId = (uid1, uid2) => {
    if (!uid1 || !uid2) return null;
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Load chat + other profile + start listening for messages
  useEffect(() => {
    let unsubscribe = null;

    const setupChat = async () => {
      try {
        if (!auth.currentUser) {
          navigate("/");
          return;
        }
        if (!otherUid || otherUid === auth.currentUser.uid) {
          setErrorMsg("Invalid chat partner.");
          setLoading(false);
          return;
        }

        const myUid = auth.currentUser.uid;
        const id = getChatId(myUid, otherUid);
        setChatId(id);

        // Load other user's profile info
        const otherRef = doc(db, "users", otherUid);
        const otherSnap = await getDoc(otherRef);
        if (!otherSnap.exists()) {
          setErrorMsg("Could not load the other student's profile.");
          setLoading(false);
          return;
        }
        setOtherProfile(otherSnap.data());

        // Ensure chat document exists
        const chatRef = doc(db, "chats", id);
        await setDoc(
          chatRef,
          {
            participants: [myUid, otherUid],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Start listening to messages in this chat
        const messagesRef = collection(db, "chats", id, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setMessages(list);
          setLoading(false);
        });
      } catch (err) {
        console.error("Error setting up chat:", err);
        setErrorMsg("Could not load chat.");
        setLoading(false);
      }
    };

    setupChat();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate, otherUid]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!chatId || !auth.currentUser || !otherUid) return;

    const text = newMessage.trim();
    if (!text) return;

    try {
      const myUid = auth.currentUser.uid;
      const messagesRef = collection(db, "chats", chatId, "messages");

      await addDoc(messagesRef, {
        text,
        fromUid: myUid,
        toUid: otherUid,
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setErrorMsg("Could not send your message.");
    }
  };

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
        Opening chat…
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
          padding: "16px 16px 20px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          height: "80vh", // nice tall chat card
          maxHeight: "680px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/messages")}
            style={{
              marginRight: "10px",
              border: "none",
              background: "transparent",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ⬅
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {otherProfile?.profilePhoto ? (
              <img
                src={otherProfile.profilePhoto}
                alt={otherProfile.name}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#BBDEFB",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#333333",
                }}
              >
                {otherProfile?.name
                  ? otherProfile.name.charAt(0).toUpperCase()
                  : "U"}
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#333333",
                }}
              >
                {otherProfile?.name || "Student"}
              </div>
              {otherProfile?.neighborhoods &&
                otherProfile.neighborhoods.length > 0 && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666666",
                    }}
                  >
                    Prefers: {otherProfile.neighborhoods[0]}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "#EEE",
            marginBottom: "8px",
          }}
        />

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "6px 4px",
          }}
        >
          {errorMsg && (
            <div
              style={{
                marginBottom: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                backgroundColor: "#FFD54F",
                fontSize: "13px",
              }}
            >
              {errorMsg}
            </div>
          )}

          {messages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontSize: "13px",
                color: "#777",
              }}
            >
              No messages yet. Say hi and ask about their housing plans 😊
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.fromUid === auth.currentUser?.uid}
              />
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSend}
          style={{
            marginTop: "8px",
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            type="text"
            placeholder="Write a message…"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "999px",
              border: "1px solid #D7CCC8",
              fontSize: "14px",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#C8D5B9",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// A single message bubble
function MessageBubble({ message, isMine }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: "6px",
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "8px 12px",
          borderRadius: "14px",
          backgroundColor: isMine ? "#BBDEFB" : "#F7F2E7",
          fontSize: "14px",
          color: "#333333",
          wordBreak: "break-word",
        }}
      >
        {message.text}
      </div>
    </div>
  );
}

export default Chat;
