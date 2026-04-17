import { useState, useRef } from 'react';
import OpenAI from 'openai';
import { reviews as SEED_REVIEWS } from '../data/reviews.js';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const CATEGORIES = ['Shipping', 'Personalization', 'Packaging', 'Product Quality', 'Returns'];

const CATEGORY_ICONS = {
  Shipping: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Personalization: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  Packaging: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  ),
  'Product Quality': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Returns: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
  ),
};

const SENTIMENT_CONFIG = {
  positive: { style: 'bg-sage-light text-sage-dark border-sage/30', dot: 'bg-sage' },
  mixed:    { style: 'bg-amber/10 text-amber border-amber/30', dot: 'bg-amber' },
  negative: { style: 'bg-red-50 text-red-500 border-red-200', dot: 'bg-red-400' },
};

const SEVERITY_CONFIG = {
  high:   { style: 'bg-red-50 text-red-500 border-red-200' },
  medium: { style: 'bg-amber/10 text-amber border-amber/30' },
  low:    { style: 'bg-sage-light text-sage-dark border-sage/30' },
};

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one review.');

  // Parse a single CSV line respecting quoted fields
  const parseLine = (line) => {
    const fields = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        fields.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    return fields;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

  // Column name aliases for common export formats
  const find = (aliases) => aliases.find(a => headers.includes(a)) ?? null;
  const ratingCol   = find(['rating', 'stars', 'score', 'review_rating', 'star_rating']);
  const textCol     = find(['review', 'text', 'body', 'review_body', 'comment', 'content', 'message', 'review_text']);
  const categoryCol = find(['category', 'type', 'topic', 'tag', 'department']);
  const dateCol     = find(['date', 'created_at', 'submitted_at', 'review_date', 'published_at', 'timestamp']);

  if (!ratingCol) throw new Error('Could not find a rating column. Expected: rating, stars, score.');
  if (!textCol)   throw new Error('Could not find a review text column. Expected: review, text, body, comment.');

  const ri = headers.indexOf(ratingCol);
  const ti = headers.indexOf(textCol);
  const ci = categoryCol ? headers.indexOf(categoryCol) : -1;
  const di = dateCol     ? headers.indexOf(dateCol)     : -1;

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseLine(lines[i]);
    const ratingRaw = parseFloat(cols[ri]);
    const rating = isNaN(ratingRaw) ? null : Math.min(5, Math.max(1, Math.round(ratingRaw)));
    const text = cols[ti]?.replace(/^["']|["']$/g, '').trim();
    if (!text || rating == null) continue;

    // Snap to known category or leave blank for AI to classify
    const rawCat = ci >= 0 ? cols[ci]?.trim() : '';
    const category = CATEGORIES.find(c => rawCat?.toLowerCase().includes(c.toLowerCase())) ?? 'Uncategorized';
    const date = di >= 0 ? (cols[di]?.split('T')[0] ?? '') : '';

    parsed.push({ id: i, rating, text, category, date });
  }

  if (parsed.length === 0) throw new Error('No valid reviews found. Check your CSV has rating and text columns with data.');
  return parsed;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StarRating({ rating, size = 12 }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= rating ? '#C49A3C' : 'none'}
          stroke={s <= rating ? '#C49A3C' : '#D1D5DB'}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="bg-white border border-border-col rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={review.rating} />
        <span className="text-[11px] font-body text-muted/60 bg-cream-dark px-2.5 py-1 rounded-full">
          {review.category}
        </span>
      </div>
      <p className="text-sm font-body text-ink leading-relaxed">"{review.text}"</p>
      {review.date && <p className="text-xs font-body text-muted/40 mt-3">{review.date}</p>}
    </div>
  );
}

function CategoryCard({ cat, data }) {
  const cfg = SENTIMENT_CONFIG[data?.sentiment] ?? SENTIMENT_CONFIG.mixed;
  return (
    <div className="bg-white border border-border-col rounded-2xl p-5 flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sage">{CATEGORY_ICONS[cat]}</span>
        <span className="text-[10px] font-body font-semibold text-muted uppercase tracking-widest leading-none">{cat}</span>
      </div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="font-heading text-4xl text-ink leading-none">{data?.count ?? '—'}</p>
          <p className="text-xs font-body text-muted/60 mt-1">reviews</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl text-ink leading-none">
            {data?.avg_rating != null ? data.avg_rating.toFixed(1) : '—'}
          </p>
          <p className="text-xs font-body text-muted/60 mt-1">avg</p>
        </div>
      </div>
      {data?.sentiment && (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-body font-medium px-2.5 py-1 rounded-full border ${cfg.style}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {data.sentiment}
        </span>
      )}
    </div>
  );
}

