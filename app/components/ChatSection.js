"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ThinkingEffect from "./ThinkingEffect";
import TypingEffect from "./TypingEffect";

/**
 * @param {Object} props - Component props
 * @param {Array} props.chatHistory - Array of chat objects: [{ id?: number, query: string, response: string, category: 'Captioning'|'Grounding'|'VQA', timestamp?: Date, coordinates?: Array }]
 * @param {Function} props.onQueryClick - Callback function when a query is clicked: (chat: Object) => void
 * @param {String} props.selectedQueryId - ID of the currently selected query
 */
export default function ChatSection({
  chatHistory = [],
  onQueryClick = null,
  selectedQueryId = null,
  thinkingQueryId = null,
}) {
  const [activeTab, setActiveTab] = useState("All");
  const chatEndRef = useRef(null);
  const [localSelectedId, setLocalSelectedId] = useState(selectedQueryId);
  // Track which chat responses have completed typing
  const completedTypingRef = useRef(new Set());
  // Track which chats were in thinking state (to detect new responses)
  const wasThinkingRef = useRef(new Set());
  // Track previous response states to detect new responses
  const previousResponsesRef = useRef(new Map());
  const [typingStates, setTypingStates] = useState({});

  useEffect(() => {
    setLocalSelectedId(selectedQueryId);
  }, [selectedQueryId]);

  // Track which chats are currently thinking
  useEffect(() => {
    if (thinkingQueryId) {
      wasThinkingRef.current.add(thinkingQueryId);
    }
  }, [thinkingQueryId]);

  // Scroll to bottom when new messages are added or typing progresses
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, thinkingQueryId, typingStates]);

  // Track new responses that need typing effect
  useEffect(() => {
    chatHistory.forEach((chat) => {
      if (chat.id) {
        const previousResponse = previousResponsesRef.current.get(chat.id);
        const currentResponse = chat.response || "";
        
        // Check if this chat was in thinking state (new response, not loaded from DB)
        const wasInThinkingState = wasThinkingRef.current.has(chat.id);
        
        // Detect if this is a new response:
        // 1. Has current response text
        // 2. Previous response was empty or undefined
        // 3. Not already completed typing
        // 4. Was in thinking state (indicates newly received, not loaded from DB)
        const isNewResponse = 
          currentResponse && 
          (!previousResponse || previousResponse === "") &&
          !completedTypingRef.current.has(chat.id) &&
          wasInThinkingState;
        
        // Update previous response tracking
        previousResponsesRef.current.set(chat.id, currentResponse);
        
        // If this is a new response, start typing effect
        if (isNewResponse) {
          setTypingStates((prev) => ({
            ...prev,
            [chat.id]: { isTyping: true, hasStarted: true },
          }));
        } else if (currentResponse && previousResponse === undefined && !wasInThinkingState) {
          // If response exists on first render and wasn't thinking (loaded from DB), skip typing
          completedTypingRef.current.add(chat.id);
        }
      }
    });
  }, [chatHistory]);

  // Hide scrollbar styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .chat-messages-area::-webkit-scrollbar {
        display: none;
      }
      .chat-messages-area {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const tabs = ["All", "Captioning", "Grounding", "VQA"];

  const filteredChatHistory =
    activeTab === "All"
      ? chatHistory
      : chatHistory.filter((chat) => chat.category === activeTab);

  const handleQueryClick = (chat) => {
    if (onQueryClick) onQueryClick(chat);
  };

  return (
    <div className="w-full h-[65vh] flex flex-col bg-[#0f1720] border border-cyan-700/10 rounded-2xl overflow-hidden min-h-[420px] shadow-lg">
      {/* Tabs */}
      <div className="flex items-center justify-center py-1 border-b border-cyan-700/10">
        <div className="flex space-x-4 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 py-2 transition-colors relative ${
                activeTab === tab
                  ? "text-white"
                  : "text-slate-300/60 hover:text-slate-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-8 chat-messages-area"
        onClick={() => {
          setLocalSelectedId(null);
          if (onQueryClick) onQueryClick(null);
        }}
      >
        {filteredChatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No chat history yet. Start a conversation below.
          </div>
        ) : (
          filteredChatHistory.map((chat) => {
            const isThinking =
              Boolean(chat.isThinking) && thinkingQueryId === chat.id;

            return (
              <div key={chat.id} className="space-y-3">
                {/* USER QUERY */}
                <div className="flex flex-col items-end">
                  <span className="text-xs text-blue-400 mb-0.5 px-2 font-medium">
                    {chat.category}
                  </span>

                  <button
                    className={`bg-blue-600 text-white px-2 py-3 rounded-lg max-w-[75%] shadow-md transition-all cursor-pointer focus:outline-none ${
                      localSelectedId === chat.id
                        ? "ring-2 ring-cyan-400 ring-offset-transparent"
                        : "hover:bg-blue-700"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalSelectedId(chat.id);
                      handleQueryClick(chat);
                    }}
                  >
                    <p className="leading-relaxed text-left whitespace-pre-wrap break-words max-w-full">
                      {chat.query}
                    </p>
                  </button>
                </div>

                {/* MODEL RESPONSE */}
                {isThinking ? (
                  <div className="flex flex-col items-start">
                    <div className="bg-black text-white px-4 py-3 rounded-lg max-w-[75%] border border-cyan-700/20 shadow-lg">
                      <ThinkingEffect isVisible={true} />
                    </div>
                  </div>
                ) : chat.response ? (
                  <div className="flex flex-col items-start">
                    <div
                      className={`bg-black text-white px-2 py-3 rounded-lg max-w-[75%] border shadow-lg ${
                        chat.error ? "border-red-500/30" : "border-black"
                      }`}
                    >
                      {typingStates[chat.id]?.isTyping && !completedTypingRef.current.has(chat.id) ? (
                        <p
                          className={`leading-relaxed whitespace-pre-wrap break-words max-w-full ${
                            chat.error ? "text-red-400" : ""
                          }`}
                        >
                          <TypingEffect
                            text={chat.response}
                            speed={15}
                            isVisible={true}
                            onComplete={() => {
                              completedTypingRef.current.add(chat.id);
                              setTypingStates((prev) => ({
                                ...prev,
                                [chat.id]: { isTyping: false, hasStarted: true },
                              }));
                            }}
                          />
                        </p>
                      ) : (
                        <p
                          className={`leading-relaxed whitespace-pre-wrap break-words max-w-full ${
                            chat.error ? "text-red-400" : ""
                          }`}
                        >
                          {chat.response}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-start">
                    <div className="bg-black text-white px-2 py-3 rounded-lg max-w-[75%] border border-black shadow-lg">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="animate-spin h-4 w-4 text-cyan-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="text-sm text-slate-400">
                          Processing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
