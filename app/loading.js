export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#030712",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}>
        <img
          src="/logo.png"
          alt=""
          width={64}
          height={64}
          style={{
            animation: "pulse 1.5s ease-in-out infinite",
            opacity: 0.7,
          }}
        />
        <div style={{
          width: 40,
          height: 3,
          background: "rgba(59,130,246,0.3)",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "60%",
            background: "#3b82f6",
            borderRadius: 2,
            animation: "loadingBar 1.2s ease-in-out infinite",
          }} />
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(0.95); }
            50% { opacity: 0.8; transform: scale(1); }
          }
          @keyframes loadingBar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(80%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    </div>
  );
}
