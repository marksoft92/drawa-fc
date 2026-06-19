export default function PanelLoading() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 20px",
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: "3px solid rgba(59,130,246,0.15)",
        borderTopColor: "#3b82f6",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
