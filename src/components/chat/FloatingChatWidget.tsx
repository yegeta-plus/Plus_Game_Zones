import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Hash, Minimize2, Maximize2, Users, DollarSign } from 'lucide-react';
import { ERPState, ChatMessage, ChatChannel } from '../../types';
import { triggerHaptic } from '../../lib/haptics';

interface FloatingChatWidgetProps {
  state: ERPState;
  onSendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  onNavigateToFullChat?: () => void;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  state,
  onSendMessage,
  onNavigateToFullChat
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [inputText, setInputText] = useState('');

  const currentUser = state.currentUser;
  const chatMessages = state.chatMessages || [];
  const chatChannels = state.chatChannels || [];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [lastSeenTime, setLastSeenTime] = useState<number>(() => Date.now());

  // Unread messages count (messages from other users since last seen)
  const unreadCount = isOpen
    ? 0
    : chatMessages.filter(m => m.senderId !== currentUser.id && new Date(m.timestamp).getTime() > lastSeenTime).length;

  useEffect(() => {
    if (isOpen) {
      setLastSeenTime(Date.now());
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeChannelId, chatMessages.length]);

  const activeChannel = chatChannels.find(c => c.id === activeChannelId) || chatChannels[0] || {
    id: 'general',
    name: 'General Lounge'
  };

  const channelMessages = chatMessages.filter(m => m.channelId === activeChannelId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    triggerHaptic('medium');
    onSendMessage({
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      text: inputText.trim()
    });

    setInputText('');
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* FLOATING ACTION BUTTON */}
      {!isOpen && (
        <button
          onClick={() => {
            triggerHaptic('heavy');
            setIsOpen(true);
          }}
          className="relative group p-3.5 rounded-full bg-gradient-to-tr from-[#00D4AA] to-[#3B82F6] text-slate-950 shadow-2xl shadow-[#00D4AA]/40 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-[#0A0E1A]"
          title="Open Team Live Chat"
        >
          <MessageSquare className="w-6 h-6 stroke-[2.5]" />

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono font-extrabold text-[10px] flex items-center justify-center border-2 border-white dark:border-[#0A0E1A] animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* FLOATING CHAT WINDOW POPOVER */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* HEADER */}
          <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold truncate flex items-center gap-1.5">
                  {activeChannel.name}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <p className="text-[10px] text-slate-400 truncate">Team Live Chat</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onNavigateToFullChat && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsOpen(false);
                    onNavigateToFullChat();
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Expand Full Chat"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHANNEL PILLS STRIP */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#1C2333] border-b border-slate-200 dark:border-[#1E2D40] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {chatChannels.map(chan => (
              <button
                key={chan.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveChannelId(chan.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  activeChannelId === chan.id
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                #{chan.name}
              </button>
            ))}
          </div>

          {/* MESSAGES FEED */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-[#0D121F] text-xs">
            {channelMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-[11px]">
                No messages yet in #{activeChannel.name}
              </div>
            ) : (
              channelMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id;

                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-300 dark:border-slate-700">
                      {msg.senderName.charAt(0)}
                    </div>

                    <div className={`max-w-[85%] space-y-0.5 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                      <div className={`text-[9px] text-slate-400 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className={`p-2.5 rounded-xl text-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white dark:bg-[#00D4AA] dark:text-slate-950 font-medium rounded-tr-none'
                          : 'bg-white dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}>
                        <p className="break-words">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSend} className="p-2.5 bg-white dark:bg-[#131926] border-t border-slate-200 dark:border-[#1E2D40] flex items-center gap-2">
            <input
              type="text"
              placeholder={`Send message to #${activeChannel.name}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
