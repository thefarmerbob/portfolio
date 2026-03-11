import { useState, useRef, useEffect } from "react";

// Song-era mapping extracted from the paper's data and LIME analysis
const SONG_ERAS = [
  {
    song: "Hell N Back",
    artist: "Bakar",
    era: "spring-comfort",
    keywords: ["mom", "bus", "spring", "home", "comfort", "family", "rides", "routine", "school", "assignment", "grind", "classes"],
    period: "Apr 2024 – May 2025",
    plays: 94,
    description: "Long-term favorite — comfort and routine, bus rides, thinking about mom",
  },
  {
    song: "Je te laisserai des mots",
    artist: "Patrick Watson",
    era: "universal-nostalgia",
    keywords: ["nostalgic", "sad", "alone", "night", "introspective", "thinking", "feeling", "rainy", "quiet", "memories", "year", "everything"],
    period: "Mar 2024 – Dec 2024",
    plays: 80,
    description: "All-time favorite — deep nostalgia, quiet moments, universal longing",
  },
  {
    song: "Instant Crush (feat. Julian Casablancas)",
    artist: "Daft Punk",
    era: "lonely-night",
    keywords: ["night", "alone", "walking", "lonely", "sad", "nostalgic", "year", "thinking", "everything", "changed", "introspective", "rainy"],
    period: "Mar 2024 – Dec 2024",
    plays: 21,
    description: "Night-time loneliness — walking alone, reflecting on change",
  },
  {
    song: "Heart To Heart",
    artist: "Mac DeMarco",
    era: "coffee-study",
    keywords: ["coffee", "shop", "assignment", "vibes", "working", "productive", "calm", "study", "hiking", "friends", "beautiful", "weather", "alive", "present", "dumplings", "chinese"],
    period: "Mar 2024 – Jan 2025",
    plays: 50,
    description: "Coffee shop study sessions, outdoor adventures with friends",
  },
  {
    song: "Ylang Ylang",
    artist: "Slowed + Julius",
    era: "taiwan-summer",
    keywords: ["taiwan", "dumplings", "shin", "night", "funny", "nice", "claw", "machines", "food", "market", "summer", "travel", "adventure"],
    period: "Aug – Oct 2024",
    plays: 30,
    description: "Taiwan summer era — night markets, dumplings, claw machines with Shin",
  },
  {
    song: "Moni",
    artist: "Moni",
    era: "taiwan-summer",
    keywords: ["taiwan", "shin", "night", "funny", "nice", "summer", "travel", "food", "adventure", "dumplings", "explore"],
    period: "Aug – Oct 2024",
    plays: 25,
    description: "Sharp Taiwan spike — discovered and obsessed, then gone",
  },
  {
    song: "Guess featuring Billie Eilish",
    artist: "Various",
    era: "social-energy",
    keywords: ["friends", "party", "fun", "night", "people", "energy", "dancing", "going", "out", "music", "loud"],
    period: "Mid 2024",
    plays: 20,
    description: "Social energy era — nights out, group fun",
  },
  {
    song: "Parallels",
    artist: "Daniela Andrade",
    era: "reflective-calm",
    keywords: ["thinking", "calm", "quiet", "reflection", "morning", "peaceful", "gentle", "soft", "wondering", "contemplation"],
    period: "Mid 2024",
    plays: 18,
    description: "Gentle reflection — calm mornings, soft contemplation",
  },
  {
    song: "parents",
    artist: "YUNGBLUD",
    era: "rebellious-energy",
    keywords: ["frustrated", "angry", "change", "energy", "loud", "intense", "breaking", "rules", "freedom", "rebellion"],
    period: "Mid 2024",
    plays: 15,
    description: "Rebellious energy — frustration channeled into intensity",
  },
  {
    song: "KICK BACK",
    artist: "Kenshi Yonezu",
    era: "anime-hype",
    keywords: ["anime", "excited", "hype", "energy", "japan", "cool", "intense", "action", "chainsaw", "fun"],
    period: "Late 2024",
    plays: 15,
    description: "Anime hype era — high energy, Japan excitement",
  },
  {
    song: "(They Long To Be) Close To You",
    artist: "Carpenters",
    era: "japan-winter",
    keywords: ["japan", "winter", "onsen", "kusatsu", "travel", "december", "cold", "holiday", "christmas", "snow", "hotspring"],
    period: "Dec 2024",
    plays: 12,
    description: "Japan winter trip — onsen visits, holiday warmth",
  },
  {
    song: "Killshot",
    artist: "Magdalena Bay",
    era: "february-energy",
    keywords: ["new", "fresh", "energy", "february", "start", "beginning", "motivated", "change", "dumplings", "shin"],
    period: "Feb 2025",
    plays: 15,
    description: "February fresh start energy",
  },
  {
    song: "Me quiero ir",
    artist: "lusillón",
    era: "wanderlust",
    keywords: ["travel", "leaving", "wanderlust", "bus", "ride", "night", "late", "thinking", "changed", "year", "hiking", "friends"],
    period: "Mar 2024 – Jan 2025",
    plays: 21,
    description: "Wanderlust — late night bus rides, longing to go somewhere",
  },
  {
    song: "Michelle - Remastered 2009",
    artist: "The Beatles",
    era: "classic-feeling",
    keywords: ["feeling", "alone", "classic", "timeless", "love", "gentle", "warmth", "sweet", "tender"],
    period: "Mid 2024",
    plays: 10,
    description: "Classic tenderness — gentle, warm feelings",
  },
  {
    song: "Si Me Voy (with The Marías)",
    artist: "Cuco",
    era: "latin-night",
    keywords: ["night", "bus", "ride", "late", "changed", "year", "thinking", "everything", "spanish", "latin", "dreamy"],
    period: "Mar 2024 – Feb 2025",
    plays: 7,
    description: "Dreamy Latin nights — late bus rides, reflective journeys",
  },
  {
    song: "The Adults Are Talking",
    artist: "The Strokes",
    era: "indie-nostalgia",
    keywords: ["old", "days", "chinese", "fortunes", "today", "it", "indie", "cool", "retro", "vibes"],
    period: "Mid 2024",
    plays: 12,
    description: "Indie nostalgia — retro vibes, fortune-telling memories",
  },
  {
    song: "Headlock",
    artist: "Imogen Heap",
    era: "emotional-depth",
    keywords: ["deep", "emotional", "intense", "feeling", "overwhelmed", "beautiful", "complex", "layers", "haunting"],
    period: "Mid 2024",
    plays: 10,
    description: "Emotional depth — complex feelings, haunting beauty",
  },
  {
    song: "blue",
    artist: "yung kai",
    era: "melancholy-night",
    keywords: ["sad", "night", "alone", "blue", "melancholy", "thinking", "year", "everything", "nostalgic"],
    period: "Mid 2024",
    plays: 12,
    description: "Melancholy nights — sadness tinged with beauty",
  },
  {
    song: "Honeypie",
    artist: "JAWNY",
    era: "sweet-playful",
    keywords: ["sweet", "playful", "fun", "happy", "cute", "light", "bouncy", "cheerful", "sunshine"],
    period: "Mid 2024",
    plays: 10,
    description: "Sweet playful energy — lighthearted and bouncy",
  },
  {
    song: "Tamacun",
    artist: "Rodrigo y Gabriela",
    era: "guitar-fire",
    keywords: ["guitar", "fire", "intense", "passionate", "acoustic", "flamenco", "energy", "fast", "impressive"],
    period: "Sep – Dec 2024",
    plays: 26,
    description: "Acoustic fire — intense guitar energy",
  },
  {
    song: "Head To Heart",
    artist: "Sagi",
    era: "chill-electronic",
    keywords: ["chill", "electronic", "smooth", "night", "drive", "ambient", "relaxed", "flow"],
    period: "Mid 2024",
    plays: 10,
    description: "Chill electronic flow — smooth nighttime drives",
  },
  {
    song: "Gasolina",
    artist: "Daddy Yankee",
    era: "party-latin",
    keywords: ["party", "energy", "dancing", "loud", "fun", "group", "celebration", "hype", "reggaeton"],
    period: "Mid 2024",
    plays: 8,
    description: "Party energy — full throttle celebration",
  },
];

