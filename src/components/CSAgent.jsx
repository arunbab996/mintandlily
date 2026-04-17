import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import { LogoFull, LogoMark } from './Logo.jsx';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a warm, knowledgeable post-purchase customer experience specialist for Mint & Lily — a personalized jewelry brand loved by over 33,800 customers. You help customers after they've placed an order: tracking issues, quality concerns, returns, exchanges, personalization questions, and general product questions.

Be warm, concise, and human. Never use corporate-speak. If you're unsure, say so and offer to escalate.

━━━ COMPANY ━━━
• Founded 2015 | 4.5/5 stars (33,800+ reviews)
• Contact: support@mintandlily.com (replies within 24 hours)
• Help Centre: help.mintandlily.com
• Social: @mintandlily on Instagram, TikTok, Facebook, Pinterest

━━━ BESTSELLING PRODUCTS ━━━

NECKLACES
• Pave Initial Pendant Necklace w/ Paperclip Chain — $39 | 18k gold-plated | Letters A–Z | 18" or 24" chain | 4.9★ (2,969 reviews)
• Minimalist Monogram Name Necklace — $39–$99 | Gold, Rose Gold, Silver, Sterling Silver | Chain lengths: 16"+2", 18"+2", 20"+2", 24"+2" | 6 material options
• Fairy Name Necklace — $29–$99 | Custom names | Gold, Rose Gold, Silver, Surgical Steel, Sterling Silver | 3 chain lengths | Most gifted
• Balloon Name Necklace — $79 | 18k gold over brass | 2–12 chars (A–Z only, uppercase) | Chain: 16"+2", 18"+2", 20"+2" | 3/8" nameplate height
• Mother of Pearl Disc Letter Necklace w/ Rope Chain — $29 | 18k gold-plated + MOP disc | A–Z | 18"+2" | 4.9★
• Tiny Script Initial Necklace — $29 | Dainty script design | Ready to ship
• Pave Bubble Initial Necklace — $29 | Gold or Silver | A–Z | Bubble letter styling
• Mint Paperclip Necklace w/ Initial & Birthstone Charm — $99
• Personalized Multi-Birthstone Necklace — $29
• Dainty Family Birthstones Necklace — $59
• Petite Halo / Classic Photo Necklace — $39 | Custom photo upload
• Center of My Heart Pave Photo Necklace — $99
• Diamond Teardrop Necklace — $85

BRACELETS
• Mint Paperclip Bracelet — $29–$85 | Gold, Silver, 18k Gold Over Sterling, 925 Sterling | 6.5", 7", 7.5" | Hinge closure
• Mint Beaded Bracelet — $39 | 18k Gold-Tone PVD over 316L Stainless Steel | Waterproof + sweat-proof + tarnish-resistant | 4mm beads | Mint charm clasp
• Gold Beaded Birthstone Bracelet — $39 | All 12 birthstones | 3 wrist sizes
• Cross Charm Birthstone Bracelet — $39 | All 12 months | 4.8★ (1,577 reviews) | 6.5", 7", 7.5"
• Don't Let The Hard Days Win Beaded Inspire Bracelet — $34
• Stella Dainty Multiple Name Bracelet — $45
• Dainty Baguette Birthstone Bracelet — $49
• Classic Tennis Bracelet — $39 | Flexible Diamond Tennis Bracelet — $69 | Blue Opal Tennis Bracelet — $89

RINGS
• Tiny Stackable Name Ring — $29–$99 | All materials | Sizes 4–12 | 4.8★ (1,918 reviews)
• Double Name Ring — $29–$99 | Two custom names | Small (4–6), Medium (7–8), Large (9–10)
• Princess-Cut Birthstone Band Ring — $49–$79 | Sizes 4–10 | All 12 months
• Dainty Constellation Birthstone Ring — $49–$69 | Sizes 5–12 | Stackable
• Personalized Dainty Birthstones Ring — $69 | 18k Gold Over Sterling | Sizes 5–12

EARRINGS
• Pave Huggie Hoop Earrings — $55 | 5mm–9mm inner diameter
• Bold Hoop Earrings — $79 | 23mm drop | Clear e-coating
• Solitaire Birthstone Huggie Hoop Earrings — $49 | All 12 months
• 4mm Classic Solitaire Studs — $39 | Freshwater Pearl Drop Huggie — $29–$75

