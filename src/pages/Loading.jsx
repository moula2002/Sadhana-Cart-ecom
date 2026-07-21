import React from "react";

function Loading({ inline = false, small = false, message = "", minHeight }) {
  const containerStyle = inline
    ? {
        minHeight: "auto",
        width: "auto",
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        padding: "4px",
      }
    : {
        minHeight: minHeight || "250px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        padding: "20px",
      };

  const orbitScale = small ? 0.55 : 1;
  const orbitWidth = small ? 48 : 80;
  const orbitHeight = small ? 48 : 80;

  return (
    <div className="loading-container" style={containerStyle}>
      <div
        className="orbit"
        style={{
          width: `${orbitWidth}px`,
          height: `${orbitHeight}px`,
          transform: `scale(${orbitScale})`,
          transformOrigin: "center center",
        }}
      >
        <span className="dot dot1"></span>
        <span className="dot dot2"></span>
        <span className="dot dot3"></span>
        <span className="dot dot4"></span>
      </div>
      {message && <p className="mt-2 text-muted fw-bold small mb-0">{message}</p>}

      <style>{`
        .loading-container {
          box-sizing: border-box;
        }

        .orbit {
          position: relative;
        }

        .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: -30px center;
        }

        .dot1 {
          background: #34a853;
          animation: orbit 1.2s linear infinite;
        }

        .dot2 {
          background: #4285f4;
          animation: orbit 1.2s linear infinite;
          animation-delay: 0.3s;
        }

        .dot3 {
          background: #ea4335;
          animation: orbit 1.2s linear infinite;
          animation-delay: 0.6s;
        }

        .dot4 {
          background: #fbbc05;
          animation: orbit 1.2s linear infinite;
          animation-delay: 0.9s;
        }

        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(30px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(30px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default Loading;