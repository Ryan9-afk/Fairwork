"use client";

import React, { useState } from "react";
import { Send, Sparkles, X, ShieldCheck, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: string[];
  swahiliText?: string;
}

const INITIAL_MESSAGES: Record<"en" | "sw", Message[]> = {
  en: [
    {
      id: "1",
      sender: "assistant",
      text: "Jambo! I am your Fairwork Legal Rights Assistant. I can explain your statutory rights under Kenyan labour law, including the Employment Act 2007 and WIBA 2007.",
      citations: ["Employment Act 2007", "Regulation of Wages Order"],
    },
  ],
  sw: [
    {
      id: "1",
      sender: "assistant",
      text: "Hujambo! Mimi ni Msaidizi wako wa Kisheria wa Haki za Kazi. Ninaweza kukueleza haki zako chini ya sheria ya ajira ya Kenya, ikiwemo Sheria ya Ajira 2007 na Sheria ya Fidia ya Majeraha Kazini (WIBA 2007).",
      citations: ["Sheria ya Ajira 2007", "Amri ya Mishahara"],
    },
  ],
};

const KNOWLEDGE_BASE = [
  {
    keywords: ["injury", "hurt", "accident", "hospital", "clinic", "jeraha", "kuumia", "hospitali"],
    replyEn:
      "Under the Work Injury Benefits Act (WIBA) 2007 §§ 10 & 16, your employer is strictly liable to provide first aid, pay for necessary medical treatment, and report the accident to the Director of Occupational Safety within 21 days. Do not sign away your claim. Keep all medical receipts and witness contacts in your Fairwork Pulse vault.",
    replySw:
      "Chini ya Sheria ya Fidia ya Majeraha Kazini (WIBA) 2007 §§ 10 & 16, mwajiri anawajibika kisheria kugharamia matibabu yako na kutoa taarifa ya ajali kwa afisi ya kazi ndani ya siku 21. Usisaini hati ya kufuta dai lako bila kushauriana na afisa wa kazi. Hifadhi stakabadhi zote za hospitali na majina ya mashahidi kwenye jalada hili.",
    citations: ["WIBA 2007 § 10 (Employer Liability)", "WIBA 2007 § 16 (Reporting of Accidents)"],
  },
  {
    keywords: ["withheld", "deduct", "unpaid", "delay", "shortfall", "mshahara", "kuzuiwa", "pungufu", "makato"],
    replyEn:
      "Under Employment Act 2007 §§ 17–19, wages must be paid in full in legal tender. Employers cannot make arbitrary deductions for alleged damages, breakages, or delays without formal agreement and labour office sanction. Save your shift records and M-Pesa statements as contemporaneous proof for conciliation.",
    replySw:
      "Chini ya Sheria ya Ajira 2007 §§ 17–19, mshahara lazima ulipwe kamili kwa fedha halali. Mwajiri haruhusiwi kukata mshahara wako kienyeji kwa madai ya uharibifu bila idhini ya kisheria. Hifadhi ujumbe wa M-Pesa na rekodi za zamu hapa ili uwe na ushahidi imara wa kuwasilisha kwa Afisa wa Kazi.",
    citations: ["Employment Act 2007 § 17 (Payment of Wages)", "Employment Act 2007 § 19 (Authorized Deductions)"],
  },
  {
    keywords: ["maternity", "pregnant", "baby", "leave", "uzazi", "ujauzito", "mimba", "likizo"],
    replyEn:
      "Under Employment Act 2007 § 29, a female employee is entitled to 3 months fully paid maternity leave without sacrificing annual leave. Section 46 explicitly states pregnancy or maternity leave is an unlawful reason for dismissal or disciplinary penalty.",
    replySw:
      "Chini ya Sheria ya Ajira 2007 § 29, mfanyakazi wa kike ana haki ya likizo ya uzazi ya miezi 3 yenye malipo kamili. Kifungu cha 46 kinapiga marufuku kumfuta kazi mfanyakazi kwa sababu ya ujauzito au kwenda likizo ya uzazi.",
    citations: ["Employment Act 2007 § 29 (Maternity Leave)", "Employment Act 2007 § 46 (Unfair Dismissal)"],
  },
  {
    keywords: ["overtime", "hours", "sunday", "weekend", "holiday", "saa", "jumapili", "sikukuu", "ziada"],
    replyEn:
      "Under the Regulation of Wages (General) Order Rules 5–6, work beyond standard daily allotment is payable at 1.5× your normal hourly rate on regular working days, and 2.0× (double time) if you are required to work on your normal rest day (Sunday) or a gazetted public holiday.",
    replySw:
      "Chini ya Amri ya Mishahara (Kanuni za 5–6), kufanya kazi zaidi ya masaa 8 ya kawaida hulipwa kwa kiwango cha 1.5×, na ukifanya kazi siku ya mapumziko (kama Jumapili) au Sikukuu ya Kitaifa, unastahili kulipwa mara mbili (2.0×).",
    citations: ["Regulation of Wages (General) Order Rules 5–6", "Employment Act 2007 § 27"],
  },
];

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "sw";
}

