import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from '../ui/dialog';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  PlusCircle,
  Tag,
  Compass,
  Sparkles,
  Send,
  X,
  Filter,
  CheckCircle2,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CommunityForum: React.FC = () => {
  const {
    communityPosts,
    currentUser,
    createCommunityPost,
    toggleCommunityUpvote,
    addCommunityComment,
    users,
  } = useApp();

  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  // New Post State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<any>('road_trip');
  const [newContent, setNewContent] = useState('');
  const [newRigTag, setNewRigTag] = useState(`${currentUser.rig.lengthFt}ft ${currentUser.rig.type.replace('_', ' ')}`);
  const [newLocationTag, setNewLocationTag] = useState(currentUser.homeRegion || 'USA Highway');

  const categories = [
    { key: 'all', label: 'All Discussions' },
    { key: 'road_trip', label: 'Road Trips & Routes' },
    { key: 'rv_advice', label: 'Rig & Hookup Advice' },
    { key: 'route_tips', label: 'Scenic Highway Tips' },
    { key: 'repairs', label: 'DIY Repairs & Tech' },
    { key: 'local_gems', label: 'Secret US Spots' },
    { key: 'hosting_news', label: 'Host Announcements' },
  ];

  const filteredPosts = selectedCategory === 'all'
    ? communityPosts
    : communityPosts.filter(p => p.category === selectedCategory);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    createCommunityPost({
      authorId: currentUser.id,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      rigTag: newRigTag.trim(),
      locationTag: newLocationTag.trim(),
    });

    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.6 },
    });

    showToast('Community discussion posted to The Roam Hub!', 'success');
    setShowCreateModal(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    addCommunityComment(postId, text.trim());
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    showToast('Reply added to discussion.', 'success');
  };

  const suggestionTags = [
    '#MoabBLM', '#ScenicByway12', '#30AmpStagger', '#SedonaBoondocking', '#StarlinkRoam', '#DogFriendly'
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-foreground">
      {/* Header Banner with Liquid Glass Accent */}
      <Card className="relative rounded-3xl p-8 sm:p-10 border-border bg-card shadow-airbnb overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-3">
            <Badge variant="sage" className="gap-2 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>The Roam Hub · US Community Campfire</span>
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Where RVers Help RVers
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed font-normal">
              Ask for BLM boondocking advice, swap generator etiquette tips, share dump station locations, and connect with fellow rovers on US highways.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outdoor"
                size="default"
                className="flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start New Discussion</span>
              </Button>
              <div className="text-xs text-muted-foreground font-semibold hidden sm:block">
                Logged in as <span className="text-foreground font-bold">{currentUser.name}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 hidden md:block">
            <img
              src="/images/camproo_badge.jpg"
              alt="CampRoo Keep Roaming Official Seal"
              className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-roo-200 hover:rotate-6 transition-transform"
            />
          </div>
        </div>
      </Card>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <Button
            key={cat.key}
            variant={selectedCategory === cat.key ? 'outdoor' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.key)}
            className="rounded-full text-xs font-bold whitespace-nowrap"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {filteredPosts.map(post => {
          const author = users.find(u => u.id === post.authorId);
          const hasUpvoted = post.upvotedBy.includes(currentUser.id);

          return (
            <Card
              key={post.id}
              className="p-6 sm:p-8 border-border bg-card shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              {/* Author header */}
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <img
                    src={author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name || 'RVer')}&background=0284c7&color=fff&bold=true`}
                    alt={author?.name}
                    className="w-10 h-10 rounded-2xl object-cover ring-1 ring-border"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{author?.name}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {post.rigTag || author?.rig?.makeModel} · {post.locationTag || author?.homeRegion}
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="capitalize">
                  {post.category.replace('_', ' ')}
                </Badge>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">{post.title}</h3>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-normal">
                  {post.content}
                </p>
              </div>

              {/* Upvote & Comments action bar */}
              <div className="flex items-center gap-4 pt-2 border-t border-border text-xs">
                <Button
                  variant={hasUpvoted ? 'outdoor' : 'secondary'}
                  size="sm"
                  onClick={() => toggleCommunityUpvote(post.id)}
                  className="gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{post.upvotes} Helpful</span>
                </Button>

                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.comments.length} Replies</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-2 space-y-3">
                {post.comments.map(c => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-dark-50/70 border border-dark-100 flex items-start gap-3">
                    <img
                      src={c.authorAvatar}
                      alt={c.authorName}
                      className="w-7 h-7 rounded-xl object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-dark-900">{c.authorName}</span>
                        {c.authorRig && (
                          <span className="text-[10px] text-dark-500 font-medium">({c.authorRig})</span>
                        )}
                        <span className="text-[9px] text-dark-400 ml-auto font-mono">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-dark-700 mt-1 leading-relaxed font-normal">{c.content}</p>
                    </div>
                  </div>
                ))}

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Write a helpful reply..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddComment(post.id);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleAddComment(post.id)}
                    variant="outdoor"
                    size="sm"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* New Post Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <img
                src="/images/camproo_app_icon.jpg"
                alt="CampRoo Mascot"
                className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-roo-200"
              />
              <div>
                <DialogTitle>Start a Roam Hub Discussion</DialogTitle>
                <DialogDescription>
                  Connect with fellow RVers, share highway route advice, and ask setup questions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody>
            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <label className="font-bold text-foreground block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="road_trip">Road Trips & Routes</option>
                  <option value="rv_advice">Rig & Hookup Advice</option>
                  <option value="route_tips">Scenic Highway Tips</option>
                  <option value="repairs">DIY Repairs & Tech</option>
                  <option value="local_gems">Secret US Spots</option>
                  <option value="hosting_news">Host Announcements</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-foreground block mb-1">Topic Title</label>
                <Input
                  required
                  placeholder="e.g. Navigating Highway 12 in Utah with a 30ft+ trailer?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              {/* Content */}
              <div>
                <label className="font-bold text-foreground block mb-1">Your Question / Advice</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details, rig clearance questions, or route conditions..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Quick Suggestion Tags */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1">Popular US Tags:</label>
                <div className="flex flex-wrap gap-1.5">
                  {suggestionTags.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setNewLocationTag(tag)}
                      className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-[10px] font-semibold transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rig & Location tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Rig Tag</label>
                  <Input
                    value={newRigTag}
                    onChange={(e) => setNewRigTag(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Location Tag</label>
                  <Input
                    value={newLocationTag}
                    onChange={(e) => setNewLocationTag(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="outdoor"
                  size="sm"
                >
                  Publish Discussion
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
};
