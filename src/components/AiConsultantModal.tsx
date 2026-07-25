import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2, Lightbulb } from 'lucide-react';

interface AiConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AiConsultantModal: React.FC<AiConsultantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Γεια σας! Είμαι ο Ψηφιακός Σύμβουλος ΤΕΕ-ΚΕΝΑΚ & Ενεργειακών Επιθεωρήσεων. Μπορείτε να με ρωτήσετε για οποιοδήποτε ειδικό σενάριο, τυπικές τιμές U/g/η_g, παραδοχές ΤΟΤΕΕ ή επίλυση σφαλμάτων στο λογισμικό. Πώς μπορώ να σας βοηθήσω;',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Πώς καταχωρώ διατηρητέο κτίριο με πέτρινους τοίχους 60cm;',
    'Τι U βάζω σε αμόνωτη ξύλινη στέγη του 1965;',
    'Πώς υπολογίζεται ο μειωμένος η_g1 σε λέβητα αερίου;',
    'Πώς δηλώνεται ηλιακός με μπόιλερ τριπλής ενέργειας;',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          context: 'Εφαρμογή ΤΕΕ-ΚΕΝΑΚ, Έκδοση ΠΕΑ, ΤΟΤΕΕ 20701-1..5, ΚΕΝΑΚ',
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Σφάλμα επικοινωνίας με τον server.');
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: resData.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '⚠️ Σφάλμα: ' + (err.message || 'Αποτυχία λήψης απάντησης από το Gemini API.'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-2xl h-[650px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>AI Σύμβουλος ΤΕΕ-ΚΕΝΑΚ & ΚΕΝΑΚ</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-1.5 py-0.5 rounded">Gemini 2.5</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ειδικός στις ΤΟΤΕΕ, τους υπολογισμούς U/g/η_g & το λογισμικό ΤΕΕ-ΚΕΝΑΚ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3.5 rounded-xl text-xs leading-relaxed space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none font-sans'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className="text-[10px] text-slate-400 text-right opacity-80 font-mono">{msg.time}</div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>Ανάλυση νομοθεσίας & υπολογισμός απάντησης...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sample Prompts */}
        {messages.length < 3 && (
          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Προτεινόμενες ερωτήσεις:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sp)}
                  type="button"
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors cursor-pointer text-left"
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Input Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
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
              placeholder="Γράψτε την ερώτησή σας για το ΤΕΕ-ΚΕΝΑΚ..."
              className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
