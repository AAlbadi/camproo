import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
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
import {
  LifeBuoy,
  Send,
  Mail,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SupportInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: string;
  defaultSubject?: string;
}

export const SupportInquiryModal: React.FC<SupportInquiryModalProps> = ({
  isOpen,
  onClose,
  defaultTopic = 'General Support & Inquiry',
  defaultSubject = ''
}) => {
  const { currentUser } = useApp();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [topic, setTopic] = useState(defaultTopic);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (currentUser?.name && !name) setName(currentUser.name);
      if (currentUser?.email && !email) setEmail(currentUser.email);
      if (defaultTopic) setTopic(defaultTopic);
      if (defaultSubject) setSubject(defaultSubject);
      setSubmitted(false);
    }
  }, [isOpen, defaultTopic, defaultSubject, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      showToast('Please enter a valid contact email.', 'warning');
      return;
    }

    if (!message.trim()) {
      showToast('Please enter your inquiry details or question.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/support/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || currentUser?.name || 'CampRoo Roamer',
          email: email.trim(),
          topic,
          subject: subject.trim() || topic,
          message: message.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
        showToast('Your inquiry has been sent to CampRoo Support! 📬', 'success');
      } else {
        showToast(data.message || 'Could not send message. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Network error submitting inquiry. Please email us directly.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleResetAndClose()}>
      <DialogContent className="max-w-lg">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-xs border border-sky-200 dark:border-sky-800">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle>CampRoo Support & Inquiries</DialogTitle>
                <Badge variant="sage" className="text-[10px] uppercase font-bold py-0.5">
                  Direct Desk
                </Badge>
              </div>
              <DialogDescription>
                Reach our team for spot help, rig clearance questions, or inquiries.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <DialogBody>
          {submitted ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground">Inquiry Dispatched!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Thank you, <strong>{name || 'Fellow Roamer'}</strong>. Your inquiry has been forwarded directly to our support desk. A confirmation receipt has also been sent to <strong>{email}</strong>.
                </p>
              </div>
              <div className="pt-2">
                <Button variant="outdoor" onClick={handleResetAndClose} className="font-bold">
                  Back to CampRoo
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Direct Support Email Callout */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-sky-800 dark:text-sky-300">
                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                    Support & Direct Inquiry
                  </span>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Average reply &lt; 24h
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                  <p className="text-xs font-semibold leading-snug">
                    For direct support & inquiries: <strong className="text-sky-950 dark:text-white underline select-all">aalbadi1911@gmail.com</strong>
                  </p>
                  <a
                    href="mailto:aalbadi1911@gmail.com?subject=CampRoo%20Support%20Inquiry"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-sky-900 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-white font-bold text-[11px] hover:bg-sky-100 transition-colors shrink-0 shadow-2xs"
                  >
                    <span>Email Directly</span>
                    <Send className="w-3 h-3 text-sky-600" />
                  </a>
                </div>
              </div>

              {/* Form inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Your Name</label>
                  <Input
                    placeholder="e.g. Aziz or Sarah"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Your Email Address</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Topic Select */}
              <div>
                <label className="font-bold text-foreground block mb-1">Inquiry Topic</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full h-10 px-3 rounded-2xl border border-input bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="General Support & Inquiry">General Support & Inquiry</option>
                  <option value="Spot Verification & Host Inquiry">Spot Verification & Host Inquiry</option>
                  <option value="Rig Clearance & Road Access">Rig Clearance & Road Access Question</option>
                  <option value="Account & Login Assistance">Account & Login Assistance</option>
                  <option value="Safety & Moderation Report">Safety & Moderation Support</option>
                  <option value="Community Partnership">Partnership & Community</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="font-bold text-foreground block mb-1">Subject</label>
                <Input
                  placeholder="e.g. Question about 40ft Class A pad clearance"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              {/* Message */}
              <div>
                <label className="font-bold text-foreground block mb-1">Your Inquiry / Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us how we can help you with your CampRoo experience..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-input bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleResetAndClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 font-bold"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Dispatching...' : 'Send Inquiry'}</span>
                </Button>
              </div>
            </form>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