function ExpandableTemplate({ item }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(item.template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border-col rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream transition-colors"
      >
        <span className="font-body font-medium text-sm text-ink">{item.issue}</span>
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
          className={`transition-transform duration-200 flex-shrink-0 ml-3 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="border-t border-border-col px-5 pb-5 pt-4 bg-cream/40">
          <p className="text-sm font-body text-muted leading-relaxed whitespace-pre-wrap">{item.template}</p>
          <button
            onClick={copy}
            className="mt-4 inline-flex items-center gap-2 text-xs font-body font-semibold text-sage hover:text-sage-dark transition-colors"
          >
            {copied
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Copied</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy response</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full bg-sage" />
      <h3 className="font-heading text-xl text-ink">{children}</h3>
    </div>
  );
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }) {
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState(null);
  const fileRef = useRef(null);

  const handleParse = () => {
    setParseError(null);
    setPreview(null);
    try {
      const parsed = parseCSV(raw);
      setPreview(parsed);
    } catch (e) {
      setParseError(e.message);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRaw(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,3,3,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-col flex-shrink-0">
          <div>
            <h2 className="font-heading text-2xl text-ink">Import Reviews</h2>
            <p className="text-xs font-body text-muted/60 mt-0.5">Paste CSV or upload a file — works with Shopify, Yotpo, Trustpilot exports</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-cream transition-colors text-muted/50 hover:text-ink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Required columns hint */}
          <div className="bg-sage-light border border-sage/20 rounded-2xl px-4 py-3.5 text-xs font-body text-sage-dark leading-relaxed">
            <p className="font-semibold mb-1">Required columns</p>
            <p><span className="font-medium">Rating</span> — rating, stars, score</p>
            <p><span className="font-medium">Review text</span> — review, text, body, comment</p>
            <p className="mt-1.5 text-sage-dark/70">Optional: category, date/created_at</p>
          </div>

          {/* File upload */}
          <div>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border-col rounded-2xl py-3.5 text-sm font-body text-muted/60 hover:border-sage/50 hover:text-sage-dark hover:bg-sage-light/40 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload CSV file
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-col" />
            <span className="text-xs font-body text-muted/40">or paste below</span>
            <div className="flex-1 h-px bg-border-col" />
          </div>

          {/* Paste area */}
          <textarea
            value={raw}
            onChange={e => { setRaw(e.target.value); setPreview(null); setParseError(null); }}
            placeholder={`rating,review,category,date\n5,"Absolutely loved the engraving",Personalization,2024-11-01\n2,"Shipping took 3 weeks",Shipping,2024-11-05`}
            className="w-full h-40 resize-none text-xs font-mono bg-cream border border-border-col rounded-2xl px-4 py-3 text-ink placeholder:text-muted/30 focus:outline-none focus:border-sage/40 leading-relaxed"
          />

          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-500 text-sm font-body rounded-2xl px-4 py-3">
              {parseError}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="bg-white border border-sage/25 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-sage-light border-b border-sage/20">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6aab80" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-xs font-body font-semibold text-sage-dark">{preview.length} reviews parsed successfully</span>
                </div>
                <div className="flex gap-3 text-xs font-body text-muted/60">
                  <span>avg {(preview.reduce((s, r) => s + r.rating, 0) / preview.length).toFixed(1)}★</span>
                  <span>{[...new Set(preview.map(r => r.category))].length} categories</span>
                </div>
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-border-col">
                {preview.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="text-xs font-body font-semibold text-amber flex-shrink-0 w-5">{r.rating}★</span>
                    <span className="text-xs font-body text-muted/60 flex-shrink-0 w-24 truncate">{r.category}</span>
                    <span className="text-xs font-body text-ink truncate">{r.text}</span>
                  </div>
                ))}
                {preview.length > 8 && (
                  <div className="px-4 py-2.5 text-xs font-body text-muted/40">+ {preview.length - 8} more</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-col flex-shrink-0">
          <button onClick={onClose} className="text-sm font-body text-muted/60 hover:text-ink transition-colors px-3 py-2">
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            {!preview && (
              <button
                onClick={handleParse}
                disabled={!raw.trim()}
                className="px-4 py-2 rounded-xl border border-border-col text-sm font-body font-medium text-ink hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Preview
              </button>
            )}
            {preview && (
              <button
                onClick={() => onImport(preview)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink hover:bg-ink/80 text-white text-sm font-body font-medium transition-all shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Load {preview.length} reviews
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReviewIntelligence() {
  const [activeReviews, setActiveReviews] = useState(SEED_REVIEWS);
  const [isImported, setIsImported] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = (parsed) => {
    setActiveReviews(parsed);
    setIsImported(true);
    setShowImport(false);
    setAnalysis(null); // clear stale report
  };

  const resetToSeed = () => {
    setActiveReviews(SEED_REVIEWS);
    setIsImported(false);
    setAnalysis(null);
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    const reviewList = activeReviews
      .map((r, i) => `${i + 1}. [${r.rating}/5 — ${r.category}] "${r.text}"`)
      .join('\n');

    const prompt = `You are a CX analyst for a DTC jewelry brand. Analyze the following customer reviews and return a JSON object with this exact structure — no markdown, no preamble, just raw JSON:
{ "summary": "2-3 sentence overall summary", "category_breakdown": { "Shipping": { "count": n, "avg_rating": n, "sentiment": "positive|mixed|negative" }, "Personalization": { "count": n, "avg_rating": n, "sentiment": "positive|mixed|negative" }, "Packaging": { "count": n, "avg_rating": n, "sentiment": "positive|mixed|negative" }, "Product Quality": { "count": n, "avg_rating": n, "sentiment": "positive|mixed|negative" }, "Returns": { "count": n, "avg_rating": n, "sentiment": "positive|mixed|negative" } }, "top_issues": [ { "issue": "short label", "frequency": n, "severity": "high|medium|low", "example": "direct quote from a review" } ], "response_templates": [ { "issue": "matches top issue label", "template": "ready-to-send customer response" } ] }

Reviews:
${reviewList}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.choices[0].message.content.trim();
      const json = JSON.parse(raw.replace(/^```json?\n?/, '').replace(/\n?```$/, ''));
      setAnalysis(json);
    } catch (err) {
      setError('Something went wrong generating the report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-cream">

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border-col px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <p className="text-sm font-body text-ink font-medium">{activeReviews.length} reviews</p>
          <span className="text-border-col">·</span>
          {isImported ? (
            <button
              onClick={resetToSeed}
              className="text-xs font-body text-muted/60 hover:text-ink transition-colors flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
              </svg>
              Reset to sample data
            </button>
          ) : (
            <p className="text-xs font-body text-muted/50 italic">sample data</p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 text-sm font-body font-medium text-ink px-4 py-2 rounded-xl border border-border-col hover:bg-cream hover:border-sage/40 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import CSV
          </button>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 bg-ink hover:bg-ink/80 disabled:bg-border-col disabled:cursor-not-allowed text-white text-sm font-body font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-7 space-y-9">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 text-sm font-body rounded-2xl px-5 py-4">
            {error}
          </div>
        )}

        {!analysis && !loading && (
          <div className="flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-sage-light border border-sage/20 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#89c29b" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h3 className="font-heading text-2xl text-ink mb-2">
              {isImported ? 'Ready to analyse' : 'Generate a report'}
            </h3>
            <p className="text-sm font-body text-muted max-w-xs leading-relaxed">
              {isImported
                ? `${activeReviews.length} reviews loaded. Hit Generate Report to surface top issues, category trends, and response templates.`
                : 'Import your own CSV or analyse the sample data to surface top issues, category trends, and ready-to-use response templates.'}
            </p>
            {!isImported && (
              <button
                onClick={() => setShowImport(true)}
                className="mt-5 flex items-center gap-2 text-sm font-body font-medium text-sage-dark hover:text-ink transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import your reviews
              </button>
            )}
          </div>
        )}

        {analysis && (
          <div className="space-y-8">
            <div className="bg-white border border-border-col rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-1 h-5 rounded-full bg-sage" />
                <h3 className="font-heading text-xl text-ink">Summary</h3>
              </div>
              <p className="font-body text-sm text-muted leading-relaxed">{analysis.summary}</p>
            </div>

            <div>
              <SectionHeader>By Category</SectionHeader>
              <div className="flex gap-3 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <CategoryCard key={cat} cat={cat} data={analysis.category_breakdown?.[cat]} />
                ))}
              </div>
            </div>

            <div>
              <SectionHeader>Top Issues</SectionHeader>
              <div className="space-y-3">
                {analysis.top_issues?.map((issue, i) => (
                  <div key={i} className="bg-white border border-border-col rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <span className="font-body font-semibold text-sm text-ink">{issue.issue}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-body text-muted bg-cream-dark px-2.5 py-1 rounded-full">
                          {issue.frequency}× reported
                        </span>
                        <span className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full border ${SEVERITY_CONFIG[issue.severity]?.style}`}>
                          {issue.severity}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-body text-muted italic leading-relaxed border-l-2 border-sage/30 pl-3">
                      "{issue.example}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionHeader>Response Templates</SectionHeader>
              <div className="space-y-2">
                {analysis.response_templates?.map((item, i) => (
                  <ExpandableTemplate key={i} item={item} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 rounded-full bg-sage" />
            <h3 className="font-heading text-xl text-ink">All Reviews</h3>
            <span className="text-xs font-body text-muted bg-white border border-border-col px-2.5 py-1 rounded-full">{activeReviews.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeReviews.map((r, i) => (
              <ReviewCard key={r.id ?? i} review={r} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
