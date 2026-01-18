import { useEffect, useMemo, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";

type ChatTurn = { role: "user" | "assistant"; text: string };

function speak(text: string, voiceName?: string) {
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const chosen =
      voiceName && voices.length
        ? voices.find((v) => v.name === voiceName) ?? null
        : null;

    if (chosen) utter.voice = chosen;

    window.speechSynthesis.speak(utter);
  } catch {
    // ignore
  }
}

function getSpeechRecognition(): any | null {
  const w = window as any;
  return w.SpeechRecognition
    ? w.SpeechRecognition
    : w.webkitSpeechRecognition
    ? w.webkitSpeechRecognition
    : null;
}

function MicToggle() {
  const { localParticipant } = useLocalParticipant();
  const [enabled, setEnabled] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await localParticipant.setMicrophoneEnabled(next);
  };

  return (
    <button
      className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
      onClick={toggle}
    >
      {enabled ? "Mic On (click to mute)" : "Mic Off (click to enable)"}
    </button>
  );
}

// Safely handle cases where backend accidentally returns an object/stringified JSON
function normalizeAdvisorReply(raw: unknown): string {
  if (typeof raw === "string") return raw;

  if (raw && typeof raw === "object") {
    const anyRaw = raw as any;
    // common patterns
    if (typeof anyRaw.reply === "string") return anyRaw.reply;
    if (typeof anyRaw.text === "string") return anyRaw.text;
    if (typeof anyRaw.feedback === "string") return anyRaw.feedback;
    // fallback
    return JSON.stringify(raw);
  }

  return String(raw ?? "");
}

export function Voice() {
  // LiveKit connect state
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Interview state
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);

  // optional: choose a voice from speechSynthesis.getVoices() list
  const VOICE_NAME = "Aaron"; // change to "Aaron", "Fred", etc.

  const roomName = useMemo(() => "admitx-voice", []);
  const identity = useMemo(
    () => `user-${Math.random().toString(16).slice(2)}`,
    []
  );

  const recognitionRef = useRef<any | null>(null);

  // Ensure voices load (Safari/Chrome sometimes populate later)
  useEffect(() => {
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = handler;
    handler();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ✅ Auto intro question once connected
  useEffect(() => {
    if (connected && history.length === 0) {
      const intro =
        "Hi! I’m your admissions advisor. Let’s start with the basics — what grade are you in, what major are you thinking about, and what are your current GPA plus SAT or ACT if you have them?";
      setHistory([{ role: "assistant", text: intro }]);
      speak(intro, VOICE_NAME);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const connect = async () => {
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(
        `/api/livekit/token?room=${encodeURIComponent(
          roomName
        )}&identity=${encodeURIComponent(identity)}`
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Token request failed (${res.status}) ${text}`);
      }

      const data = (await res.json()) as { token: string; url: string };
      if (!data?.token || !data?.url) throw new Error("Bad token response");

      setToken(data.token);
      setUrl(data.url);
      setConnected(true);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to connect");
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const askAdvisor = async (userText: string) => {
    setThinking(true);
    setErr(null);

    // add user message immediately
    setHistory((prev) => [...prev, { role: "user", text: userText }]);

    try {
      const res = await fetch("/api/voice/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          // keep last ~10 turns (client-side)
          history: [...history, { role: "user", text: userText }].slice(-10),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Advisor failed (${res.status}) ${text}`);
      }

      const data = await res.json();
      const reply = normalizeAdvisorReply((data as any)?.reply ?? data);

      setHistory((prev) => [...prev, { role: "assistant", text: reply }]);
      if (reply) speak(reply, VOICE_NAME);
    } catch (e: any) {
      setErr(e?.message ?? "Advisor failed");
    } finally {
      setThinking(false);
    }
  };

  const startListening = () => {
    setErr(null);

    const SR = getSpeechRecognition();
    if (!SR) {
      setErr("Speech Recognition not supported. Try Chrome.");
      return;
    }

    if (!recognitionRef.current) {
      const rec = new SR();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript?.trim();
        if (text) askAdvisor(text);
      };

      rec.onerror = (event: any) => {
        setErr(event?.error ? `Speech error: ${event.error}` : "Speech error");
        setListening(false);
      };

      rec.onend = () => setListening(false);

      recognitionRef.current = rec;
    }

    setListening(true);
    recognitionRef.current.start();
  };

  if (!connected) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-2">Voice Interview</h1>
        <p className="text-gray-600 mb-6">
          Connect to start a live admissions-style interview.
        </p>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <button
          className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
          onClick={connect}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect"}
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token!}
      serverUrl={url!}
      connect={true}
      video={false}
      audio={true}
      onDisconnected={() => setConnected(false)}
      className="h-full"
    >
      <RoomAudioRenderer />

      <div className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Voice Interview</h1>
            <div className="text-sm text-gray-600">
              Room: <span className="font-medium">{roomName}</span> • You:{" "}
              <span className="font-medium">{identity}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <MicToggle />
            <button
              className="rounded-lg bg-green-600 text-white px-4 py-2 disabled:opacity-60"
              onClick={startListening}
              disabled={listening || thinking}
            >
              {listening ? "Listening..." : thinking ? "Thinking..." : "Talk"}
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mt-6 rounded-xl border bg-white p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Conversation
          </div>

          {history.length === 0 ? (
            <div className="text-sm text-gray-500">
              The advisor will start once you connect.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((t, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-semibold">
                    {t.role === "user" ? "You" : "Advisor"}:
                  </span>{" "}
                  <span className="text-gray-800">{t.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LiveKitRoom>
  );
}
