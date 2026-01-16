import React, { useEffect, useRef } from "react";
import { Check, CheckCheck } from "lucide-react";

const ChatBox = ({ messages,hotelName }) => {
  const scrollRef = useRef(null);


  useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  const isNearBottom =
    el.scrollHeight - el.scrollTop - el.clientHeight < 80;

  if (isNearBottom) {
    el.scrollTop = el.scrollHeight;
  }
}, [messages]);


  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6
             bg-[#F8FAFC] rounded-3xl border border-gray-100 shadow-inner"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40">
          <div className="p-4 bg-gray-100 rounded-full">
            <CheckCheck size={32} />
          </div>
          <p className="text-sm font-medium">
            Start a conversation with the hotel
          </p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isUser = msg.sender === "user";
          const showAvatar =
            index === 0 || messages[index - 1].sender !== msg.sender;

          return (
            <div
              key={msg._id || index}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Sender Label */}
              {showAvatar && (
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 mx-2">
                  {isUser ? "You" : hotelName || "Hotel Concierge"}
                </span>
              )}

              <div
                className={`relative flex max-w-[85%] md:max-w-[70%] ${
                  isUser ? "flex-row-reverse" : "flex-row"
                } gap-2`}
              >
                {/* Bubble */}
                <div
                  className={`px-4 py-3 shadow-sm transition-all duration-300 ${
                    isUser
                      ? "bg-linear-to-tr from-blue-600 to-indigo-500 text-white rounded-3xl rounded-tr-none shadow-blue-100"
                      : "bg-white border border-gray-100 text-gray-800 rounded-3xl rounded-tl-none"
                  }`}
                >
                  <p className="text-sm leading-relaxed font-medium">
                    {msg.message}
                  </p>

                  {/* Time + Seen */}
                  <div
                    className={`flex items-center gap-1.5 mt-1.5 text-[9px] font-bold uppercase tracking-tighter ${
                      isUser ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}

                    {isUser && (
                      <span className="ml-1">
                        {msg.status === "seen" ? (
                          <CheckCheck
                            size={12}
                            className="text-emerald-300"
                          />
                        ) : (
                          <Check size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatBox;
