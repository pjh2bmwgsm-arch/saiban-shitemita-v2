"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ref,
  onValue,
  set,
  update,
  push,
  query,
  limitToLast,
} from "firebase/database";
import { db } from "../lib/firebase";
import {
  Gavel,
  ChevronLeft,
  Plus,
  ThumbsUp,
  MessageCircle,
  Upload,
  Home,
  User,
  Flame,
  Eye,
  Gift,
  Bell,
  Users,
  Lock,
  Mic,
  Sparkles,
  Send,
  RotateCcw,
  Check,
} from "lucide-react";

const BG = "#131316";
const CARD = "#1D1D22";
const LINE = "#2C2C33";
const PINK = "#FF3D7F";
const YELLOW = "#FFD23F";
const TEXT = "#F3F2ED";
const MUTED = "#89879A";

function loadLocal(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveLocal(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

const upcomingCasesSeed = [
  { id: 101, category: "浮気疑惑", startLabel: "今夜 21:00", interested: 412, notify: false },
  { id: 102, category: "お金の貸し借り", startLabel: "今夜 22:30", interested: 128, notify: true },
  { id: 103, category: "元恋人トラブル", startLabel: "明日 20:00", interested: 89, notify: false },
];

const seedCases = {
  1: {
    id: 1,
    title: "誕生日を忘れた事件",
    hot: true,
    status: "voting",
    plaintiff: "A子",
    defendant: "B男",
    votesA: 128,
    votesB: 41,
    giftsA: 2400,
    giftsB: 300,
    viewers: 842,
    plaintiffClaim: "3年間一度も誕生日を覚えてくれたことがない。今年もLINEで気づかせるまで無反応でした。",
    defendantClaim: "仕事のプロジェクトが立て込んでいて、前日まで日付の感覚がありませんでした。悪気はなく、翌日ちゃんとお祝いしました。",
    timeline: ["3年前 交際開始", "1年目の誕生日 → 当日は特に何もなし", "2年目の誕生日 → LINEでヒントを出してようやく気づく", "今年 → 同じことが再び起きる"],
    plaintiffPoints: ["3年間、一度も自分から誕生日を祝ってもらえたことがない", "毎回LINEでそれとなく伝えてようやく気づいてもらえる", "『大切にされていない』と感じてしまう"],
    defendantPoints: ["直近3ヶ月、大型プロジェクトのリリース対応で余裕がなかった", "忘れていたのは事実だが、翌日すぐにお祝いの準備をした", "毎年ではなく、今回はたまたま特に忙しい時期と重なった"],
    plaintiffGuessOfDefendant: "きっと『そんなに気にしてると思わなかった』って言い訳すると思う",
    defendantGuessOfPlaintiff: "たぶん『毎年忘れられるのが悲しい』って落ち込んでると思う",
    aiVerdict: null,
  },
  2: {
    id: 2,
    title: "旅行の割り勘めぐる対立",
    hot: false,
    status: "verdict",
    plaintiff: "C美",
    defendant: "D也",
    votesA: 302,
    votesB: 288,
    giftsA: 5100,
    giftsB: 4800,
    viewers: 2130,
    plaintiffClaim: "宿泊費もガソリン代も私が多く払っているのに、食事代だけ均等割りを求められた。",
    defendantClaim: "宿泊先は元々彼女の希望した高いホテルだったので、その分は食費で調整するのが公平だと思っていた。",
    aiVerdict: "双方に一理あります。事前に費目ごとの負担割合を合意していなかった点が対立の根本原因です。今回は五分五分としつつ、次回からは出発前に割り勘ルールを決めることを提案します。",
  },
  3: {
    id: 3,
    title: "ルームシェアの家事分担事件",
    hot: true,
    status: "voting",
    plaintiff: "E太",
    defendant: "F奈",
    votesA: 54,
    votesB: 97,
    giftsA: 100,
    giftsB: 900,
    viewers: 356,
    plaintiffClaim: "皿洗いもゴミ出しも自分ばかりやっている。ルームメイトは家事をほぼしない。",
    defendantClaim: "家賃は自分の方が多く負担しているので、家事の分担はその分軽くしてもらう約束だったはず。",
    timeline: ["半年前 ルームシェア開始、家事は『気づいた方がやる』で合意", "3ヶ月前 家賃を多く払う代わりに家事を減らしてほしいと相談", "直近1ヶ月 皿洗い・ゴミ出しの頻度に偏りが目立つように"],
    plaintiffPoints: ["直近1ヶ月、皿洗いは28日中24日を自分が担当", "ゴミ出しも声をかけないと本人がやらない", "家賃差はあるが、体感の負担差の方がずっと大きい"],
    defendantPoints: ["家賃は自分の方が月2万円多く払っている", "『家賃が多い分は家事を軽くする』と口頭で合意した認識だった", "気づいた家事はその都度やっているつもりだった"],
    plaintiffGuessOfDefendant: "『家賃を多く払ってるんだから公平でしょ』って開き直ると思う",
    defendantGuessOfPlaintiff: "『そんな約束した覚えはない』って言われると思う",
    aiVerdict: null,
  },
};

function ScreenHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 14px", borderBottom: `1px solid ${LINE}` }}>
      {onBack && (
        <button onClick={onBack} aria-label="戻る" style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: TEXT }}>
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
    </div>
  );
}

