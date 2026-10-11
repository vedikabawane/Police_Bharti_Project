import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getContact, getTeamMembers, submitContact } from "../../services/public/siteContentService";

const emptyForm = { name: "", email: "", mobile: "", subject: "", message: "" };
const fields = [
  ["name", "नाव", 100], ["email", "ईमेल", 255], ["mobile", "मोबाईल (ऐच्छिक)", 20],
  ["subject", "विषय", 200], ["message", "संदेश", 3000],
];

function TeamMemberPhoto({ member }) {
  const [failed, setFailed] = useState(false);
  const photoUrl = member.photo_url
    ? new URL(
        member.photo_url,
        new URL(api.defaults.baseURL, window.location.origin),
      ).href
    : "";

  return <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-pb-light shadow-md sm:h-28 sm:w-28">{photoUrl && !failed ? <img src={photoUrl} alt={member.name} loading="lazy" decoding="async" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <div role="img" aria-label={`Portrait placeholder for ${member.name}`} className="flex h-full w-full items-center justify-center text-2xl font-black text-pb-khaki">{member.name?.trim()?.charAt(0)?.toUpperCase() || "P"}</div>}</div>;
}

function TeamContactDetail({ type, value, href }) {
  const iconPaths = {
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    mobile: <><path d="M7 3h10v18H7z" /><path d="M10 6h4M11 18h2" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return <div className="flex min-w-0 items-center gap-3 rounded-xl bg-pb-light px-3 py-2.5 text-pb-green">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-neutral text-pb-khaki"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">{iconPaths[type]}</svg></span>
    {href ? <a href={href} className="min-w-0 flex-1 break-all text-sm font-semibold underline decoration-pb-khaki decoration-1 underline-offset-2 hover:text-pb-khaki focus-visible:rounded-sm">{value}</a> : <p className="min-w-0 flex-1 break-words text-sm font-medium">{value}</p>}
  </div>;
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
    <div className="min-h-screen bg-pb-light">
      <section className="bg-pb-green px-4 py-10 text-white sm:px-6 sm:py-14 lg:px-8"><div className="mx-auto max-w-6xl"><p className="font-bold text-[#e1d37f]">संपर्क</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">{contact?.heading || "आमच्याशी संपर्क साधा"}</h1><p className="mt-4 max-w-2xl leading-7 text-slate-200">{contact?.description || "प्रश्न किंवा सूचना असल्यास खालील फॉर्मद्वारे संदेश पाठवा."}</p></div></section>
      <section className="mx-auto max-w-6xl bg-pb-light px-4 pb-2 pt-12 sm:px-6 lg:px-8">
        <header className="mb-7 max-w-2xl border-l-4 border-pb-khaki pl-4 sm:pl-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-pb-khaki">Our Team</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-pb-green sm:text-3xl">The people behind Police Bharti</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Meet the team working on the platform and supporting your preparation.</p>
        </header>
        {teamLoading ? <p role="status" className="rounded-xl border border-pb-neutral bg-white p-5 text-slate-500">Loading team...</p> : teamMembers.length > 0 ? <div className="grid items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">{teamMembers.map((member) => <article key={member.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-neutral bg-white shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:border-pb-khaki hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
          <header className="relative flex flex-col items-center bg-pb-green px-5 pb-10 pt-7 text-center text-white before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-pb-khaki">
            <TeamMemberPhoto member={member} />
            <h3 className="mt-3 max-w-full break-words text-xl font-extrabold leading-snug sm:text-2xl">{member.name}</h3>
            <p className="mt-2 max-w-full break-words rounded-full bg-pb-khaki px-3.5 py-1 text-xs font-bold leading-5 text-white sm:text-sm">{member.role}</p>
          </header>
          <div className="relative -mt-5 flex flex-1 flex-col rounded-t-2xl bg-white px-5 pb-5 pt-4 sm:px-6">
            {member.bio && <p className="whitespace-pre-line break-words text-sm leading-6 text-pb-green">{member.bio}</p>}
            {(member.email || member.mobile || member.location) && <div className={`space-y-2.5 ${member.bio ? "mt-4" : ""}`}>
              {member.email && <TeamContactDetail type="email" value={member.email} href={`mailto:${member.email}`} />}
              {member.mobile && <TeamContactDetail type="mobile" value={member.mobile} href={`tel:${member.mobile}`} />}
              {member.location && <TeamContactDetail type="location" value={member.location} />}
            </div>}
          </div>
        </article>)}</div> : null}
      </section>
      <main className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="h-fit rounded-2xl border border-pb-border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-pb-green">संपर्क माहिती</h2>
          {loadingInfo ? <p className="mt-5 text-slate-500">माहिती लोड होत आहे...</p> : <div className="mt-5 space-y-5">
            {contactRows.map(([label, value, href]) => <div key={label}><p className="text-xs font-bold uppercase tracking-wide text-pb-khaki">{label}</p>{value ? href ? <a className="mt-1 block break-words font-semibold text-pb-green underline decoration-pb-khaki" href={href}>{value}</a> : <p className="mt-1 whitespace-pre-line font-semibold text-pb-green">{value}</p> : <p className="mt-1 text-slate-500">माहिती उपलब्ध नाही</p>}</div>)}
            {contact?.support_note && <p className="rounded-xl bg-pb-light p-4 text-sm leading-6 text-slate-600">{contact.support_note}</p>}
            {contact?.map_url && <a href={contact.map_url} target="_blank" rel="noreferrer" className="inline-flex font-bold text-pb-khaki underline">नकाशा पहा</a>}
          </div>}
        </section>
        <section className="rounded-2xl border border-pb-border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-pb-green">आम्हाला संदेश पाठवा</h2>
          {notice && <p role="status" className={`mt-4 rounded-xl p-3 text-sm font-semibold ${notice.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{notice.text}</p>}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {fields.map(([key, label, max]) => <label key={key} className="block text-sm font-bold text-pb-green">{label}{key === "message" ? <textarea required maxLength={max} rows={5} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-2 w-full rounded-xl border border-pb-border px-4 py-3 font-normal outline-none focus:border-pb-khaki" /> : <input required={key !== "mobile"} type={key === "email" ? "email" : "text"} maxLength={max} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-2 w-full rounded-xl border border-pb-border px-4 py-3 font-normal outline-none focus:border-pb-khaki" />}</label>)}
            <button disabled={submitting} className="min-h-11 w-full rounded-xl bg-pb-khaki px-6 py-3 font-bold text-white disabled:opacity-60 sm:w-auto">{submitting ? "पाठवत आहे..." : "संदेश पाठवा"}</button>
          </form>
        </section>
      </main>
      <p className="pb-8 text-center text-sm text-slate-500">प्लॅटफॉर्मबद्दल अधिक माहितीसाठी <Link className="font-bold text-pb-khaki underline" to="/about">आमच्याबद्दल</Link> पहा.</p>
    </div>
  );
}

export default Contact;
