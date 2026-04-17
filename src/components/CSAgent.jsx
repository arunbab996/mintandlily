import { useState, useRef, useEffect } from 'react';
import OpenAI from 'openai';
import { LogoFull, LogoMark } from './Logo.jsx';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a warm, empathetic post-purchase customer experience specialist for Mint & Lily — a personalized jewelry brand loved by over 33,800 customers. Your job is to make customers feel genuinely heard and to resolve their issue within this conversation as far as humanly possible. You are their advocate, not a gatekeeper.

━━━ CORE BEHAVIOUR ━━━

NEVER do this:
• Do not tell someone to just email support as your first or only response. That is a dead end and leaves the customer feeling abandoned.
• Do not give hollow platitudes without immediately taking action.
• Do not ask the customer to do work you can guide them through yourself.

ALWAYS do this:
• Acknowledge the emotion first — 1 sentence, genuine.
• Move into gathering what you need to resolve it: order number, what happened, what they want.
• Commit to a concrete next step with a clear timeline. "I'm flagging this as urgent — our team will reach out within 2 hours" beats "please email us" every time.
• Stay in the conversation. Keep asking the right follow-up questions until you have everything needed to fully hand off with a clear resolution path.
• If you genuinely cannot action something yourself (you need to look up an order), tell the customer exactly what happens next and when — make them feel it is being handled NOW, not filed away.

━━━ RESOLUTION PLAYBOOKS ━━━

MISSING ITEM / EMPTY PACKAGING (highest urgency):
1. Acknowledge — this is distressing and completely unacceptable.
2. Ask: order number + what the package looked like on arrival (sealed, open, visibly tampered?).
3. Confirm their delivery address is still correct.
4. Tell them: "I'm flagging this as a priority right now. Our fulfilment team will investigate and get back to you within 2 hours — you won't need to chase us at all."
5. Ask if they'd prefer a replacement or a refund, so the team has that ready to action immediately.

WRONG ENGRAVING / WRONG ITEM:
1. Acknowledge the disappointment — they were excited about this piece.
2. Ask: order number + exactly what they received vs. what they ordered.
3. Tell them to keep the item — no return needed.
4. Tell them: "We'll get the correct piece made and shipped at no extra cost. I'm noting everything now so the team can action this without any back-and-forth from you."
5. Confirm their current shipping address.

DAMAGED ITEM:
1. Acknowledge.
2. Ask: order number + brief description of the damage.
3. Ask for a quick photo — this lets the team process a replacement immediately without delays.
4. Tell them: "Once you send that photo to support@mintandlily.com with your order number in the subject line, our team will send a replacement — no need to return the damaged piece, no charge."
5. Timeline: "You'll hear back within 24 hours."

ORDER NOT ARRIVED / TRACKING ISSUE:
1. Ask: order number + when they ordered + last tracking update they can see.
2. US window: 4–8 business days. International: 1–3+ weeks.
3. If within window: reassure and walk them through checking tracking.
4. If outside window: "That's not okay and I'm escalating this now. Our team will investigate with the carrier and update you within a few hours. You won't need to keep checking."

RETURNS / EXCHANGES:
1. Ask what they'd like to return or exchange and the reason.
2. Non-personalised items: eligible within 30 days (60 days Nov 12–Dec 25) for refund or gift card.
3. Personalised items: final sale — UNLESS Mint & Lily made an error. Then free replacement, no return needed.
4. Walk them through the exact next step.

━━━ ON EMAIL ━━━
Only mention support@mintandlily.com as a follow-up action, never the primary resolution. When you do, always say: what to include, what will happen, and when they'll hear back. Never leave a customer with just an email address and nothing else.

━━━ COMPANY ━━━
• Founded 2015 | 4.5/5 stars (33,800+ reviews)
• support@mintandlily.com — replies within 24 hours
• help.mintandlily.com

━━━ PRODUCTS ━━━
NECKLACES: Pave Initial Pendant (), Monogram Name (–), Fairy Name (–, most gifted), Balloon Name (), Mother of Pearl Disc Letter (), Tiny Script Initial (), Pave Bubble Initial (), Paperclip w/ Birthstone Charm (), Multi-Birthstone (), Family Birthstones (), Photo Necklaces (–), Diamond Teardrop ()
BRACELETS: Mint Paperclip (–), Mint Beaded (, waterproof PVD stainless), Gold Beaded Birthstone (), Cross Charm Birthstone (), Inspire Beaded (), Stella Multi-Name (), Dainty Baguette Birthstone (), Tennis Bracelets (–)
RINGS: Tiny Stackable Name (–, sizes 4–12), Double Name (–), Princess-Cut Birthstone Band (–), Constellation Birthstone (–), Personalized Birthstones ()
EARRINGS: Pave Huggie Hoops (), Bold Hoops (), Birthstone Huggies (), Classic Studs (), Pearl Drop Huggie (–)
CHARMS: –, initials A–Z, all 12 birthstones, birth flowers

