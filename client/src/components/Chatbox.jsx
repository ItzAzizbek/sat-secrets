import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, User, Bot } from 'lucide-react';
import api from '../config/axios';

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = { role: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/chat', {
        message: message,
        history: chatHistory
      });

      const aiResponse = { role: 'model', text: res.data.response };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorResponse = { 
        role: 'model', 
        text: "Sorry, I'm experiencing some technical difficulties. Please try again later or contact us via Telegram." 
      };
      setChatHistory(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[500px] bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-black uppercase tracking-widest text-xs">Customer Support</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 font-medium text-sm"
          >
            {chatHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 uppercase text-[10px] tracking-widest mb-2 font-bold">New Conversation</p>
                <p className="text-gray-600">How can we assist you today?</p>
              </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 ${
                  msg.role === 'user' 
                    ? 'bg-black text-white rounded-l-lg rounded-t-lg' 
                    : 'bg-white border-2 border-black text-black rounded-r-lg rounded-t-lg'
                }`}>
                  <div className="flex items-center gap-1 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-tighter">
                    {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                    {msg.role === 'user' ? 'You' : 'SAT Support'}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-black p-3 rounded-r-lg rounded-t-lg">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t-2 border-black bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-100 border-b-2 border-transparent focus:border-black focus:outline-none py-2 px-3 text-sm transition-colors"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading || !message.trim()}
                className="bg-black text-white p-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-95 ${
          isOpen ? 'bg-white text-black border-2 border-black' : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default Chatbox;
