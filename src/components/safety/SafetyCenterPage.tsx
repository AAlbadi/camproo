import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  Lock,
  Eye,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export const SafetyCenterPage: React.FC = () => {
  const { currentUser, submitReport } = useApp();
  const { showToast } = useToast();

  const [reportTargetType, setReportTargetType] = useState<'user' | 'spot'>('spot');
  const [reportTargetName, setReportTargetName] = useState('');
  const [reportReason, setReportReason] = useState('Safety concern');
  const [reportDetails, setReportDetails] = useState('');

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetName || !reportDetails) return;

    submitReport({
      reporterId: currentUser.id,
      reportedTargetType: reportTargetType,
      targetId: `target-${Date.now()}`,
      targetName: reportTargetName,
      reason: reportReason,
      details: reportDetails,
    });

    showToast('Report filed confidentially with CampRoo Safety Rangers.', 'success');
    setReportTargetName('');
    setReportDetails('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white rounded-3xl p-8 border border-cream-200 shadow-soft">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            COMMUNITY TRUST & SAFETY
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight">
            CampRoo Trust & Safety Center
          </h1>
          <p className="text-sm text-cream-900/70 leading-relaxed font-normal">
            CampRoo is founded on mutual respect, verified traveler identities, and genuine hospitality.
            Find a spot. Share a spot. Keep roaming safely across America.
          </p>
        </div>
        <img
          src="/images/camproo_logo_square.jpg"
          alt="CampRoo Safety Pledge"
          className="w-28 h-28 rounded-3xl object-contain shadow-md border border-roo-100 shrink-0"
        />
      </div>

      {/* Safety Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-forest-950">Multi-Tier Verification</h3>
          <p className="text-xs text-cream-900/70 leading-relaxed font-normal">
            Every member verifies email, mobile phone, and government photo ID before requesting stays. Verified RV ownership badges assure hosts of legitimate rigs.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-forest-950">Address Privacy Shield</h3>
          <p className="text-xs text-cream-900/70 leading-relaxed font-normal">
            Hosts never have their private home addresses exposed publicly. Approximate neighborhood pins appear in search; exact street gates unlock only after mutual agreement.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-cream-200 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-forest-950">Reciprocal Reviews</h3>
          <p className="text-xs text-cream-900/70 leading-relaxed font-normal">
            Both hosts and travelers rate each other across 5 core criteria (Communication, Accuracy, Hospitality, Safety, Cleanliness), including the signature "Would you welcome again?" badge.
          </p>
        </div>
      </div>

      {/* Guidelines for Hosts & Guests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* For Guests */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-soft space-y-4">
          <h3 className="text-lg font-extrabold text-forest-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-roo-500" />
            <span>Guidelines for Roamers (Guests)</span>
          </h3>
          <ul className="space-y-2.5 text-xs text-cream-900/80">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Respect the property:</strong> Never leave trash or gray water on host land. Leave the space cleaner than you found it.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Adhere to arrival times:</strong> Notify your host promptly if traffic delays your estimated arrival.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Manage electrical loads:</strong> Stagger heavy AC/microwave use on 30A pedestals to protect host breakers.</span>
            </li>
          </ul>
        </div>

        {/* For Hosts */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-soft space-y-4">
          <h3 className="text-lg font-extrabold text-forest-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forest-700" />
            <span>Guidelines for Hosts</span>
          </h3>
          <ul className="space-y-2.5 text-xs text-cream-900/80">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Clear clearances:</strong> Accurately list any low tree branches, narrow cattle gates, or soft unpaved shoulders.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>100% Free:</strong> Never ask travelers for nightly rates or commercial fees. Enjoy pure peer hospitality.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Gatekeeper controls:</strong> You retain complete discretion to accept or decline any stay request.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Confidential Report Submission Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-soft space-y-5">
        <div>
          <h3 className="text-lg font-extrabold text-forest-950 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>File a Confidential Safety Report</span>
          </h3>
          <p className="text-xs text-cream-900/60 mt-1">
            Reports are immediately audited by CampRoo community moderators. Your identity is kept strictly confidential.
          </p>
        </div>

        <form onSubmit={handleReport} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-forest-950 block mb-1">Target Type</label>
            <select
              value={reportTargetType}
              onChange={e => setReportTargetType(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-cream-300 text-xs font-semibold text-forest-950"
            >
              <option value="spot">Report a Spot / Property</option>
              <option value="user">Report a User / Member</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-forest-950 block mb-1">Spot Name or User Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Desert Roo Pad or User Name"
              value={reportTargetName}
              onChange={e => setReportTargetName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-cream-300 text-xs text-forest-950"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-forest-950 block mb-1">Reason</label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-cream-300 text-xs font-semibold text-forest-950"
            >
              <option value="Safety concern">Safety or Physical Hazard</option>
              <option value="Commercial solicitation">Commercial Solicitation / Fee Demand</option>
              <option value="Inaccurate listing">Inaccurate Dimensions / Ground Conditions</option>
              <option value="Inappropriate communication">Inappropriate or Unwelcoming Behavior</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-forest-950 block mb-1">Explanation & Details</label>
            <textarea
              rows={3}
              required
              placeholder="Provide context to assist our Ranger moderation audit..."
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-cream-300 text-xs text-cream-900"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-soft transition-all"
            >
              Submit Confidential Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
