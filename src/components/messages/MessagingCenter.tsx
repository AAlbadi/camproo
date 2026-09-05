import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Send, MessageSquare, ShieldCheck, MapPin, Calendar, Clock, ChevronRight, Sparkles, UserCheck, ArrowLeft } from 'lucide-react';

export const MessagingCenter: React.FC = () => {
  const {
    currentUser,
    threads,
    users,
    spots,
    requests,
    activeThreadId,
    setActiveThreadId,
    sendMessage,
    setSelectedSpotId,
    setCurrentView,
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(Boolean(activeThreadId));

  // Filter threads for current user
  const userThreads = threads.filter(t => t.participants.includes(currentUser.id));

  // Determine active thread
  const currentThread = userThreads.find(t => t.id === activeThreadId) || userThreads[0];

  useEffect(() => {
    if (activeThreadId) {
      setMobileShowChat(true);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages]);

  const otherUserId = currentThread?.participants.find(id => id !== currentUser.id);
  const otherUser = users.find(u => u.id === otherUserId);
  const spot = spots.find(s => s.id === currentThread?.spotId);
  const stayReq = requests.find(r => r.id === currentThread?.stayRequestId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !otherUserId) return;

    sendMessage(currentThread ? currentThread.id : null, otherUserId, messageInput.trim(), spot?.id, stayReq?.id);
    setMessageInput('');
  };

  // 1-Click quick conversation starter for any available US host
  const handleStartChatWithHost = (hostId: string, spotId: string, greeting: string) => {
    sendMessage(null, hostId, greeting, spotId);
  };

  const quickReplies = [
    'Does the electrical pedestal take a standard 30A TT-30 plug?',
    'We are running about 30 minutes ahead of schedule.',
    'We just pulled in through the front gate, thank you!',
    'Everything is level and connected. Thank you for your hospitality!',
  ];

  // List of available hosts for quick direct message initiation
  const availableHosts = users.filter(u => u.role === 'host' && u.id !== currentUser.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-foreground">
      {/* Top Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="sage" className="uppercase tracking-wider">
              RVer Messaging
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">End-to-End Direct Chat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1">Community Inbox</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Communicate directly with US hosts and travelers regarding parking pads, hookups, and gate codes.
          </p>
        </div>

        {/* Current user badge */}
        <Card className="px-4 py-2 rounded-2xl flex items-center gap-3 border-border bg-card">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs font-black text-foreground">{currentUser.name}</div>
            <div className="text-[10px] text-muted-foreground font-medium">{currentUser.role.toUpperCase()} · {currentUser.homeRegion}</div>
          </div>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-airbnb overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
        {/* Left Sidebar: Thread List */}
        <div className={`md:col-span-4 border-r border-border flex flex-col bg-secondary/20 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border bg-card">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Active Threads ({userThreads.length})</span>
            </h2>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-border">
            {userThreads.length === 0 ? (
              <div className="p-6 text-center space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  No active conversations yet. Click any US host below to start a free chat:
                </p>
                <div className="space-y-2 text-left">
                  {availableHosts.slice(0, 3).map(h => {
                    const hostSpot = spots.find(s => s.hostId === h.id);
                    return (
                      <button
                        key={h.id}
                        onClick={() => handleStartChatWithHost(
                          h.id,
                          hostSpot ? hostSpot.id : spots[0].id,
                          `Hi ${h.name}! I love your spot in ${hostSpot?.locationName || 'the area'} and had a quick question regarding rig clearance.`
                        )}
                        className="w-full p-2.5 rounded-2xl border border-border hover:border-primary bg-card text-left transition-all flex items-center gap-2.5 group"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={h.avatar} alt={h.name} />
                          <AvatarFallback>{h.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-foreground group-hover:text-primary truncate">
                            {h.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {h.homeRegion} · {h.rig.makeModel}
                          </div>
                        </div>
                        <Badge variant="sage" className="text-[10px]">
                          Chat →
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              userThreads.map(thread => {
                const partnerId = thread.participants.find(id => id !== currentUser.id);
                const partner = users.find(u => u.id === partnerId);
                const threadSpot = spots.find(s => s.id === thread.spotId);
                const isSelected = currentThread?.id === thread.id;
                const isUnread = thread.unreadBy.includes(currentUser.id);

                return (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setMobileShowChat(true);
                    }}
                    className={`w-full p-4 text-left transition-all flex items-start gap-3 ${
                      isSelected ? 'bg-white shadow-xs border-l-4 border-l-roo-500 font-semibold' : 'hover:bg-dark-100/60'
                    }`}
                  >
                    <img
                      src={partner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.name || 'RVer')}&background=0284c7&color=fff&bold=true`}
                      alt={partner?.name}
                      className="w-10 h-10 rounded-2xl object-cover shrink-0 ring-1 ring-dark-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-dark-900 truncate">
                          {partner?.name || 'RVer'}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-roo-500 shrink-0" />
                        )}
                      </div>
                      {threadSpot && (
                        <span className="text-[10px] text-roo-600 font-bold block truncate">
                          {threadSpot.title}
                        </span>
                      )}
                      <p className="text-[11px] text-dark-500 truncate mt-0.5">
                        {thread.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Panel */}
        <div className={`md:col-span-8 flex flex-col bg-card ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {currentThread && otherUser ? (
            <>
              {/* Chat Header with Stay Context */}
              <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 -ml-1 rounded-xl bg-card border border-border text-foreground hover:bg-secondary flex items-center justify-center shrink-0"
                    aria-label="Back to threads"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <Avatar className="w-10 h-10 rounded-2xl ring-1 ring-border">
                    <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                    <AvatarFallback className="rounded-2xl">{otherUser.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-foreground">{otherUser.name}</span>
                      {otherUser.verifications.idDocument && (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {otherUser.role === 'host' ? 'Verified Host' : 'Verified Roamer'} · {otherUser.homeRegion}
                    </p>
                  </div>
                </div>

                {spot && (
                  <button
                    onClick={() => {
                      setSelectedSpotId(spot.id);
                      setCurrentView('spot-detail');
                    }}
                    className="flex items-center gap-2 p-2 rounded-2xl bg-card border border-border hover:border-primary text-left transition-all"
                  >
                    <img src={spot.photos[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <div className="text-[11px]">
                      <span className="font-bold text-foreground block truncate max-w-[140px]">{spot.title}</span>
                      <span className="text-primary font-semibold">{spot.locationName} · FREE</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-secondary/10">
                {currentThread.messages.map(msg => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-xs shadow-xs'
                            : 'bg-card text-foreground border border-border rounded-bl-xs shadow-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 font-mono ${
                            isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="px-4 py-2 border-t border-border bg-card flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">Quick reply:</span>
                {quickReplies.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMessageInput(q)}
                    className="px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium whitespace-nowrap transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex items-center gap-2">
                <Input
                  placeholder="Type a friendly message to host/guest..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!messageInput.trim()}
                  variant="outdoor"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-secondary/80 border border-border flex items-center justify-center text-3xl shadow-xs">
                💬
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-foreground">
                  {userThreads.length === 0 ? 'Your Inbox is Fresh & Ready' : 'Select a Conversation'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {userThreads.length === 0
                    ? 'Start a direct chat with any host on the left, or browse spots on the live map to coordinate your next stay.'
                    : 'Choose a conversation from the sidebar to view chat history and coordinates.'}
                </p>
              </div>
              {userThreads.length === 0 && (
                <Button
                  onClick={() => {
                    setCurrentView('explore');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  variant="outdoor"
                  size="sm"
                  className="rounded-xl shadow-xs"
                >
                  Explore Free Spots Map →
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