function CaseCard({ c, onClick }) {
  const total = (c.votesA || 0) + (c.votesB || 0);
  const pctA = total ? Math.round((c.votesA / total) * 100) : 50;
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", textAlign: "left", background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, cursor: "pointer", display: "block" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {c.hot && (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#1A1A1A", background: YELLOW, padding: "3px 9px 3px 7px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Flame size={11} /> 急上昇
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: c.status === "verdict" ? "#8B8578" : PINK, background: c.status === "verdict" ? "#2A2A2A" : "rgba(255,61,127,0.14)", padding: "3px 9px", borderRadius: 20 }}>
            {c.status === "verdict" ? "判決確定" : "審理中"}
          </span>
        </div>
        <span style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 3 }}>
          <Eye size={12} /> {(c.viewers || 0).toLocaleString()}
        </span>
      </div>
      <p style={{ fontSize: 17, color: TEXT, margin: "0 0 12px", fontWeight: 800, letterSpacing: "-0.01em" }}>{c.title}</p>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED, marginBottom: 5 }}>
        <span style={{ color: PINK, fontWeight: 700 }}>{c.plaintiff} {pctA}%</span>
        <span style={{ color: YELLOW, fontWeight: 700 }}>{c.defendant} {100 - pctA}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", background: "#0D0D0F" }}>
        <div style={{ width: `${pctA}%`, background: PINK }} />
        <div style={{ width: `${100 - pctA}%`, background: YELLOW }} />
      </div>
    </button>
  );
}

function UpcomingCard({ u, onToggleNotify }) {
  return (
    <div style={{ background: `linear-gradient(135deg, rgba(255,61,127,0.08), rgba(255,210,63,0.08))`, border: `1px dashed ${LINE}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: CARD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Lock size={14} color={MUTED} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: TEXT, margin: "0 0 3px" }}>{u.category}をめぐる裁判</p>
          <p style={{ fontSize: 11, color: MUTED, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: YELLOW, fontWeight: 700 }}>{u.startLabel} 開廷</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Users size={11} /> {u.interested}人が気になる
            </span>
          </p>
        </div>
      </div>
      <button onClick={() => onToggleNotify(u.id)} aria-label="通知設定" style={{ background: u.notify ? PINK : "transparent", border: `1.5px solid ${u.notify ? PINK : LINE}`, borderRadius: 20, padding: "7px 12px", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: u.notify ? "#fff" : MUTED, cursor: "pointer", flexShrink: 0 }}>
        <Bell size={12} /> {u.notify ? "設定済み" : "通知する"}
      </button>
    </div>
  );
}

function HomeScreen({ cases, upcoming, onOpen, onNew, onToggleNotify, connected }) {
  const sorted = [...cases].sort((a, b) => (b.hot === a.hot ? (b.viewers || 0) - (a.viewers || 0) : b.hot ? 1 : -1));
  return (
    <div>
      <div style={{ padding: "22px 20px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Gavel size={20} color={YELLOW} />
          <h1 style={{ fontSize: 24, color: TEXT, margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>裁判してみた</h1>
        </div>
        <p style={{ fontSize: 13, color: MUTED, margin: "0 0 18px" }}>
          {connected ? (
            <>今、<span style={{ color: YELLOW, fontWeight: 700 }}>{cases.reduce((s, c) => s + (c.viewers || 0), 0).toLocaleString()}人</span>が観戦中</>
          ) : (
            "接続中…"
          )}
        </p>
      </div>
      <div style={{ padding: "0 20px 90px" }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, margin: "0 0 10px", letterSpacing: "0.02em" }}>まもなく開廷</p>
        {upcoming.map((u) => (
          <UpcomingCard key={u.id} u={u} onToggleNotify={onToggleNotify} />
        ))}
        <p style={{ fontSize: 12, fontWeight: 800, color: MUTED, margin: "22px 0 10px", letterSpacing: "0.02em" }}>審理中・判決済み</p>
        {sorted.map((c) => (
          <CaseCard key={c.id} c={c} onClick={() => onOpen(c)} />
        ))}
      </div>
      <button onClick={onNew} style={{ position: "absolute", right: 20, bottom: 84, width: 56, height: 56, borderRadius: "50%", background: PINK, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(255,61,127,0.45)" }} aria-label="裁判をひらく">
        <Plus size={26} />
      </button>
    </div>
  );
}

function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SR) {
      const rec = new SR();
      rec.lang = "ja-JP";
      rec.interimResults = true;
      rec.continuous = true;
      recognitionRef.current = rec;
      setSupported(true);
    }
  }, []);
  return { recognition: recognitionRef.current, supported };
}

function NewCaseScreen({ onBack, onSubmit }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [invited, setInvited] = useState(false);
  const { recognition, supported } = useSpeechRecognition();
  const baseTranscriptRef = useRef("");

  useEffect(() => {
    if (!recognition) return;
    const onResult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) baseTranscriptRef.current += final;
      setDetail((baseTranscriptRef.current + interim).trim());
    };
    const onEnd = () => setRecording(false);
    recognition.addEventListener("result", onResult);
    recognition.addEventListener("end", onEnd);
    return () => {
      recognition.removeEventListener("result", onResult);
      recognition.removeEventListener("end", onEnd);
    };
  }, [recognition]);

  const submit = () => {
    if (!title.trim() || !detail.trim()) {
      setError("議題タイトルと詳細を入力してください");
      return;
    }
    setError("");
    onSubmit({ title: title.trim(), detail: detail.trim(), invitee: inviteeName.trim() || "相手" });
  };

  const toggleRecord = () => {
    if (recording) {
      recognition && recognition.stop();
      setRecording(false);
      return;
    }
    if (supported) {
      baseTranscriptRef.current = detail ? detail + "。" : "";
      try {
        recognition.start();
        setRecording(true);
      } catch (e) {
        setRecording(false);
      }
    } else {
      setRecording(true);
      setTimeout(() => {
        setRecording(false);
        setTitle((t) => t || "記念日を忘れられた事件");
        setDetail((d) => d || "3年間、付き合った記念日を一度も覚えてくれたことがありません。今年もLINEで気づかせるまで無反応でした。");
      }, 1600);
    }
  };

  const sendLineInvite = () => {
    const appUrl = "https://saiban-shitemita-v2.vercel.app";
    const message = `${title || "議題"}について「裁判してみた」で話し合いませんか？\n${detail}\n\n${appUrl}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
    window.open(lineUrl, "_blank");
    setInvited(true);
  };

  return (
    <div>
      <ScreenHeader title="議題を投稿" onBack={onBack} />
      <div style={{ padding: 20 }}>
        <button onClick={toggleRecord} style={{ width: "100%", padding: "16px", borderRadius: 12, border: `1.5px solid ${recording ? PINK : LINE}`, background: recording ? "rgba(255,61,127,0.12)" : CARD, color: recording ? PINK : TEXT, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 6 }}>
          <Mic size={17} /> {recording ? "聞き取り中…（タップで停止）" : "音声で議題を話す"}
        </button>
        {!supported && <p style={{ fontSize: 10, color: MUTED, margin: "0 0 12px" }}>このブラウザは音声認識に対応していません（Chrome推奨）。</p>}
        {supported && <div style={{ marginBottom: 12 }} />}
        <label style={labelStyle}>議題タイトル</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：割り勘でもめた事件" style={inputStyle} />
        <label style={{ ...labelStyle, marginTop: 16 }}>詳細</label>
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="何が起きたか、簡潔に書いてください" rows={4} style={{ ...inputStyle, resize: "none" }} />
        <label style={{ ...labelStyle, marginTop: 16 }}>相手の名前（表示用）</label>
        <input value={inviteeName} onChange={(e) => setInviteeName(e.target.value)} placeholder="例：たろう" style={inputStyle} />

        <label style={{ ...labelStyle, marginTop: 20 }}>相手を招待</label>
        {invited ? (
          <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 8, color: TEXT }}>
            <Check size={15} color="#7CDA9E" /> LINEでの招待を送信しました
          </div>
        ) : (
          <button
            onClick={sendLineInvite}
            disabled={!title.trim() || !detail.trim()}
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: !title.trim() || !detail.trim() ? "not-allowed" : "pointer",
              color: !title.trim() || !detail.trim() ? MUTED : "#06C755",
              fontWeight: 700,
              opacity: !title.trim() || !detail.trim() ? 0.5 : 1,
            }}
          >
            <MessageCircle size={16} /> LINEで招待メッセージを送る
          </button>
        )}
        <p style={{ fontSize: 10, color: MUTED, margin: "6px 0 0" }}>
          タップするとLINEアプリが開き、送りたい友だちを選べます（先にタイトルと詳細を入力してください）
        </p>

        {error && <p style={{ color: PINK, fontSize: 12, marginTop: 8 }}>{error}</p>}
        <button onClick={submit} style={{ ...primaryBtn, marginTop: 24 }}>開廷する</button>
      </div>
    </div>
  );
}

