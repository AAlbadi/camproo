import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  Home,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Truck,
  Star,
  Eye,
  PauseCircle,
  PlayCircle,
  Globe,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const HostDashboardPage: React.FC = () => {
  const {
    currentUser,
    spots,
    requests,
    users,
    respondToStayRequest,
    updateSpotStatus,
    setCurrentView,
    setSelectedSpotId,
    setActiveThreadId,
    threads,
  } = useApp();

  const { showToast } = useToast();

  const [responseModalReqId, setResponseModalReqId] = useState<string | null>(null);
  const [responseAction, setResponseAction] = useState<'accepted' | 'declined'>('accepted');
  const [hostResponseNote, setHostResponseNote] = useState('');

  const [spotFilter, setSpotFilter] = useState<'all' | 'public' | 'personal'>('all');

  // Spots hosted by current user
  const mySpots = spots.filter(s => s.hostId === currentUser.id);
  const filteredMySpots = mySpots.filter(s => {
    if (spotFilter === 'public') return s.visibility !== 'personal';
    if (spotFilter === 'personal') return s.visibility === 'personal';
    return true;
  });

  // Requests for this host's spots
  const incomingRequests = requests.filter(r => r.hostId === currentUser.id);
  const pendingRequests = incomingRequests.filter(r => r.status === 'pending');
  const confirmedGuests = incomingRequests.filter(r => r.status === 'accepted');

  const handleOpenResponse = (reqId: string, action: 'accepted' | 'declined') => {
    setResponseModalReqId(reqId);
    setResponseAction(action);
    setHostResponseNote(
      action === 'accepted'
        ? 'Welcome to our spot! The gravel pad is ready. Let us know your estimated arrival time.'
        : 'Sorry, we are unavailable on those dates.'
    );
  };

  const handleConfirmResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseModalReqId) return;

    respondToStayRequest(responseModalReqId, responseAction, hostResponseNote);

    if (responseAction === 'accepted') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast('Stay request accepted! Exact directions unlocked for your guest.', 'success');
    } else {
      showToast('Stay request declined.', 'info');
    }

    setResponseModalReqId(null);
  };

  const handleOpenChat = (travelerId: string, spotId: string, stayReqId: string) => {
    const thread = threads.find(
      t => t.stayRequestId === stayReqId || (t.participants.includes(travelerId) && t.participants.includes(currentUser.id))
    );
    if (thread) {
      setActiveThreadId(thread.id);
      setCurrentView('messages');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight">Host Dashboard</h1>
          <p className="text-xs sm:text-sm text-cream-900/70 mt-1">
            Manage your shared spots, respond to incoming stay requests, and coordinate with fellow rovers.
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentView('host-onboarding');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-5 py-2.5 rounded-2xl bg-forest-900 hover:bg-forest-800 text-cream-50 text-xs font-bold shadow-soft flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4 text-roo-400" />
          <span>Add Another Free Spot</span>
        </button>
      </div>

      {/* Pending Stay Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-forest-950">Pending Stay Inquiries</h2>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-roo-500 text-white text-xs font-bold animate-pulse">
                {pendingRequests.length} New
              </span>
            )}
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-cream-200 text-xs text-cream-900/60">
            No pending stay requests right now. All inquiries are up to date!
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(req => {
              const traveler = users.find(u => u.id === req.travelerId);
              const spot = spots.find(s => s.id === req.spotId);
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 border border-amber-300/80 shadow-float space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cream-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={traveler?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(traveler?.name || 'RVer')}&background=0284c7&color=fff&bold=true`}
                        alt={traveler?.name}
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                      <div>
                        <h3 className="text-base font-extrabold text-forest-950">{traveler?.name}</h3>
                        <p className="text-xs text-cream-900/60">
                          {traveler?.homeRegion} · {traveler?.tripsCompleted} completed stays · ★ {traveler?.rating}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-cream-900/70 font-semibold text-right">
                      Requested spot: <strong className="text-forest-950">{spot?.title}</strong>
                    </div>
                  </div>

                  {/* Trip details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-cream-50">
                      <span className="text-[10px] uppercase font-bold text-forest-700 block">Dates</span>
                      <span className="font-extrabold text-forest-950">{req.arrivalDate} → {req.departureDate}</span>
                      <span className="text-[10px] text-cream-900/60 block">({req.nights} nights)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-cream-50">
                      <span className="text-[10px] uppercase font-bold text-forest-700 block">Rig Class & Length</span>
                      <span className="font-extrabold text-forest-950">{req.travelerRig.lengthFt} ft</span>
                      <span className="text-[10px] text-cream-900/60 block">{req.travelerRig.description}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-cream-50">
                      <span className="text-[10px] uppercase font-bold text-forest-700 block">Travelers</span>
                      <span className="font-extrabold text-forest-950">{req.guestCount} guests</span>
                    </div>

                    <div className="p-3 rounded-xl bg-cream-50">
                      <span className="text-[10px] uppercase font-bold text-forest-700 block">Estimated Arrival</span>
                      <span className="font-extrabold text-forest-950">{req.arrivalTimeEst || '4:00 PM'}</span>
                    </div>
                  </div>

                  {/* Message from traveler */}
                  <div className="p-3.5 rounded-2xl bg-cream-50 text-xs text-cream-900/90 italic">
                    "{req.personalNote}"
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleOpenChat(req.travelerId, req.spotId, req.id)}
                      className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-bold"
                    >
                      Message Traveler
                    </button>
                    <button
                      onClick={() => handleOpenResponse(req.id, 'declined')}
                      className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleOpenResponse(req.id, 'accepted')}
                      className="px-5 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50 text-xs font-bold shadow-soft"
                    >
                      Accept Free Stay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Listed Spots */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-forest-950">My Spots ({mySpots.length})</h2>
            <p className="text-xs text-cream-900/60 mt-0.5">Manage your public peer listings and private saved spots.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-cream-100 p-1 rounded-2xl text-xs font-bold text-cream-900 border border-cream-200">
              <button
                onClick={() => setSpotFilter('all')}
                className={`px-3 py-1 rounded-xl transition-all ${spotFilter === 'all' ? 'bg-forest-900 text-white shadow-xs' : 'text-cream-700 hover:text-forest-950'}`}
              >
                All ({mySpots.length})
              </button>
              <button
                onClick={() => setSpotFilter('public')}
                className={`px-3 py-1 rounded-xl transition-all ${spotFilter === 'public' ? 'bg-forest-900 text-white shadow-xs' : 'text-cream-700 hover:text-forest-950'}`}
              >
                🌐 Public ({mySpots.filter(s => s.visibility !== 'personal').length})
              </button>
              <button
                onClick={() => setSpotFilter('personal')}
                className={`px-3 py-1 rounded-xl transition-all ${spotFilter === 'personal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-cream-700 hover:text-forest-950'}`}
              >
                🔒 Personal ({mySpots.filter(s => s.visibility === 'personal').length})
              </button>
            </div>

            <button
              onClick={() => {
                setCurrentView('host-onboarding');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Share Spot</span>
            </button>
          </div>
        </div>

        {filteredMySpots.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-cream-200 text-center space-y-3">
            <p className="text-xs text-cream-900/70">No spots found matching this filter.</p>
            <button
              onClick={() => {
                setCurrentView('host-onboarding');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-bold"
            >
              + Add a Spot Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMySpots.map(spot => (
              <div
                key={spot.id}
                className="bg-white rounded-3xl overflow-hidden border border-cream-200 shadow-soft flex flex-col justify-between"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-cream-200">
                  <img src={spot.photos[0] || '/images/real_rv_camping_hero.jpg'} alt={spot.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {spot.visibility === 'personal' ? (
                      <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm">
                        <Lock className="w-3 h-3" /> PERSONAL SPOT
                      </span>
                    ) : spot.reviewStatus === 'pending_review' ? (
                      <span className="bg-amber-600 text-white px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3" /> UNDER REVIEW
                      </span>
                    ) : (
                      <span className="bg-forest-900 text-cream-50 px-2.5 py-1 rounded-xl text-xs font-black shadow-sm">
                        100% FREE
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 px-2 py-0.5 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{spot.rating}</span>
                  </div>
                </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
                    {spot.locationName}, {spot.generalArea}
                  </span>
                  <h3 className="text-lg font-bold text-forest-950 mt-0.5">{spot.title}</h3>
                  <p className="text-xs text-cream-900/70 mt-1 line-clamp-2">{spot.description}</p>
                </div>

                <div className="pt-3 border-t border-cream-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedSpotId(spot.id);
                      setCurrentView('spot-detail');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-forest-900 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Listing</span>
                  </button>

                  <button
                    onClick={() => {
                      const newStatus = spot.status === 'active' ? 'paused' : 'active';
                      updateSpotStatus(spot.id, newStatus);
                      showToast(`Spot ${newStatus === 'active' ? 'activated' : 'paused'}.`, 'info');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      spot.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-cream-200 text-cream-800'
                    }`}
                  >
                    {spot.status === 'active' ? (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 text-cream-600" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Response Note Modal */}
      {responseModalReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-cream-200 shadow-float space-y-4">
            <h3 className="text-base font-extrabold text-forest-950">
              {responseAction === 'accepted' ? 'Accept Stay Request' : 'Decline Stay Request'}
            </h3>
            <form onSubmit={handleConfirmResponse} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-forest-900 block mb-1">
                  Message to Traveler
                </label>
                <textarea
                  rows={3}
                  required
                  value={hostResponseNote}
                  onChange={e => setHostResponseNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs text-cream-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResponseModalReqId(null)}
                  className="px-4 py-2 text-xs font-bold text-cream-900/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-soft ${
                    responseAction === 'accepted' ? 'bg-forest-900 hover:bg-forest-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {responseAction === 'accepted' ? 'Acceptance' : 'Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
