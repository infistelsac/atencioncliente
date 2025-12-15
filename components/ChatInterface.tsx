import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, MessageType } from '../types';
import { getSuggestedReply, summarizeConversation, draftResponse } from '../services/geminiService';
import { Send, Paperclip, Smile, Search, MoreVertical, Check, CheckCheck, Sparkles, Bot, Image as ImageIcon, Camera, FileText, X, MessageSquarePlus, Phone, Video, Wand2, PenTool, Edit2, Save, Wrench } from 'lucide-react';

interface ChatInterfaceProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onSendMessage: (conversationId: string, text: string, type?: MessageType) => void;
  onStartCall: (name: string, avatar: string, type: 'audio' | 'video') => void;
  onEditMessage: (conversationId: string, messageId: string, newText: string) => void;
}

const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🧐", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "👍", "👎", "👌", "✌️", "🤞", "👋", "💪", "❤️", "🔥", "✨"
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  onStartCall,
  onEditMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // UI States for menus
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // AI Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // AI Draft/Consult State
  const [showDraftInput, setShowDraftInput] = useState(false);
  const [draftInstruction, setDraftInstruction] = useState('');

  // Message Editing State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Auto-suggestion debounce
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAutoSuggestEnabled, setIsAutoSuggestEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  // Debounced Auto-Suggestion Effect
  useEffect(() => {
    if (!isAutoSuggestEnabled || !inputText.trim() || !activeConversation || showDraftInput || editingMessageId) {
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      setIsGenerating(true);
      // Pass current text to context-aware suggestion
      const options = await getSuggestedReply(activeConversation.customerName, activeConversation.messages); // In real scenario, pass inputText
      if (options && options.length > 0) {
        setSuggestions(options);
        setShowSuggestions(true);
      }
      setIsGenerating(false);
    }, 1500); // 1.5s delay after stop typing

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, isAutoSuggestEnabled, activeConversation, showDraftInput, editingMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e?: React.FormEvent, type: MessageType = MessageType.TEXT, content?: string) => {
    e?.preventDefault();
    const textToSend = content || inputText;

    if (textToSend.trim() && activeConversationId) {
      onSendMessage(activeConversationId, textToSend, type);
      if (type === MessageType.TEXT) {
        setInputText('');
      }
      setShowEmojiPicker(false);
      setShowAttachMenu(false);
      setShowSuggestions(false);
      setShowDraftInput(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!activeConversation) return;

    setIsGenerating(true);
    setShowSuggestions(true); // Open panel immediately
    setShowDraftInput(false);
    setSuggestions([]); // Clear previous

    const options = await getSuggestedReply(activeConversation.customerName, activeConversation.messages);

    if (options && options.length > 0) {
      setSuggestions(options);
    } else {
      setShowSuggestions(false);
    }
    setIsGenerating(false);
  };

  const handleConsultAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !draftInstruction.trim()) return;

    setIsGenerating(true);
    const draft = await draftResponse(activeConversation.customerName, activeConversation.messages, draftInstruction);

    setInputText(draft);
    setDraftInstruction('');
    setShowDraftInput(false);
    setIsGenerating(false);
  };

  const handleSelectSuggestion = (text: string) => {
    setInputText(text);
    setShowSuggestions(false);
  };

  const handleSummarize = async () => {
    if (!activeConversation) return;
    setIsGenerating(true);
    const result = await summarizeConversation(activeConversation.messages);
    setSummary(result);
    setShowSummaryModal(true);
    setIsGenerating(false);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const handleAttachImage = () => {
    const randomImages = [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    ];
    const randomImg = randomImages[Math.floor(Math.random() * randomImages.length)];
    handleSendMessage(undefined, MessageType.IMAGE, randomImg);
  };

  const handleNewChat = () => {
    alert("Aquí se abriría la lista de contactos.");
  };

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

  const saveEdit = () => {
    if (activeConversationId && editingMessageId && editText.trim()) {
      onEditMessage(activeConversationId, editingMessageId, editText);
      setEditingMessageId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return formatTime(date);
    if (days === 1) return 'Ayer';
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 rounded-l-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
      {/* Sidebar List */}
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200`}>
        {/* Header */}
        <div className="h-16 bg-gray-50 dark:bg-gray-800 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar chat..."
              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 dark:focus:border-green-500 transition-colors"
            />
          </div>
          <button
            onClick={handleNewChat}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Nuevo Chat / Contactos"
          >
            <MessageSquarePlus size={20} />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 ${activeConversationId === conv.id ? 'bg-green-50 dark:bg-gray-700' : ''
                }`}
            >
              <img src={conv.customerAvatar} alt={conv.customerName} className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`font-semibold truncate ${activeConversationId === conv.id ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-200'}`}>
                    {conv.customerName}
                  </h3>
                  <span className={`text-xs ${conv.unreadCount > 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formatDate(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                    {conv.messages[conv.messages.length - 1]?.type === MessageType.IMAGE
                      ? '📷 Foto'
                      : conv.messages[conv.messages.length - 1]?.text}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-whatsapp-dark transition-colors duration-200 relative">
          {/* Chat Header */}
          <div className="h-16 bg-gray-50 dark:bg-gray-800 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <button onClick={() => onSelectConversation('')} className="md:hidden text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <img src={activeConversation.customerAvatar} alt={activeConversation.customerName} className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{activeConversation.customerName}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">en línea</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">

              <button
                onClick={() => setIsAutoSuggestEnabled(!isAutoSuggestEnabled)}
                className={`p-2 rounded-full transition-colors ${isAutoSuggestEnabled ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={isAutoSuggestEnabled ? "Auto-sugerencias activadas" : "Activar auto-sugerencias"}
              >
                <Sparkles size={20} />
              </button>
              <button
                onClick={() => onStartCall(activeConversation.customerName, activeConversation.customerAvatar, 'audio')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Llamada de voz"
              >
                <Phone size={20} />
              </button>
              <button
                onClick={() => onStartCall(activeConversation.customerName, activeConversation.customerAvatar, 'video')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Videollamada"
              >
                <Video size={20} />
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <Search size={20} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 hidden sm:block" />
              <MoreVertical size={20} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 custom-scrollbar relative"
          >
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-40 dark:opacity-10 pointer-events-none z-0" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}></div>

            {activeConversation.messages.map((msg, idx) => {
              const isMe = msg.senderId !== 'customer';
              const showTail = idx === activeConversation.messages.length - 1 || activeConversation.messages[idx + 1]?.senderId !== msg.senderId;
              const isEditing = editingMessageId === msg.id;

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 relative z-10 group`}>
                  <div
                    className={`max-w-[85%] lg:max-w-[65%] px-2 py-2 rounded-lg shadow-sm relative text-[15px] leading-relaxed transition-colors duration-200
                      ${isMe
                        ? 'bg-[#d9fdd3] dark:bg-outgoing-dark text-gray-900 dark:text-gray-100 rounded-tr-none'
                        : 'bg-white dark:bg-incoming-dark text-gray-900 dark:text-gray-100 rounded-tl-none'}
                      ${!showTail && isMe ? 'rounded-tr-lg mr-2' : ''}
                      ${!showTail && !isMe ? 'rounded-tl-lg ml-2' : ''}
                    `}
                  >
                    {/* Tail SVGs */}
                    {showTail && isMe && (
                      <span className="absolute -right-2 top-0 text-[#d9fdd3] dark:text-outgoing-dark transition-colors duration-200">
                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="none"><path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" fill="currentColor"></path><path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" fill="rgba(0,0,0,0.05)"></path></svg>
                      </span>
                    )}
                    {showTail && !isMe && (
                      <span className="absolute -left-2 top-0 text-white dark:text-incoming-dark transition-colors duration-200">
                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="none"><path d="M-2.288 1h5.188v11.193l-6.467-8.625C-4.626 2.156-4.058 1 -2.288 1z" fill="currentColor" transform="scale(-1,1) translate(-8,0)"></path></svg>
                      </span>
                    )}

                    {/* Edit Mode vs Display Mode */}
                    {isEditing ? (
                      <div className="p-1 min-w-[200px]">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                            <X size={16} />
                          </button>
                          <button onClick={saveEdit} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">
                            <Check size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Message Content */}
                        <div className="px-2">
                          {msg.type === MessageType.IMAGE ? (
                            <div className="mb-1 rounded-lg overflow-hidden mt-1">
                              <img src={msg.text} alt="Attachment" className="max-w-full h-auto object-cover max-h-64 rounded-lg" />
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1 px-2 select-none mt-1">
                          {msg.isEdited && (
                            <span className="text-[10px] italic text-gray-500 dark:text-gray-400 mr-1">
                              editado
                            </span>
                          )}
                          <span className={`text-[11px] min-w-fit ${isMe ? 'text-gray-500 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatTime(msg.timestamp)}
                          </span>
                          {isMe && (
                            <span className="text-blue-500 dark:text-blue-400">
                              {msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
                            </span>
                          )}
                        </div>

                        {/* Edit Hover Button for 'Me' messages */}
                        {isMe && msg.type === MessageType.TEXT && (
                          <button
                            onClick={() => startEditing(msg)}
                            className="absolute -top-3 right-0 bg-gray-100 dark:bg-gray-700 shadow-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 dark:text-gray-300 hover:text-blue-600 z-20"
                            title="Editar mensaje"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-end gap-2 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200 relative z-20">

            {/* Popups Backdrop */}
            {(showEmojiPicker || showAttachMenu || showSuggestions || showDraftInput) && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => { setShowEmojiPicker(false); setShowAttachMenu(false); setShowSuggestions(false); setShowDraftInput(false); }}
              ></div>
            )}

            {/* AI Draft/Consult Floating Panel */}
            {showDraftInput && (
              <div className="absolute bottom-20 left-4 right-4 md:left-20 md:right-20 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-900/50 p-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                    <Bot size={20} />
                    <span>Consultar / Redactar con IA</span>
                  </div>
                  <button onClick={() => setShowDraftInput(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleConsultAi} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={draftInstruction}
                      onChange={(e) => setDraftInstruction(e.target.value)}
                      placeholder="Ej: Dile amablemente que no tenemos stock hasta el martes..."
                      className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white resize-none"
                      rows={2}
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDraftInput(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating || !draftInstruction.trim()}
                      className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <Sparkles size={16} className="animate-spin" /> : <PenTool size={16} />}
                      Generar Borrador
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* AI Suggestions Floating Panel */}
            {showSuggestions && (
              <div className="absolute bottom-20 left-4 right-4 md:left-12 md:right-12 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-900/50 p-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                    <Sparkles size={18} className={isGenerating ? "animate-spin" : ""} />
                    <span>Sugerencias de IA</span>
                  </div>
                  <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={18} />
                  </button>
                </div>

                {isGenerating && suggestions.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
                    <Wand2 className="animate-pulse" size={24} />
                    <span>Generando opciones inteligentes...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="text-left p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-100 dark:border-purple-800/30 transition-all text-sm text-gray-800 dark:text-gray-200 hover:scale-[1.02] shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-4 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-80 h-80 flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 rounded-t-xl">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Emojis</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-8 gap-1 custom-scrollbar">
                  {COMMON_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddEmoji(emoji)}
                      className="text-xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachment Menu */}
            {showAttachMenu && (
              <div className="absolute bottom-20 left-12 z-20 flex flex-col gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="flex flex-col gap-3">
                  <div className="group flex items-center gap-3 cursor-pointer" onClick={handleAttachImage}>
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <ImageIcon size={24} />
                    </div>
                    <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-1 rounded-full shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Fotos y videos
                    </span>
                  </div>
                  <div className="group flex items-center gap-3 cursor-pointer" onClick={() => setShowAttachMenu(false)}>
                    <div className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-1 rounded-full shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Cámara
                    </span>
                  </div>
                  <div className="group flex items-center gap-3 cursor-pointer" onClick={() => setShowAttachMenu(false)}>
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                    <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-1 rounded-full shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Documento
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Toolbar Buttons */}
            <button
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); setShowSuggestions(false); setShowDraftInput(false); }}
              className={`p-2 transition-colors mb-1 rounded-full ${showEmojiPicker ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <Smile size={24} />
            </button>
            <button
              onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); setShowSuggestions(false); setShowDraftInput(false); }}
              className={`p-2 transition-colors mb-1 rounded-full ${showAttachMenu ? 'text-gray-800 bg-gray-200 dark:text-white dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <Paperclip size={24} className={showAttachMenu ? "rotate-45 transition-transform" : "transition-transform"} />
            </button>

            <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus-within:border-green-500 dark:focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all flex flex-col">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Escribe un mensaje"
                className="w-full px-4 py-3 bg-transparent focus:outline-none resize-none max-h-32 text-sm text-gray-900 dark:text-gray-100 custom-scrollbar placeholder-gray-400 dark:placeholder-gray-400"
                rows={1}
                style={{ minHeight: '44px' }}
              />
            </div>

            <div className="flex flex-col gap-2 mb-1">
              {/* Robot Icon for Consultation */}
              <button
                onClick={() => { setShowDraftInput(!showDraftInput); setShowSuggestions(false); setShowAttachMenu(false); setShowEmojiPicker(false); }}
                className={`p-2 rounded-full transition-colors flex items-center justify-center relative group ${showDraftInput ? 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}
                title="Consultar / Redactar con IA"
              >
                <Bot size={20} />
                {/* Tooltip */}
                <span className="absolute bottom-full mb-2 right-0 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Consultar IA
                </span>
              </button>

              <button
                onClick={handleGenerateReply}
                disabled={isGenerating}
                className={`p-2 rounded-full transition-colors flex items-center justify-center relative group ${showSuggestions ? 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900' : 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50'}`}
                title="Sugerir Respuestas"
              >
                <Sparkles size={20} className={isGenerating ? "animate-spin" : ""} />
                {/* Tooltip */}
                <span className="absolute bottom-full mb-2 right-0 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Sugerir Respuestas
                </span>
              </button>

              <button
                onClick={() => handleSendMessage()}
                className={`p-2 rounded-full transition-colors flex items-center justify-center ${inputText.trim()
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                disabled={!inputText.trim()}
              >
                <Send size={20} className={inputText.trim() ? "ml-0.5" : ""} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 border-b-8 border-green-500 dark:border-green-600 text-center p-8 transition-colors duration-200">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-sm mb-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1022px-WhatsApp.svg.png" width="80" alt="Whatsapp" />
          </div>
          <h2 className="text-3xl font-light text-gray-700 dark:text-gray-200 mb-4">SoportePro Web</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Envía y recibe mensajes sin necesidad de mantener tu teléfono conectado.
            Usa SoportePro en hasta 4 dispositivos vinculados y 1 teléfono.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Sistema sincronizado y seguro.
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && summary && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <h3 className="font-bold">Resumen de Gemini AI</h3>
              </div>
              <button onClick={() => setShowSummaryModal(false)} className="hover:bg-blue-700 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-sm text-gray-700 dark:text-gray-300">
                <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;