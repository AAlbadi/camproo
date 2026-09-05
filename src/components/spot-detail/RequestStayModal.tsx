import React, { useState } from 'react';
import { Spot } from '../../types';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { RV_TYPE_LABELS, RVType } from '../../types';
import { Calendar as CalendarIcon, Truck, Users, Send, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';

interface RequestStayModalProps {
  spot: Spot;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestStayModal: React.FC<RequestStayModalProps> = ({ spot, onClose, onSuccess }) => {
  const { currentUser, submitStayRequest } = useApp();
  const { showToast } = useToast();

  const getInitialDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 3);
    return {
      arrival: tomorrow.toISOString().split('T')[0],
      departure: dayAfter.toISOString().split('T')[0],
    };
  };

  const initialDates = getInitialDates();
  const [arrivalDate, setArrivalDate] = useState(initialDates.arrival);
  const [departureDate, setDepartureDate] = useState(initialDates.departure);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateFieldPicking, setDateFieldPicking] = useState<'arrival' | 'departure'>('arrival');
  const [guestCount, setGuestCount] = useState(2);
  const [rvType, setRvType] = useState<RVType>(currentUser.rig.type || 'class_c');
  const [rigLength, setRigLength] = useState<number>(currentUser.rig.lengthFt || 28);
  const [personalNote, setPersonalNote] = useState(
    `Hi! We are traveling through the area in our ${currentUser.rig.lengthFt || 28}ft ${
      RV_TYPE_LABELS[currentUser.rig.type] || 'RV'
    } and would love to stay with you. We are completely self-contained and clean.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nights calculation
  const calculateNights = () => {
    const start = new Date(arrivalDate).getTime();
    const end = new Date(departureDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const nights = calculateNights();
  const isTooLong = rigLength > spot.rigCompatibility.maxLengthFt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTooLong) {
      showToast(`Cannot request: Your rig (${rigLength}ft) exceeds the host's ${spot.rigCompatibility.maxLengthFt}ft limit.`, 'error');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      submitStayRequest({
        spotId: spot.id,
        travelerId: currentUser.id,
        hostId: spot.hostId,
        arrivalDate,
        departureDate,
        nights,
        guestCount,
        travelerRig: {
          type: rvType,
          lengthFt: rigLength,
          description: `${rigLength}ft ${RV_TYPE_LABELS[rvType]}`,
        },
        personalNote,
        arrivalTimeEst: '4:00 PM',
      });

      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
      });

      showToast(`Stay request sent to host! Free peer-to-peer stay pending approval.`, 'success');
      setIsSubmitting(false);
      onSuccess();
    }, 400);
  };

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src="/images/camproo_app_icon.jpg"
              alt="CampRoo Mascot"
              className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-roo-200 shrink-0"
            />
            <div>
              <DialogTitle>Request a Free Stay</DialogTitle>
              <DialogDescription>
                {spot.title} · {spot.locationName}, {spot.generalArea}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Free pricing summary banner */}
            <div className="p-3.5 rounded-2xl bg-secondary/80 border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Nightly Rate
                </span>
                <span className="text-base font-black text-foreground">$0 USD (Free Peer Stay)</span>
              </div>
              <Badge variant="free">100% Free</Badge>
            </div>

            {/* Dates Picker */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">Arrival Date</label>
                <button
                  type="button"
                  onClick={() => {
                    setDateFieldPicking('arrival');
                    setShowCalendar(!showCalendar);
                  }}
                  className="w-full h-11 px-3 rounded-2xl border border-input bg-background flex items-center justify-between text-xs font-bold text-foreground hover:bg-muted/40 transition-colors"
                >
                  <span>{new Date(arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <CalendarIcon className="w-4 h-4 text-primary" />
                </button>
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">Departure Date</label>
                <button
                  type="button"
                  onClick={() => {
                    setDateFieldPicking('departure');
                    setShowCalendar(!showCalendar);
                  }}
                  className="w-full h-11 px-3 rounded-2xl border border-input bg-background flex items-center justify-between text-xs font-bold text-foreground hover:bg-muted/40 transition-colors"
                >
                  <span>{new Date(departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <CalendarIcon className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>

            {/* Interactive shadcn Calendar Drawer */}
            {showCalendar && (
              <div className="p-2 rounded-2xl border border-border bg-card">
                <div className="text-[10px] font-bold text-muted-foreground px-2 pb-1">
                  Selecting {dateFieldPicking === 'arrival' ? 'Arrival' : 'Departure'} Date:
                </div>
                <Calendar
                  selectedDate={dateFieldPicking === 'arrival' ? arrivalDate : departureDate}
                  onSelectDate={(date) => {
                    if (dateFieldPicking === 'arrival') {
                      setArrivalDate(date);
                      setDateFieldPicking('departure');
                    } else {
                      setDepartureDate(date);
                      setShowCalendar(false);
                    }
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {/* Guests & Rig Details */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>Traveling Vehicle Info</span>
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Pad Limit: {spot.rigCompatibility.maxLengthFt}ft
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">RV Class</label>
                  <select
                    value={rvType}
                    onChange={e => setRvType(e.target.value as RVType)}
                    className="w-full h-11 p-2 rounded-2xl border border-input bg-background text-xs font-bold text-foreground"
                  >
                    {Object.entries(RV_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">Your Rig Length (ft)</label>
                  <Input
                    type="number"
                    min={10}
                    max={45}
                    value={rigLength}
                    onChange={e => setRigLength(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Clearance Check Alert */}
              {isTooLong ? (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Warning: Rig exceeds maximum pad length of {spot.rigCompatibility.maxLengthFt} ft!</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Rig fits comfortably on this {spot.rigCompatibility.maxLengthFt}ft pad ({spot.rigCompatibility.maxLengthFt - rigLength}ft margin).</span>
                </div>
              )}
            </div>

            {/* Note to Host */}
            <div>
              <label className="font-bold text-foreground block mb-1">Introduction Note to Host</label>
              <textarea
                rows={3}
                required
                value={personalNote}
                onChange={e => setPersonalNote(e.target.value)}
                className="w-full p-3 rounded-2xl border border-input bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isTooLong}
                className="gap-2 font-bold"
              >
                <Send className="w-4 h-4" />
                <span>Submit Request ({nights} {nights === 1 ? 'Night' : 'Nights'})</span>
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
