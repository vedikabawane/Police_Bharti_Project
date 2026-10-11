import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAbout } from "../../services/public/siteContentService";

const sections = [
  ["introduction", "आमच्याबद्दल"], ["purpose", "या व्यासपीठाचा उद्देश"],
  ["mission", "ध्येय"], ["vision", "दृष्टी"], ["study_features", "अभ्यास साहित्य"],
  ["test_features", "चाचण्या आणि सराव"], ["physical_training_info", "शारीरिक तयारी"],
  ["current_affairs_info", "चालू घडामोडी"], ["recruitment_info", "भरतीविषयक माहिती"],
  ["ai_assistant_info", "मराठी AI सहाय्यक"], ["performance_info", "कामगिरीचा मागोवा"],
  ["free_platform_info", "विनामूल्य वापर"],
];

function About() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getAbout().then((result) => setContent(result.data)).catch(() => setError("सध्या माहिती लोड करता येत नाही.")); }, []);

  return (
    <div className="min-h-screen bg-pb-light">
      <section className="bg-pb-green px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#e1d37f]">Police Bharti Platform</p>
          {content ? <><h1 className="mt-4 text-3xl font-black sm:text-5xl">{content.hero_title}</h1><p className="mt-5 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8 text-slate-200">{content.hero_subtitle}</p></> : <p className="mt-5 text-slate-200">{error || "माहिती लोड होत आहे..."}</p>}
        </div>
      </section>
      {content && <>
        <section className="mx-auto max-w-6xl bg-pb-light px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 sm:gap-5">
            {sections.map(([key, title], index) => content[key] && <article key={key} className={`min-w-0 rounded-2xl border border-pb-border bg-white p-5 shadow-sm sm:p-7 ${index < 2 ? "md:col-span-2" : ""}`}>
              <h2 className="text-balance text-xl font-extrabold text-pb-green">{title}</h2><p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-600 sm:text-base">{content[key]}</p>
            </article>)}
          </div>
        </section>
        <section className="mx-4 mb-12 rounded-3xl bg-pb-green px-5 py-9 text-center text-white sm:mx-auto sm:mb-14 sm:max-w-6xl sm:px-10 sm:py-12">
          <h2 className="text-2xl font-black">संपर्क साधा</h2><p className="mx-auto mt-3 max-w-2xl text-slate-200">{content.contact_cta}</p>
          <Link to="/contact" className="mt-6 inline-flex rounded-xl bg-[#d7c56f] px-5 py-3 font-bold text-pb-green">संपर्क पृष्ठावर जा</Link>
        </section>
      </>}
    </div>
  );
}

export default About;