function EvidenceScreen({ onBack, onSubmit }) {
  const [claim, setClaim] = useState("");
  const [error, setError] = useState("");
  const [attached, setAttached] = useState(0);
  const [lawyerHired, setLawyerHired] = useState(false);
  const [guess, setGuess] = useState("");
  const submit = () => {
    if (!claim.trim()) {
      setError("主張を入力してください");
      return;
    }
    setError("");
    onSubmit({ claim: claim.trim(), guess: guess.trim(), attached, lawyerHired });
  };
  return (
    <div>
      <ScreenHeader title="証拠・主張の提出" onBack={onBack} />
      <div style={{ padding: 20 }}>
        <div style={{ background: "rgba(255,61,127,0.12)", border: `1px solid rgba(255,61,127,0.3)`, borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 12, color: "#FF7CA3" }}>
          相手の提出内容は、双方の締切が揃うまで表示されません。
        </div>
        <label style={labelStyle}>あなたの主張</label>
        <textarea value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="何が問題だと思うか、あなたの言い分を書いてください" rows={5} style={{ ...inputStyle, resize: "none" }} />
        <button onClick={() => setAttached((n) => n + 1)} style={{ ...inputStyle, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", color: MUTED }}>
          <Upload size={16} /> LINEスクショなど証拠画像を添付
        </button>
        {attached > 0 && <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>画像を{attached}枚添付しました</p>}
        <label style={{ ...labelStyle, marginTop: 20 }}>立場チェンジ：相手はこう言うと予想しますか？</label>
        <textarea value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="例：きっと『そんなに気にしてると思わなかった』って言うと思う" rows={2} style={{ ...inputStyle, resize: "none" }} />
        <button
          onClick={() => setLawyerHired((v) => !v)}
          style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 12, border: `1.5px solid ${lawyerHired ? YELLOW : LINE}`, background: lawyerHired ? "rgba(255,210,63,0.12)" : CARD, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}
        >
          <Sparkles size={18} color={YELLOW} />
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: TEXT }}>弁護士AIを雇う</span>
            <span style={{ display: "block", fontSize: 11, color: MUTED, marginTop: 2 }}>主張の弱い部分を指摘し、説得力のある言い回しに整えてくれます（300pt）</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: lawyerHired ? YELLOW : MUTED }}>{lawyerHired ? "依頼済み" : "依頼する"}</span>
        </button>
        {error && <p style={{ color: PINK, fontSize: 12, marginTop: 8 }}>{error}</p>}
        <button onClick={submit} style={{ ...primaryBtn, marginTop: 24 }}>提出する</button>
      </div>
    </div>
  );
}

