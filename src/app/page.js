"use client";

import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaUser, FaPaperclip, FaTimes, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

  // --- Export Engines ---
  const exportWord = (content) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const blob = new Blob(['\ufeff', header + content.replace(/\n/g, '<br/>') + footer], { type: 'application/msword' });
    saveAs(blob, "chat_document.doc");
  };

  const exportPDF = async (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#0f172a" });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save("chat_document.pdf");
  };

  const exportExcel = (content) => {
    const lines = content.split('\n').filter(l => l.trim().startsWith('|'));
    if (lines.length < 2) return;
    const data = lines.filter(l => !l.includes('---')).map(l => l.split('|').map(cell => cell.trim()).filter(Boolean));
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "data_table.xlsx");
  };

  const exportPNG = async (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#0f172a" });
    canvas.toBlob((blob) => {
      saveAs(blob, "image_output.png");
    });
  };
  // -----------------------

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
              id={`msg-${idx}`}
              className={`${styles.messageWrapper} ${msg.role === "user" ? styles.userWrapper : styles.botWrapper}`}
            >
              <div className={`${styles.avatar} ${msg.role === "user" ? styles.userAvatar : styles.botAvatar}`}>
                {msg.role === "user" ? <FaUser size={16} /> : <BsStars size={18} />}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
                <div className={`${styles.messageBubble} ${msg.role === "user" ? styles.userMessage : styles.botMessage}`}>
                   {msg.content}
                </div>
                
                {/* Export Toolkit Bar */}
                {msg.role === "bot" && (
                  <div className={styles.exportBar} data-html2canvas-ignore="true">
                    <button className={styles.exportBtn} onClick={() => exportPDF(idx)} title="Download PDF">
                      <FaFilePdf size={14} /> PDF
                    </button>
                    <button className={styles.exportBtn} onClick={() => exportWord(msg.content)} title="Download Word Doc">
                      <FaFileWord size={14} /> Word
                    </button>
                    {msg.content.includes('|') && msg.content.includes('---') && (
                      <button className={styles.exportBtn} onClick={() => exportExcel(msg.content)} title="Download Excel Sheet">
                        <FaFileExcel size={14} /> Excel
                      </button>
                    )}
                    <button className={styles.exportBtn} onClick={() => exportPNG(idx)} title="Download as PNG Image">
                      <FaFileImage size={14} /> PNG
                    </button>
                  </div>
                )}
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
