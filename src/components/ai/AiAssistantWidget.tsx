import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw } from 'lucide-react';
import { ERPState } from '../../types';
import { calculateTotalBusinessBalance, calculateMonthlyStats, formatETB } from '../../lib/store';
import { triggerHaptic } from '../../lib/haptics';

interface AiAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  state: ERPState;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiAssistantWidget: React.FC<AiAssistantWidgetProps> = ({
  isOpen,
  onClose,
  state
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Selam ${state.currentUser.name.split(' ')[0]}! I am your PlusZone AI Finance Assistant. How can I help analyze your Ethiopian business ledger today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'What is my net profit margin this month?',
    'Analyze my cashflow and Equb obligations.',
    'How can I optimize Telebirr and CBE merchant transfers?',
    'Provide Ethiopian business tax compliance tips.'
  ];

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    triggerHaptic('light');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    // Calculate current ledger summary context to send to backend API
    const totalBalance = calculateTotalBusinessBalance(state.wallets, state.transactions, state.transfers);
    const { income, expense, profit } = calculateMonthlyStats(state.transactions);

    const ledgerSummary = {
      totalBalance: formatETB(totalBalance),
      monthlyIncome: formatETB(income),
      monthlyExpense: formatETB(expense),
      monthlyProfit: formatETB(profit),
      activeEqubs: state.equbs.filter(e => e.status === 'ACTIVE').length.toString(),
      activeLoans: state.loans.filter(l => l.status === 'ACTIVE').length.toString(),
      healthScore: '92%'
    };

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          ledgerSummary
        })
      });

      const data = await res.json();
      const replyText = data.reply || data.error || 'No response returned.';

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'ai',
          text: `[Offline Mode] Ledger Analysis:\n• Total Liquid Cash: ${ledgerSummary.totalBalance}\n• Monthly Net Profit: ${ledgerSummary.monthlyProfit}\n• Recommendation: Keep CBE reserve above ETB 200,000 for upcoming wholesale inventory batch.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-[#131926] border border-[#00D4AA]/30 w-full max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col h-[85vh] sm:h-[600px] text-[#F0F4FF] shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Widget Header */}
        <div className="bg-[#1C2333] px-4 py-3 border-b border-[#1E2D40] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00D4AA] to-[#3B82F6] flex items-center justify-center text-[#0A0E1A] shadow-md">
              <Sparkles className="w-4 h-4 text-[#0A0E1A]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                PlusZone AI Finance Assistant
                <span className="text-[9px] bg-[#00D4AA]/20 text-[#00D4AA] px-1.5 py-0.2 rounded font-mono">GEMINI</span>
              </h3>
              <p className="text-[10px] text-[#8899BB]">Real-time Ethiopian Business Finance Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#131926] text-[#8899BB] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0A0E1A]">
          {messages.map((m) => {
            const isAi = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                    isAi ? 'bg-[#00D4AA]/20 text-[#00D4AA]' : 'bg-[#3B82F6]/20 text-[#3B82F6]'
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                    isAi
                      ? 'bg-[#131926] border border-[#1E2D40] text-[#F0F4FF] rounded-tl-none'
                      : 'bg-[#00D4AA] text-[#0A0E1A] font-medium rounded-tr-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <p className={`text-[9px] text-right font-mono ${isAi ? 'text-[#8899BB]' : 'text-[#0A0E1A]/70'}`}>
                    {m.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#00D4AA] bg-[#131926] p-3 rounded-2xl w-max border border-[#1E2D40]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing ledger & generating financial insights...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        {messages.length <= 2 && (
          <div className="p-2 bg-[#131926] border-t border-[#1E2D40] flex flex-wrap gap-1.5 overflow-x-auto">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-[10px] bg-[#1C2333] hover:bg-[#00D4AA]/20 hover:text-[#00D4AA] text-[#8899BB] border border-[#1E2D40] px-2.5 py-1 rounded-full text-left transition-colors cursor-pointer shrink-0"
              >
                💡 {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[#131926] border-t border-[#1E2D40] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask AI finance advice (e.g. Telebirr, CBE, Equb)..."
            className="flex-1 bg-[#1C2333] border border-[#1E2D40] focus:border-[#00D4AA] rounded-xl px-3 py-2.5 text-xs text-white outline-none"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0A0E1A] flex items-center justify-center font-bold cursor-pointer disabled:opacity-40 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
