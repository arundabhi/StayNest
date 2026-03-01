import React, { useEffect, useRef, useState } from "react";
import api from "../../api/axios.config";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import {
  Search,
  Send,
  MessageSquare,
  CheckCheck,
  MoreVertical,
  ArrowLeft,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";

const OwnerChatCenter = () => {
  const { hotelId } = useParams();

  const [messages, setMessages] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const sseRef = useRef(null);

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");
      setOwnerId(res.data.user._id);
    } catch (err) {
      toast.error("Authentication failed. Please login again.");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!ownerId) return;
    fetchMessages();
    connectSSE(ownerId);
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [ownerId, hotelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeUserId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/chats/${hotelId}`);
      setMessages(res.data.messages || []);
      console.log("Fetched Messages:", res.data.messages);
    } catch {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const connectSSE = (uid) => {
  if (sseRef.current) return;

  const es = new EventSource(
    `${import.meta.env.VITE_API_URL}/chats/sse/${uid}`
  );

  es.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "new-message") {
      setMessages((prev) => [...prev, data.chat]);
    }

    // 🔥 ADD THIS
    if (data.type === "seen") {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === "hotel"
            ? { ...m, status: "seen" }
            : m
        )
      );
    }
  };

  es.onerror = () => {
    sseRef.current = null;
    setTimeout(() => connectSSE(uid), 3000);
  };

  sseRef.current = es;
};

  const markSeen = async () => {
    try {
      await api.patch(`/chats/seen/${hotelId}`);
    } catch {
      console.warn("Seen sync failed");
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeUserId) return;
    try {
      const res = await api.post(`/chats/${hotelId}`, {
        message: text,
        sender: "hotel",
        recipientId: activeUserId,
      });
      setMessages((prev) => [...prev, res.data.chat]);
      setText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const conversations = messages.reduce((acc, msg) => {
    const uid = msg.userId?._id || msg.userId;
    if (!uid) return acc;

    if (!acc[uid]) {
      acc[uid] = {
        user: msg.userId,
        lastMsg: msg.message,
        time: msg.createdAt,
        unread: msg.status !== "seen" && msg.sender === "user" ? 1 : 0,
      };
    } else {
      if (new Date(msg.createdAt) > new Date(acc[uid].time)) {
        acc[uid].lastMsg = msg.message;
        acc[uid].time = msg.createdAt;
      }
      if (msg.status !== "seen" && msg.sender === "user") {
        acc[uid].unread += 1;
      }
    }
    return acc;
  }, {});

  const chatList = Object.entries(conversations)
    .filter(([_, c]) => c.user?.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b[1].time) - new Date(a[1].time));

  const activeMessages = messages.filter((m) => {
  const uid = m.userId?._id || m.userId;
  return uid?.toString() === activeUserId?.toString();
});
  const activeUser = conversations[activeUserId]?.user;

  return (
    <div className="min-h-screen bg-[#FBFDFF] pt-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 flex h-[82vh] overflow-hidden border border-slate-100">
        
        {/* SIDEBAR: CONVERSATION LIST */}
        <div className={`w-full md:w-[400px] border-r border-slate-50 flex flex-col bg-slate-50/30 ${activeUserId ? "hidden md:flex" : "flex"}`}>
          <div className="p-8 pb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <MessageSquare className="text-blue-600" size={32} /> Inbox
              </h2>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Clock size={20} />
              </div>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                placeholder="Search guest inquiries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
            {chatList.length ? (
              chatList.map(([uid, c]) => (
                <button
                  key={uid}
                  onClick={() => {
                    setActiveUserId(uid);
                    markSeen();
                  }}
                  className={`w-full p-5 mb-2 rounded-[2rem] flex gap-4 transition-all duration-300 group ${
                    uid === activeUserId 
                    ? "bg-blue-600 shadow-xl shadow-blue-200 translate-x-1" 
                    : "hover:bg-white hover:shadow-md"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-colors ${
                    uid === activeUserId ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"
                  }`}>
                    {c.user?.name?.[0] || "G"}
                  </div>
                  
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`font-black text-sm transition-colors ${uid === activeUserId ? "text-white" : "text-slate-900"}`}>
                        {c.user?.name || "Guest User"}
                      </p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${uid === activeUserId ? "text-blue-100" : "text-slate-400"}`}>
                        {new Date(c.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={`text-xs truncate font-medium ${uid === activeUserId ? "text-blue-50" : "text-slate-500"}`}>
                      {c.lastMsg}
                    </p>
                  </div>

                  {c.unread > 0 && uid !== activeUserId && (
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-slate-50">
                        {c.unread}
                      </span>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                <AlertCircle size={64} className="mb-4" />
                <p className="font-black uppercase tracking-widest">No Conversations</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: CHAT WINDOW */}
        <div className={`flex-1 flex flex-col bg-[#FDFEFE] ${!activeUserId ? "hidden md:flex items-center justify-center bg-slate-50/20" : ""}`}>
          {activeUserId ? (
            <>
              {/* CHAT HEADER */}
              <div className="p-6 border-b border-slate-50 flex items-center gap-5 bg-white/80 backdrop-blur-md">
                <button onClick={() => setActiveUserId(null)} className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100">
                    {activeUser?.name?.[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-none mb-1">{activeUser?.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest is Online</p>
                  </div>
                </div>
                <button className="ml-auto p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* MESSAGES AREA */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/20">
                {activeMessages.map((m) => (
                  <div key={m._id} className={`flex ${m.sender === "hotel" ? "justify-end" : "justify-start"}`}>
                    <div className={`group relative max-w-[75%] px-6 py-4 rounded-[2rem] shadow-sm transition-all ${
                      m.sender === "hotel"
                        ? "bg-slate-900 text-white rounded-tr-none shadow-slate-200"
                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                    }`}>
                      <p className="text-sm font-bold leading-relaxed">{m.message}</p>
                      <div className={`flex items-center justify-end gap-1.5 mt-2 opacity-40 transition-opacity group-hover:opacity-100`}>
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {m.sender === "hotel" && <CheckCheck size={14} className={m.status === "seen" ? "text-blue-400" : ""} />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* MESSAGE INPUT */}
              <div className="p-8 bg-white border-t border-slate-50">
                <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your response to the guest..."
                    className="flex-1 bg-transparent py-4 px-6 font-bold text-slate-700 outline-none placeholder:text-slate-300 text-sm"
                  />
                  <button 
                    onClick={sendMessage} 
                    className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all active:scale-90 flex items-center justify-center shrink-0"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-600 mb-8 animate-bounce">
                <MessageSquare size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Guest Relations Hub</h3>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                Select a guest on the left to start a conversation. Fast responses lead to higher guest satisfaction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple StatRow component used in previous dashboard fits here if needed, 
// otherwise this code is self-contained.

export default OwnerChatCenter;