import React, { useEffect, useRef } from "react";
import { Check, CheckCheck, MessageCircle } from "lucide-react";

const ChatBox = ({ messages, hotelName }) => {
  const scrollRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  // Helper to format date separators
  const getRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Detect user scroll to toggle auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      // If user is within 150px of bottom, keep auto-scroll on
      shouldAutoScroll.current = distanceFromBottom < 150;
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldAutoScroll.current) return;

    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto p-6 space-y-8 bg-[#FBFDFF] scrollbar-thin scrollbar-thumb-slate-200"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
          <div className="p-6 bg-slate-100 rounded-full">
            <MessageCircle size={40} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest">
            No messages yet
          </p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isUser = msg.sender === "user";

          // Logic: Show Date Separator
          const prevMsg = messages[index - 1];
          const showDate =
            !prevMsg ||
            new Date(prevMsg.createdAt).toDateString() !==
              new Date(msg.createdAt).toDateString();

          // Logic: Group messages (don't show "You" or "Hotel" every time)
          const showLabel =
            !prevMsg || prevMsg.sender !== msg.sender || showDate;

          return (
            <React.Fragment key={msg._id || index}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-4 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {getRelativeDate(msg.createdAt)}
                  </span>
                </div>
              )}

              <div
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} 
                animate-in fade-in slide-in-from-bottom-2 duration-500`}
              >
                {showLabel && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                    {isUser ? "You" : hotelName || "Concierge"}
                  </span>
                )}

                <div
                  className={`relative flex max-w-[85%] md:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"} gap-2`}
                >
                  <div
                    className={`px-5 py-3.5 shadow-sm transition-all duration-300 group ${
                      isUser
                        ? "bg-slate-900 text-white rounded-[2rem] rounded-tr-none shadow-slate-200"
                        : "bg-white border border-slate-100 text-slate-800 rounded-[2rem] rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed font-semibold">
                      {msg.message}
                    </p>

                    <div
                      className={`flex items-center justify-end gap-1.5 mt-2 text-[9px] font-black uppercase tracking-tighter ${
                        isUser ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "sending..."}

                      {isUser && (
                        <span className="ml-1">
                          {msg.status === "seen" ? (
                            <CheckCheck size={14} className="text-blue-500" />
                          ) : (
                            <Check
                              size={14}
                              className={
                                msg.status === "sending" ? "animate-pulse" : ""
                              }
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })
      )}
    </div>
  );
};

export default ChatBox;
