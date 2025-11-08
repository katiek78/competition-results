import React, { useState, useRef } from "react";

const FlagTooltip = ({ country, children, style = {} }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Toggle tooltip
    setShowTooltip(!showTooltip);

    // Auto-hide after 2.5 seconds
    if (!showTooltip) {
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 2500);
    }
  };

  const handleMouseEnter = (e) => {
    setIsHovering(true);
    e.target.style.backgroundColor = "#f0f0f0";
  };

  const handleMouseLeave = (e) => {
    setIsHovering(false);
    e.target.style.backgroundColor = "transparent";
  };

  return (
    <span
      style={{
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        padding: "2px 4px",
        borderRadius: "3px",
        transition: "background-color 0.2s",
        ...style,
      }}
      title={country} // Always show native tooltip as backup
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Custom tooltip - shows on click */}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "white",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "14px",
            whiteSpace: "nowrap",
            zIndex: 1000,
            marginBottom: "5px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.3s ease-out",
            pointerEvents: "none", // Prevent tooltip from blocking clicks
          }}
        >
          {country}
          {/* Tooltip arrow */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #333",
            }}
          />
        </div>
      )}
    </span>
  );
};

export default FlagTooltip;
