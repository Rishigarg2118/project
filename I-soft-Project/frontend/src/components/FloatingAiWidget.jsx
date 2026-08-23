import React, { useState, useEffect, useRef } from 'react';

export default function FloatingAiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
       text: "Hello! I am your context-trained Rishi's Emp system AI Operations Agent. Ask me anything about employees, departments, skills, attendance, assets, or request sample SQL queries!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-ai-chat', handleOpenChat);
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      // API call to our new backend route
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: messages.slice(1) // Omit the welcome message from history context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to communicate with AI server');
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.reply || 'Sorry, I encountered an empty response.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `⚠️ Error: ${err.message || 'Could not reach the AI server. Please make sure the backend is running.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'var(--font-body)' }}>
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '370px',
          height: '520px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 0 20px -5px rgba(234, 88, 12, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginBottom: '16px',
          animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
            padding: '16px 20px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🤖</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', fontFamily: 'var(--font-head)' }}>Rishi's Emp system AI Agent</div>
                <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
                  Online & Trained
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxShadow: msg.sender === 'user' ? '0 4px 10px rgba(234, 88, 12, 0.15)' : '0 2px 5px rgba(0,0,0,0.03)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                  {msg.time}
                </span>
              </div>
            ))}
            
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '12px 16px', background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }}></span>
                <span style={{ width: '6px', height: '6px', background: '#7c3aed', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }}></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '12px 16px',
              background: '#ffffff',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Ask AI Agent..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.15)',
                fontSize: '13px',
                outline: 'none',
                background: '#f8fafc',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
                color: '#fff',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s, opacity 0.2s',
                boxShadow: '0 4px 10px rgba(234, 88, 12, 0.2)',
                opacity: (loading || !message.trim()) ? 0.6 : 1
              }}
            >
              <span style={{ fontSize: '16px', transform: 'rotate(-45deg) translate(1px, -1px)' }}>🚀</span>
            </button>
          </form>
          
          {/* Info bar */}
          <div style={{
            background: '#f1f5f9',
            padding: '6px 12px',
            fontSize: '9px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            fontFamily: 'var(--font-head)',
            fontWeight: '600'
          }}>
            Powered by OpenRouter • Gemini 2.5 Flash
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: 'none',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: '0 8px 24px rgba(234, 88, 12, 0.35), 0 0 20px var(--primary-glow)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s',
          animation: 'pulseGlow 2s infinite alternate'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(234, 88, 12, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(234, 88, 12, 0.35)';
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Embedded CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 8px 24px rgba(234, 88, 12, 0.35), 0 0 0 rgba(234, 88, 12, 0); }
          100% { box-shadow: 0 8px 24px rgba(234, 88, 12, 0.5), 0 0 20px rgba(234, 88, 12, 0.4); }
        }
      `}</style>
    </div>
  );
}
