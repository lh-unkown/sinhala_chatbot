"use client";

import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaUser } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import styles from "./page.module.css";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "ආයුබෝවන්! මම ඔබේ සිංහල AI සහායකයා. මට ඔබට උදව් කළ හැකි දෙයක් තිබේද?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setError(null);
    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        throw new Error("Failed to communicate with AI.");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "bot", content: data.content }]);
    } catch (err) {
      console.error(err);
      setError("සමාවෙන්න, සම්බන්ධතා දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.");
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className={styles.mainContainer}>
      <div className={styles.ambientGlow} />
      
      <div className={styles.chatWindow}>
        
        {/* Futuristic AI Orb Header Component */}
        <div className={styles.aiOrbContainer}>
          <div className={styles.orbWrapper}>
            <div className={`${styles.orbCore} ${isLoading ? styles.orbCoreThinking : ""}`} />
            <div className={`${styles.ring} ${styles.ring1} ${isLoading ? styles.ringThinking : ""}`} />
            <div className={`${styles.ring} ${styles.ring2} ${isLoading ? styles.ringThinking : ""}`} />
            <div className={`${styles.ring} ${styles.ring3} ${isLoading ? styles.ringThinking : ""}`} />
          </div>
          <h1 className={styles.headerText}>Sys_Core_SL</h1>
          <p className={styles.statusText}>
            {isLoading ? "Thinking // සිතමින්..." : "Online // සජීවී"}
          </p>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`${styles.messageWrapper} ${msg.role === "user" ? styles.userWrapper : styles.botWrapper}`}
            >
              <div className={`${styles.avatar} ${msg.role === "user" ? styles.userAvatar : styles.botAvatar}`}>
                {msg.role === "user" ? <FaUser size={16} /> : <BsStars size={18} />}
              </div>
              <div className={`${styles.messageBubble} ${msg.role === "user" ? styles.userMessage : styles.botMessage}`}>
                 {msg.content}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className={styles.errorLabel}>
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.inputField}
            placeholder="ඔබේ පණිවිඩය මෙහි ටයිප් කරන්න..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button 
            className={styles.sendButton} 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            title="Transmit"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </main>
  );
}