// Compute similarity between query and song keywords
function computeMatch(queryLower, songEra) {
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  let score = 0;
  let matchedKeywords = [];

  for (const keyword of songEra.keywords) {
    if (queryLower.includes(keyword)) {
      score += keyword.length > 4 ? 3 : 1; // longer keywords worth more
      matchedKeywords.push(keyword);
    }
  }

  // Partial word matching
  for (const word of queryWords) {
    for (const keyword of songEra.keywords) {
      if (keyword.includes(word) || word.includes(keyword)) {
        if (!matchedKeywords.includes(keyword)) {
          score += 0.5;
          matchedKeywords.push(keyword);
        }
      }
    }
  }

  return { score, matchedKeywords };
}

function getLocalRecommendations(query) {
  const queryLower = query.toLowerCase();
  const scored = SONG_ERAS.map(era => {
    const { score, matchedKeywords } = computeMatch(queryLower, era);
    return { ...era, score, matchedKeywords };
  })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return scored;
}

// Vinyl record spinning animation component
function VinylRecord({ isPlaying, song, artist, color }) {
  return (
    <div className="flex items-center justify-center" style={{ perspective: "800px" }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, #1a1a1a, #333, #1a1a1a, #444, #1a1a1a, #333, #1a1a1a)`,
          boxShadow: `0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: isPlaying ? "spin 3s linear infinite" : "none",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: color || "#e8453c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#1a1a1a",
            }}
          />
        </div>
        {/* Grooves */}
        {[35, 42, 49, 55].map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: "0.5px solid rgba(255,255,255,0.05)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const ACCENT_COLORS = [
  "#e8453c",
  "#d4782f",
  "#2e9e6b",
  "#3b82c4",
  "#8b5cf6",
  "#d946a8",
  "#ea7b2a",
  "#14b8a6",
];

function SongCard({ result, index, isNew }) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: isNew ? 1 : 0.7,
        animation: isNew ? `fadeSlideUp 0.5s ease ${index * 0.12}s both` : "none",
        background: hovered
          ? `linear-gradient(135deg, rgba(30,30,30,0.95), rgba(40,40,40,0.9))`
          : "rgba(25,25,25,0.85)",
        border: `1px solid ${hovered ? color + "55" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        gap: 20,
        alignItems: "center",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "default",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 8px 32px ${color}15` : "none",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <VinylRecord isPlaying={hovered} song={result.song} artist={result.artist} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 19,
              color: "#f0ece4",
              letterSpacing: "-0.01em",
            }}
          >
            {result.song}
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>—</span>
          <span style={{ color: color, fontSize: 14, fontWeight: 500 }}>{result.artist}</span>
        </div>

        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            margin: "6px 0 10px",
            fontStyle: "italic",
            lineHeight: 1.4,
          }}
        >
          {result.description}
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{
              background: color + "20",
              color: color,
              padding: "2px 10px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {result.period}
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
            }}
          >
            {result.plays} plays
          </span>
          {result.matchedKeywords && result.matchedKeywords.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {result.matchedKeywords.slice(0, 4).map((kw, i) => (
                <span
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.45)",
                    padding: "2px 8px",
                    borderRadius: 100,
                    fontSize: 10,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${color}30, ${color}10)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color: color,
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontWeight: 700,
        }}
      >
        #{index + 1}
      </div>
    </div>
  );
}

// AI-powered recommendation using Anthropic API
async function getAIRecommendations(query) {
  const songList = SONG_ERAS.map(
    s => `- "${s.song}" by ${s.artist}: era="${s.era}", keywords=[${s.keywords.join(", ")}], description="${s.description}", period="${s.period}", plays=${s.plays}`
  ).join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are the brain of "Chihiro," a nostalgia-driven music recommendation system. Given a user's mood/text input, recommend the top 5 songs that would maximize nostalgia based on semantic similarity to journal entries associated with listening patterns.

Here are the available songs and their associated emotional eras:
${songList}

User's current mood/text: "${query}"

Respond ONLY with a JSON array of exactly 5 objects, no other text. Each object must have:
- "song": exact song name from the list
- "artist": exact artist name from the list  
- "reason": a brief, poetic 1-sentence reason why this song matches (be personal and evocative, reference the era/mood)
- "confidence": a number 0-1 indicating match strength

Example format: [{"song":"...","artist":"...","reason":"...","confidence":0.85}]`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export default function Chihiro() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [aiResults, setAiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("ai"); // "ai" or "local"
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const [typedText, setTypedText] = useState("");
  const subtitle = "nostalgia-driven music recommendations";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= subtitle.length) {
        setTypedText(subtitle.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 45);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setHasSearched(true);
    setLoading(true);

    // Always get local results
    const local = getLocalRecommendations(query);
    setResults(local);

    if (mode === "ai") {
      try {
        const ai = await getAIRecommendations(query);
        // Merge AI results with song data
        const merged = ai.map(aiSong => {
          const match = SONG_ERAS.find(
            s => s.song.toLowerCase() === aiSong.song.toLowerCase()
          );
          return {
            ...match,
            ...(match || {}),
            song: aiSong.song,
            artist: aiSong.artist,
            aiReason: aiSong.reason,
            confidence: aiSong.confidence,
            matchedKeywords: match?.keywords?.slice(0, 3) || [],
          };
        });
        setAiResults(merged);
      } catch (e) {
        console.error("AI recommendation failed:", e);
        setAiResults(null);
      }
    } else {
      setAiResults(null);
    }

    setLoading(false);
  };

  const displayResults = mode === "ai" && aiResults ? aiResults : results;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0e0e",
        color: "#f0ece4",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Serif+Display&display=swap');
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(1deg); }
          66% { transform: translateY(4px) rotate(-1deg); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        ::selection {
          background: #e8453c44;
          color: #f0ece4;
        }
        
        input::placeholder {
          color: rgba(255,255,255,0.25);
          font-style: italic;
        }
        
        .noise {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Noise texture overlay */}
      <div className="noise" />

      {/* Ambient background glow */}
      <div
        style={{
          position: "fixed",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,69,60,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          animation: "float 12s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -300,
          left: -200,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          animation: "float 15s ease-in-out infinite reverse",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 720,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: 50, textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 64,
              fontWeight: 400,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1,
              background: "linear-gradient(135deg, #f0ece4 30%, #e8453c 70%, #d4782f)",
              backgroundSize: "200% 200%",
              animation: "gradientShift 8s ease infinite",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            chihiro
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 14,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginTop: 10,
              fontWeight: 300,
              minHeight: 20,
            }}
          >
            {typedText}
            <span style={{ animation: "pulse 1s ease infinite", opacity: typedText.length < subtitle.length ? 1 : 0 }}>|</span>
          </p>
        </header>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            marginBottom: 24,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 100,
            padding: 4,
            width: "fit-content",
            margin: "0 auto 24px",
          }}
        >
          {[
            { key: "ai", label: "AI-Powered" },
            { key: "local", label: "Keyword Match" },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              style={{
                background: mode === m.key ? "rgba(255,255,255,0.1)" : "transparent",
                color: mode === m.key ? "#f0ece4" : "rgba(255,255,255,0.35)",
                border: "none",
                borderRadius: 100,
                padding: "8px 20px",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.25s ease",
                fontFamily: "inherit",
                fontWeight: mode === m.key ? 500 : 400,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div
          style={{
            position: "relative",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="how are you feeling right now?"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "18px 24px",
                color: "#f0ece4",
                fontSize: 16,
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={e => {
                e.target.style.borderColor = "rgba(232,69,60,0.3)";
                e.target.style.background = "rgba(255,255,255,0.06)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "rgba(255,255,255,0.08)";
                e.target.style.background = "rgba(255,255,255,0.04)";
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !query.trim()}
              style={{
                background: loading
                  ? "rgba(232,69,60,0.3)"
                  : "linear-gradient(135deg, #e8453c, #d4782f)",
                border: "none",
                borderRadius: 14,
                padding: "18px 28px",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.04em",
                transition: "all 0.3s ease",
                whiteSpace: "nowrap",
                opacity: !query.trim() ? 0.4 : 1,
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  finding...
                </span>
              ) : (
                "feel"
              )}
            </button>
          </div>

          {/* Prompt suggestions */}
          {!hasSearched && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 14,
                justifyContent: "center",
              }}
            >
              {[
                "eating dumplings with shin",
                "rainy day, feeling nostalgic",
                "late night bus ride home",
                "coffee shop studying",
                "hiking with friends",
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(prompt);
                    inputRef.current?.focus();
                  }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 100,
                    padding: "6px 16px",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    e.target.style.borderColor = "rgba(232,69,60,0.3)";
                    e.target.style.color = "rgba(255,255,255,0.7)";
                  }}
                  onMouseLeave={e => {
                    e.target.style.borderColor = "rgba(255,255,255,0.06)";
                    e.target.style.color = "rgba(255,255,255,0.4)";
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {hasSearched && !loading && displayResults.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 24,
                  background: "linear-gradient(180deg, #e8453c, #d4782f)",
                  borderRadius: 2,
                }}
              />
              <h2
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 400,
                  margin: 0,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                your nostalgia playlist
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "3px 10px",
                  borderRadius: 100,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {mode === "ai" && aiResults ? "ai" : "keyword"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {displayResults.map((result, i) => (
                <div key={`${result.song}-${i}`}>
                  <SongCard result={result} index={i} isNew={true} />
                  {mode === "ai" && result.aiReason && (
                    <p
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: 12,
                        fontStyle: "italic",
                        margin: "6px 0 0 144px",
                        lineHeight: 1.5,
                      }}
                    >
                      "{result.aiReason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasSearched && !loading && displayResults.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <p style={{ fontSize: 18, fontFamily: "'DM Serif Display', Georgia, serif" }}>
              no matching eras found
            </p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              try describing your mood, a place, or an experience
            </p>
          </div>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: 80,
            textAlign: "center",
            color: "rgba(255,255,255,0.15)",
            fontSize: 11,
            letterSpacing: "0.08em",
          }}
        >
          <p>built with journal entries, spotify data & nostalgia</p>
          <p style={{ marginTop: 4 }}>
            SBERT · VAE · 309 journal pages · 32,278 streams
          </p>
        </footer>
      </div>
    </div>
  );
}
