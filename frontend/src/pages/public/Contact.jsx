import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getContact, getTeamMembers, submitContact } from "../../services/public/siteContentService";

const emptyForm = { name: "", email: "", mobile: "", subject: "", message: "" };
const fields = [
  ["name", "नाव", 100], ["email", "ईमेल", 255], ["mobile", "मोबाईल (ऐच्छिक)", 20],
  ["subject", "विषय", 200], ["message", "संदेश", 3000],
];

/* ================= PASSPORT-STYLE TEAM PHOTO ================= */
function TeamMemberPhoto({ member }) {
  const [failed, setFailed] = useState(false);
  const photoUrl = member.photo_url
    ? new URL(
        member.photo_url,
        new URL(api.defaults.baseURL, window.location.origin),
      ).href
    : "";

  return (
    <div className="relative shrink-0">
      {/* Passport photo frame: 3:4 aspect ratio (approx 24×32 on mobile, 28×36 on desktop) */}
      <div className="relative h-32 w-24 overflow-hidden rounded-md border-[3px] border-white bg-white shadow-md ring-1 ring-pb-khaki/30 transition-transform duration-500 group-hover:scale-[1.03] sm:h-36 sm:w-28">
        {photoUrl && !failed ? (
          <img
            src={photoUrl}
            alt={member.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top"
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            role="img"
            aria-label={`Portrait placeholder for ${member.name}`}
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pb-light to-white text-3xl font-black text-pb-khaki sm:text-4xl"
          >
            {member.name?.trim()?.charAt(0)?.toUpperCase() || "P"}
          </div>
        )}
        {/* Subtle inner ring for a printed-photo feel */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-slate-900/5"
        />
      </div>
    </div>
  );
}

function TeamContactDetail({ type, value, href }) {
  const iconPaths = {
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    mobile: <><path d="M7 3h10v18H7z" /><path d="M10 6h4M11 18h2" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-pb-light px-3 py-2.5 text-pb-green transition-colors duration-300 hover:bg-pb-neutral/60">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-neutral text-pb-khaki">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">{iconPaths[type]}</svg>
      </span>
      {href ? (
        <a href={href} className="min-w-0 flex-1 break-all text-sm font-semibold underline decoration-pb-khaki decoration-1 underline-offset-2 hover:text-pb-khaki focus-visible:rounded-sm">{value}</a>
      ) : (
        <p className="min-w-0 flex-1 break-words text-sm font-medium">{value}</p>
      )}
    </div>
  );
}

function Contact() {
  const [contact, setContact] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    getContact().then((result) => setContact(result.data)).catch(() => setContact(null)).finally(() => setLoadingInfo(false));
    getTeamMembers().then((result) => setTeamMembers(Array.isArray(result.data) ? result.data : [])).catch(() => setTeamMembers([])).finally(() => setTeamLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault(); setNotice(null); setSubmitting(true);
    try { const result = await submitContact(form); setNotice({ type: "success", text: result.message || "तुमचा संदेश पाठवला आहे." }); setForm(emptyForm); }
    catch (error) {
      const status = error.response?.status;
      const text = status === 429 ? "कृपया थोड्या वेळाने पुन्हा प्रयत्न करा." : status === 422 ? "कृपया सर्व माहिती तपासून पुन्हा पाठवा." : "संदेश पाठवता आला नाही. कृपया पुन्हा प्रयत्न करा.";
      setNotice({ type: "error", text });
    } finally { setSubmitting(false); }
  };

  const contactRows = [
    ["ईमेल", contact?.email, contact?.email ? `mailto:${contact.email}` : null],
    ["फोन", contact?.phone, contact?.phone ? `tel:${contact.phone}` : null],
    ["पत्ता", contact?.address, null], ["कामकाजाची वेळ", contact?.working_hours, null],
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      {/* ================= ANIMATION KEYFRAMES ================= */}
      <style>{`
        @keyframes blobMove {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.12); }
          66% { transform: translate(-30px, 30px) scale(0.94); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientPan {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-blob { animation: blobMove 20s ease-in-out infinite; }
        .delay-2 { animation-delay: 3s; }
        .delay-4 { animation-delay: 6s; }
        .animate-fade-up { animation: fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-gradient { background-size: 200% 200%; animation: gradientPan 9s ease infinite; }
        .animate-shimmer { animation: shimmer 3.2s ease-in-out infinite; }
        .animate-float-soft { animation: floatSoft 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob, .animate-fade-up, .animate-gradient,
          .animate-shimmer, .animate-float-soft { animation: none !important; }
        }
      `}</style>

      {/* ================= ANIMATED BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-pb-light via-white to-pb-light" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="animate-blob absolute -top-32 -left-28 h-80 w-80 rounded-full bg-pb-khaki/25 blur-3xl" />
        <div className="animate-blob delay-2 absolute top-1/3 -right-28 h-72 w-72 rounded-full bg-pb-green/15 blur-3xl" />
        <div className="animate-blob delay-4 absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-pb-khaki/20 blur-3xl" />
      </div>

      {/* ================= CONTENT WRAPPER ================= */}
      <div className="relative z-10">

        {/* ---------- HERO ---------- */}
        <section className="animate-gradient relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-pb-green via-pb-green to-[#0f3d2e] px-5 pt-12 pb-14 text-white sm:rounded-b-[44px] sm:px-6 sm:py-16 lg:px-8">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#e1d37f]/15 blur-3xl sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-shimmer absolute top-0 left-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl">
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-[#e1d37f]/30 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e1d37f]" />
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#e1d37f] uppercase sm:text-xs sm:tracking-widest">
                संपर्क
              </span>
            </span>

            <h1
              className="animate-fade-up mt-5 text-[1.85rem] leading-[1.3] font-black tracking-tight text-balance sm:mt-6 sm:text-4xl lg:text-5xl"
              style={{ animationDelay: "90ms" }}
            >
              {contact?.heading || "आमच्याशी संपर्क साधा"}
            </h1>

            <p
              className="animate-fade-up mt-4 max-w-2xl text-[15px] leading-[1.9] text-slate-200/90 sm:text-base sm:leading-8"
              style={{ animationDelay: "170ms" }}
            >
              {contact?.description || "प्रश्न किंवा सूचना असल्यास खालील फॉर्मद्वारे संदेश पाठवा."}
            </p>
          </div>
        </section>

        {/* ---------- TEAM ---------- */}
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-2 sm:px-6 lg:px-8">
          <header className="animate-fade-up mb-7 max-w-2xl border-l-4 border-pb-khaki pl-4 sm:pl-5">
            <p className="text-xs font-extrabold tracking-[0.18em] text-pb-khaki uppercase">Our Team</p>
            <h2 className="mt-2 text-2xl leading-tight font-black text-pb-green sm:text-3xl">
              The people behind Police Bharti
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Meet the team working on the platform and supporting your preparation.
            </p>
          </header>

          {teamLoading ? (
            <p role="status" className="animate-pulse rounded-xl border border-pb-neutral bg-white/80 p-5 text-slate-500 backdrop-blur-sm">
              Loading team...
            </p>
          ) : teamMembers.length > 0 ? (
            <div className="grid items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {teamMembers.map((member, i) => (
                <article
                  key={member.id}
                  className="animate-fade-up group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-neutral bg-white/85 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-pb-khaki hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none"
                  style={{ animationDelay: `${Math.min(i * 80, 400)}ms` }}
                >
                  {/* Header: passport photo left, name + role right */}
                  <header className="relative overflow-hidden bg-gradient-to-br from-pb-green to-[#0f3d2e] px-5 pt-6 pb-6 text-white">
                    <span className="absolute inset-x-0 top-0 h-1 bg-pb-khaki" />
                    <span className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#e1d37f]/10 blur-2xl" />

                    <div className="relative flex items-center gap-4">
                      <TeamMemberPhoto member={member} />

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg leading-snug font-extrabold break-words sm:text-xl">
                          {member.name}
                        </h3>
                        <p className="mt-2 inline-block max-w-full rounded-full bg-pb-khaki px-3 py-1 text-[11px] leading-5 font-bold break-words text-white shadow-sm sm:text-xs">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </header>

                  {/* Body */}
                  <div className="flex flex-1 flex-col bg-white px-5 py-5 sm:px-6">
                    {member.bio && (
                      <p className="text-sm leading-6 break-words whitespace-pre-line text-pb-green">
                        {member.bio}
                      </p>
                    )}
                    {(member.email || member.mobile || member.location) && (
                      <div className={`space-y-2.5 ${member.bio ? "mt-4" : ""}`}>
                        {member.email && <TeamContactDetail type="email" value={member.email} href={`mailto:${member.email}`} />}
                        {member.mobile && <TeamContactDetail type="mobile" value={member.mobile} href={`tel:${member.mobile}`} />}
                        {member.location && <TeamContactDetail type="location" value={member.location} />}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {/* ---------- MAIN: INFO + FORM ---------- */}
        <main className="mx-auto grid max-w-6xl gap-7 px-5 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">

          {/* Contact info card */}
          <section className="animate-fade-up h-fit overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg sm:p-8">
            <div className="relative p-6 sm:p-0">
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green sm:hidden" />
              <h2 className="text-2xl font-black text-pb-green">संपर्क माहिती</h2>

              {loadingInfo ? (
                <p className="mt-5 animate-pulse text-slate-500">माहिती लोड होत आहे...</p>
              ) : (
                <div className="mt-5 space-y-5">
                  {contactRows.map(([label, value, href]) => (
                    <div key={label} className="rounded-xl bg-pb-light/60 p-3.5 transition-colors duration-300 hover:bg-pb-light">
                      <p className="text-xs font-bold tracking-wide text-pb-khaki uppercase">{label}</p>
                      {value ? (
                        href ? (
                          <a className="mt-1 block font-semibold break-words text-pb-green underline decoration-pb-khaki decoration-1 underline-offset-2 transition-colors hover:text-pb-khaki" href={href}>{value}</a>
                        ) : (
                          <p className="mt-1 font-semibold whitespace-pre-line text-pb-green">{value}</p>
                        )
                      ) : (
                        <p className="mt-1 text-slate-500">माहिती उपलब्ध नाही</p>
                      )}
                    </div>
                  ))}

                  {contact?.support_note && (
                    <p className="rounded-xl border border-pb-khaki/20 bg-pb-light p-4 text-sm leading-6 text-slate-600">
                      {contact.support_note}
                    </p>
                  )}

                  {contact?.map_url && (
                    <a
                      href={contact.map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-pb-green/10 px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:bg-pb-green hover:text-white"
                    >
                      नकाशा पहा
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Form card */}
          <section
            className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg sm:p-8"
            style={{ animationDelay: "120ms" }}
          >
            <h2 className="text-2xl font-black text-pb-green">आम्हाला संदेश पाठवा</h2>

            {notice && (
              <p
                role="status"
                className={`animate-fade-up mt-4 rounded-xl p-3 text-sm font-semibold ${
                  notice.type === "success"
                    ? "bg-green-50 text-green-800 ring-1 ring-green-200"
                    : "bg-red-50 text-red-800 ring-1 ring-red-200"
                }`}
              >
                {notice.text}
              </p>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {fields.map(([key, label, max]) => (
                <label key={key} className="block text-sm font-bold text-pb-green">
                  {label}
                  {key === "message" ? (
                    <textarea
                      required
                      maxLength={max}
                      rows={5}
                      value={form[key]}
                      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                      className="mt-2 w-full resize-y rounded-xl border border-pb-border bg-white px-4 py-3 font-normal text-slate-700 transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/25"
                    />
                  ) : (
                    <input
                      required={key !== "mobile"}
                      type={key === "email" ? "email" : "text"}
                      maxLength={max}
                      value={form[key]}
                      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                      className="mt-2 w-full rounded-xl border border-pb-border bg-white px-4 py-3 font-normal text-slate-700 transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/25"
                    />
                  )}
                </label>
              ))}

              <button
                disabled={submitting}
                className="group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-pb-khaki to-[#c9b95f] px-6 py-3.5 font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto sm:min-h-0"
              >
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                  <span className="animate-shimmer absolute top-0 left-0 h-full w-1/3 -skew-x-12 bg-white/25" />
                </span>
                <span className="relative">
                  {submitting ? "पाठवत आहे..." : "संदेश पाठवा"}
                </span>
              </button>
            </form>
          </section>
        </main>

        {/* ---------- FOOTER LINK ---------- */}
        <p className="pb-8 text-center text-sm text-slate-500">
          प्लॅटफॉर्मबद्दल अधिक माहितीसाठी{" "}
          <Link className="font-bold text-pb-khaki underline decoration-1 underline-offset-2 transition-colors hover:text-pb-green" to="/about">
            आमच्याबद्दल
          </Link>{" "}
          पहा.
        </p>
      </div>
    </div>
  );
}

export default Contact;