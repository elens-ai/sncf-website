import React, { useEffect } from 'react';
import { X, Heart, Building2, Users, Landmark, ShieldCheck, Phone, Mail, MapPin, Clock, ArrowUpRight } from 'lucide-react';

/**
 * Ways to contribute to the foundation.
 *
 * This is a redesign of nirankarifoundation.org/donate/ — the same information,
 * organised as three ways to give plus the practical details, instead of one
 * long column with the FAQ buried at the bottom.
 *
 * It deliberately does NOT take payment. Every path to giving hands off to the
 * foundation's own donation page, which is where the Razorpay / PayUmoney
 * integration and the receipting live. A second payment surface would be a
 * second thing to secure, and donors should see the official domain in the
 * address bar when they enter card details.
 */

const DONATE_URL = 'https://nirankarifoundation.org/donate/';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WAYS = [
  {
    icon: Users,
    title: 'As an Individual',
    body: 'A personal contribution of any size, given once or whenever you are able.',
  },
  {
    icon: Building2,
    title: 'As a Corporate',
    body: 'Company giving and CSR partnerships directed at the foundation’s programmes.',
  },
  {
    icon: Landmark,
    title: 'As a Society or Foundation',
    body: 'Institutional grants and partnerships between organisations working alongside us.',
  },
];

const METHODS = [
  {
    title: 'Online',
    body: 'Debit card, credit card, net banking, bank transfer, e-wallets and UPI — handled by Razorpay (powered by HDFC Bank) and PayUmoney.',
  },
  {
    title: 'Cheque or DD',
    body: 'Drawn in favour of “Sant Nirankari Charitable Foundation”, payable at Delhi, posted to the office or submitted at your nearest branch.',
  },
  {
    title: 'In person',
    body: 'By card at the SNCF office in Nirankari Colony on working days, 9:30 AM – 6:00 PM, or at the SNCF counter during Sunday Satsang in Delhi.',
  },
];

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="donate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Ways to contribute"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="donate-modal-panel"
        className="relative w-full max-w-4xl my-auto rounded-[32px] bg-neutral-950/95 border border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Masthead, tinted with the live stage accents so the panel belongs to
            whatever the hero is showing behind it. */}
        <div
          className="relative px-5 sm:px-8 pt-7 pb-6"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--accent-a) 55%, transparent), color-mix(in srgb, var(--accent-b) 28%, transparent))',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white/80 hover:text-white grid place-items-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/85">
              How to give
            </span>
          </div>

          <h2 className="font-dancing-script font-bold text-white leading-none mb-3 text-[clamp(2.5rem,6vw,3.75rem)] drop-shadow">
            Contribute
          </h2>

          <p className="text-white/90 text-sm sm:text-base max-w-2xl leading-relaxed">
            SNCF heals, enriches and empowers the less fortunate to reach their potential
            and lead a more fulfilling life — irrespective of race, caste, creed, colour or
            nationality. You can join this movement by gifting your time, talent or treasure.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-neutral-900 font-bold text-sm shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Contribute Now
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/75">
              <ShieldCheck className="w-3.5 h-3.5" />
              Completed on the foundation’s official site
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-8">
          {/* Three ways to give */}
          <section>
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-400 mb-4">
              Monetary gifts
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {WAYS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:bg-white/[0.07] transition-colors"
                >
                  <Icon className="w-5 h-5 mb-2.5" style={{ color: 'var(--accent-b)' }} />
                  <p className="font-semibold text-white text-sm mb-1.5">{title}</p>
                  <p className="text-[13px] text-neutral-400 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How the money can reach the foundation */}
          <section>
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-400 mb-4">
              Ways to contribute
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {METHODS.map(({ title, body }) => (
                <div key={title} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <p className="font-semibold text-white text-sm mb-1.5">{title}</p>
                  <p className="text-[13px] text-neutral-400 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 80G — the single most asked question, so it is not buried. */}
          <div
            className="rounded-2xl p-4 flex items-start gap-3 border"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-b) 35%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--accent-a) 14%, transparent)',
            }}
          >
            <ShieldCheck className="w-5 h-5 flex-none mt-0.5" style={{ color: 'var(--accent-b)' }} />
            <p className="text-[13px] text-white/85 leading-relaxed">
              Donations to Sant Nirankari Charitable Foundation are tax deductible under
              section <span className="font-semibold text-white">80G(5)(vi)</span> of the
              Income Tax Act, 1961. Contributions are accepted in Indian Rupees.
            </p>
          </div>

          {/* Practical details */}
          <section className="border-t border-white/10 pt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-neutral-500 flex-none mt-0.5" />
              <p className="text-[13px] text-neutral-400 leading-relaxed">
                Sant Nirankari Charitable Foundation
                <br />
                80-A, Avtar Marg, Sant Nirankari Colony, Delhi 110009
              </p>
            </div>
            <div className="space-y-2.5">
              <a
                href="tel:+911147660380"
                className="flex items-center gap-3 text-[13px] text-neutral-400 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-neutral-500 flex-none" />
                011-47660380
              </a>
              <a
                href="mailto:accounts@nirankarifoundation.org"
                className="flex items-center gap-3 text-[13px] text-neutral-400 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-neutral-500 flex-none" />
                accounts@nirankarifoundation.org
              </a>
              <p className="flex items-center gap-3 text-[13px] text-neutral-400">
                <Clock className="w-4 h-4 text-neutral-500 flex-none" />
                Office counter 9:30 AM – 6:00 PM, working days
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