function JudgeAvatar({ speaking, size = 96 }) {
  const [mouthBars, setMouthBars] = useState([3, 5, 4]);
  const timerRef = useRef(null);
  useEffect(() => {
    if (speaking) {
      timerRef.current = setInterval(() => setMouthBars([1, 2, 3].map(() => 2 + Math.round(Math.random() * 6))), 140);
    } else {
      setMouthBars([2, 2, 2]);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [speaking]);
  return (
    <svg width={size} height={size} viewBox="0 0 120 130" role="img" aria-label="AI裁判官のアバター">
      <path d="M18 128 C18 98 36 84 60 84 C84 84 102 98 102 128 Z" fill="#22222A" />
      <path d="M60 84 L60 128" stroke="#0F0F13" strokeWidth="2" />
      <circle cx="60" cy="118" r="7" fill={YELLOW} opacity="0.9" />
      <path d="M60 111 L55 121 L65 121 Z" fill="#22222A" />
      <rect x="52" y="72" width="16" height="16" rx="4" fill="#3A3A44" />
      <circle cx="60" cy="50" r="38" fill="#3A3A44" />
      <circle cx="60" cy="50" r="38" fill="none" stroke={speaking ? PINK : YELLOW} strokeWidth="2.5" opacity="0.8" />
      <ellipse cx="47" cy="36" rx="10" ry="7" fill="#4A4A56" opacity="0.6" />
      <line x1="60" y1="12" x2="60" y2="2" stroke="#4A4A56" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="2" r="4.5" fill={speaking ? PINK : YELLOW} />
      <circle cx="46" cy="48" r="6" fill={speaking ? PINK : YELLOW} />
      <circle cx="74" cy="48" r="6" fill={speaking ? PINK : YELLOW} />
      <rect x="40" y="62" width="40" height="16" rx="6" fill="#17171B" />
      {mouthBars.map((h, i) => (
        <rect key={i} x={48 + i * 10} y={70 - h} width="5" height={h * 2} rx="2" fill={speaking ? PINK : "#4A4A56"} />
      ))}
    </svg>
  );
}

const JUDGE_SLIDES = ["intro", "timeline", "plaintiff", "defendant", "score"];

function JudgePresentationScreen({ c, onBack, onProceed }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [status, setStatus] = useState("idle");
  const [bars, setBars] = useState([8, 14, 10, 16, 9]);
  const barTimer = useRef(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
      if (barTimer.current) clearInterval(barTimer.current);
    };
  }, []);

  const startWave = () => {
    barTimer.current = setInterval(() => setBars([1, 2, 3, 4, 5].map(() => 6 + Math.round(Math.random() * 22))), 180);
  };
  const stopWave = () => {
    if (barTimer.current) clearInterval(barTimer.current);
    setBars([6, 6, 6, 6, 6]);
  };

  const narrationFor = (slide) => {
    if (slide === "intro") return `${c.title}。ただいまより開廷いたします。`;
    if (slide === "timeline") return "事の経緯です。" + (c.timeline || []).join("。") + "。";
    if (slide === "plaintiff") return `${c.plaintiff}側の主張です。` + (c.plaintiffPoints || [c.plaintiffClaim]).join("。") + "。";
    if (slide === "defendant") return `次に、${c.defendant}側の主張です。` + (c.defendantPoints || [c.defendantClaim]).join("。") + "。";
    return `AIによる分析です。話の一貫性は、${c.plaintiff}側80点、${c.defendant}側45点という結果になりました。`;
  };

  const playSlide = (index) => {
    setSlideIndex(index);
    const text = narrationFor(JUDGE_SLIDES[index]);
    setStatus("speaking");
    startWave();
    const finish = () => {
      stopWave();
      setStatus("done");
      if (index < JUDGE_SLIDES.length - 1) setTimeout(() => playSlide(index + 1), 600);
    };
    if (!supported) {
      setTimeout(finish, 1400 + text.length * 35);
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ja-JP";
    utt.rate = 1.03;
    utt.onend = finish;
    window.speechSynthesis.speak(utt);
  };

  const skip = () => {
    if (supported) window.speechSynthesis.cancel();
    stopWave();
    onProceed();
  };

  const speaking = status === "speaking";
  const slide = JUDGE_SLIDES[slideIndex];
  const isLast = slideIndex === JUDGE_SLIDES.length - 1;
  const statusLabel =
    slideIndex === 0 && status === "idle" ? "タップして開廷する" : !speaking ? (isLast ? "解説が終わりました" : "") : slide === "intro" ? "開廷を宣言中…" : slide === "timeline" ? "経緯を説明中…" : slide === "plaintiff" ? `${c.plaintiff}側を代読中…` : slide === "defendant" ? `${c.defendant}側を代読中…` : "分析結果を発表中…";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 10px" }}>
        <button onClick={onBack} aria-label="戻る" style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: TEXT }}>
          <ChevronLeft size={22} />
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 800, color: TEXT, margin: 0, flex: 1, letterSpacing: "-0.01em" }}>{c.title}</h1>
        <button onClick={skip} style={{ background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer" }}>スキップ</button>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 20px 16px" }}>
        {JUDGE_SLIDES.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: LINE, overflow: "hidden" }}>
            <div style={{ height: "100%", width: i < slideIndex || (i === slideIndex && status === "done") ? "100%" : i === slideIndex && speaking ? "60%" : "0%", background: i <= slideIndex ? (i % 2 === 0 ? PINK : YELLOW) : "transparent", transition: "width 0.4s ease" }} />
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 84, height: 84, margin: "0 auto 8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: speaking ? `0 0 0 7px rgba(255,61,127,0.12)` : "none", transition: "box-shadow 0.2s ease" }}>
            <JudgeAvatar speaking={speaking} size={84} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, height: 22, marginBottom: 4 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ width: 4, height: speaking ? h : 6, borderRadius: 2, background: speaking ? PINK : LINE, transition: "height 0.15s ease" }} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: MUTED, margin: 0, minHeight: 16 }}>{statusLabel}</p>
        </div>
        {slide === "intro" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 22 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,61,127,0.15)", border: `1.5px solid ${PINK}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 16, fontWeight: 800, color: PINK }}>{c.plaintiff[0]}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: PINK, margin: 0 }}>{c.plaintiff}</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 900, color: MUTED, margin: 0 }}>VS</p>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,210,63,0.15)", border: `1.5px solid ${YELLOW}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 16, fontWeight: 800, color: YELLOW }}>{c.defendant[0]}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: YELLOW, margin: 0 }}>{c.defendant}</p>
              </div>
            </div>
            {slideIndex === 0 && status === "idle" && <button onClick={() => playSlide(0)} style={primaryBtn}>開廷する</button>}
          </div>
        )}
        {slide === "timeline" && (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "16px 16px 6px" }}>
            {(c.timeline || []).map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: i % 2 === 0 ? PINK : YELLOW, flexShrink: 0 }} />
                  {i < c.timeline.length - 1 && <div style={{ width: 1.5, flex: 1, background: LINE, marginTop: 2 }} />}
                </div>
                <p style={{ fontSize: 12.5, color: TEXT, margin: "-2px 0 0", lineHeight: 1.5 }}>{t}</p>
              </div>
            ))}
          </div>
        )}
        {(slide === "plaintiff" || slide === "defendant") && (
          <div style={{ background: slide === "plaintiff" ? "rgba(255,61,127,0.1)" : "rgba(255,210,63,0.1)", border: `1px solid ${slide === "plaintiff" ? "rgba(255,61,127,0.3)" : "rgba(255,210,63,0.35)"}`, borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: slide === "plaintiff" ? PINK : YELLOW, margin: "0 0 12px" }}>{slide === "plaintiff" ? c.plaintiff : c.defendant}側の主張ポイント</p>
            {(slide === "plaintiff" ? c.plaintiffPoints || [c.plaintiffClaim] : c.defendantPoints || [c.defendantClaim]).map((pt, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: slide === "plaintiff" ? PINK : YELLOW, color: "#1A1A1F", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <p style={{ fontSize: 12.5, color: TEXT, margin: 0, lineHeight: 1.6 }}>{pt}</p>
              </div>
            ))}
            <div style={{ marginTop: 4, paddingTop: 14, borderTop: `1px dashed ${LINE}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
                <Sparkles size={12} /> {slide === "plaintiff" ? c.defendant : c.plaintiff}が予想していた言い分
              </p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
                「{slide === "plaintiff" ? (c.defendantGuessOfPlaintiff || "（まだ提出されていません）") : (c.plaintiffGuessOfDefendant || "（まだ提出されていません）")}」
              </p>
            </div>
          </div>
        )}
        {slide === "score" && (
          <div>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, margin: "0 0 10px" }}>AIによる主張の一貫性スコア</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60 }}>
                <div style={{ flex: 1, height: "80%", background: PINK, borderRadius: "4px 4px 0 0" }} />
                <div style={{ flex: 1, height: "45%", background: YELLOW, borderRadius: "4px 4px 0 0" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: MUTED }}>
                <span>{c.plaintiff}側 80点</span>
                <span>{c.defendant}側 45点</span>
              </div>
            </div>
            <button onClick={onProceed} style={primaryBtn}>解説を終えて投票へ進む</button>
          </div>
        )}
      </div>
    </div>
  );
}

