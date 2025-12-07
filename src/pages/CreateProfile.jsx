// CreateProfile.jsx
// Profile creation + editing page WITHOUT Firebase Storage.
//
// - Basic info: name, age, gender, bio, hasHouse
// - Tags: neighborhoods, roommate preferences
//   • Added via "Add" button OR clicking preset chips (no Enter needed)
// - Profile photo & home photos stored as base64 data URLs in Firestore
//   (works without Firebase Storage)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// 🔹 Preset tag suggestions
const PRESET_NEIGHBORHOODS = [
  "Çankaya",
  "Kolej",
  "Tunalı",
  "ODTÜ çevresi",
  "Kızılay",
  "Bahçelievler",
];

const PRESET_PREFS = [
  "tidy",
  "non-smoker",
  "quiet",
  "social",
  "night owl",
  "early bird",
  "LGBTQ+ friendly",
];

// Helper: read a File object as data URL (base64) using FileReader
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CreateProfile() {
  const navigate = useNavigate();

  // Basic fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [hasHouse, setHasHouse] = useState(false);
  const [bio, setBio] = useState("");

  // Profile photo data URL
  const [profilePhoto, setProfilePhoto] = useState("");

  // Tag arrays
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [roommatePreferences, setRoommatePreferences] = useState([]);

  // Temporary input values for new tags
  const [neighborhoodInput, setNeighborhoodInput] = useState("");
  const [roommatePrefInput, setRoommatePrefInput] = useState("");

  // Home photos (data URLs)
  const [homePhotos, setHomePhotos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // -----------------------------
  // Load existing profile (edit)
  // -----------------------------
  useEffect(() => {
    const loadProfileIfExists = async () => {
      if (!auth.currentUser) {
        navigate("/");
        return;
      }

      try {
        const uid = auth.currentUser.uid;
        const profileRef = doc(db, "users", uid);
        const snap = await getDoc(profileRef);

        if (snap.exists()) {
          const data = snap.data();

          setName(data.name || "");
          setAge(data.age || "");
          setGender(data.gender || "");
          setHasHouse(Boolean(data.hasHouse));
          setBio(data.bio || "");

          setProfilePhoto(data.profilePhoto || "");

          setNeighborhoods(
            Array.isArray(data.neighborhoods) ? data.neighborhoods : []
          );
          setRoommatePreferences(
            Array.isArray(data.roommatePreferences)
              ? data.roommatePreferences
              : []
          );
          setHomePhotos(Array.isArray(data.homePhotos) ? data.homePhotos : []);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setErrorMsg("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfileIfExists();
  }, [navigate]);

  // -----------------------------
  // Tag helpers (button + preset)
  // -----------------------------

  // can be called with valueFromChip OR use current input
  const addNeighborhoodTag = (valueFromChip) => {
    const raw = valueFromChip ?? neighborhoodInput;
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!neighborhoods.includes(trimmed)) {
      setNeighborhoods([...neighborhoods, trimmed]);
    }
    setNeighborhoodInput("");
  };

  const removeNeighborhoodTag = (tag) => {
    setNeighborhoods(neighborhoods.filter((n) => n !== tag));
  };

  const addRoommatePrefTag = (valueFromChip) => {
    const raw = valueFromChip ?? roommatePrefInput;
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!roommatePreferences.includes(trimmed)) {
      setRoommatePreferences([...roommatePreferences, trimmed]);
    }
    setRoommatePrefInput("");
  };

  const removeRoommatePrefTag = (tag) => {
    setRoommatePreferences(roommatePreferences.filter((p) => p !== tag));
  };

  // -----------------------------
  // File handlers
  // -----------------------------

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setProfilePhoto(dataUrl);
    } catch (err) {
      console.error("Error reading profile photo:", err);
      setErrorMsg("Could not load profile photo.");
    }
  };

  const handleHomePhotosChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      setHomePhotos((prev) => [...prev, ...dataUrls]);
    } catch (err) {
      console.error("Error reading home photos:", err);
      setErrorMsg("Could not load home photos.");
    }
  };

  // -----------------------------
  // Save profile
  // -----------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!auth.currentUser) {
      setErrorMsg("You must be logged in.");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }

    try {
      setSaving(true);
      const uid = auth.currentUser.uid;
      const finalHomePhotos = hasHouse ? homePhotos : [];

      await setDoc(
        doc(db, "users", uid),
        {
          name: name.trim(),
          age: age.trim(),
          gender,
          hasHouse,
          bio: bio.trim(),
          profilePhoto: profilePhoto || "",
          homePhotos: finalHomePhotos,
          neighborhoods,
          roommatePreferences,
        },
        { merge: true }
      );

      alert("Profile saved!");
      navigate("/home");
    } catch (err) {
      console.error("Error saving profile:", err);
      setErrorMsg("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
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
          Create your profile
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: "14px",
            color: "#555555",
          }}
        >
          Tell other students who you are and where / how you’d like to live.
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

        <form
          onSubmit={handleSaveProfile}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {/* Name */}
          <label style={{ fontSize: "13px" }}>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              style={inputStyle}
              required
            />
          </label>

          {/* Age */}
          <label style={{ fontSize: "13px" }}>
            Age
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="21"
              style={inputStyle}
            />
          </label>

          {/* Gender */}
          <label style={{ fontSize: "13px" }}>
            Gender
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={inputStyle}
            >
              <option value="">Choose...</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>

          {/* Profile photo */}
          <label style={{ fontSize: "13px" }}>
            Profile photo (optional)
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              style={{ marginTop: "6px", fontSize: "12px" }}
            />
            <small style={{ fontSize: "11px", color: "#777" }}>
              Select an image from your device. It will be saved with your
              profile.
            </small>
            {profilePhoto && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", color: "#777" }}>
                  Current preview:
                </span>
                <br />
                <img
                  src={profilePhoto}
                  alt="Profile preview"
                  style={{
                    marginTop: "4px",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </label>

          {/* Has house */}
          <label
            style={{
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="checkbox"
              checked={hasHouse}
              onChange={(e) => setHasHouse(e.target.checked)}
            />
            I already have a house / room to offer
          </label>

          {/* Home photos (only if hasHouse) */}
          {hasHouse && (
            <label style={{ fontSize: "13px" }}>
              Home photos (optional)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleHomePhotosChange}
                style={{ marginTop: "6px", fontSize: "12px" }}
              />
              <small style={{ fontSize: "11px", color: "#777" }}>
                You can choose one or more images. They will be shown to other
                students.
              </small>

              {homePhotos.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#777",
                      marginBottom: "4px",
                    }}
                  >
                    Current home photos:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {homePhotos.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Home ${idx + 1}`}
                        style={{
                          width: "70px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          backgroundColor: "#EEE",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </label>
          )}

          {/* Bio */}
          <label style={{ fontSize: "13px" }}>
            Short bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your study program, habits, and what kind of roommate you are."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          {/* Neighborhood tags */}
          <label style={{ fontSize: "13px" }}>
            Preferred neighborhoods
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "4px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={neighborhoodInput}
                onChange={(e) => setNeighborhoodInput(e.target.value)}
                placeholder="Example: Çankaya"
                style={{ ...inputStyle, marginTop: 0 }}
              />
              <button
                type="button"
                onClick={() => addNeighborhoodTag()}
                style={smallButtonStyle}
              >
                Add
              </button>
            </div>
            <small style={{ fontSize: "11px", color: "#777" }}>
              Type a neighborhood and click “Add” or tap one of the suggestions
              below.
            </small>

            {/* preset neighborhood chips */}
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {PRESET_NEIGHBORHOODS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => addNeighborhoodTag(n)}
                  style={presetChipStyle}
                >
                  {n}
                </button>
              ))}
            </div>

            <TagRow tags={neighborhoods} onRemove={removeNeighborhoodTag} />
          </label>

          {/* Roommate preference tags */}
          <label style={{ fontSize: "13px" }}>
            Roommate preferences
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "4px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={roommatePrefInput}
                onChange={(e) => setRoommatePrefInput(e.target.value)}
                placeholder="Example: tidy, non-smoker"
                style={{ ...inputStyle, marginTop: 0 }}
              />
              <button
                type="button"
                onClick={() => addRoommatePrefTag()}
                style={smallButtonStyle}
              >
                Add
              </button>
            </div>
            <small style={{ fontSize: "11px", color: "#777" }}>
              Type a preference and click “Add” or tap one of the suggestions
              below.
            </small>

            {/* preset roommate preference chips */}
            <div
              style={{
                marginTop: "6px",
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {PRESET_PREFS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => addRoommatePrefTag(p)}
                  style={presetChipStyle}
                >
                  {p}
                </button>
              ))}
            </div>

            <TagRow
              tags={roommatePreferences}
              onRemove={removeRoommatePrefTag}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "8px",
              padding: "10px",
              width: "100%",
              backgroundColor: "#C8D5B9",
              border: "none",
              borderRadius: "999px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Tag row with remove buttons
function TagRow({ tags, onRemove }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "6px",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "999px",
            backgroundColor: "#E3F2FD",
            fontSize: "12px",
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(tag)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "12px",
              padding: 0,
            }}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: "4px",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #D7CCC8",
  fontSize: "14px",
  backgroundColor: "#FFFFFF",
  color: "#333333",
};

const smallButtonStyle = {
  padding: "8px 12px",
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#C8D5B9",
  fontSize: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const presetChipStyle = {
  padding: "4px 10px",
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#F0F4C3",
  fontSize: "12px",
  cursor: "pointer",
};

export default CreateProfile;