━━━ PERSONALIZATION ━━━
Letters A–Z | Names 2–12 chars | Up to 4 names on select pieces
Birthstones: Jan:Garnet | Feb:Amethyst | Mar:Aquamarine | Apr:Diamond | May:Emerald | Jun:Alexandrite | Jul:Ruby | Aug:Peridot | Sep:Sapphire | Oct:Pink Tourmaline | Nov:Citrine | Dec:Blue Topaz
Materials: 18k Gold-Plated, 18k Gold Over Sterling (most durable), 925 Sterling Silver, 18k Rose Gold, Surgical Steel, PVD Stainless (waterproof/sweat-proof)

━━━ SIZING ━━━
Necklaces: 16"+2" to 24"+2" | Bracelets: 6.5", 7", 7.5" | Rings: 4–12

━━━ SHIPPING ━━━
US: 4–8 business days | Free over $65 | International: 1–3+ weeks | Expedited does not reduce production time

━━━ RETURNS ━━━
Non-personalised: 30-day refund or gift card (60 days Nov 12–Dec 25)
Personalised: final sale unless Mint & Lily erred — then free replacement, no return needed
Damaged: free replacement, customer sends photos, no return shipping required
International: gift card only | Confirmed orders cannot be cancelled

━━━ WARRANTY ━━━
5-year limited manufacturing defect warranty. Free replacements on proof of defect.`

// ── Post-purchase action cards ────────────────────────────────────────────────
const ACTIONS = [
  {
    label: 'Track my order',
    sub: 'Get live shipping status',
    prompt: 'Where is my order and how do I track it?',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    label: 'Return or exchange',
    sub: 'Start a refund or swap',
    prompt: 'I want to start a return or exchange.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
      </svg>
    ),
  },
  {
    label: 'Wrong engraving',
    sub: 'Name or date was incorrect',
    prompt: 'I received the wrong engraving on my order.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: 'Item arrived damaged',
    sub: 'Broken or defective on arrival',
    prompt: 'My item arrived damaged. What do I do?',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Shipping question',
    sub: 'Timelines, international, costs',
    prompt: 'I have a question about shipping.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    label: 'Product question',
    sub: 'Materials, sizing, care',
    prompt: 'I have a question about one of your products.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
];

const HERO_IMAGE = 'https://mintandlily.com/cdn/shop/files/gold_beaded_birthstone_bracelet_model_home.jpg';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm overflow-hidden">
        <LogoMark style={{ width: '12px', height: '17px' }} />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-border-col">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/60 inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/60 inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-sage/60 inline-block" />
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ content, timestamp, feedback, onFeedback, streaming }) {
  return (
    <div className="flex items-start gap-3 mb-5 group">
      <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm overflow-hidden">
        <LogoMark style={{ width: '12px', height: '17px' }} />
      </div>
      <div className="flex flex-col gap-1.5" style={{ maxWidth: 'min(75%, 520px)' }}>
        <div
          className="bg-white rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm border border-border-col text-sm font-body text-ink leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {content}
          {streaming && <span className="inline-block w-0.5 h-3.5 bg-sage ml-0.5 animate-pulse align-middle" />}
        </div>
        <div className="flex items-center gap-2.5 px-0.5">
          <span className="text-[10px] font-body" style={{ color: 'rgba(89,89,89,0.38)' }}>{formatTime(timestamp)}</span>
          {!streaming && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onFeedback('up')}
                title="Helpful"
                className={`p-1 rounded-md transition-colors ${feedback === 'up' ? 'text-sage' : 'text-muted/20 hover:text-sage'}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill={feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </button>
              <button
                onClick={() => onFeedback('down')}
                title="Not helpful"
                className={`p-1 rounded-md transition-colors ${feedback === 'down' ? 'text-red-400' : 'text-muted/20 hover:text-red-400'}`}
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
      <div className="flex flex-col items-end gap-1.5" style={{ maxWidth: 'min(75%, 520px)' }}>
        <div
          className="text-white rounded-2xl rounded-tr-sm px-4 py-3.5 text-sm font-body leading-relaxed shadow-sm"
          style={{ background: '#020303', whiteSpace: 'pre-wrap' }}
        >
          {content}
        </div>
        <span className="text-[10px] font-body px-0.5" style={{ color: 'rgba(89,89,89,0.38)' }}>{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}

function EscalationBanner() {
  return (
    <div className="mb-5 mx-1 rounded-2xl overflow-hidden" style={{ background: '#edf6f0', border: '1px solid rgba(105,171,128,0.2)' }}>
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6aab80" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-body font-semibold text-ink leading-tight">Still need help?</p>
          <p className="text-xs font-body text-muted/70 mt-0.5 leading-relaxed">
            Email{' '}
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

const QUICK_PROMPTS = [
  "Where's my order?",
  "Start a return",
  "Wrong engraving received",
  "Item arrived damaged",
  "Track my package",
];

// ── Welcome screen ─────────────────────────────────────────────────────────────
function WelcomeScreen({ onSend }) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const submit = (text) => {
    const t = (text ?? query).trim();
    if (t) onSend(t);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Hero ── */}
      <div className="relative flex-shrink-0" style={{ minHeight: 300 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(10,8,6,0.28) 0%, rgba(10,8,6,0.52) 45%, rgba(10,8,6,0.78) 100%)' }}
        />
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-9 pb-6">
          <LogoFull className="h-5 w-auto mb-6 invert brightness-200 opacity-90" />
          <h1
            className="font-heading text-white leading-tight mb-2"
            style={{ fontSize: '1.85rem', fontWeight: 400, letterSpacing: '-0.01em' }}
          >
            Hi, how can I help you?
          </h1>
          <p className="text-sm font-body mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Post-purchase support for all Mint &amp; Lily orders
          </p>

          {/* ── Chat composer ── */}
          <div className="w-full max-w-md">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}
            >
              {/* Agent row */}
              <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2 border-b border-black/[0.06]">
                <div className="w-6 h-6 rounded-full bg-sage-light flex items-center justify-center flex-shrink-0">
                  <LogoMark style={{ width: '11px', height: '11px' }} />
                </div>
                <span className="text-xs font-body font-medium text-ink/70">Mint &amp; Lily Support</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] font-body text-sage-dark">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
                  Online
                </span>
              </div>

              {/* Textarea */}
              <div className="px-4 pt-3 pb-2">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question or issue…"
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm font-body text-ink placeholder:text-muted/40 focus:outline-none leading-relaxed"
                  style={{ maxHeight: '80px', overflowY: 'auto' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                  }}
                />
              </div>

              {/* Footer row */}
              <div className="px-3 pb-3 flex items-center justify-between">
                <span className="text-[10px] font-body text-muted/35 pl-1">Enter to send</span>
                <button
                  onClick={() => submit()}
                  disabled={!query.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink text-white text-xs font-body font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/80 transition-all"
                >
                  Send
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick-prompt chips */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => submit(p)}
                  className="text-xs font-body px-3 py-1.5 rounded-full text-white/90 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action cards ── */}
      <div className="px-4 pt-5 pb-6">
        <p className="text-[10px] font-body font-semibold uppercase tracking-[0.12em] mb-3 px-1" style={{ color: 'rgba(89,89,89,0.5)' }}>
          Common requests
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => submit(action.prompt)}
              className="group flex flex-col items-start gap-3 bg-white border border-border-col rounded-2xl px-4 py-4 text-left hover:border-sage/40 hover:shadow-md transition-all"
            >
              <span className="text-sage group-hover:text-sage-dark transition-colors">
                {action.icon}
              </span>
              <div>
                <p className="text-sm font-body font-semibold text-ink leading-tight">{action.label}</p>
                <p className="text-xs font-body text-muted/60 mt-0.5 leading-snug">{action.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Email fallback */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-body" style={{ color: 'rgba(89,89,89,0.5)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>Prefer email?</span>
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
      <div className="flex-1 min-h-0 overflow-y-auto">
        <WelcomeScreen onSend={sendMessage} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: '#F7F5F1' }}>
      {/* Chat header */}
      <div className="bg-white border-b border-border-col px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ boxShadow: '0 1px 0 #E8E6E1' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center shadow-sm">
              <LogoMark style={{ width: '17px', height: '17px' }} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-sage border-2 border-white rounded-full" />
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-ink leading-tight">Customer Experience</p>
            <p className="text-[11px] font-body" style={{ color: 'rgba(89,89,89,0.55)' }}>Mint &amp; Lily · Online now</p>
          </div>
        </div>
        <button
          onClick={() => { setMessages([]); setShowEscalation(false); }}
          className="text-xs font-body text-muted/50 hover:text-ink transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-cream"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          </svg>
          New chat
        </button>
      </div>

      {/* Messages — mt-auto pushes messages to bottom when chat is short */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        <div className="px-5 pt-4 pb-2 mt-auto">
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
      </div>

      {/* Input — sticky bottom, elevated */}
      <div
        className="flex-shrink-0 bg-white px-4 pt-3 pb-4"
        style={{ boxShadow: '0 -1px 0 #E8E6E1, 0 -4px 16px rgba(0,0,0,0.04)' }}
      >
        <div
          className="flex items-end gap-2.5 rounded-2xl px-4 py-3 transition-all"
          style={{ background: '#F3F1ED', outline: '1.5px solid transparent', outlineOffset: '0' }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Mint &amp; Lily…"
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
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: input.trim() && !isStreaming ? '#020303' : '#D9D7D2',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] font-body mt-2" style={{ color: 'rgba(89,89,89,0.3)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
