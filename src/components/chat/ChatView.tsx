import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Hash,
  Users,
  Search,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Building,
  CheckCheck,
  X,
  FileText,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Wallet,
  CornerDownRight,
  Sparkles,
  Pin,
  Flame,
  UserCheck,
  Check,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { ERPState, ChatMessage, ChatChannel, UserProfile, Transaction, Wallet as WalletType, Equb } from '../../types';
import { triggerHaptic } from '../../lib/haptics';

interface ChatViewProps {
  state: ERPState;
  onSendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onCreateChannel: (channel: Omit<ChatChannel, 'id' | 'createdDate'>) => void;
  onNavigateTab?: (tab: any) => void;
  onApproveRequest?: (reqId: string, note?: string) => void;
  onRejectRequest?: (reqId: string, note?: string) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🚀', '💡', '💰', '✅', '🔥', '🙏', '👏', '🎯'];

export const ChatView: React.FC<ChatViewProps> = ({
  state,
  onSendMessage,
  onAddReaction,
  onCreateChannel,
  onApproveRequest,
  onRejectRequest
}) => {
  const currentUser = state.currentUser;
  const chatMessages = state.chatMessages || [];
  const chatChannels = state.chatChannels || [];
  const users = state.users || [];

  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Attachment state
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: 'IMAGE' | 'DOCUMENT' } | null>(null);

  // Financial Reference picker modal
  const [showRefPicker, setShowRefPicker] = useState(false);
  const [selectedRef, setSelectedRef] = useState<ChatMessage['reference'] | undefined>(undefined);

