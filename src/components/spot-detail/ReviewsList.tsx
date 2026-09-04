import React from 'react';
import { Review, User } from '../../types';
import { Star, ShieldCheck, ThumbsUp, MessageSquare } from 'lucide-react';

interface ReviewsListProps {
  reviews: Review[];
  users: User[];
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, users }) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-soft space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-cream-100">
        <div>
          <h3 className="text-lg font-extrabold text-forest-950">Traveler Reviews</h3>
          <p className="text-xs text-cream-900/60 font-medium">Real experiences from verified CampRoo members</p>
        </div>
        <div className="flex items-center gap-1 bg-cream-100 px-3 py-1.5 rounded-2xl">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-extrabold text-forest-950">
            {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.ratingOverall, 0) / reviews.length).toFixed(1) : '5.0'}
          </span>
          <span className="text-xs text-cream-900/60 font-medium">({reviews.length})</span>
        </div>
      </div>

      {/* Review Category Score Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-cream-50 border border-cream-200/80 text-xs">
        <div>
          <span className="text-cream-900/60 font-medium block">Communication</span>
          <span className="font-extrabold text-forest-950 text-sm">5.0 ★</span>
        </div>
        <div>
          <span className="text-cream-900/60 font-medium block">Accuracy</span>
          <span className="font-extrabold text-forest-950 text-sm">4.9 ★</span>
        </div>
        <div>
          <span className="text-cream-900/60 font-medium block">Hospitality</span>
          <span className="font-extrabold text-forest-950 text-sm">5.0 ★</span>
        </div>
        <div>
          <span className="text-cream-900/60 font-medium block">Safety</span>
          <span className="font-extrabold text-forest-950 text-sm">5.0 ★</span>
        </div>
        <div>
          <span className="text-cream-900/60 font-medium block">Cleanliness</span>
          <span className="font-extrabold text-forest-950 text-sm">4.9 ★</span>
        </div>
      </div>

      {/* Reviews Item List */}
      <div className="space-y-6 pt-2">
        {reviews.length === 0 ? (
          <p className="text-sm text-cream-900/60 italic">No reviews yet for this spot. Be the first to stay!</p>
        ) : (
          reviews.map(review => {
            const author = users.find(u => u.id === review.authorId);
            return (
              <div key={review.id} className="space-y-3 pb-6 border-b border-cream-100 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={author?.name || 'RVer'}
                      className="w-10 h-10 rounded-2xl object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-forest-950 flex items-center gap-1.5">
                        <span>{author?.name || 'Fellow RVer'}</span>
                        {author?.verifications?.idDocument && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-[11px] text-cream-900/60">
                        {author?.rig?.lengthFt ? `${author.rig.lengthFt}ft ${author.rig.type}` : 'Traveler'} · {review.createdAt}
                      </div>
                    </div>
                  </div>

                  {review.wouldWelcomeAgain && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      <ThumbsUp className="w-3 h-3 text-emerald-600" /> Would Welcome Again
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-cream-900/90 leading-relaxed">
                  "{review.comment}"
                </p>

                {/* Host reply if present */}
                {review.hostReply && (
                  <div className="ml-6 p-3.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-cream-900/80 space-y-1">
                    <div className="font-bold text-forest-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-forest-700" />
                      Host Response
                    </div>
                    <p className="italic">"{review.hostReply}"</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
