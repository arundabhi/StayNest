import React, { useState, useRef, useEffect } from "react";
import api from "../../api/axios.config";
import { MessageCircle, Send, X, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownContent = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom Table Styling
        table: ({ node, ...props }) => (
          <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-gray-50/80 backdrop-blur-sm" {...props} />
        ),
        tbody: ({ node, ...props }) => (
          <tbody className="bg-white divide-y divide-gray-100" {...props} />
        ),
        tr: ({ node, ...props }) => (
          <tr className="hover:bg-gray-50/50 transition-colors" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th
            className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td className="px-4 py-3 text-sm text-gray-700 leading-relaxed" {...props} />
        ),
        // Custom List Styling
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-5 my-3 space-y-1.5" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-5 my-3 space-y-1.5" {...props} />
        ),
        // Paragraph and Typography
        p: ({ node, ...props }) => (
          <p className="mb-3 last:mb-0 leading-relaxed" {...props} />
        ),
        // Link Styling
        a: ({ node, ...props }) => (
          <a
            className="text-blue-600 font-medium hover:underline break-all transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        // Bold/Strong
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-gray-900" {...props} />
        ),
        // Blockquote
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 my-4" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 **Welcome to StayNest**\n\nYour smart hotel booking assistant is here to help you find the perfect stay — quickly and effortlessly.\n\n✨ **What you can do:**\n- 🔍 **Discover** hotels in any city\n- 💡 **Get** personalized recommendations\n- 🛏 **Compare** rooms, prices & amenities\n- 📅 **Check** availability instantly\n- 💳 **Book** securely with multiple payment options\n- 📖 **Manage** your bookings anytime\n\nJust tell me what you’re looking for — I’ll take care of the rest.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customMessage = null) => {
    const rawText = customMessage || input;
    if (!rawText || !rawText.trim() || isLoading) return;

    const userMessage = rawText.trim();
    if (!customMessage) setInput("");

    // If clearing chat, reset state immediately
    if (userMessage.toLowerCase().includes("clear chat") || userMessage.toLowerCase().includes("reset chat")) {
        setMessages([{
            role: "assistant",
            content: "👋 **Chat history cleared.** I'm ready to help you with a fresh start! What can I do for you?"
        }]);
    } else {
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    }

    setIsLoading(true);

    try {
      const response = await api.post("/ai/chat", { message: userMessage });
      if (response.data.success) {
        let aiResponse = response.data.response;
        let paymentUrl = response.data.paymentUrl || null;

        // Check for redirect tag
        const redirectMatch = aiResponse.match(/\[REDIRECT_TO_PAYMENT:\s*([^\]\s]+)\]/);

        if (redirectMatch) {
          paymentUrl = redirectMatch[1];
          // Clean the response from the redirect tag
          aiResponse = aiResponse.replace(/\[REDIRECT_TO_PAYMENT:.*?\]/g, "").trim();
        }

        const newMsg = {
          role: "assistant",
          content: aiResponse,
          paymentUrl: paymentUrl || undefined,
        };

        setMessages((prev) => [...prev, newMsg]);

        if (paymentUrl) {
          // Perform smooth redirect after 1.8 seconds so user can read summary
          setTimeout(() => {
            window.location.href = paymentUrl;
          }, 1800);
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const errorMessage = error.response?.status === 401 
        ? "Please login to chat with your StayNest Assistant." 
        : "I'm having trouble connecting right now. Please try again in a moment.";
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center border-4 border-white/20"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl w-[90vw] sm:w-[450px] h-[600px] flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">StayNest Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-blue-100 font-medium">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 p-5 overflow-y-auto space-y-6 bg-[#f8faff]"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                >
                  <div
                    className={`p-2 rounded-2xl h-9 w-9 flex-shrink-0 flex items-center justify-center shadow-sm border ${msg.role === "user"
                        ? "bg-blue-50 border-blue-100 text-blue-600"
                        : "bg-white border-gray-100 text-gray-600"
                      }`}
                  >
                    {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div
                    className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm border ${msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none border-blue-500 font-medium"
                        : "bg-white text-gray-800 rounded-tl-none border-gray-100"
                      } max-w-full overflow-x-auto`}
                  >
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <>
                        <MarkdownContent content={msg.content} />
                        
                        {/* Quick Selection Action Chips */}
                        {index === messages.length - 1 && !isLoading && !msg.paymentUrl && (
                          (() => {
                            const lower = (msg.content || "").toLowerCase();
                            let quickActions = [];

                            if (
                              lower.includes("how would you like to pay") ||
                              lower.includes("choose payment method") ||
                              (lower.includes("stripe") && lower.includes("razorpay") && (lower.includes("cod") || lower.includes("hotel")))
                            ) {
                              quickActions = [
                                { label: "💳 Stripe (Card)", value: "Stripe", className: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" },
                                { label: "💰 Razorpay (UPI)", value: "Razorpay", className: "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100" },
                                { label: "🏨 Pay at Hotel (COD)", value: "Pay at Hotel", className: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" },
                              ];
                            } else if (
                              lower.includes("shall i confirm this booking") ||
                              lower.includes("reply **yes** to confirm") ||
                              lower.includes("reply yes to confirm") ||
                              lower.includes("yes to confirm or no to cancel")
                            ) {
                              quickActions = [
                                { label: "✅ Yes, Confirm Booking", value: "Yes", className: "bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-sm" },
                                { label: "❌ No, Cancel", value: "No", className: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200" },
                              ];
                            }

                            if (quickActions.length === 0) return null;

                            return (
                              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                                {quickActions.map((qa, qi) => (
                                  <button
                                    key={qi}
                                    onClick={() => handleSend(qa.value)}
                                    disabled={isLoading}
                                    className={`px-3.5 py-2 text-xs rounded-xl font-medium transition-all transform active:scale-95 shadow-sm cursor-pointer ${qa.className}`}
                                  >
                                    {qa.label}
                                  </button>
                                ))}
                              </div>
                            );
                          })()
                        )}

                        {/* Direct Payment Action CTA */}
                        {msg.paymentUrl && (
                          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                            <a
                              href={msg.paymentUrl}
                              className={`inline-flex items-center justify-center gap-2.5 w-full px-5 py-3.5 ${
                                msg.paymentUrl.includes("checkout.stripe.com")
                                  ? "bg-[#635BFF] hover:bg-[#534be8] text-white shadow-indigo-200"
                                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-200"
                              } font-bold rounded-2xl shadow-lg transition-all transform active:scale-98 text-center no-underline text-sm`}
                            >
                              <span>🔒</span>
                              <span>
                                {msg.paymentUrl.includes("checkout.stripe.com")
                                  ? "Pay Securely on Stripe Checkout"
                                  : "Proceed to Payment"}
                              </span>
                              <span>➔</span>
                            </a>
                            <p className="text-[11px] text-center text-gray-500 font-medium">
                              Redirecting to secure payment in a moment...
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="p-2 rounded-2xl h-9 w-9 flex-shrink-0 flex items-center justify-center bg-white border border-gray-100 shadow-sm text-gray-400">
                    <Bot size={18} />
                  </div>
                  <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-3xl rounded-tl-none flex items-center gap-3 text-gray-500 text-sm font-medium">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    StayNest is thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-5 bg-white border-t border-gray-100/80 backdrop-blur-sm">
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none pr-12 shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-blue-200 flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-center items-center gap-2 mt-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
              <img src="/logo.png" alt="StayNest" className="h-3.5 object-contain" onError={(e) => e.target.style.display='none'} />
              <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                AI Concierge by StayNest
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
