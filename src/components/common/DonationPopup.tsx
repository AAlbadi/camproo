import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, X, ExternalLink, HelpCircle, Check, DollarSign } from 'lucide-react';

interface DonationPopupProps {
  position?: 'bottom-left' | 'bottom-right';
}

const PRESET_AMOUNTS = [
  { amount: 3, label: '$3', description: '1 Coffee ☕' },
  { amount: 5, label: '$5', description: '2 Coffees ☕☕', popular: true },
  { amount: 10, label: '$10', description: 'Campfire Hero 🔥' },
  { amount: 25, label: '$25', description: 'Server Fuel 🚀' },
];

export const DonationPopup: React.FC<DonationPopupProps> = ({ position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [hasCopiedEnv, setHasCopiedEnv] = useState(false);

  // Read donation URL from Vite env or fallback
  const donationUrl = import.meta.env.VITE_DONATION_URL || 'https://buymeacoffee.com/camproo';
  const kofiUrl = import.meta.env.VITE_KOFI_URL || 'https://ko-fi.com';
  const paypalUrl = import.meta.env.VITE_PAYPAL_URL;

  // Check if closed previously
  useEffect(() => {
    const dismissedAt = localStorage.getItem('camproo_donation_dismissed_at');
    if (!dismissedAt) {
      // Auto-open softly after 4 seconds on first visit
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('camproo_donation_dismissed_at', Date.now().toString());
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const getTargetUrl = () => {
    const finalAmount = isCustom ? Number(customAmount) || 5 : selectedAmount;
    try {
      const url = new URL(donationUrl);
      if (url.hostname.includes('buymeacoffee.com')) {
        return `${donationUrl}?amount=${finalAmount}`;
      }
      return donationUrl;
    } catch {
      return donationUrl;
    }
  };

  const handleDonate = () => {
    window.open(getTargetUrl(), '_blank', 'noopener,noreferrer');
  };

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText('VITE_DONATION_URL=https://buymeacoffee.com/YOUR_USERNAME');
    setHasCopiedEnv(true);
    setTimeout(() => setHasCopiedEnv(false), 2500);
  };

  const isDefaultLink = donationUrl.includes('camproo');

  const positionClasses = position === 'bottom-left' 
    ? 'bottom-6 left-6 items-start' 
    : 'bottom-5 right-5 sm:right-6 md:right-16 lg:right-18 items-end';

  return (
    <div className={`fixed ${positionClasses} z-40 select-none font-sans flex flex-col`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="mb-3 w-80 sm:w-96 rounded-3xl bg-white/95 dark:bg-dark-900/95 backdrop-blur-xl border border-roo-200/80 dark:border-dark-700 shadow-2xl overflow-hidden p-5 text-dark-900 dark:text-cream-50"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-roo-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-roo-500/20">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight flex items-center gap-1.5 text-dark-900 dark:text-white">
                    Support Camproo
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-roo-100 text-roo-700 dark:bg-roo-950/60 dark:text-roo-300">
                      Creator ☕
                    </span>
                  </h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">
                    Keep this website independent & alive
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close donation popup"
                className="p-1.5 rounded-xl text-dark-400 hover:text-dark-700 hover:bg-cream-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pitch Text */}
            <p className="text-xs leading-relaxed text-dark-600 dark:text-dark-300 mb-4 bg-cream-50/70 dark:bg-dark-800/60 p-3 rounded-2xl border border-cream-200/60 dark:border-dark-700/50">
              I'm building this website to help travelers & RVers find scenic spots without corporate paywalls. A small coffee helps pay for database, maps, and server costs! ⛺
            </p>

            {/* Preset Amount Badges */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Select amount</span>
                <span className="text-roo-500 font-bold">
                  {isCustom ? `$${customAmount || '0'}` : `$${selectedAmount}`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map(preset => {
                  const active = !isCustom && selectedAmount === preset.amount;
                  return (
                    <button
                      key={preset.amount}
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedAmount(preset.amount);
                      }}
                      className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl border text-center transition-all ${
                        active
                          ? 'border-roo-500 bg-roo-50 dark:bg-roo-950/40 text-roo-700 dark:text-roo-300 font-bold shadow-sm'
                          : 'border-cream-200 dark:border-dark-700 hover:border-roo-300 bg-white dark:bg-dark-800 text-dark-700 dark:text-cream-200'
                      }`}
                    >
                      {preset.popular && (
                        <span className="absolute -top-2 bg-roo-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow">
                          Popular
                        </span>
                      )}
                      <span className="text-sm font-semibold">{preset.label}</span>
                      <span className="text-[10px] text-dark-400 dark:text-dark-400 mt-0.5 truncate max-w-full">
                        {preset.description.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount toggle */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-xl transition-colors border ${
                    isCustom 
                      ? 'bg-dark-900 text-white dark:bg-cream-100 dark:text-dark-900 border-transparent' 
                      : 'text-dark-500 hover:text-dark-800 dark:text-dark-400 border-cream-200 dark:border-dark-700'
                  }`}
                >
                  Custom amount
                </button>
                {isCustom && (
                  <div className="flex-1 relative flex items-center">
                    <DollarSign className="w-3.5 h-3.5 absolute left-2.5 text-dark-400" />
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 15"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full text-xs pl-7 pr-3 py-1.5 rounded-xl border border-roo-300 focus:outline-none focus:ring-2 focus:ring-roo-500 bg-white dark:bg-dark-800 dark:text-white"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleDonate}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-roo-500 to-amber-500 hover:from-roo-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-roo-500/25 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <Coffee className="w-4 h-4 fill-current" />
              <span>Donate {isCustom ? `$${customAmount || 5}` : `$${selectedAmount}`} on Buy Me a Coffee</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 ml-0.5" />
            </button>

            {/* Secondary links */}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-dark-400 dark:text-dark-500">
              <a
                href={kofiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-roo-500 transition-colors underline-offset-2 hover:underline"
              >
                Ko-fi
              </a>
              <span>•</span>
              {paypalUrl ? (
                <a
                  href={paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-roo-500 transition-colors underline-offset-2 hover:underline"
                >
                  PayPal.me
                </a>
              ) : (
                <span className="text-[11px]">Instant card / Apple Pay accepted</span>
              )}
            </div>

            {/* Website Owner Setup Helper */}
            <div className="mt-3 pt-3 border-t border-cream-200/80 dark:border-dark-800">
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="w-full flex items-center justify-between text-[11px] text-dark-500 dark:text-dark-400 hover:text-roo-600 dark:hover:text-roo-400 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  {isDefaultLink ? '⚡ Site owner: Connect your wallet (1 min)' : 'Donation settings'}
                </span>
                <span className="font-semibold">{showSetupGuide ? 'Hide' : 'Show'}</span>
              </button>

              {showSetupGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 text-[11px] bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-2.5 rounded-xl text-dark-700 dark:text-cream-200 space-y-1.5"
                >
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Fastest way to get approved & receive donations:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-dark-600 dark:text-cream-300">
                    <li>
                      Create a free page at{' '}
                      <a
                        href="https://buymeacoffee.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-roo-600 hover:text-roo-700"
                      >
                        buymeacoffee.com
                      </a>{' '}
                      (instant approval, zero documents).
                    </li>
                    <li>
                      Put your link in your project's <code className="bg-amber-200/60 dark:bg-dark-800 px-1 py-0.5 rounded font-mono">.env</code>:
                    </li>
                  </ol>
                  <div className="flex items-center gap-1.5 mt-1">
                    <code className="flex-1 bg-white dark:bg-dark-900 px-2 py-1 rounded text-[10px] font-mono border border-amber-200 dark:border-dark-700 truncate">
                      VITE_DONATION_URL=https://buymeacoffee.com/YOUR_NAME
                    </code>
                    <button
                      onClick={copyEnvSnippet}
                      className="px-2 py-1 rounded bg-amber-200/70 hover:bg-amber-300 dark:bg-dark-700 dark:hover:bg-dark-600 text-[10px] font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {hasCopiedEnv ? <Check className="w-3 h-3 text-green-600" /> : null}
                      {hasCopiedEnv ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Corner Pill / Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 dark:bg-dark-900/95 backdrop-blur-md border border-roo-300/80 dark:border-dark-700 text-dark-900 dark:text-white shadow-airbnb-hover hover:shadow-subtle-glow transition-all cursor-pointer"
        aria-label="Toggle support creator popup"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-roo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-roo-500"></span>
        </span>
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-roo-500 to-amber-400 flex items-center justify-center text-white text-xs shadow-sm">
          <Coffee className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold tracking-tight">
          Support project
        </span>
        <span className="text-[11px] font-semibold text-roo-600 dark:text-roo-400 ml-0.5">
          ☕
        </span>
      </motion.button>
    </div>
  );
};
