import React, { useState } from 'react';
import { Review, User } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Truck,
  Calendar,
  PenLine,
  Image as ImageIcon,
  X,
  Edit2,
  Clock
} from 'lucide-react';
import { Button } from '../ui/button';

interface ReviewsListProps {
  reviews: Review[];
  users: User[];
  onWriteReview?: () => void;
  onEditReview?: (review: Review) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  users,
  onWriteReview,
  onEditReview,
}) => {
  const { currentUser } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.ratingOverall, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
      {/* Reviews Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-foreground">Traveler Reviews & Field Reports</h3>
            {reviews.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-bold">
                {reviews.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Verified experiences, road condition reports, and campsite tips from real campers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-2xl">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-black text-amber-950 dark:text-amber-200">
                {averageRating}
              </span>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                ({reviews.length})
              </span>
            </div>
          )}

          {onWriteReview && (
            <Button
              size="sm"
              onClick={onWriteReview}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Write a Review</span>
            </Button>
          )}
        </div>
      </div>

      {/* Review Category Score Breakdown */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-secondary/30 border border-border text-xs">
          <div>
            <span className="text-muted-foreground font-medium block">Listing Accuracy</span>
            <span className="font-black text-foreground text-sm flex items-center gap-1 mt-0.5">
              {(reviews.reduce((acc, r) => acc + (r.categories?.accuracy || 5), 0) / reviews.length).toFixed(1)}
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            </span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium block">Road & Access</span>
            <span className="font-black text-foreground text-sm flex items-center gap-1 mt-0.5">
              {(reviews.reduce((acc, r) => acc + (r.categories?.communication || 5), 0) / reviews.length).toFixed(1)}
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            </span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium block">Cleanliness</span>
            <span className="font-black text-foreground text-sm flex items-center gap-1 mt-0.5">
              {(reviews.reduce((acc, r) => acc + (r.categories?.cleanliness || 5), 0) / reviews.length).toFixed(1)}
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            </span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium block">Safety</span>
            <span className="font-black text-foreground text-sm flex items-center gap-1 mt-0.5">
              {(reviews.reduce((acc, r) => acc + (r.categories?.safety || 5), 0) / reviews.length).toFixed(1)}
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            </span>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6 pt-2">
        {reviews.length === 0 ? (
          <div className="p-8 rounded-3xl bg-secondary/30 border border-border text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mx-auto flex items-center justify-center">
              <PenLine className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-foreground">
                No traveler reviews yet for this campsite.
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Have you camped, boondocked, or driven through here? Be the first to share road conditions, cell service report, and photos!
              </p>
            </div>
            {onWriteReview && (
              <Button
                onClick={onWriteReview}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-sm"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Be the First to Review</span>
              </Button>
            )}
          </div>
        ) : (
          reviews.map((review) => {
            const author = users.find((u) => u.id === review.authorId);
            const reviewPhotos = review.photos || [];

            return (
              <div
                key={review.id}
                className="space-y-3.5 pb-6 border-b border-border last:border-0 last:pb-0"
              >
                {/* Author row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        author?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          author?.name || 'RVer'
                        )}&background=047857&color=fff&bold=true`
                      }
                      alt={author?.name || 'RVer'}
                      className="w-11 h-11 rounded-2xl object-cover ring-1 ring-border shadow-xs"
                    />
                    <div>
                      <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <span>{author?.name || 'Fellow RVer'}</span>
                        {author?.verifications?.idDocument && (
                          <span title="Verified Camper" className="inline-flex">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-2 mt-0.5">
                        {review.rigType ? (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-muted-foreground" />
                            <span>{review.rigType}</span>
                          </span>
                        ) : author?.rig?.lengthFt ? (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-muted-foreground" />
                            <span>{author.rig.lengthFt}ft {author.rig.type.replace('_', ' ')}</span>
                          </span>
                        ) : null}

                        {(review.rigType || author?.rig?.lengthFt) && <span>·</span>}

                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{review.stayDate || review.createdAt}</span>
                        </span>

                        {review.updatedAt && (
                          <span className="text-[10px] text-muted-foreground italic font-normal">
                            (edited)
                          </span>
                        )}

                        {review.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-[10px] font-bold border border-amber-300 dark:border-amber-700">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Under Review</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars, Recommendation Badge & Edit Action */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.ratingOverall
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>

                    {review.wouldWelcomeAgain && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                        <ThumbsUp className="w-3 h-3 text-emerald-600" /> Recommends
                      </span>
                    )}

                    {onEditReview && (review.authorId === currentUser?.id || currentUser?.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => onEditReview(review)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-foreground bg-secondary/80 hover:bg-secondary border border-border transition-colors shadow-xs ml-1"
                        title="Edit this review"
                      >
                        <Edit2 className="w-3 h-3 text-emerald-600" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                  "{review.comment}"
                </p>

                {/* Attached Review Photos */}
                {reviewPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                    {reviewPhotos.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative aspect-video rounded-xl overflow-hidden border border-border group hover:opacity-95 transition-opacity"
                      >
                        <img
                          src={photo}
                          alt="Review attachment"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Host reply if present */}
                {review.hostReply && (
                  <div className="ml-4 sm:ml-6 p-3.5 rounded-2xl bg-secondary/50 border border-border text-xs text-foreground/80 space-y-1">
                    <div className="font-extrabold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
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

      {/* Review Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white font-bold flex items-center gap-1 hover:text-white/80"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
            <img
              src={selectedPhoto}
              alt="Full size review photo"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
