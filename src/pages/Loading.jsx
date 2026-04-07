import React from "react";

function Loading() {
  return (
    <div className="loading-container">
      <div className="orbit">
        <span className="dot dot1"></span>
        <span className="dot dot2"></span>
        <span className="dot dot3"></span>
        <span className="dot dot4"></span>
      </div>

      <style jsx>{`
        .loading-container {
          min-height: 300px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f3f5;
        }

        .orbit {
          position: relative;
          width: 80px;
          height: 80px;
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