const GIFT_AMOUNTS = [100, 300, 500];

function CaseDetailScreen({ c, onBack, onVote, onGift, myVote, points, walletPt, onObjection, myName }) {
  const [giftTarget, setGiftTarget] = useState(null);
  const [objecting, setObjecting] = useState(false);
  const [objectionText, setObjectionText] = useState("");
  const [objectionSent, setObjectionSent] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const commentListRef = useRef(null);
  const total = (c.votesA || 0) + (c.votesB || 0);
  const pctA = total ? Math.round((c.votesA / total) * 100) : 50;

  useEffect(() => {
    const commentsRef = query(ref(db, `comments/${c.id}`), limitToLast(40));
    const unsub = onValue(commentsRef, (snap) => {
      const val = snap.val();
      if (!val) {
        setComments([]);
        return;
      }
      const list = Object.values(val).sort((a, b) => (a.ts || 0) - (b.ts || 0));
      setComments(list);
    });
    return () => unsub();
  }, [c.id]);

  useEffect(() => {
    if (commentListRef.current) commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
  }, [comments]);

  const sendComment = () => {
    if (!commentInput.trim()) return;
    push(ref(db, `comments/${c.id}`), { name: myName, text: commentInput.trim(), ts: Date.now() });
    setCommentInput("");
  };

  const sendObjection = () => {
    if (!objectionText.trim() || walletPt < 50) return;
    onObjection(50);
    setObjectionSent(true);
    setObjecting(false);
    setObjectionText("");
  };

  const sendGift = (amount) => {
    onGift(giftTarget, amount);
    setGiftTarget(null);
  };

  return (
    <div>
      <ScreenHeader title={c.title} onBack={onBack} />
      <div style={{ padding: 20 }}>
        <p style={{ fontSize: 12, color: MUTED, display: "flex", alignItems: "center", gap: 5, marginTop: -6, marginBottom: 16 }}>
          <Eye size={13} /> {(c.viewers || 0).toLocaleString()}人が観戦中
        </p>
        <div style={{ position: "relative", display: "flex", gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, background: "rgba(255,61,127,0.1)", border: `1px solid rgba(255,61,127,0.25)`, borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: PINK, margin: "0 0 6px" }}>{c.plaintiff}側</p>
            <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.6 }}>{c.plaintiffClaim}</p>
          </div>
          <div style={{ flex: 1, background: "rgba(255,210,63,0.1)", border: `1px solid rgba(255,210,63,0.3)`, borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: YELLOW, margin: "0 0 6px" }}>{c.defendant}側</p>
            <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.6 }}>{c.defendantClaim}</p>
          </div>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: BG, border: `2px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: TEXT }}>VS</div>
        </div>

        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${LINE}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, margin: 0 }}>ライブコメント（リアルタイム共有）</p>
          </div>
          <div ref={commentListRef} style={{ height: 130, overflowY: "auto", padding: "8px 14px" }}>
            {comments.map((cm, i) => (
              <p key={i} style={{ fontSize: 12, margin: "0 0 8px", lineHeight: 1.4, color: cm.name === myName ? TEXT : "#C9C7D1" }}>
                <span style={{ fontWeight: 700, color: cm.name === myName ? YELLOW : PINK, marginRight: 6 }}>{cm.name}</span>
                {cm.text}
              </p>
            ))}
            {comments.length === 0 && <p style={{ fontSize: 12, color: MUTED }}>まだコメントがありません</p>}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: `1px solid ${LINE}` }}>
            <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment()} placeholder="コメントする…" style={{ ...inputStyle, flex: 1, padding: "8px 12px", fontSize: 13 }} />
            <button onClick={sendComment} style={{ width: 38, height: 38, borderRadius: 8, background: PINK, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label="送信">
              <Send size={15} />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: PINK, fontWeight: 700 }}>{c.plaintiff}側 {pctA}%（{c.votesA || 0}票）</span>
            <span style={{ color: YELLOW, fontWeight: 700 }}>{c.defendant}側 {100 - pctA}%（{c.votesB || 0}票）</span>
          </div>
          <div style={{ height: 9, borderRadius: 5, overflow: "hidden", display: "flex", background: "#0D0D0F" }}>
            <div style={{ width: `${pctA}%`, background: PINK }} />
            <div style={{ width: `${100 - pctA}%`, background: YELLOW }} />
          </div>
        </div>

        {myVote ? (
          <div style={{ textAlign: "center", fontSize: 13, color: "#7CDA9E", background: "rgba(124,218,158,0.12)", borderRadius: 8, padding: 12, marginBottom: 18, fontWeight: 700 }}>
            {myVote === "A" ? c.plaintiff : c.defendant}側に投票しました
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <button onClick={() => onVote("A")} disabled={points <= 0} style={{ ...voteBtn, borderColor: PINK, color: PINK, opacity: points <= 0 ? 0.4 : 1 }}>
              <ThumbsUp size={15} /> {c.plaintiff}側を支持
            </button>
            <button onClick={() => onVote("B")} disabled={points <= 0} style={{ ...voteBtn, borderColor: YELLOW, color: YELLOW, opacity: points <= 0 ? 0.4 : 1 }}>
              <ThumbsUp size={15} /> {c.defendant}側を支持
            </button>
          </div>
        )}
        <p style={{ fontSize: 11, color: MUTED, textAlign: "center", marginBottom: 22 }}>本日の無料投票 残り{points}回</p>

        <div style={{ borderBottom: `1px solid ${LINE}`, paddingBottom: 18, marginBottom: 18 }}>
          {objectionSent ? (
            <div style={{ textAlign: "center", fontSize: 12, color: "#7CDA9E", background: "rgba(124,218,158,0.12)", borderRadius: 8, padding: 10 }}>裁判官に意見が届きました</div>
          ) : objecting ? (
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 8px" }}>矛盾点や気になる点を裁判官に伝える（50pt）</p>
              <textarea value={objectionText} onChange={(e) => setObjectionText(e.target.value)} placeholder="例：矛盾していませんか？" rows={2} style={{ ...inputStyle, resize: "none", fontSize: 13 }} />
              <button onClick={sendObjection} disabled={walletPt < 50 || !objectionText.trim()} style={{ ...primaryBtn, marginTop: 10, padding: "10px", background: walletPt < 50 || !objectionText.trim() ? "#3A3A42" : PINK, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Send size={13} /> 裁判官に送る
              </button>
            </div>
          ) : (
            <button onClick={() => setObjecting(true)} style={{ ...voteBtn, width: "100%", borderColor: LINE, color: TEXT, borderStyle: "dashed" }}>
              <Sparkles size={14} /> 矛盾を裁判官に指摘する（50pt）
            </button>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, margin: "0 0 12px" }}>応援ギフトを送る（保有 {walletPt.toLocaleString()}pt）</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setGiftTarget("A")} style={{ ...giftBtn, borderColor: PINK, color: PINK }}>
              <Gift size={14} /> {c.plaintiff}側 ¥{(c.giftsA || 0).toLocaleString()}
            </button>
            <button onClick={() => setGiftTarget("B")} style={{ ...giftBtn, borderColor: YELLOW, color: YELLOW }}>
              <Gift size={14} /> {c.defendant}側 ¥{(c.giftsB || 0).toLocaleString()}
            </button>
          </div>
          {giftTarget && (
            <div style={{ marginTop: 12, background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 10px" }}>{giftTarget === "A" ? c.plaintiff : c.defendant}側にギフトを送る</p>
              <div style={{ display: "flex", gap: 8 }}>
                {GIFT_AMOUNTS.map((amt) => (
                  <button key={amt} onClick={() => sendGift(amt)} disabled={walletPt < amt} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${LINE}`, background: walletPt < amt ? "#232328" : BG, color: walletPt < amt ? "#57555F" : TEXT, fontSize: 13, fontWeight: 700, cursor: walletPt < amt ? "not-allowed" : "pointer" }}>
                    {amt}pt
                  </button>
                ))}
              </div>
              {walletPt < GIFT_AMOUNTS[0] && <p style={{ fontSize: 11, color: PINK, marginTop: 8 }}>ポイント残高が不足しています</p>}
            </div>
          )}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function VerdictScreen({ c, onBack, walletPt, onRetrial }) {
  const total = (c.votesA || 0) + (c.votesB || 0);
  const pctA = total ? Math.round((c.votesA / total) * 100) : 50;
  const winner = pctA >= 50 ? c.plaintiff : c.defendant;
  const [requested, setRequested] = useState(false);
  const requestRetrial = () => {
    if (walletPt < 500) return;
    onRetrial(500);
    setRequested(true);
  };
  return (
    <div>
      <ScreenHeader title="判決" onBack={onBack} />
      <div style={{ padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Gavel size={28} color={YELLOW} />
          <p style={{ fontSize: 19, color: TEXT, margin: "10px 0 4px", fontWeight: 900 }}>{winner}側の勝訴</p>
          <p style={{ fontSize: 12, color: MUTED }}>投票結果 {pctA}% — {100 - pctA}%</p>
        </div>
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: YELLOW, margin: "0 0 8px" }}>AIによる所見</p>
          <p style={{ fontSize: 13.5, color: TEXT, lineHeight: 1.7, margin: 0 }}>{c.aiVerdict}</p>
        </div>
        {requested ? (
          <div style={{ textAlign: "center", fontSize: 12, color: "#7CDA9E", background: "rgba(124,218,158,0.12)", borderRadius: 8, padding: 12, marginTop: 16 }}>再審請求を受け付けました</div>
        ) : (
          <button onClick={requestRetrial} disabled={walletPt < 500} style={{ width: "100%", marginTop: 16, padding: "13px", borderRadius: 8, border: `1.5px solid ${walletPt < 500 ? LINE : YELLOW}`, background: "transparent", color: walletPt < 500 ? MUTED : YELLOW, fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: walletPt < 500 ? "not-allowed" : "pointer" }}>
            <RotateCcw size={14} /> 納得いかない場合、再審請求する（500pt）
          </button>
        )}
        <button onClick={onBack} style={{ ...primaryBtn, marginTop: 12 }}>ホームに戻る</button>
      </div>
    </div>
  );
}

