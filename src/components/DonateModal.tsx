import { bindCMSValue, getCMSCopy } from '../cms/runtime';
import { getCMSLink } from '../cms/links';
import React, { useEffect } from 'react';
import { X, Heart, Building2, Users, Landmark, ShieldCheck, Phone, Mail, MapPin, Clock, ArrowUpRight } from 'lucide-react';

/**
 * Ways to contribute to the foundation.
 *
 * This is a redesign of nirankarifoundation.org/donate/ — the same information,
 * organised as three ways to give plus the practical details, instead of one
 * long column with the FAQ buried at the bottom.
 *
 * It deliberately does NOT take payment, and it no longer hands off to
 * nirankarifoundation.org/donate/ either: this site replaces that domain and
 * it is being decommissioned, so the old link would send donors somewhere
 * that is going away — the worst possible destination for someone about to
 * enter card details.
 *
 * PENDING: the Razorpay / PayUmoney checkout and the receipting still live
 * behind that old page. Until a replacement payment address exists, the
 * primary action is a real conversation with the accounts team, and the
 * offline routes below (cheque, bank, counter) are complete and usable as
 * they stand. Point DONATE_URL at the new checkout when there is one and
 * restore the button.
 */

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

let WAYS = bindCMSValue(() => ([
  {
    icon: Users,
    title: getCMSCopy("copy.DonateModal.3e668943d374", "As an Individual"),
    body: getCMSCopy("copy.DonateModal.b2f17b50cfe5", "A personal contribution of any size, given once or whenever you are able."),
  },
  {
    icon: Building2,
    title: getCMSCopy("copy.DonateModal.f45a5e04aae6", "As a Corporate"),
    body: getCMSCopy("copy.DonateModal.abc0c507ea90", "Company giving and CSR partnerships directed at the foundation’s programmes."),
  },
  {
    icon: Landmark,
    title: getCMSCopy("copy.DonateModal.29e98f698033", "As a Society or Foundation"),
    body: getCMSCopy("copy.DonateModal.d287e37ac350", "Institutional grants and partnerships between organisations working alongside us."),
  },
]), value => { WAYS = value; });

let METHODS = bindCMSValue(() => ([
  {
    title: getCMSCopy("copy.DonateModal.0d21bd52022c", "Online"),
    body: getCMSCopy("copy.DonateModal.6ac7e156e834", "Debit card, credit card, net banking, bank transfer, e-wallets and UPI — handled by Razorpay (powered by HDFC Bank) and PayUmoney."),
  },
  {
    title: getCMSCopy("copy.DonateModal.172fbeaeda3b", "Cheque or DD"),
    body: getCMSCopy("copy.DonateModal.4511c3b7229d", "Drawn in favour of “Sant Nirankari Charitable Foundation”, payable at Delhi, posted to the office or submitted at your nearest branch."),
  },
  {
    title: getCMSCopy("copy.DonateModal.5cf02dbb1e63", "In person"),
    body: getCMSCopy("copy.DonateModal.38d4e3fd8526", "By card at the SNCF office in Nirankari Colony on working days, 9:30 AM – 6:00 PM, or at the SNCF counter during Sunday Satsang in Delhi."),
  },
]), value => { METHODS = value; });

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
      aria-label={getCMSCopy("copy.DonateModal.ca9e7065cc38", "Ways to contribute")}
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
            aria-label={getCMSCopy("copy.DonateModal.7d9eb7acb13e", "Close")}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white/80 hover:text-white grid place-items-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/85">{getCMSCopy("copy.DonateModal.a5e07daca875", "How to give")}</span>
          </div>

          <h2 className="font-dancing-script font-bold text-white leading-none mb-3 text-[clamp(2.5rem,6vw,3.75rem)] drop-shadow">{getCMSCopy("copy.DonateModal.97b0c61b99f6", "Contribute")}</h2>

          <p className="text-white/90 text-sm sm:text-base max-w-2xl leading-relaxed">{getCMSCopy("copy.DonateModal.b90c0ed18088", "SNCF heals, enriches and empowers the less fortunate to reach their potential and lead a more fulfilling life — irrespective of race, caste, creed, colour or nationality. You can join this movement by gifting your time, talent or treasure.")}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={getCMSLink("copy.Link.DonateModal.0ad460126563", "mailto:accounts@nirankarifoundation.org?subject=Contributing%20to%20SNCF")}
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-neutral-900 font-bold text-sm shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >{getCMSCopy("copy.DonateModal.08d4574fb8eb", "Talk to the accounts team")}<ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-white/75">
              <ShieldCheck className="w-3.5 h-3.5" />{getCMSCopy("copy.DonateModal.5210e7a0aa69", "Donations are deductible u/s 80G(5)(vi)")}</span>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-8">
          {/* Three ways to give */}
          <section>
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-400 mb-4">{getCMSCopy("copy.DonateModal.a227814cb736", "Monetary gifts")}</h3>
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
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-400 mb-4">{getCMSCopy("copy.DonateModal.ca9e7065cc38", "Ways to contribute")}</h3>
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
            <p className="text-[13px] text-white/85 leading-relaxed">{getCMSCopy("copy.DonateModal.5ffbded46693", "Donations to Sant Nirankari Charitable Foundation are tax deductible under section ")}<span className="font-semibold text-white">{getCMSCopy("copy.DonateModal.dfd680b022db", "80G(5)(vi)")}</span>{getCMSCopy("copy.DonateModal.b9128d48c204", " of the Income Tax Act, 1961. Contributions are accepted in Indian Rupees.")}</p>
          </div>

          {/* Practical details */}
          <section className="border-t border-white/10 pt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-neutral-500 flex-none mt-0.5" />
              <p className="text-[13px] text-neutral-400 leading-relaxed">{getCMSCopy("copy.DonateModal.a01941bf3134", "Sant Nirankari Charitable Foundation")}<br />{getCMSCopy("copy.DonateModal.beb1d4c609ce", "80-A, Avtar Marg, Sant Nirankari Colony, Delhi 110009")}</p>
            </div>
            <div className="space-y-2.5">
              <a
                href={getCMSLink("copy.Link.DonateModal.e3dc1a537132", "tel:+911147660380")}
                className="flex items-center gap-3 text-[13px] text-neutral-400 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-neutral-500 flex-none" />{getCMSCopy("copy.DonateModal.a4c324b95c22", "011-47660380")}</a>
              <a
                href={getCMSLink("copy.Link.DonateModal.536060a063aa", "mailto:accounts@nirankarifoundation.org")}
                className="flex items-center gap-3 text-[13px] text-neutral-400 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4 text-neutral-500 flex-none" />{getCMSCopy("copy.DonateModal.bee1eacddce6", "accounts@nirankarifoundation.org")}</a>
              <p className="flex items-center gap-3 text-[13px] text-neutral-400">
                <Clock className="w-4 h-4 text-neutral-500 flex-none" />{getCMSCopy("copy.DonateModal.6a795d9b33d1", "Office counter 9:30 AM – 6:00 PM, working days")}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
