import { useState, useRef, useEffect } from "react";
import { useFilters } from "../context/FilterContext";
import api from "../lib/api";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
} from "lucide-react";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you:\n\n• **Search jobs**: \"Find React developer roles\"\n• **Control filters**: \"Show only remote jobs\"\n• **Answer questions**: \"How does matching work?\"\n\nWhat can I help with?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { filters, applyAIFilters } = useFilters();

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg },
    ]);

    setLoading(true);

    try {
      const { data } = await api.post("/assistant/chat", {
        message: userMsg,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        currentFilters: filters,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      // Apply AI filters
      if (
        data.filterUpdates &&
        Object.keys(data.filterUpdates).length > 0
      ) {
        applyAIFilters(data.filterUpdates);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          
          <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600 rounded-t-2xl">
            <span className="text-white font-medium flex items-center gap-2">
              <Bot className="w-5 h-5" /> AI Assistant
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  m.role === "user" ? "justify-end" : ""
                }`}
              >
                {m.role === "assistant" && (
                  <Bot className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                )}

                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none [&_p]:m-0 [&_ul]:m-0 [&_li]:m-0">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>

                {m.role === "user" && (
                  <User className="w-6 h-6 text-gray-400 shrink-0 mt-1" />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <Bot className="w-6 h-6 text-blue-500 shrink-0" />
                <div className="bg-gray-100 px-3 py-2 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}