  // Create Channel Modal
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when channel or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelId, chatMessages.length]);

  // Derive active channel or DM recipient
  const isDirectMessage = activeChannelId.startsWith('dm:');
  let dmOtherUser: UserProfile | undefined = undefined;

  if (isDirectMessage) {
    const parts = activeChannelId.replace('dm:', '').split('_');
    const otherUserId = parts.find(id => id !== currentUser.id) || parts[0];
    dmOtherUser = users.find(u => u.id === otherUserId);
  }

  const activeChannel = isDirectMessage
    ? {
        id: activeChannelId,
        name: dmOtherUser ? dmOtherUser.name : 'Direct Message',
        type: 'DIRECT' as const,
        description: dmOtherUser ? `${dmOtherUser.role} • ${dmOtherUser.branch}` : '1-on-1 Chat'
      }
    : chatChannels.find(c => c.id === activeChannelId) || chatChannels[0] || {
        id: 'general',
        name: 'General Lounge',
        type: 'PUBLIC' as const,
        description: 'Company-wide chat'
      };

  // Filter messages for active channel
  const filteredMessages = chatMessages.filter(m => {
    if (m.channelId !== activeChannelId) return false;
    if (messageSearchQuery.trim()) {
      return m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(messageSearchQuery.toLowerCase());
    }
    return true;
  });

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const isImage = file.type.startsWith('image/');
      setAttachedFile({
        url: reader.result as string,
        name: file.name,
        type: isImage ? 'IMAGE' : 'DOCUMENT'
      });
      triggerHaptic('light');
    };
    reader.readAsDataURL(file);
  };

  // Handle Submit
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile && !selectedRef) return;

    triggerHaptic('medium');

    onSendMessage({
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      text: inputText.trim(),
      fileUrl: attachedFile?.url,
      fileName: attachedFile?.name,
      fileType: attachedFile?.type,
      replyToId: replyingTo?.id,
      replyToText: replyingTo?.text.substring(0, 60),
      replyToSenderName: replyingTo?.senderName,
      reference: selectedRef,
      isAnnouncement: isAnnouncement && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin')
    });

    setInputText('');
    setAttachedFile(null);
    setSelectedRef(undefined);
    setReplyingTo(null);
    setIsAnnouncement(false);
    setShowEmojiPicker(false);
  };

  // Start DM
  const handleStartDM = (targetUser: UserProfile) => {
    triggerHaptic('light');
    const sortedIds = [currentUser.id, targetUser.id].sort();
    const dmId = `dm:${sortedIds.join('_')}`;
    setActiveChannelId(dmId);
  };

  // Create Channel Handler
  const handleCreateChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    triggerHaptic('medium');
    const cleanId = newChannelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    onCreateChannel({
      name: newChannelName.trim(),
      type: 'PUBLIC',
      description: newChannelDesc.trim() || 'Custom team chat channel'
    });

    setActiveChannelId(cleanId);
    setNewChannelName('');
    setNewChannelDesc('');
    setShowCreateChannelModal(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* HEADER TITLE BANNER */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A0E1A] rounded-2xl p-5 border border-slate-700/50 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
            <MessageSquare className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              Team Live Chat & Communication
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                REAL-TIME
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Collaborate across cashiers, managers & admins. Share financial references instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowCreateChannelModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Channel</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN CHAT LAYOUT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start min-h-[600px]">
        {/* SIDEBAR: CHANNELS & DIRECT MESSAGES */}
        <div className="lg:col-span-1 bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-4 shadow-sm space-y-4">
          {/* Search Channels & Users */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats or team..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* PUBLIC CHANNELS SECTION */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-[#8899BB] flex items-center justify-between">
              <span>Public Channels</span>
              <span className="text-[10px] font-mono">{chatChannels.length}</span>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {chatChannels
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(channel => {
                  const isActive = activeChannelId === channel.id;
                  const channelMsgCount = chatMessages.filter(m => m.channelId === channel.id).length;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveChannelId(channel.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 dark:bg-[#00D4AA]/15 border border-emerald-500/30 text-emerald-600 dark:text-[#00D4AA] font-bold shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-[#1C2333] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-500 dark:text-[#00D4AA]' : 'text-slate-400'}`} />
                        <span className="text-xs truncate">{channel.name}</span>
                      </div>

                      {channelMsgCount > 0 && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-[#00D4AA]'
                            : 'bg-slate-200 dark:bg-[#1C2333] text-slate-500 dark:text-slate-400'
                        }`}>
                          {channelMsgCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* DIRECT MESSAGES (1-ON-1 TEAM MEMBERS) */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-[#1E2D40]">
            <div className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-[#8899BB] flex items-center justify-between">
              <span>Direct Messages</span>
              <span className="text-[10px] font-mono">{users.length - 1}</span>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {users
                .filter(u => u.id !== currentUser.id)
                .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(user => {
                  const sortedIds = [currentUser.id, user.id].sort();
                  const dmChannelId = `dm:${sortedIds.join('_')}`;
                  const isActive = activeChannelId === dmChannelId;
                  const unreadCount = chatMessages.filter(m => m.channelId === dmChannelId && m.senderId !== currentUser.id).length;

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleStartDM(user)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 dark:bg-[#00D4AA]/15 border border-emerald-500/30 text-emerald-600 dark:text-[#00D4AA] font-bold shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-[#1C2333] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar with online indicator */}
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                            {user.name.charAt(0)}
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#131926] absolute -bottom-0.5 -right-0.5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.role} • {user.branch}</p>
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* MAIN CHAT CONVERSATION AREA */}
        <div className="lg:col-span-3 bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl flex flex-col h-[620px] shadow-sm overflow-hidden">
          {/* CHAT HEADER */}
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#1E2D40] bg-slate-50/50 dark:bg-[#131926] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-[#00D4AA]/20 text-emerald-600 dark:text-[#00D4AA] flex items-center justify-center font-bold">
                {isDirectMessage ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  {activeChannel.name}
                  {isDirectMessage && dmOtherUser && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {dmOtherUser.role}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#8899BB] truncate max-w-md">
                  {activeChannel.description}
                </p>
              </div>
            </div>

            {/* Chat search & controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isSearchOpen ? 'bg-emerald-500/20 text-emerald-600 dark:text-[#00D4AA]' : 'hover:bg-slate-100 dark:hover:bg-[#1C2333] text-slate-500'
                }`}
                title="Search messages in channel"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* IN-CHANNEL MESSAGE SEARCH BAR (IF TOGGLED) */}
          {isSearchOpen && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-[#1C2333] border-b border-slate-200 dark:border-[#1E2D40] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Filter messages in this channel..."
                value={messageSearchQuery}
                onChange={e => setMessageSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {messageSearchQuery && (
                <button
                  onClick={() => setMessageSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* MESSAGES LIST CONTAINER */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-[#0D121F]">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="w-12 h-12 stroke-[1.5] text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
                <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">No messages yet</p>
                <p className="text-xs max-w-xs mt-1 text-slate-500">
                  Be the first to start the conversation in <span className="font-bold">{activeChannel.name}</span>!
                </p>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs">
                      {msg.senderName.charAt(0)}
                    </div>

                    {/* Message Bubble Column */}
                    <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                      {/* Meta header */}
                      <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                        <span className="px-1.5 py-0.2 rounded font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {msg.senderRole}
                        </span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Replying Context Banner if reply */}
                      {msg.replyToText && (
                        <div className={`p-2 rounded-lg text-xs bg-slate-100 dark:bg-[#1A2333] border-l-2 border-emerald-500 text-slate-600 dark:text-slate-300 italic mb-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          <span className="font-bold non-italic text-emerald-600 dark:text-[#00D4AA]">{msg.replyToSenderName || 'Reply'}:</span> {msg.replyToText}
                        </div>
                      )}

                      {/* Main Message Content */}
                      <div className={`relative p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        msg.isAnnouncement
                          ? 'bg-amber-500/15 border-2 border-amber-500/40 text-slate-900 dark:text-amber-100 rounded-tl-none font-medium'
                          : isMe
                          ? 'bg-emerald-600 text-white dark:bg-[#00D4AA] dark:text-slate-950 rounded-tr-none font-medium'
                          : 'bg-white dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-slate-100 rounded-tl-none'
                      }`}>
                        {/* Announcement Badge */}
                        {msg.isAnnouncement && (
                          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1 text-[11px] uppercase tracking-wider">
                            <Pin className="w-3.5 h-3.5" />
                            <span>Official Announcement</span>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                        {/* Financial or Approval Reference Card if attached */}
                        {msg.reference && (
                          <div className={`mt-2.5 p-3 rounded-xl border text-left flex flex-col gap-2 ${
                            msg.reference.type === 'APPROVAL'
                              ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 text-slate-900 dark:text-slate-100'
                              : 'bg-slate-950/10 dark:bg-slate-950/30 border-slate-200/30 dark:border-slate-800'
                          }`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  msg.reference.type === 'APPROVAL'
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                    : 'bg-emerald-500/20 text-emerald-500'
                                }`}>
                                  {msg.reference.type === 'APPROVAL' ? <ShieldCheck className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[11px] truncate">{msg.reference.title}</p>
                                  <p className="text-[10px] opacity-80 truncate">{msg.reference.subtitle}</p>
                                </div>
                              </div>

                              {msg.reference.type === 'APPROVAL' && msg.reference.status && (
                                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0 ${
                                  msg.reference.status === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : msg.reference.status === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                }`}>
                                  {msg.reference.status}
                                </span>
                              )}

                              {msg.reference.amount !== undefined && (
                                <span className="font-mono font-extrabold text-[11px] shrink-0">
                                  ETB {msg.reference.amount.toLocaleString()}
                                </span>
                              )}
                            </div>

                            {/* Reason Display Block */}
                            {msg.reference.reason && (
                              <div className="text-[11px] font-medium bg-amber-500/10 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-500/20 text-amber-950 dark:text-amber-200">
                                <span className="font-extrabold text-amber-700 dark:text-amber-300">💬 Reason: </span>
                                <span>{msg.reference.reason}</span>
                              </div>
                            )}

                            {/* Quick Approve / Reject action inside Chat if request is pending */}
                            {msg.reference.type === 'APPROVAL' && msg.reference.status === 'PENDING' && (currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && onApproveRequest && onRejectRequest && (
                              <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('success');
                                    onApproveRequest(msg.reference!.id);
                                  }}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve Request</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('warning');
                                    onRejectRequest(msg.reference!.id);
                                  }}
                                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject Request</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* File / Image Attachment */}
                        {msg.fileUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-200/20 max-w-sm">
                            {msg.fileType === 'IMAGE' ? (
                              <img src={msg.fileUrl} alt={msg.fileName || 'Attachment'} className="max-h-52 w-full object-cover" />
                            ) : (
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName || 'attachment'}
                                className="p-3 bg-slate-800/20 flex items-center gap-2 text-xs font-bold hover:underline"
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="truncate">{msg.fileName || 'Download Attached Document'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Reactions Pills Bar */}
                      <div className={`flex flex-wrap gap-1 items-center pt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions && msg.reactions.map((react, i) => {
                          const hasReacted = react.users.includes(currentUser.id);

                          return (
                            <button
                              key={i}
                              onClick={() => {
                                triggerHaptic('light');
                                onAddReaction(msg.id, react.emoji);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                                hasReacted
                                  ? 'bg-emerald-500/20 border border-emerald-500/40 font-bold text-emerald-700 dark:text-[#00D4AA]'
                                  : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                              }`}
                            >
                              <span>{react.emoji}</span>
                              <span className="font-mono">{react.count}</span>
                            </button>
                          );
                        })}

                        {/* Action buttons (Reply & Quick React) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setReplyingTo(msg);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            title="Reply to message"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                          </button>

                          {COMMON_EMOJIS.slice(0, 3).map(e => (
                            <button
                              key={e}
                              onClick={() => {
                                triggerHaptic('light');
                                onAddReaction(msg.id, e);
                              }}
                              className="p-0.5 hover:scale-125 transition-transform text-xs cursor-pointer"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* REPLYING CONTEXT BAR */}
          {replyingTo && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-[#1A2333] border-t border-slate-200 dark:border-[#1E2D40] flex items-center justify-between text-xs text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <CornerDownRight className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Replying to <strong className="text-emerald-600 dark:text-[#00D4AA]">{replyingTo.senderName}</strong>:</span>
                <span className="truncate italic text-slate-500 dark:text-slate-400">"{replyingTo.text}"</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FINANCIAL REFERENCE PREVIEW BAR */}
          {selectedRef && (
            <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Referencing: <strong className="font-bold">{selectedRef.title}</strong> ({selectedRef.subtitle})</span>
              </div>
              <button onClick={() => setSelectedRef(undefined)} className="p-1 text-emerald-600 dark:text-emerald-400 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FILE ATTACHMENT PREVIEW BAR */}
          {attachedFile && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-[#1A2333] border-t border-slate-200 dark:border-[#1E2D40] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-bold truncate">{attachedFile.name}</span>
                <span className="text-[10px] font-mono text-slate-500">({attachedFile.type})</span>
              </div>
              <button onClick={() => setAttachedFile(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* INPUT FORM */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#131926] border-t border-slate-200 dark:border-[#1E2D40] flex items-center gap-2 shrink-0 relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />

            {/* Attach file button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2333] transition-colors cursor-pointer"
              title="Attach File or Image"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Attach Financial Reference button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowRefPicker(true);
              }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                selectedRef ? 'bg-emerald-500/20 text-emerald-600 dark:text-[#00D4AA]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2333]'
              }`}
              title="Reference Transaction, Wallet, or Equb"
            >
              <DollarSign className="w-5 h-5" />
            </button>

            {/* Quick Emojis Dropdown Toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C2333] transition-colors cursor-pointer"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              placeholder={`Message ${activeChannel.name}...`}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 py-2.5 px-3.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Admin Announcement Toggle */}
            {(currentUser.role === 'SuperAdmin' || currentUser.role === 'Admin') && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsAnnouncement(!isAnnouncement);
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isAnnouncement ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Send as Official Announcement"
              >
                <Pin className="w-4 h-4" />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() && !attachedFile && !selectedRef}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Quick Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-12 bg-white dark:bg-[#1A2333] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-2.5 shadow-xl grid grid-cols-5 gap-2 z-30">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText(prev => prev + ' ' + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-base transition-transform hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* FINANCIAL REFERENCE PICKER MODAL */}
      {showRefPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Attach Financial Reference
              </h3>
              <button onClick={() => setShowRefPicker(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-[#8899BB]">
              Select a recent transaction or wallet to link directly into your message for team review.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <p className="text-[11px] font-extrabold uppercase text-slate-400">Recent Transactions</p>
              {state.transactions.slice(0, 8).map(tx => (
                <button
                  key={tx.id}
                  onClick={() => {
                    setSelectedRef({
                      type: 'TRANSACTION',
                      id: tx.id,
                      title: `${tx.type === 'INCOME' ? 'Income' : 'Expense'}: ${tx.category}`,
                      subtitle: tx.description || tx.branch,
                      amount: tx.amount
                    });
                    setShowRefPicker(false);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-[#1C2333] hover:border-emerald-500 border border-slate-200 dark:border-[#1E2D40] flex items-center justify-between transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{tx.category} - {tx.description || tx.branch}</p>
                    <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-mono font-bold text-xs ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    ETB {tx.amount.toLocaleString()}
                  </span>
                </button>
              ))}

              <p className="text-[11px] font-extrabold uppercase text-slate-400 pt-2">Wallets & Vaults</p>
              {state.wallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedRef({
                      type: 'WALLET',
                      id: w.id,
                      title: w.name,
                      subtitle: w.accountNumber || w.type
                    });
                    setShowRefPicker(false);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-[#1C2333] hover:border-emerald-500 border border-slate-200 dark:border-[#1E2D40] flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{w.name}</p>
                      <p className="text-[10px] text-slate-400">{w.accountNumber || w.type}</p>
                    </div>
                  </div>
                </button>
              ))}

              {(state.approvalRequests || []).length > 0 && (
                <>
                  <p className="text-[11px] font-extrabold uppercase text-amber-500 pt-2">Approval Requests</p>
                  {(state.approvalRequests || []).map(req => (
                    <button
                      key={req.id}
                      onClick={() => {
                        setSelectedRef({
                          type: 'APPROVAL',
                          id: req.id,
                          title: req.targetTitle,
                          subtitle: `Action: ${req.actionType.replace(/_/g, ' ')}`,
                          reason: req.reason || 'Co-admin authorization requested',
                          status: req.status
                        });
                        setShowRefPicker(false);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-amber-500/10 hover:border-amber-500 border border-amber-500/30 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{req.targetTitle}</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          {req.actionType.replace(/_/g, ' ')} • Reason: {req.reason || 'Verification requested'}
                        </p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {req.status}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW CHANNEL MODAL */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateChannelSubmit} className="bg-white dark:bg-[#131926] border border-slate-200 dark:border-[#1E2D40] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2D40] pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-emerald-500" />
                Create New Chat Channel
              </h3>
              <button type="button" onClick={() => setShowCreateChannelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mekelle Branch Team"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dedicated coordination for northern branch cashiers"
                  value={newChannelDesc}
                  onChange={e => setNewChannelDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2333] border border-slate-200 dark:border-[#1E2D40] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateChannelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
