"use client";

import { useEffect, useState, useRef } from "react";

/**
 * TypingEffect component that displays text with a character-by-character typing animation
 * @param {Object} props - Component props
 * @param {String} props.text - The full text to type out
 * @param {Number} props.speed - Typing speed in milliseconds per character (default: 20)
 * @param {Boolean} props.isVisible - Whether the typing effect should be active
 * @param {Function} props.onComplete - Callback when typing is complete
 */
export default function TypingEffect({ 
  text = "", 
  speed = 20, 
  isVisible = true,
  onComplete = null 
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef(null);
  const textRef = useRef(text);

  // Update text ref when text changes
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Reset and start typing when text changes or becomes visible
  useEffect(() => {
    if (!isVisible || !text) {
      setDisplayedText("");
      setIsTyping(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Reset displayed text when new text arrives
    setDisplayedText("");
    setIsTyping(true);
    let currentIndex = 0;

    const typeNextChar = () => {
      const currentText = textRef.current;
      if (currentIndex < currentText.length) {
        setDisplayedText(currentText.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    };

    // Start typing after a small delay
    timeoutRef.current = setTimeout(typeNextChar, 50);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, isVisible, speed, onComplete]);

  if (!isVisible || !text) {
    return null;
  }

  return (
    <span className="inline-block">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

