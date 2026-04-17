import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import { LogoFull, LogoMark } from './Logo.jsx';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a customer service agent for Mint & Lily, a personalized jewelry DTC brand. Be warm, concise, and helpful. You know the following about the brand: products include engraved bracelets, necklaces, rings, earrings, and charms priced between $19–$99. Popular lines include the Mint Paperclip series, Beaded Inspire Bracelets, Birthstone collections, and Monogram Name pieces. Shipping is international. Returns and exchanges are accepted. The brand is also stocked at Nordstrom. If you don't know a specific answer, say so honestly and offer to escalate to the team.`;

const SUGGESTIONS = [
  "What's your return policy?",
  "Do you ship internationally?",
  "Tell me about the Paperclip series",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0">
        <LogoMark className="w-4 h-4" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm border border-border-col">
        <div className="flex gap-1.5 items-center h-4">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/70 inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/70 inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/70 inline-block" />
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ content }) {
  return (
    <div className="flex items-end gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0">
        <LogoMark className="w-4 h-4" />
      </div>
      <div className="flex flex-col gap-1 max-w-[70%]">
        <span className="text-[10px] font-body tracking-widest uppercase text-muted/50 px-1">
          Mint & Lily
        </span>
        <div className="bg-white border border-border-col rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm text-sm font-body text-ink leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content }) {
  return (
    <div className="flex items-end justify-end gap-3 mb-6">
      <div className="max-w-[70%]">
        <div className="bg-sage text-white rounded-2xl rounded-br-sm px-5 py-4 shadow-sm text-sm font-body leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </div>
    </div>
  );
}

export default function CSAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const context = newMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...context],
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: response.choices[0].message.content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, something went wrong. Please try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-cream">

      {/* Chat brand bar */}
      <div className="bg-white border-b border-border-col px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-sage-light flex items-center justify-center">
              <LogoMark className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-sage border-2 border-white rounded-full" />
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-ink">Customer Support</p>
            <p className="text-xs font-body text-muted/70">Typically replies instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-body bg-sage-light text-sage-dark px-3 py-1.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
          Online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 min-h-0">

        {/* Welcome state */}
        {isEmpty && (
          <div className="flex flex-col items-center text-center mb-10">
            <div className="mb-5">
              <LogoFull className="h-8 w-auto mx-auto opacity-90" />
            </div>
            <h2 className="font-heading text-3xl text-ink mb-2 leading-tight">
              How can we help?
            </h2>
            <p className="text-sm font-body text-muted max-w-xs leading-relaxed">
              Ask us about orders, personalization, shipping, or any of our jewelry collections.
            </p>

            <div className="mt-8 flex flex-col gap-2.5 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="group flex items-center justify-between text-sm font-body text-left px-5 py-3.5 bg-white border border-border-col rounded-2xl hover:border-sage/50 hover:shadow-sm transition-all text-ink"
                >
                  <span>{s}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30 group-hover:text-sage transition-colors flex-shrink-0 ml-3">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === 'user'
            ? <UserMessage key={i} content={msg.content} />
            : <AgentMessage key={i} content={msg.content} />
        )}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Divider */}
      <div className="border-t border-border-col" />

      {/* Input */}
      <div className="bg-white px-5 py-4">
        <div className="flex items-end gap-3 bg-cream border border-border-col rounded-2xl px-4 py-3 transition-all focus-within:border-sage/50 focus-within:shadow-sm">
          <textarea
            ref={(el) => { inputRef.current = el; textareaRef.current = el; }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Mint & Lily…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm font-body text-ink placeholder:text-muted/40 focus:outline-none leading-relaxed"
            style={{ maxHeight: '96px', overflowY: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-ink hover:bg-ink/80 disabled:bg-border-col disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs font-body text-muted/35 mt-2.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