function NamePrompt({ onSubmit }) {
  const [name, setName] = useState("");
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <Gavel size={28} color={YELLOW} />
      <p style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "12px 0 6px" }}>裁判してみた</p>
      <p style={{ color: MUTED, fontSize: 12, margin: "0 0 20px" }}>コメントや投票で表示する名前を入力してください</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例：たろう"
        style={inputStyle}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onSubmit(name.trim())}
      />
      <button onClick={() => name.trim() && onSubmit(name.trim())} style={{ ...primaryBtn, marginTop: 16 }}>はじめる</button>
    </div>
  );
}

const labelStyle = { fontSize: 13, color: MUTED, display: "block", marginBottom: 6, fontWeight: 600 };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "11px 13px", fontSize: 14, border: `1px solid ${LINE}`, borderRadius: 8, background: CARD, color: TEXT, fontFamily: "inherit" };
const primaryBtn = { width: "100%", padding: "13px", background: PINK, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: "pointer" };
const giftBtn = { flex: 1, padding: "10px", background: CARD, border: "1.5px solid", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" };
const voteBtn = { flex: 1, padding: "12px", background: CARD, border: "1.5px solid", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" };

export default function CourtApp() {
  const [myName, setMyName] = useState(null);
  const [screen, setScreen] = useState("home");
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [cases, setCases] = useState([]);
  const [connected, setConnected] = useState(false);
  const [upcoming, setUpcoming] = useState(upcomingCasesSeed);
  const [votes, setVotes] = useState({});
  const [freeVotesLeft, setFreeVotesLeft] = useState(3);
  const [walletPt, setWalletPt] = useState(800);
  const [draftCase, setDraftCase] = useState(null);

  useEffect(() => {
    const storedName = loadLocal("saiban-my-name", null);
    if (storedName) setMyName(storedName);
    setWalletPt(loadLocal("saiban-wallet", 800));
    setVotes(loadLocal("saiban-votes", {}));
    setFreeVotesLeft(loadLocal("saiban-free-votes", 3));
  }, []);

  useEffect(() => {
    const casesRef = ref(db, "cases");
    const unsub = onValue(casesRef, (snap) => {
      const val = snap.val();
      if (val) {
        setCases(Object.values(val));
        setConnected(true);
      } else {
        set(casesRef, seedCases).then(() => setConnected(true));
      }
    });
    return () => unsub();
  }, []);

  const activeCase = cases.find((c) => c.id === activeCaseId) || null;

  const openCase = (c) => {
    setActiveCaseId(c.id);
    setScreen(c.status === "verdict" ? "verdict" : "judge");
  };

  const castVote = (side) => {
    if (freeVotesLeft <= 0 || !activeCase) return;
    const nextVotes = { ...votes, [activeCase.id]: side };
    setVotes(nextVotes);
    saveLocal("saiban-votes", nextVotes);
    const nextFree = freeVotesLeft - 1;
    setFreeVotesLeft(nextFree);
    saveLocal("saiban-free-votes", nextFree);
    update(ref(db, `cases/${activeCase.id}`), {
      votesA: (activeCase.votesA || 0) + (side === "A" ? 1 : 0),
      votesB: (activeCase.votesB || 0) + (side === "B" ? 1 : 0),
    });
  };

  const sendGift = (side, amount) => {
    if (walletPt < amount || !activeCase) return;
    const nextWallet = walletPt - amount;
    setWalletPt(nextWallet);
    saveLocal("saiban-wallet", nextWallet);
    update(ref(db, `cases/${activeCase.id}`), {
      giftsA: (activeCase.giftsA || 0) + (side === "A" ? amount : 0),
      giftsB: (activeCase.giftsB || 0) + (side === "B" ? amount : 0),
    });
  };

  const spendPoints = (amount) => {
    setWalletPt((p) => {
      const next = Math.max(0, p - amount);
      saveLocal("saiban-wallet", next);
      return next;
    });
  };

  const toggleNotify = (id) => {
    setUpcoming((prev) => prev.map((u) => (u.id === id ? { ...u, notify: !u.notify } : u)));
  };

  const startNewCase = (data) => {
    setDraftCase(data);
    setScreen("evidence");
  };

  const finalizeNewCase = (evidence) => {
    if (!draftCase) {
      setScreen("home");
      return;
    }
    const id = Date.now();
    const newCase = {
      id,
      title: draftCase.title,
      hot: false,
      status: "voting",
      plaintiff: myName,
      defendant: draftCase.invitee || "相手",
      votesA: 0,
      votesB: 0,
      giftsA: 0,
      giftsB: 0,
      viewers: Math.floor(2 + Math.random() * 8),
      plaintiffClaim: evidence.claim,
      defendantClaim: "（相手の提出待ちです。締切が揃うと表示されます）",
      timeline: [`議題投稿：${draftCase.detail}`, "相手を招待", "証拠・主張の提出中"],
      plaintiffPoints: [evidence.claim],
      defendantPoints: [],
      plaintiffGuessOfDefendant: evidence.guess || "",
      defendantGuessOfPlaintiff: "",
      aiVerdict: null,
    };
    set(ref(db, `cases/${id}`), newCase);
    setDraftCase(null);
    setScreen("home");
  };

  const handleNameSubmit = (name) => {
    setMyName(name);
    saveLocal("saiban-my-name", name);
  };

  return (
    <div style={{ maxWidth: 400, width: "100%", margin: "0 auto", background: BG, height: 640, position: "relative", fontFamily: "system-ui, -apple-system, sans-serif", borderRadius: 16, overflow: "hidden", border: `1px solid ${LINE}` }}>
      {!myName ? (
        <NamePrompt onSubmit={handleNameSubmit} />
      ) : (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 66, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {screen === "home" && <HomeScreen cases={cases} upcoming={upcoming} onOpen={openCase} onNew={() => setScreen("newCase")} onToggleNotify={toggleNotify} connected={connected} />}
            {screen === "newCase" && <NewCaseScreen onBack={() => setScreen("home")} onSubmit={startNewCase} />}
            {screen === "evidence" && <EvidenceScreen onBack={() => setScreen("newCase")} onSubmit={finalizeNewCase} />}
            {screen === "judge" && activeCase && <JudgePresentationScreen c={activeCase} onBack={() => setScreen("home")} onProceed={() => setScreen("detail")} />}
            {screen === "detail" && activeCase && (
              <CaseDetailScreen c={activeCase} onBack={() => setScreen("home")} onVote={castVote} onGift={sendGift} onObjection={spendPoints} myVote={votes[activeCase.id]} points={freeVotesLeft} walletPt={walletPt} myName={myName} />
            )}
            {screen === "verdict" && activeCase && <VerdictScreen c={activeCase} onBack={() => setScreen("home")} walletPt={walletPt} onRetrial={spendPoints} />}
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", borderTop: `1px solid ${LINE}`, background: CARD, padding: "10px 0 14px" }}>
            <button onClick={() => setScreen("home")} style={tabStyle(screen === "home")}>
              <Home size={19} />
              <span style={{ fontSize: 11 }}>ホーム</span>
            </button>
            <button onClick={() => setScreen("newCase")} style={tabStyle(screen === "newCase" || screen === "evidence")}>
              <Gavel size={19} />
              <span style={{ fontSize: 11 }}>開廷する</span>
            </button>
            <button style={tabStyle(false)}>
              <User size={19} />
              <span style={{ fontSize: 11 }}>マイページ</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function tabStyle(active) {
  return { flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? YELLOW : MUTED, cursor: "pointer" };
}
