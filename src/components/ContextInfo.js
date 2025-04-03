import React, { useState, useEffect, useRef } from "react";
import "../styles/ContextInfo.css";

const ContextInfo = ({ title, description }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const [popupPosition, setPopupPosition] = useState({
    top: true,
    right: true,
  });

  // Calculate and set the optimal position for the popup
  const calculatePosition = () => {
    if (!buttonRef.current || !popupRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const popupWidth = 320; // Width from CSS
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check horizontal position
    const rightSpace = viewportWidth - buttonRect.right;
    const leftSpace = buttonRect.left;

    // Check vertical position
    const bottomSpace = viewportHeight - buttonRect.bottom;

    // Set optimal position
    setPopupPosition({
      top: bottomSpace >= 250, // Show below if enough space, otherwise above
      right: rightSpace < popupWidth && leftSpace >= popupWidth, // Show on left if not enough right space
      center: window.innerWidth <= 768, // Center on mobile
    });
  };

  // Close the popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        !event.target.classList.contains("context-button")
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      calculatePosition();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <div className="context-info">
      <button
        ref={buttonRef}
        className="context-button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={isOpen ? "Close explanation" : "Open explanation"}
        title="Click for more information"
      >
        {isOpen ? "✕" : "?"}
      </button>

      {isOpen && (
        <div
          className={`context-popup ${popupPosition.top ? "top" : "bottom"} ${
            popupPosition.center
              ? "center"
              : popupPosition.right
              ? "right"
              : "left"
          }`}
          ref={popupRef}
        >
          <div className="context-header">
            <h4>{title}</h4>
            <button onClick={() => setIsOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="context-content">{description}</div>
        </div>
      )}
    </div>
  );
};

export default ContextInfo;
