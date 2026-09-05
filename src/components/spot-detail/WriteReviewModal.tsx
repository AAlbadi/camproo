import React, { useState } from 'react';
import { Spot, User, Review } from '../../types';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
  Star,
  Camera,
  Upload,
  X,
  Plus,
  Truck,
  Calendar,
  ThumbsUp,
  Loader2,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface WriteReviewModalProps {
  spot: Spot;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialReview?: Review | null;
  isEditMode?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor - Not recommended',
  2: 'Fair - Needs improvement',
  3: 'Good - Decent stay',
  4: 'Great - Highly recommend',
  5: 'Exceptional - Outstanding campsite!',
};

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  spot,
  isOpen,
  onClose,
  onSuccess,
  initialReview,
  isEditMode = false,
}) => {
  const { currentUser, submitReview, updateReview } = useApp();
  const { showToast } = useToast();

  const [ratingOverall, setRatingOverall] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [categories, setCategories] = useState({
    accuracy: 5,
    roadAccess: 5,
    cleanliness: 5,
    safety: 5,
    hospitality: 5,
  });

  const [comment, setComment] = useState('');
  const [rigType, setRigType] = useState<string>(
    currentUser.rig?.type ? `${currentUser.rig.lengthFt}ft ${currentUser.rig.type.replace('_', ' ')}` : '25ft Campervan'
  );
  const [stayDate, setStayDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [wouldWelcomeAgain, setWouldWelcomeAgain] = useState(true);

  // Photos state
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form based on edit mode and initialReview
  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialReview) {
        setRatingOverall(initialReview.ratingOverall || 5);
        setCategories({
          accuracy: initialReview.categories?.accuracy || 5,
          roadAccess: initialReview.categories?.communication || 5,
          cleanliness: initialReview.categories?.cleanliness || 5,
          safety: initialReview.categories?.safety || 5,
          hospitality: initialReview.categories?.hospitality || 5,
        });
        setComment(initialReview.comment || '');
        setRigType(initialReview.rigType || (currentUser.rig?.type ? `${currentUser.rig.lengthFt}ft ${currentUser.rig.type.replace('_', ' ')}` : '25ft Campervan'));
        setStayDate(initialReview.stayDate || initialReview.createdAt || new Date().toISOString().split('T')[0]);
        setWouldWelcomeAgain(initialReview.wouldWelcomeAgain ?? true);
        setAttachedPhotos(initialReview.photos || []);
      } else {
        setRatingOverall(5);
        setCategories({ accuracy: 5, roadAccess: 5, cleanliness: 5, safety: 5, hospitality: 5 });
        setComment('');
        setRigType(currentUser.rig?.type ? `${currentUser.rig.lengthFt}ft ${currentUser.rig.type.replace('_', ' ')}` : '25ft Campervan');
        setStayDate(new Date().toISOString().split('T')[0]);
        setWouldWelcomeAgain(true);
        setAttachedPhotos([]);
      }
    }
  }, [isOpen, isEditMode, initialReview, currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const newFiles = Array.from(files);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          setAttachedPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    setIsUploadingPhoto(false);
  };

  const handleAddUrlPhoto = () => {
    const url = photoUrlInput.trim();
    if (!url) return;
    if (url.includes('unsplash.com') || url.includes('pexels.com')) {
      showToast('Please only add authentic photos of the actual camping spot.', 'error');
      return;
    }
    setAttachedPhotos((prev) => [...prev, url]);
    setPhotoUrlInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      showToast('Please write a few words about your experience.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && initialReview) {
        updateReview(initialReview.id, {
          ratingOverall,
          categories: {
            accuracy: categories.accuracy,
            communication: categories.roadAccess,
            hospitality: categories.hospitality,
            safety: categories.safety,
            cleanliness: categories.cleanliness,
          },
          wouldWelcomeAgain,
          comment: comment.trim(),
          photos: attachedPhotos,
          rigType,
          stayDate,
        });
        showToast('Review updated successfully!', 'success');
      } else {
        const reviewPayload: Omit<Review, 'id' | 'createdAt'> = {
          spotId: spot.id,
          travelerId: currentUser.id,
          hostId: spot.hostId || 'public',
          stayRequestId: `req-${Date.now()}`,
          authorId: currentUser.id,
          authorRole: 'traveler',
          ratingOverall,
          categories: {
            accuracy: categories.accuracy,
            communication: categories.roadAccess,
            hospitality: categories.hospitality,
            safety: categories.safety,
            cleanliness: categories.cleanliness,
          },
          wouldWelcomeAgain,
          comment: comment.trim(),
          photos: attachedPhotos,
          rigType,
          stayDate,
        };

        submitReview(reviewPayload);
        showToast('Review submitted! Thank you for helping fellow RVers.', 'success');
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast('Failed to save review. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStars = hoverRating || ratingOverall;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEditMode ? 'Edit Existing Review' : 'Camper Community Field Report'}</span>
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            {isEditMode ? `Edit Review for ${spot.title}` : `Review ${spot.title}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditMode
              ? 'Update your ratings, road condition updates, or add newly taken campsite photos.'
              : 'Share authentic road conditions, leveling, cell reception, and photos to help the boondocking community.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Overall Star Rating */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                Overall Experience Rating
              </span>

              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingOverall(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 focus:outline-none transform hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= activeStars
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <span className="text-xs font-extrabold text-foreground block">
                {RATING_LABELS[activeStars] || 'Select rating'}
              </span>
            </div>

            {/* Sub-categories */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-secondary/30 border border-border text-xs">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Road & Access</label>
                <select
                  value={categories.roadAccess}
                  onChange={(e) => setCategories({ ...categories, roadAccess: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-input bg-background text-xs font-semibold"
                >
                  <option value={5}>5 ★ Smooth / Easy Access</option>
                  <option value={4}>4 ★ Light Gravel / Washboard</option>
                  <option value={3}>3 ★ Moderate Bumps / Slopes</option>
                  <option value={2}>2 ★ Rough / High Clearance</option>
                  <option value={1}>1 ★ Severe / 4WD Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Listing Accuracy</label>
                <select
                  value={categories.accuracy}
                  onChange={(e) => setCategories({ ...categories, accuracy: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-input bg-background text-xs font-semibold"
                >
                  <option value={5}>5 ★ Exactly as described</option>
                  <option value={4}>4 ★ Mostly accurate</option>
                  <option value={3}>3 ★ Some differences</option>
                  <option value={2}>2 ★ Inaccurate rig limits</option>
                  <option value={1}>1 ★ Misleading listing</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Cleanliness</label>
                <select
                  value={categories.cleanliness}
                  onChange={(e) => setCategories({ ...categories, cleanliness: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-input bg-background text-xs font-semibold"
                >
                  <option value={5}>5 ★ Pristine / Zero trash</option>
                  <option value={4}>4 ★ Well kept</option>
                  <option value={3}>3 ★ Minor litter</option>
                  <option value={2}>2 ★ Needs cleaning</option>
                  <option value={1}>1 ★ Heavy trash / neglected</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Safety & Feeling</label>
                <select
                  value={categories.safety}
                  onChange={(e) => setCategories({ ...categories, safety: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-input bg-background text-xs font-semibold"
                >
                  <option value={5}>5 ★ Felt completely safe</option>
                  <option value={4}>4 ★ Very safe</option>
                  <option value={3}>3 ★ Average</option>
                  <option value={2}>2 ★ Felt uneasy</option>
                  <option value={1}>1 ★ Unsafe</option>
                </select>
              </div>
            </div>

            {/* Rig and Date Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Your RV / Rig Type</label>
                <div className="relative">
                  <Truck className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={rigType}
                    onChange={(e) => setRigType(e.target.value)}
                    placeholder="e.g. 28ft Class C, 20ft Van, 35ft Fifth Wheel"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Date of Visit</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="date"
                    required
                    value={stayDate}
                    onChange={(e) => setStayDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Your Review & Camper Tips
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share helpful tips for fellow campers: access road conditions, turn-around ease, level spots, cellular signal (Verizon/AT&T/T-Mobile), noise level, or views..."
                className="w-full p-3 rounded-2xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed"
              />
            </div>

            {/* Photo Contribution Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Attach Real Photos (Optional)</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {attachedPhotos.length} photo{attachedPhotos.length === 1 ? '' : 's'} attached
                </span>
              </div>

              {/* Upload Controls */}
              <div className="flex border-b border-border mb-3">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                    uploadMode === 'file'
                      ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Device File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-1.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                    uploadMode === 'url'
                      ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Image URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                <label className="border-2 border-dashed border-border hover:border-emerald-600 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-secondary/30 hover:bg-emerald-50/20">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-emerald-700 dark:text-emerald-400 mb-1" />
                  <span className="text-xs font-bold text-foreground">Click to upload photos from device</span>
                  <span className="text-[10px] text-muted-foreground">JPG, PNG, WebP (multiple files supported)</span>
                </label>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="https://.../campsite-view.jpg"
                    className="flex-1 p-2 rounded-xl border border-input bg-background text-xs text-foreground"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddUrlPhoto}
                    disabled={!photoUrlInput.trim()}
                    className="shrink-0 text-xs font-bold"
                  >
                    Add URL
                  </Button>
                </div>
              )}

              {/* Attached Photos Thumbnail Preview */}
              {attachedPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  {attachedPhotos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-border group">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Would Welcome / Recommend */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="would-recommend"
                checked={wouldWelcomeAgain}
                onChange={(e) => setWouldWelcomeAgain(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-border"
              />
              <label htmlFor="would-recommend" className="text-xs font-semibold text-foreground cursor-pointer">
                I would stay here again and recommend this spot to fellow campers
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm"
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    {isEditMode ? 'Saving Changes...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {isEditMode ? 'Save Updated Review' : 'Submit Review & Photos'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
