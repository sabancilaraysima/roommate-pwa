// Reusable Tag component for neighborhood and preference tags
export default function Tag({ label, onRemove }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "#C8D5B9",
        padding: "6px 10px",
        borderRadius: "12px",
        marginRight: "6px",
        marginBottom: "6px",
        fontSize: "14px",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          marginLeft: "8px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        ×
      </button>
    </span>
  );
}
