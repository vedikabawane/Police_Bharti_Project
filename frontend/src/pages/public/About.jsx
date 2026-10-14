import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAbout } from "../../services/public/siteContentService";

const sections = [
  ["introduction", "आमच्याबद्दल"],
  ["purpose", "या व्यासपीठाचा उद्देश"],
  ["mission", "ध्येय"],
  ["vision", "दृष्टी"],
  ["study_features", "अभ्यास साहित्य"],
  ["test_features", "चाचण्या आणि सराव"],
  ["physical_training_info", "शारीरिक तयारी"],
  ["current_affairs_info", "चालू घडामोडी"],
  ["recruitment_info", "भरतीविषयक माहिती"],
  ["ai_assistant_info", "मराठी AI सहाय्यक"],
  ["performance_info", "कामगिरीचा मागोवा"],
  ["free_platform_info", "विनामूल्य वापर"],
];

function About() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAbout()
      .then((result) => setContent(result.data))
      .catch(() => setError("सध्या माहिती लोड करता येत नाही."));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-pb-light text-slate-800 selection:bg-[#d7c56f]/30">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-b-[28px] bg-pb-green px-5 pt-12 pb-16 text-white sm:rounded-b-[44px] sm:px-6 sm:pt-20 sm:pb-28 lg:px-8">
        {/* Decorative Glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#e1d37f]/10 blur-3xl sm:h-96 sm:w-96" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5 blur-2xl sm:h-80 sm:w-80" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e1d37f]/40 to-transparent" />

        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e1d37f]/30 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm sm:px-4">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e1d37f] sm:h-2 sm:w-2" />
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#e1d37f] uppercase sm:text-xs sm:tracking-widest">
              Police Bharti Platform
            </p>
          </div>

          {content ? (
            <>
              <h1 className="mt-5 text-[1.75rem] leading-[1.35] font-black tracking-tight text-balance sm:mt-6 sm:text-4xl sm:leading-[1.25] lg:text-5xl lg:leading-[1.15]">
                {content.hero_title}
              </h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-[1.9] text-slate-200/90 sm:mt-6 sm:text-lg sm:leading-9">
                {content.hero_subtitle}
              </p>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-8 sm:max-w-md sm:p-6">
              <p className="flex items-center gap-3 text-sm font-medium text-slate-200 sm:text-base">
                {!error && (
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#e1d37f] border-t-transparent" />
                )}
                {error || "माहिती लोड होत आहे..."}
              </p>
            </div>
          )}
        </div>
      </section>

      {content && (
        <>
          {/* ================= CONTENT CARDS ================= */}
          <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-5 pb-12 sm:-mt-14 sm:px-6 sm:pb-16 lg:px-8">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {sections.map(
                ([key, title], index) =>
                  content[key] && (
                    <article
                      key={key}
                      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-pb-green/30 hover:shadow-xl ${
                        index < 2
                          ? "bg-gradient-to-br from-white via-white to-pb-light/60 md:col-span-2"
                          : ""
                      }`}
                    >
                      {/* Top Accent Line */}
                      <div
                        className={`absolute inset-x-0 top-0 h-1 transition-all duration-300 ${
                          index < 2
                            ? "bg-gradient-to-r from-pb-green via-[#d7c56f] to-pb-green"
                            : "bg-pb-green/15 group-hover:bg-pb-green"
                        }`}
                      />

                      <div className="flex flex-col p-5 pt-6 sm:p-8">
                        {/* Card Header */}
                        <div className="flex items-start gap-3.5 sm:gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-[11px] font-black text-pb-green transition-colors duration-300 group-hover:bg-pb-green group-hover:text-[#e1d37f] sm:h-9 sm:w-9 sm:rounded-xl sm:text-xs">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h2 className="text-[1.0625rem] leading-snug font-extrabold tracking-tight text-balance text-pb-green sm:text-xl lg:text-2xl">
                            {title}
                          </h2>
                        </div>

                        {/* Card Body */}
                        <div className="mt-4 border-t border-slate-100 pt-4 sm:mt-5 sm:pt-5">
                          <p className="text-[14.5px] leading-[1.85] break-words whitespace-pre-line text-slate-600 sm:text-base sm:leading-8">
                            {content[key]}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
              )}
            </div>
          </section>

          {/* ================= CONTACT CTA ================= */}
          <section className="px-5 pb-14 sm:px-6 sm:pb-20 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="relative overflow-hidden rounded-3xl bg-pb-green px-6 py-10 text-center text-white shadow-xl sm:px-12 sm:py-14">
                {/* Decorative Circles */}
                <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[#e1d37f]/10 blur-2xl sm:h-64 sm:w-64" />
                <div className="pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-[#e1d37f]/10 blur-2xl sm:h-64 sm:w-64" />

                <div className="relative z-10">
                  <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-[#e1d37f] uppercase sm:text-xs sm:tracking-wider">
                    मदत आणि सहकार्य
                  </span>

                  <h2 className="mt-3 text-xl leading-snug font-black tracking-tight text-balance sm:text-3xl">
                    संपर्क साधा
                  </h2>

                  <p className="mx-auto mt-3 max-w-2xl text-[14.5px] leading-[1.85] text-slate-200 sm:text-base sm:leading-8">
                    {content.contact_cta}
                  </p>

                  <Link
                    to="/contact"
                    className="mt-7 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#d7c56f] px-6 py-4 text-[15px] font-extrabold text-pb-green shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1d37f] hover:shadow-lg active:translate-y-0 active:bg-[#c9b95f] focus-visible:ring-2 focus-visible:ring-[#e1d37f] focus-visible:ring-offset-2 focus-visible:ring-offset-pb-green focus-visible:outline-none sm:mt-7 sm:w-auto sm:min-h-0 sm:py-3.5 sm:text-base"
                  >
                    <span>संपर्क पृष्ठावर जा</span>
                    <span aria-hidden="true" className="text-lg leading-none">
                      &rarr;
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default About;