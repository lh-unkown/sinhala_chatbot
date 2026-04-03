"use client";

import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaUser, FaPaperclip, FaTimes } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import styles from "./page.module.css";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "ආයුබෝවන්! මම ඔබේ සිංහල AI සහායකයා. මට ඔබට උදව් කළ හැකි දෙයක් තිබේද?" }
  ]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 10MB Limit
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: base64String
      });
      setError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;
    
    setError(null);
    const userMessage = { 
        role: "user", 
        content: input.trim() || "[File Attached]",
        attachment: attachment
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachment(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Failed to parse server response.");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to communicate with AI.");
      }
      
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "bot", content: data.content }]);
    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message} (කරුණාකර නැවත උත්සාහ කරන්න)`);
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
          {attachment && (
            <div className={styles.filePreviewContainer}>
              <div className={styles.filePreviewPill}>
                <span className={styles.fileName}>{attachment.name}</span>
                <button className={styles.removeFileBtn} onClick={() => setAttachment(null)}>
                  <FaTimes size={12} />
                </button>
              </div>
            </div>
          )}

          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp, application/pdf" 
            style={{ display: "none" }} 
            ref={fileInputRef}
            onChange={handleFileChange} 
          />
          <button 
            className={styles.attachButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Attach File"
          >
            <FaPaperclip />
          </button>

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
            disabled={(!input.trim() && !attachment) || isLoading}
            title="Transmit"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </main>
  );
}