CHARMS ($19–$55) — Initials A–Z, all 12 birthstones, birth flowers, fun charms

━━━ PERSONALIZATION ━━━
• Initials/letters: A–Z | Names: 2–12 chars, A–Z only | Multiple names: up to 4 on select pieces
• Birthstones: Jan:Garnet | Feb:Amethyst | Mar:Aquamarine | Apr:Diamond | May:Emerald | Jun:Alexandrite | Jul:Ruby | Aug:Peridot | Sep:Sapphire | Oct:Pink Tourmaline | Nov:Citrine | Dec:Blue Topaz
• Birth flowers all 12 months | Photos on select necklaces
• Materials: 18k Gold-Plated, 18k Gold Over Sterling, 925 Sterling Silver, 18k Rose Gold, Surgical Steel

━━━ SIZING ━━━
• Necklaces: 16"+2", 18"+2", 20"+2", 24"+2" | Bracelets: 6.5", 7", 7.5" | Rings: 4–12

━━━ MATERIALS & CARE ━━━
• 18k Gold Over Sterling = most durable | PVD stainless = waterproof/sweat-proof
• Store cool & dry; avoid harsh chemicals | 5-year manufacturing defect warranty

━━━ SHIPPING ━━━
• US: 4–8 business days | Free over $65 | Expedited available (doesn't reduce production time)
• In-stock: same/next business day | International: 1–3+ weeks

━━━ RETURNS ━━━
• Non-personalised: 30-day refund or gift card (60 days Nov 12–Dec 25)
• Personalised: final sale UNLESS Mint & Lily erred — then free replacement
• Damaged items: email photos to support@mintandlily.com — free replacement, no return shipping
• International: gift card only | Cannot cancel confirmed orders

━━━ QUALITY PROMISE ━━━
• 5-year limited warranty | Free replacements for defects (email photos)

━━━ ESCALATION ━━━
For complex issues always offer: "Reach our team at support@mintandlily.com — they reply within 24 hours and can look up your order directly."`;

const QUICK_PROMPTS = [
  "Where's my order?",
  "Start a return",
  "Wrong engraving received",
  "Item arrived damaged",
  "Track my package",
];

const TOPICS = [
  {
    label: 'My Order',
    desc: 'Tracking, status, changes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    questions: ["Where is my order?", "How do I track my package?", "Can I cancel or change my order?"],
  },
  {
    label: 'Returns & Exchanges',
    desc: 'Refunds, swaps, damaged items',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
      </svg>
    ),
    questions: ["How do I return an item?", "Can I exchange for a different size?", "My item arrived damaged — what do I do?"],
  },
  {
    label: 'Personalization',
    desc: 'Engravings, birthstones, names',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    questions: ["How do birthstone options work?", "What name length can I engrave?", "Can I order multiple names on one piece?"],
  },
  {
    label: 'Products',
    desc: 'Materials, sizing, collections',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    questions: ["What materials are your pieces made from?", "Tell me about the Paperclip series", "What are your bestsellers?"],
  },
  {
    label: 'Shipping',
    desc: 'Timelines, international, costs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    questions: ["Do you ship internationally?", "How long does delivery take?", "Is there free shipping?"],
  },
];

const HERO_IMAGES = [
  'https://mintandlily.com/cdn/shop/files/gold_beaded_birthstone_bracelet_model_home.jpg',
  'https://mintandlily.com/cdn/shop/files/homepage_Dainty_baguette_bs_bracelet_1.jpg',
  'https://mintandlily.com/cdn/shop/files/cross_charm_bs_bracelet_home_page_1.jpg',
];

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0 shadow-sm">
        <LogoMark style={{ width: '15px', height: '15px' }} />
      </div>
      <div className="bg-white border border-border-col rounded-2xl rounded-bl-none px-5 py-3.5 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/70 inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/70 inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/70 inline-block" />
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ content, timestamp, feedback, onFeedback, streaming }) {
  return (
    <div className="flex items-end gap-3 mb-5 group">
      <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0 shadow-sm">
        <LogoMark style={{ width: '15px', height: '15px' }} />
      </div>
      <div className="flex flex-col gap-1.5 max-w-[75%]">
        <div
          className="bg-white border border-border-col rounded-2xl rounded-bl-none px-5 py-4 shadow-sm text-sm font-body text-ink leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {content}
          {streaming && <span className="inline-block w-0.5 h-3.5 bg-sage ml-0.5 animate-pulse align-middle" />}
        </div>
        <div className="flex items-center gap-3 px-1">
          <span className="text-[10px] font-body text-muted/40">{formatTime(timestamp)}</span>
          {!streaming && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onFeedback('up')}
                title="Helpful"
                className={`p-1 rounded transition-colors ${feedback === 'up' ? 'text-sage' : 'text-muted/25 hover:text-sage'}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill={feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </button>
              <button
                onClick={() => onFeedback('down')}
                title="Not helpful"
                className={`p-1 rounded transition-colors ${feedback === 'down' ? 'text-red-400' : 'text-muted/25 hover:text-red-400'}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill={feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                  <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ content, timestamp }) {
  return (
    <div className="flex items-end justify-end gap-3 mb-5">
      <div className="flex flex-col items-end gap-1.5 max-w-[75%]">
        <div className="bg-ink text-white rounded-2xl rounded-br-none px-5 py-4 shadow-sm text-sm font-body leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
        <span className="text-[10px] font-body text-muted/40 px-1">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}

function EscalationBanner() {
  return (
    <div className="mb-5 rounded-2xl overflow-hidden border border-sage/20">
      <div className="bg-sage-light px-5 py-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#77A484" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-body font-semibold text-ink">Still need help?</p>
          <p className="text-xs font-body text-muted mt-0.5 leading-relaxed">
            Email us at{' '}
            <a href="mailto:support@mintandlily.com" className="text-sage-dark font-medium underline underline-offset-2">
              support@mintandlily.com
            </a>
            {' '}— we reply within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ onSend }) {
  const [query, setQuery] = useState('');
  const [activeTopicIdx, setActiveTopicIdx] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = (text) => {
    const t = (text ?? query).trim();
    if (t) onSend(t);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Hero ── */}
      <div className="relative flex-shrink-0" style={{ minHeight: 300 }}>
        {/* Layered images for depth */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGES[0]})` }}
        />
        {/* Rich gradient — warm at top, deeper at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(10,8,6,0.30) 0%, rgba(10,8,6,0.55) 50%, rgba(10,8,6,0.72) 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-10 pb-8">
          {/* Logo */}
          <LogoFull className="h-6 w-auto mb-7 invert brightness-200 opacity-95" />

          {/* Heading */}
          <h1
            className="font-heading text-white leading-tight mb-2"
            style={{ fontSize: '2rem', fontWeight: 400, letterSpacing: '-0.01em' }}
          >
            Hi, how can I help you?
          </h1>
          <p className="text-sm font-body text-white/65 mb-7 tracking-wide">
            Ask about your order, returns, or any of our jewelry
          </p>

          {/* Search box */}
          <div className="w-full max-w-md">
            <div
              className="flex items-center rounded-2xl overflow-hidden border"
              style={{ background: 'rgba(255,255,255,0.97)', borderColor: 'rgba(255,255,255,0.6)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            >
              <div className="pl-4 flex-shrink-0 text-muted/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Search or ask a question…"
                className="flex-1 px-3 py-4 text-sm font-body text-ink placeholder:text-muted/45 focus:outline-none bg-transparent"
              />
              {query && (
                <button
                  onClick={() => submit()}
                  className="mr-2 w-9 h-9 rounded-xl bg-ink flex items-center justify-center flex-shrink-0 hover:bg-ink/80 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Quick prompt chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => submit(p)}
                  className="text-xs font-body px-3.5 py-2 rounded-full text-white transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Topics ── */}
      <div className="px-5 pt-6 pb-3">
        <p className="text-[10px] font-body font-semibold text-muted/50 uppercase tracking-[0.12em] mb-4 px-1">
          Browse by topic
        </p>
        <div className="flex flex-col gap-2">
          {TOPICS.map((topic, i) => (
            <div key={topic.label}>
              <button
                onClick={() => setActiveTopicIdx(activeTopicIdx === i ? null : i)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                  activeTopicIdx === i
                    ? 'bg-ink border-ink text-white shadow-md'
                    : 'bg-white border-border-col text-ink hover:border-ink/20 hover:shadow-sm'
                }`}
              >
                <span className={`flex-shrink-0 ${activeTopicIdx === i ? 'text-sage-light' : 'text-sage'}`}>
                  {topic.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-body font-semibold leading-tight ${activeTopicIdx === i ? 'text-white' : 'text-ink'}`}>
                    {topic.label}
                  </p>
                  <p className={`text-xs font-body mt-0.5 ${activeTopicIdx === i ? 'text-white/55' : 'text-muted/60'}`}>
                    {topic.desc}
                  </p>
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    activeTopicIdx === i ? 'rotate-180 text-white/50' : 'text-muted/30'
                  }`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {activeTopicIdx === i && (
                <div className="mt-1.5 ml-3 flex flex-col gap-1.5">
                  {topic.questions.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="group flex items-center justify-between text-sm font-body text-left px-4 py-3.5 bg-white border border-border-col rounded-xl hover:border-sage/40 hover:bg-sage-light/20 hover:shadow-sm transition-all text-ink"
                    >
                      <span>{q}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-muted/30 group-hover:text-sage transition-colors flex-shrink-0 ml-3">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-5 mt-auto">
        <div className="flex items-center justify-center gap-2 text-xs font-body text-muted/50">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>Need direct help?</span>
          <a href="mailto:support@mintandlily.com" className="text-sage-dark font-medium underline underline-offset-2">
            support@mintandlily.com
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CSAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [showEscalation, setShowEscalation] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (messages.filter(m => m.role === 'assistant').length >= 4) setShowEscalation(true);
  }, [messages]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsStreaming(true);

    const msgId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date(), id: msgId, streaming: true }]);

    try {
      const context = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1024,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...context],
      });

      let full = '';
      for await (const chunk of stream) {
        full += chunk.choices[0]?.delta?.content ?? '';
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: full } : m));
      }
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, streaming: false } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === msgId
        ? { ...m, content: "I'm sorry, something went wrong. Please try again or reach out to support@mintandlily.com directly.", streaming: false }
        : m
      ));
    } finally {
      setIsStreaming(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (messages.length === 0) {
    return (
      <div className="h-full">
        <WelcomeScreen onSend={sendMessage} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-cream">
      {/* Chat header */}
      <div className="bg-white border-b border-border-col px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center shadow-sm">
              <LogoMark style={{ width: '17px', height: '17px' }} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-sage border-2 border-white rounded-full" />
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-ink leading-tight">Customer Experience</p>
            <p className="text-[11px] font-body text-muted/55">Mint & Lily · Online now</p>
          </div>
        </div>
        <button
          onClick={() => { setMessages([]); setShowEscalation(false); }}
          className="text-xs font-body text-muted/50 hover:text-ink transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-cream border border-transparent hover:border-border-col"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          </svg>
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-7 min-h-0">
        {messages.map((msg) =>
          msg.role === 'user'
            ? <UserMessage key={msg.id ?? msg.timestamp?.getTime()} content={msg.content} timestamp={msg.timestamp} />
            : <AgentMessage
                key={msg.id ?? msg.timestamp?.getTime()}
                content={msg.content}
                timestamp={msg.timestamp}
                streaming={msg.streaming}
                feedback={feedback[msg.id]}
                onFeedback={(val) => setFeedback(p => ({ ...p, [msg.id]: val }))}
              />
        )}
        {isStreaming && messages[messages.length - 1]?.content === '' && <TypingIndicator />}
        {showEscalation && !isStreaming && <EscalationBanner />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-col bg-white px-5 py-4">
        <div className="flex items-end gap-3 bg-cream border border-border-col rounded-2xl px-4 py-3 transition-all focus-within:border-sage/40 focus-within:shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Mint & Lily…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm font-body text-ink placeholder:text-muted/40 focus:outline-none leading-relaxed"
            style={{ maxHeight: '96px', overflowY: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-ink hover:bg-ink/80 disabled:bg-border-col disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs font-body text-muted/35 mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
