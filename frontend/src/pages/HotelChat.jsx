import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import { fetchMessages, postMessage, markSeen } from "../api/chat.api";
import { Send, ChevronLeft, Info, Circle } from "lucide-react";
import toast from "react-hot-toast";

const HotelChat = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [hotelInfo, setHotelInfo] = useState(null);

  const hasMarkedSeen = useRef(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  /* ─────────────────────────────
     1️⃣ LOAD CHAT HISTORY
  ───────────────────────────── */
  useEffect(() => {
    if (!hotelId) return;

    const loadChat = async () => {
      try {
        const res = await fetchMessages(hotelId);
        console.log(res.data);
        
        if (res.data.success) {
          setMessages(res.data.messages);
          setHotelInfo(res.data.hotel || { name: "Hotel Concierge" });
        }
      } catch (err) {
        toast.error(err.message || "Failed to load conversation");
      }
    };

    loadChat();
  }, [hotelId]);

  /* ─────────────────────────────
     2️⃣ MARK SEEN (ONCE)
  ───────────────────────────── */
  useEffect(() => {
    if (!hotelId || hasMarkedSeen.current) return;

    const hasUnseenHotelMsg = messages.some(
      m => m.sender === "hotel" && m.status !== "seen"
    );

    if (hasUnseenHotelMsg) {
      markSeen(hotelId);
      hasMarkedSeen.current = true;
    }
  }, [messages, hotelId]);

  /* ─────────────────────────────
     3️⃣ SSE REAL-TIME CONNECTION
  ───────────────────────────── */
  useEffect(() => {
    if (!userId) return;

    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/chats/sse`,
      { withCredentials: true } // JWT cookie
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "new-message") {
      setMessages((prev) => {
        const exists = prev.some(
          (m) => m._id === data.chat._id
        );
        return exists ? prev : [...prev, data.chat];
      });
if (data.chat.sender === "hotel") {
        markSeen(hotelId);
      }
    }

      if (data.type === "seen") {
        setMessages(prev =>
          prev.map(m => ({ ...m, status: "seen" }))
        );
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE disconnected, retrying...");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  /* ─────────────────────────────
     4️⃣ SEND MESSAGE
  ───────────────────────────── */
  const handleSend = async (e) => {
  e.preventDefault();
  if (!inputValue.trim()) return;

  const tempMessage = {
    _id: `temp-${Date.now()}`,
    message: inputValue,
    sender: "user",
    status: "sent",
    createdAt: new Date().toISOString(),
  };

  // 1️⃣ Show instantly
  setMessages(prev => [...prev, tempMessage]);
  setInputValue("");

  try {
    const res = await postMessage(hotelId, {
      message: tempMessage.message,
      sender: "user",
    });

    if (!res.data.success) throw new Error();

  } catch {
    toast.error("Message failed");
  }
};


  /* ─────────────────────────────
     UI
  ───────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-10">
      <div className="max-w-3xl mx-auto px-4 h-[85vh] flex flex-col">

        {/* HEADER */}
        <header className="bg-white border border-gray-100 rounded-t-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="font-black">{hotelInfo?.name || "Hotel Concierge"}</h2>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                Active
              </div>
            </div>
          </div>
          <Info size={20} className="text-gray-400" />
        </header>

        {/* CHAT */}
        <div className="flex-1 bg-white border-x border-gray-100">
          <ChatBox messages={messages} hotelName={hotelInfo?.name}/>
        </div>

        {/* INPUT */}
        <footer className="bg-white border border-gray-100 rounded-b-3xl p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 p-3 rounded-xl border"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
            />
            <button
              disabled={!inputValue.trim()}
              className="bg-blue-600 text-white px-5 rounded-xl disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
};

export default HotelChat;
