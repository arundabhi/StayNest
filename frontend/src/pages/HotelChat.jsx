import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import api from "../api/axios.config";
import { Send, ChevronLeft, Info } from "lucide-react";
import toast from "react-hot-toast";

const HotelChat = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [hotelInfo, setHotelInfo] = useState(null);
  const [userId, setUserId] = useState(null);

  const bottomRef = useRef(null);
  const sseRef = useRef(null);

  /* ─────────────────────────────
     1️⃣ FETCH LOGGED-IN USER
  ───────────────────────────── */
  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");
      setUserId(res.data.user._id);
    } catch {
      toast.error("Please login again");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  /* ─────────────────────────────
     2️⃣ LOAD CHAT HISTORY
  ───────────────────────────── */
  const loadChat = async () => {
    try {
      const res = await api.get(`/chats/${hotelId}`);

      if (res.data.success) {
        setMessages(res.data.messages || []);
        setHotelInfo(res.data.hotelData || { name: "Hotel Concierge" });

        // mark seen if hotel messages exist
        if (res.data.messages.some(m => m.sender === "hotel" && m.status !== "seen")) {
          await api.patch(`/chats/seen/${hotelId}`);
        }
      }
    } catch {
      toast.error("Failed to load conversation");
    }
  };

  useEffect(() => {
    if (!hotelId) return;
    loadChat();
  }, [hotelId]);

  /* ─────────────────────────────
     3️⃣ SSE CONNECTION
  ───────────────────────────── */
  useEffect(() => {
    if (!userId) return;

    const es = new EventSource(
      `${import.meta.env.VITE_API_URL}/chats/sse/${userId}`
    );

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "new-message") {
        setMessages(prev => {
          const exists = prev.some(m => m._id === data.chat._id);
          return exists ? prev : [...prev, data.chat];
        });

        if (data.chat.sender === "hotel") {
          api.patch(`/chats/seen/${hotelId}`);
        }
      }

      if (data.type === "seen") {
        setMessages(prev => prev.map(m => ({ ...m, status: "seen" })));
      }
    };

    es.onerror = () => {
      console.warn("SSE disconnected, retrying...");
      sseRef.current = null;
      setTimeout(() => {
        if (!sseRef.current) {
          sseRef.current = es;
        }
      }, 3000);
    };

    sseRef.current = es;

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [userId, hotelId]);

  /* ─────────────────────────────
     4️⃣ AUTO SCROLL
  ───────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─────────────────────────────
     5️⃣ SEND MESSAGE
  ───────────────────────────── */
  const handleSend = async (e) => {
  e.preventDefault();
  if (!inputValue.trim()) return;

  const messageText = inputValue;
  setInputValue("");

  try {
    const res = await api.post(`/chats/${hotelId}`, {
      message: messageText,
      sender: "user",
    });

    // 🔥 ADD THIS
    setMessages(prev => [...prev, res.data.chat]);

  } catch {
    toast.error("Message failed to send");
  }
};

  /* ─────────────────────────────
     UI
  ───────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-10 flex flex-col items-center">
      <div className="w-full max-w-2xl h-[80vh] flex flex-col bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border">

        {/* HEADER */}
        <header className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}>
              <ChevronLeft />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">
              {hotelInfo?.name?.charAt(0) || "H"}
            </div>
            <div>
              <h2 className="font-black">{hotelInfo?.name || "Hotel Concierge"}</h2>
              <p className="text-xs text-emerald-500 font-bold">Online</p>
            </div>
          </div>
          <Info />
        </header>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <ChatBox messages={messages} />
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <footer className="p-6 border-t">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-100 px-4 py-2 rounded-xl font-bold"
            />
            <button
              disabled={!inputValue.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl"
            >
              <Send />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default HotelChat;
