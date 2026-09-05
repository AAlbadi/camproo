import React, { useState } from 'react';
import { Spot, SpotEditType, SpotEditRequest } from '../../types';
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
  Edit3,
  MapPin,
  Truck,
  Flame,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface RequestEditModalProps {
  spot: Spot;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RequestEditModal: React.FC<RequestEditModalProps> = ({
  spot,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, submitSpotEditRequest } = useApp();
  const { showToast } = useToast();

  const [editType, setEditType] = useState<SpotEditType>('road_access');
  const [submitterName, setSubmitterName] = useState(currentUser?.name || 'Verified RVer');
  const [submitterEmail, setSubmitterEmail] = useState(currentUser?.email || '');

  // Category specific fields
  const [suggestedLength, setSuggestedLength] = useState<number>(spot.rigCompatibility.maxLengthFt);
  const [suggestedRoadCondition, setSuggestedRoadCondition] = useState('');
  const [suggestedLat, setSuggestedLat] = useState<number>(spot.coordinates[0]);
  const [suggestedLng, setSuggestedLng] = useState<number>(spot.coordinates[1]);
  const [seasonalNotes, setSeasonalNotes] = useState('');
  const [amenityNotes, setAmenityNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notes.trim()) {
      showToast('Please provide a brief note explaining the requested change.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const suggestedChanges: SpotEditRequest['suggestedChanges'] = {};

      if (editType === 'rig_limits') {
        suggestedChanges.maxLengthFt = suggestedLength;
      } else if (editType === 'road_access') {
        suggestedChanges.roadCondition = suggestedRoadCondition;
      } else if (editType === 'gps_location') {
        suggestedChanges.coordinates = [suggestedLat, suggestedLng];
      } else if (editType === 'closure_season') {
        suggestedChanges.seasonalNotes = seasonalNotes;
      } else if (editType === 'amenities') {
        suggestedChanges.description = amenityNotes;
      }

      submitSpotEditRequest({
        spotId: spot.id,
        spotTitle: spot.title,
        submitterName,
        submitterEmail,
        editType,
        suggestedChanges,
        notes: notes.trim(),
      });

      showToast('Edit request submitted for ranger verification. Thank you for keeping CampRoo accurate!', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast('Could not submit edit request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Crowdsourced Verification</span>
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            Suggest an Edit for {spot.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Found changed road conditions, new rig restrictions, or incorrect coordinates? Let us know so we can update the listing.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Category Selector */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                What information needs updating?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'road_access', label: 'Road & Access', icon: Compass },
                  { id: 'rig_limits', label: 'Rig & Length Limits', icon: Truck },
                  { id: 'gps_location', label: 'GPS Coordinates', icon: MapPin },
                  { id: 'amenities', label: 'Amenities & Water', icon: CheckCircle2 },
                  { id: 'closure_season', label: 'Closure or Fire Ban', icon: Flame },
                  { id: 'general', label: 'General Info', icon: Edit3 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = editType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEditType(item.id as SpotEditType)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200 ring-2 ring-emerald-600/20'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic fields based on category */}
            {editType === 'rig_limits' && (
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-2 text-xs">
                <label className="font-bold text-foreground block">
                  Corrected Maximum RV Length (ft)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="10"
                    max="65"
                    value={suggestedLength}
                    onChange={(e) => setSuggestedLength(Number(e.target.value))}
                    className="w-28 p-2 rounded-xl border border-input bg-background font-mono font-bold text-sm"
                  />
                  <span className="text-muted-foreground text-[11px]">
                    Current listing says: <strong>{spot.rigCompatibility.maxLengthFt} ft</strong>
                  </span>
                </div>
              </div>
            )}

            {editType === 'road_access' && (
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-2 text-xs">
                <label className="font-bold text-foreground block">
                  Current Road Condition & Accessibility
                </label>
                <select
                  value={suggestedRoadCondition}
                  onChange={(e) => setSuggestedRoadCondition(e.target.value)}
                  className="w-full p-2 rounded-xl border border-input bg-background font-semibold"
                >
                  <option value="">Select current ground condition...</option>
                  <option value="paved">Fully Paved / Easy 2WD Access</option>
                  <option value="good_gravel">Graded Gravel - Passenger Car Accessible</option>
                  <option value="washboard">Heavy Washboard / Rutted - Drive Slow</option>
                  <option value="high_clearance">High Clearance Required (Rocks / Dips)</option>
                  <option value="4wd_required">4WD + High Clearance Strictly Required</option>
                  <option value="washed_out">Road Washed Out / Impassable</option>
                </select>
              </div>
            )}

            {editType === 'gps_location' && (
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-2 text-xs">
                <label className="font-bold text-foreground block">
                  Corrected Decimal Coordinates (Latitude, Longitude)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Latitude</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={suggestedLat}
                      onChange={(e) => setSuggestedLat(parseFloat(e.target.value))}
                      className="w-full p-2 rounded-xl border border-input bg-background font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Longitude</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={suggestedLng}
                      onChange={(e) => setSuggestedLng(parseFloat(e.target.value))}
                      className="w-full p-2 rounded-xl border border-input bg-background font-mono font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Current: {spot.coordinates[0].toFixed(5)}, {spot.coordinates[1].toFixed(5)}
                </p>
              </div>
            )}

            {editType === 'closure_season' && (
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-2 text-xs">
                <label className="font-bold text-foreground block">
                  Closure Status / Fire Restriction Details
                </label>
                <input
                  type="text"
                  value={seasonalNotes}
                  onChange={(e) => setSeasonalNotes(e.target.value)}
                  placeholder="e.g. Closed for winter through May 15; Stage 2 fire ban currently in effect"
                  className="w-full p-2 rounded-xl border border-input bg-background font-semibold"
                />
              </div>
            )}

            {editType === 'amenities' && (
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border space-y-2 text-xs">
                <label className="font-bold text-foreground block">
                  Amenities Update (Water, Cell Service, Restroom, Trash)
                </label>
                <input
                  type="text"
                  value={amenityNotes}
                  onChange={(e) => setAmenityNotes(e.target.value)}
                  placeholder="e.g. Vault toilet removed; spigot shut off; Verizon cell signal is 3 bars LTE"
                  className="w-full p-2 rounded-xl border border-input bg-background font-semibold"
                />
              </div>
            )}

            {/* Explanation / Notes */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Details & Explanation <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain what has changed, when you visited, or why this update is needed..."
                className="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Submitter info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Your Name</label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-input bg-background text-xs text-foreground font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Your Email (Optional)</label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="For verification updates"
                  className="w-full p-2 rounded-xl border border-input bg-background text-xs text-foreground font-semibold"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Submit Edit Request
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