export function AIAssistantDrawer({ isOpen, onClose, lang }: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES[lang]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  function findAnswer(query: string): { reply: string; citations: string[] } {
    const q = query.toLowerCase();
    for (const item of KNOWLEDGE_BASE) {
      if (item.keywords.some((k) => q.includes(k))) {
        return {
          reply: lang === "sw" ? item.replySw : item.replyEn,
          citations: item.citations,
        };
      }
    }

    return {
      reply:
        lang === "sw"
          ? "Kuhusu swala hili, Sheria ya Ajira ya Kenya (2007) inasisitiza kwamba mkataba wa kazi (hata wa mdomo) unalindwa kisheria. Unaweza kutumia 'Haki Dossier' yako kuwasilisha malalamishi rasmi kwa Afisa wa Kazi wa Kaunti Ndogo (Sub-County Labour Officer) au chama cha wafanyakazi (COTU-K)."
          : "Under Kenyan Labour Law, even oral or casual contracts are legally protected contracts of service under Employment Act § 8. You can export your Haki Dossier to present a structured, contemporaneous evidence trail to a Sub-County Labour Officer or union advocate for formal conciliation.",
      citations: ["Employment Act 2007 § 8", "Employment Act 2007 § 87"],
    };
  }

  async function handleSend(textToSend?: string) {
    const userText = (textToSend || input).trim();
    if (!userText) return;

    const nextId = `msg_${messages.length + 1}`;
    const userMsg: Message = {
      id: nextId,
      sender: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, lang }),
      });

      if (res.ok) {
        const data = (await res.json()) as { reply?: string; citations?: string[] };
        if (data.reply) {
          const assistantMsg: Message = {
            id: `msg_asst_${messages.length + 2}`,
            sender: "assistant",
            text: data.reply,
            citations: data.citations || ["Employment Act 2007", "WIBA 2007"],
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch {
      // Network or API failure: smoothly use offline knowledge base
    }

    // Offline / Fallback response
    const match = findAnswer(userText);
    const assistantMsg: Message = {
      id: `msg_asst_${messages.length + 2}`,
      sender: "assistant",
      text: match.reply,
      citations: match.citations,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  }

  const promptSuggestions =
    lang === "sw"
      ? [
          "Mwajiri amekata mshahara wangu",
          "Nimeumia kazini ujenzi",
          "Saa za ziada zinalipwa aje?",
          "Haki za likizo ya uzazi",
        ]
      : [
          "Foreman withheld my agreed pay",
          "Injured on a construction site",
          "How is Sunday overtime calculated?",
          "Can they dismiss me if pregnant?",
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col h-[85vh] max-h-[700px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                {lang === "sw" ? "Msaidizi wa Haki za Kazi" : "AI Legal Rights Assistant"}
              </h3>
              <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                <Scale size={12} className="text-blue-600" />
                <span>Employment Act 2007 & WIBA</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
          >
            <X size={19} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white font-medium rounded-br-none shadow-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm"
                }`}
              >
                {m.text}
              </div>

              {m.citations && (
                <div className="flex flex-wrap gap-1 mt-1.5 max-w-[85%]">
                  {m.citations.map((c, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-blue-100"
                    >
                      <ShieldCheck size={11} /> {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 px-3 py-2 rounded-2xl w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-150" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-300" />
            </div>
          )}
        </div>

        {/* Prompt Suggestions */}
        <div className="px-4 py-2 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto scrollbar-none">
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-gray-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "sw" ? "Uliza swali kuhusu haki zako..." : "Ask about your labour rights..."}
              className="flex-1 h-11 px-4 text-xs rounded-full bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
            <Button
              type="submit"
              variant="iosPrimary"
              size="iosIcon"
              disabled={!input.trim()}
              className="h-11 w-11 rounded-full shrink-0"
            >
              <Send size={16} />
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
            <ShieldCheck size={11} />
            <span>Statutory information grounded in Kenya Law. Not formal legal representation.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
