import React, { useState } from 'react';
import { StayRequest, Spot } from '../../types';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Star, ThumbsUp, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaveReviewModalProps {
  request: StayRequest;
  spot?: Spot;
  onClose: () => void;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({ request, spot, onClose }) => {
  const { currentUser, submitReview } = useApp();
  const { showToast } = useToast();

  const [communication, setCommunication] = useState(5);
  const [accuracy, setAccuracy] = useState(5);
  const [hospitality, setHospitality] = useState(5);
  const [safety, setSafety] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [wouldWelcomeAgain, setWouldWelcomeAgain] = useState(true);
  const [comment, setComment] = useState('');

  const overallRating = Number(
    ((communication + accuracy + hospitality + safety + cleanliness) / 5).toFixed(1)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview({
      spotId: spot?.id,
      travelerId: request.travelerId,
      hostId: request.hostId,
      stayRequestId: request.id,
      authorId: currentUser.id,
      authorRole: currentUser.id === request.travelerId ? 'traveler' : 'host',
      ratingOverall: overallRating,
      categories: {
        communication,
        accuracy,
        hospitality,
        safety,
        cleanliness,
      },
      wouldWelcomeAgain,
      comment,
    });

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
    });

    showToast('Review submitted! Thank you for fostering trust in the CampRoo community.', 'success');
    onClose();
  };

  const renderStars = (val: number, setVal: (n: number) => void) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          type="button"
          key={star}
          onClick={() => setVal(star)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            className={`w-5 h-5 ${
              star <= val ? 'text-amber-400 fill-amber-400' : 'text-cream-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-3xl w-full max-w-lg p-4 sm:p-6 border border-cream-200 shadow-float space-y-5 sm:space-y-6 max-h-[92dvh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between pb-3 border-b border-cream-100">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-forest-950">Review Your CampRoo Stay</h3>
            <p className="text-xs text-cream-900/60 font-medium">{spot?.title || 'RV Spot'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-cream-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Rating Criteria Categories */}
          <div className="space-y-3 p-4 rounded-2xl bg-cream-50 border border-cream-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-950">Communication</span>
              {renderStars(communication, setCommunication)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-950">Listing Accuracy</span>
              {renderStars(accuracy, setAccuracy)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-950">Host Hospitality</span>
              {renderStars(hospitality, setHospitality)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-950">Safety & Security</span>
              {renderStars(safety, setSafety)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-950">Cleanliness & Pad Quality</span>
              {renderStars(cleanliness, setCleanliness)}
            </div>
          </div>

          {/* Would Welcome Again Toggle */}
          <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-forest-800" />
              <div>
                <span className="text-xs font-bold text-forest-950 block">
                  Would you welcome this CampRoo member again?
                </span>
                <span className="text-[10px] text-forest-700">Helps build community trust</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWouldWelcomeAgain(!wouldWelcomeAgain)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                wouldWelcomeAgain
                  ? 'bg-forest-900 text-cream-50'
                  : 'bg-cream-200 text-cream-800'
              }`}
            >
              {wouldWelcomeAgain ? 'Yes, Gladly!' : 'No'}
            </button>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-bold text-forest-950 block mb-1">
              Your Review & Story
            </label>
            <textarea
              rows={4}
              required
              placeholder="Tell fellow rovers about the pad levelness, quiet surroundings, host hospitality, and any tips..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full p-3 rounded-xl border border-cream-300 text-xs text-cream-900 focus:outline-none focus:ring-1 focus:ring-forest-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-cream-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-cream-900/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50 text-xs font-bold shadow-soft"
            >
              Submit Community Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
