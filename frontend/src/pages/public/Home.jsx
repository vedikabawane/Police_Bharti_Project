import { Link } from "react-router-dom";

const subjects = [
  {
    icon: "अ",
    title: "मराठी",
    description:
      "व्याकरण, शब्दसंपदा, वाक्यरचना आणि भाषिक सराव.",
  },
  {
    icon: "१",
    title: "गणित",
    description:
      "अंकगणित, टक्केवारी, नफा-तोटा, वेळ, वेग आणि सराव.",
  },
  {
    icon: "🧠",
    title: "बुद्धिमत्ता",
    description:
      "तार्किक विचार, मालिका, आकृत्या आणि reasoning प्रश्न.",
  },
  {
    icon: "🌎",
    title: "भूगोल",
    description:
      "महाराष्ट्र, भारत आणि जगाचा महत्त्वपूर्ण भूगोल.",
  },
  {
    icon: "📜",
    title: "इतिहास",
    description:
      "महाराष्ट्र व भारताच्या इतिहासाचा परीक्षाभिमुख अभ्यास.",
  },
  {
    icon: "⚖️",
    title: "राज्यशास्त्र",
    description:
      "भारतीय संविधान, शासनव्यवस्था आणि नागरिकशास्त्र.",
  },
  {
    icon: "🔬",
    title: "विज्ञान",
    description:
      "भौतिकशास्त्र, रसायनशास्त्र आणि जीवशास्त्राचे मूलभूत ज्ञान.",
  },
  {
    icon: "📰",
    title: "Current Affairs",
    description:
      "महाराष्ट्र, भारत आणि जगातील महत्त्वाच्या चालू घडामोडी.",
  },
  {
    icon: "📚",
    title: "सामान्य ज्ञान",
    description:
      "पोलीस भरतीसाठी आवश्यक विविध सामान्य ज्ञानाचा सराव.",
  },
];

const features = [
  {
    icon: "📚",
    title: "अभ्यास साहित्य",
    description:
      "विषय, topic, notes आणि learning material व्यवस्थित पद्धतीने अभ्यासा.",
  },
  {
    icon: "📝",
    title: "सराव प्रश्न",
    description:
      "Topic-wise questions सोडवा आणि तुमची concept clarity मजबूत करा.",
  },
  {
    icon: "📜",
    title: "Previous Year Questions",
    description:
      "मागील वर्षांच्या Police Bharti प्रश्नांचा pattern समजून सराव करा.",
  },
  {
    icon: "🏆",
    title: "Mock Tests",
    description:
      "Subject, Topic, Daily, Weekly आणि Full Mock Tests देऊन तयारी तपासा.",
  },
  {
    icon: "📊",
    title: "Performance Analysis",
    description:
      "Score, accuracy, weak topics, strong topics आणि improvement पाहा.",
  },
  {
    icon: "🏃",
    title: "Physical Tracking",
    description:
      "Running, 100m, 800m, 1600m, Shot Put, Push-ups आणि Weight track करा.",
  },
  {
    icon: "🤖",
    title: "Marathi AI Assistant",
    description:
      "Police Bharti संबंधित प्रश्न, MCQs, explanations आणि study guidance मिळवा.",
  },
  {
    icon: "🔔",
    title: "Important Notifications",
    description:
      "तुमच्या preparation साठी आवश्यक updates आणि notifications मिळवा.",
  },
];

const preparationSteps = [
  {
    number: "01",
    icon: "📚",
    title: "अभ्यास करा",
    description:
      "Subject आणि topic नुसार notes आणि learning material अभ्यासा.",
  },
  {
    number: "02",
    icon: "📝",
    title: "प्रश्न सोडवा",
    description:
      "दररोज questions आणि PYQ सोडवून accuracy वाढवा.",
  },
  {
    number: "03",
    icon: "🏆",
    title: "Test द्या",
    description:
      "Mock tests देऊन actual exam pattern ची तयारी करा.",
  },
  {
    number: "04",
    icon: "📊",
    title: "Analysis करा",
    description:
      "Weak topics ओळखा आणि त्या topics वर पुन्हा अभ्यास करा.",
  },
  {
    number: "05",
    icon: "🏃",
    title: "Physical सुधारित करा",
    description:
      "Running आणि physical activities चा नियमित progress track करा.",
  },
];

const physicalActivities = [
  {
    icon: "🏃",
    title: "Running",
    text: "Distance आणि time track करा.",
  },
  {
    icon: "⚡",
    title: "100m / 800m / 1600m",
    text: "Running performance नोंदवा.",
  },
  {
    icon: "🏋️",
    title: "Shot Put",
    text: "Throw performance नोंदवा.",
  },
  {
    icon: "💪",
    title: "Push-ups",
    text: "Strength progress track करा.",
  },
  {
    icon: "⚖️",
    title: "Weight",
    text: "Weight progress नियमित नोंदवा.",
  },
];

const testTypes = [
  "Subject Test",
  "Topic Test",
  "Mixed Test",
  "Daily Test",
  "Weekly Test",
  "Previous Year",
  "Full Mock Test",
];

function Home() {
  return (
    <div className="w-full min-w-0 overflow-hidden bg-pb-light selection:bg-[#d7c56f]/30">
      {/* Custom Scoped Animations for Smooth Mobile & Desktop Feel */}
      <style>{`
        @keyframes pbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pbPulseGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.28; transform: scale(1.06); }
        }
        .animate-pb-float {
          animation: pbFloat 4s ease-in-out infinite;
        }
        .animate-pb-glow {
          animation: pbPulseGlow 5s ease-in-out infinite;
        }
      `}</style>

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="pb-public-hero relative overflow-hidden bg-pb-green">
        {/* Ambient Decorative Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-pb-glow absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d7c56f]/20 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute right-[10%] top-[12%] hidden text-7xl opacity-[0.05] sm:block">
            🚔
          </div>
          <div className="absolute bottom-[10%] left-[5%] hidden text-6xl opacity-[0.05] sm:block">
            👮
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* =========================
                LEFT
            ========================= */}
            <div className="min-w-0 text-left">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#d7c56f] bg-[#d7c56f] px-3.5 py-1.5 text-pb-green shadow-md sm:px-4 sm:py-2">
                <span className="animate-bounce text-base sm:text-lg">🚔</span>
                <span className="text-xs font-extrabold tracking-wide text-pb-green sm:text-sm">
                  महाराष्ट्र पोलीस भरती तयारी
                </span>
              </div>

              <h1 className="mt-5 text-balance text-3xl font-black leading-[1.2] tracking-tight text-white sm:mt-7 sm:text-5xl lg:text-6xl">
                वर्दीचं स्वप्न,
                <span className="mt-1 block text-[#d7c56f] drop-shadow-sm">
                  मेहनतीची तयारी.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:mt-6 sm:text-lg sm:leading-8">
                पोलीस भरतीची तयारी करण्यासाठी अभ्यास, प्रश्नसंच, Previous Year
                Questions, Mock Tests, Performance Analysis आणि Physical
                Tracking — सर्व काही एका मोफत platform वर.
              </p>

              {/* CTA - Thumb-friendly full width on mobile */}
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
                <Link
                  to="/register"
                  className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#d7c56f] px-6 py-4 text-base font-black text-pb-green shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e4d787] hover:shadow-xl active:scale-[0.98] sm:w-auto sm:px-8"
                >
                  <span>👮 तयारी सुरू करा</span>
                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </Link>

                <Link
                  to="/about"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-pb-green active:scale-[0.98] sm:w-auto sm:px-7 sm:text-base"
                >
                  🛡️ Platform बद्दल
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/80 bg-pb-khaki/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm sm:px-4 sm:py-2 sm:text-xs">
                  🆓 Completely Free
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/80 bg-pb-khaki/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm sm:px-4 sm:py-2 sm:text-xs">
                  🇮🇳 Maharashtra Focused
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/80 bg-pb-khaki/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm sm:px-4 sm:py-2 sm:text-xs">
                  📚 Study + Physical
                </span>
              </div>
            </div>

            {/* =========================
                RIGHT PREPARATION CARD
            ========================= */}
            <div className="relative min-w-0">
              <div className="animate-pb-float mx-auto max-w-xl rounded-[1.75rem] border border-white/15 bg-pb-neutral/95 p-2.5 shadow-2xl backdrop-blur-md sm:rounded-[2rem] sm:p-4">
                <div className="rounded-[1.35rem] bg-[#faf9f4] p-4 sm:rounded-[1.5rem] sm:p-7">
                  {/* Card heading */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-2xl shadow-md sm:h-14 sm:w-14 sm:text-3xl">
                        👮
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-pb-khaki sm:text-xs">
                          Preparation
                        </p>
                        <h2 className="mt-0.5 text-lg font-black text-pb-green sm:text-xl">
                          तुमची तयारी
                        </h2>
                      </div>
                    </div>

                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1eee2] text-2xl">
                      🚔
                    </span>
                  </div>

                  <p className="mt-4 rounded-xl border border-[#e4e0d2]/70 bg-[#f1eee2] p-3.5 text-xs leading-5 text-slate-600 sm:mt-5 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
                    Study, practice, take tests, and track physical preparation
                    in one place.
                  </p>

                  {/* Preparation cards - 2x2 grid on mobile for compact view, stacked on larger if preferred */}
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3">
                    <div className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-[#e4e0d2] bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-pb-khaki active:scale-[0.99] sm:p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pb-light text-xl">
                        📚
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-pb-green sm:text-base">
                          Study Material
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                          Subjects • Topics • Notes
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-[#e4e0d2] bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-pb-khaki active:scale-[0.99] sm:p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pb-light text-xl">
                        📝
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-pb-green sm:text-base">
                          PYQ & Questions
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                          Topic-wise practice
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-[#d7c56f] bg-[#f5f1dd] p-3.5 shadow-sm transition-all duration-200 active:scale-[0.99] sm:p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-xl">
                        🏆
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-pb-green sm:text-base">
                          Mock Tests
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-pb-khaki sm:text-xs">
                          Test • Score • Analysis
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-[#e4e0d2] bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-pb-khaki active:scale-[0.99] sm:p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pb-light text-xl">
                        🏃
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-pb-green sm:text-base">
                          Physical Tracking
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                          Running • Fitness • Progress
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK STATS
      ===================================================== */}
      <section className="relative z-10 border-b border-[#ddd8c7] bg-[#faf9f4] shadow-sm">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 divide-x divide-y divide-[#ddd8c7] sm:grid-cols-4 sm:divide-y-0">
          <div className="px-4 py-5 text-center transition hover:bg-white sm:py-7">
            <p className="text-2xl font-black text-pb-green sm:text-3xl">9</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              मुख्य विषय
            </p>
          </div>

          <div className="px-4 py-5 text-center transition hover:bg-white sm:py-7">
            <p className="text-2xl font-black text-pb-green sm:text-3xl">PYQ</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Previous Year Questions
            </p>
          </div>

          <div className="px-4 py-5 text-center transition hover:bg-white sm:py-7">
            <p className="text-2xl font-black text-pb-green sm:text-3xl">
              Mock
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Test Practice
            </p>
          </div>

          <div className="bg-[#f5f1dd]/50 px-4 py-5 text-center transition hover:bg-[#f5f1dd] sm:py-7">
            <p className="text-2xl font-black text-pb-khaki sm:text-3xl">
              FREE
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600 sm:text-sm">
              सर्व विद्यार्थ्यांसाठी
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHY PLATFORM
      ===================================================== */}
      <section className="bg-pb-light py-12 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-black uppercase tracking-[0.15em] text-pb-khaki shadow-sm">
                👮 Why This Platform?
              </span>

              <h2 className="mt-4 text-2xl font-black leading-snug text-pb-green sm:text-3xl lg:text-4xl">
                तयारी फक्त अभ्यासाची नाही,
                <span className="mt-1 block text-pb-khaki">
                  पूर्ण preparation ची आहे.
                </span>
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
                Police Bharti साठी written preparation सोबत physical preparation
                देखील महत्त्वाची आहे. त्यामुळे या platform वर दोन्ही बाजू एकत्र
                manage करण्याचा प्रयत्न केला आहे.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
                <span className="rounded-xl border border-[#ddd7c3] bg-white px-3.5 py-2.5 text-xs font-bold text-pb-green shadow-sm sm:px-4 sm:py-3 sm:text-sm">
                  📚 Written Preparation
                </span>
                <span className="rounded-xl border border-[#ddd7c3] bg-white px-3.5 py-2.5 text-xs font-bold text-pb-green shadow-sm sm:px-4 sm:py-3 sm:text-sm">
                  🏃 Physical Preparation
                </span>
                <span className="rounded-xl border border-[#ddd7c3] bg-white px-3.5 py-2.5 text-xs font-bold text-pb-green shadow-sm sm:px-4 sm:py-3 sm:text-sm">
                  📊 Performance
                </span>
              </div>
            </div>

            {/* Bento 2x2 Grid even on mobile for compact thumb-friendly view */}
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
              <div className="group rounded-2xl bg-pb-green p-4 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:rounded-3xl sm:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl sm:h-12 sm:w-12 sm:text-3xl">
                  📚
                </div>
                <h3 className="mt-4 text-base font-black sm:mt-5 sm:text-lg">
                  Structured Study
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-300 sm:mt-2.5 sm:text-sm sm:leading-6">
                  Subjects आणि topics व्यवस्थित क्रमाने अभ्यासण्याची सुविधा.
                </p>
              </div>

              <div className="group rounded-2xl bg-pb-green p-4 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:rounded-3xl sm:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl sm:h-12 sm:w-12 sm:text-3xl">
                  📝
                </div>
                <h3 className="mt-4 text-base font-black sm:mt-5 sm:text-lg">
                  Smart Practice
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-300 sm:mt-2.5 sm:text-sm sm:leading-6">
                  Questions आणि PYQ च्या मदतीने regular practice.
                </p>
              </div>

              <div className="group rounded-2xl border border-[#ddd7c3] bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:rounded-3xl sm:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-light text-2xl sm:h-12 sm:w-12 sm:text-3xl">
                  📊
                </div>
                <h3 className="mt-4 text-base font-black text-pb-green sm:mt-5 sm:text-lg">
                  Performance
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:mt-2.5 sm:text-sm sm:leading-6">
                  तुमच्या scores आणि weak areas चा आढावा.
                </p>
              </div>

              <div className="group rounded-2xl border border-[#ddd7c3] bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:rounded-3xl sm:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-light text-2xl sm:h-12 sm:w-12 sm:text-3xl">
                  🏃
                </div>
                <h3 className="mt-4 text-base font-black text-pb-green sm:mt-5 sm:text-lg">
                  Physical
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:mt-2.5 sm:text-sm sm:leading-6">
                  Fitness आणि running progress track करा.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-[#faf9f4] px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-pb-khaki border border-[#ddd8c7]">
              Platform Features
            </span>

            <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl lg:text-4xl">
              तुमच्या तयारीसाठी आवश्यक सर्व काही
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
              Written exam पासून physical preparation आणि performance tracking
              पर्यंत एक complete preparation experience.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3.5 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-[#ddd8c7] bg-[#faf9f4] p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#c9bd8c] hover:bg-white hover:shadow-xl active:scale-[0.99] sm:flex-col sm:rounded-3xl sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-pb-khaki sm:h-14 sm:w-14 sm:text-2xl">
                  {feature.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-pb-green sm:mt-4 sm:text-lg">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:mt-2.5 sm:text-sm sm:leading-7">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SUBJECTS
      ===================================================== */}
      <section className="bg-pb-light py-12 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <span className="inline-block rounded-full bg-white px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-pb-khaki shadow-sm">
                📚 Study Subjects
              </span>

              <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl lg:text-4xl">
                विषयानुसार तुमची तयारी करा
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
                प्रत्येक subject चे topics, notes, questions आणि tests व्यवस्थित
                पद्धतीने अभ्यासण्यासाठी.
              </p>
            </div>

            <div className="hidden">📚 📝 👮</div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {subjects.map((subject) => (
              <div
                key={subject.title}
                className="group rounded-2xl border border-[#ddd8c7] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/60 hover:shadow-xl active:scale-[0.99] sm:rounded-3xl sm:p-6"
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0ecdc] text-xl font-black text-pb-khaki transition-all duration-300 group-hover:scale-105 group-hover:bg-pb-green group-hover:text-[#d7c56f]">
                    {subject.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-pb-green sm:text-lg">
                      {subject.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:mt-1.5 sm:text-sm sm:leading-6">
                      {subject.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          TEST TYPES
      ===================================================== */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <span className="inline-block rounded-full bg-[#faf9f4] px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-pb-khaki border border-[#ddd8c7]">
                📝 Practice System
              </span>

              <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl lg:text-4xl">
                तुमच्या level नुसार Test द्या
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
                फक्त questions सोडवण्यापेक्षा वेगवेगळ्या प्रकारच्या tests देऊन
                तुमची actual preparation तपासा.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 sm:mt-7 sm:gap-2.5">
                {testTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8c7] bg-[#faf9f4] px-3.5 py-2 text-xs font-extrabold text-pb-green shadow-sm transition hover:border-pb-khaki hover:bg-[#f5f1dd]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-pb-khaki" />
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] bg-pb-green p-5 text-white shadow-xl sm:rounded-[2rem] sm:p-9">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d7c56f]/10 blur-2xl" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d7c56f] text-2xl shadow-md">
                    🏆
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d7c56f] sm:text-xs">
                      Test Result
                    </p>
                    <p className="text-base font-black sm:text-lg">
                      Performance Overview
                    </p>
                  </div>
                </div>

                <span className="text-3xl">📊</span>
              </div>

              <div className="relative mt-6 space-y-3 sm:mt-7">
                <div className="rounded-2xl bg-white p-4 text-pb-green shadow-sm transition hover:translate-x-1 sm:p-5">
                  <p className="text-sm font-black sm:text-base">
                    Review each test
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                    See your score and accuracy after completing a test.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-pb-green shadow-sm transition hover:translate-x-1 sm:p-5">
                  <p className="text-sm font-black sm:text-base">
                    Plan what to practice next
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                    Use your results to revisit questions and topics that need
                    more practice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PREPARATION ROADMAP
      ===================================================== */}
      <section className="relative overflow-hidden bg-pb-green py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-[#d7c56f]">
              🎯 Preparation Roadmap
            </span>

            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
              तयारीचा योग्य flow
            </h2>

            <p className="mt-3 inline-block rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200 sm:mt-4 sm:text-sm">
              Study → Practice → Test → Analysis → Physical
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3.5 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
            {preparationSteps.map((step) => (
              <div
                key={step.number}
                className="group relative flex items-start gap-4 rounded-2xl border border-pb-neutral bg-white p-4 text-pb-green shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-pb-accent hover:shadow-xl active:scale-[0.99] sm:flex-col sm:justify-between sm:rounded-3xl sm:p-6"
              >
                <div className="flex shrink-0 flex-col items-center gap-2 sm:w-full sm:flex-row sm:justify-between">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-pb-green text-xs font-black text-[#d7c56f]">
                    {step.number}
                  </span>
                  <span className="text-2xl transition-transform duration-300 group-hover:scale-125">
                    {step.icon}
                  </span>
                </div>

                <div className="min-w-0 flex-1 sm:mt-5">
                  <h3 className="text-base font-black text-pb-green sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          PHYSICAL
      ===================================================== */}
      <section className="bg-pb-light py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div>
              <span className="inline-block rounded-full bg-white px-3.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-pb-khaki shadow-sm">
                🏃 Physical Preparation
              </span>

              <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl lg:text-4xl">
                Written सोबत Physical तयारीही track करा
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
                तुमच्या physical preparation ची रोजची किंवा नियमित नोंद ठेवा.
                Running time, distance, jumps, push-ups आणि weight यासारखी
                माहिती एकाच ठिकाणी manage करा.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-3">
                {physicalActivities.map((activity, idx) => (
                  <div
                    key={activity.title}
                    className={`rounded-2xl border border-[#ddd8c7] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-pb-khaki hover:shadow-md active:scale-[0.98] ${
                      idx === physicalActivities.length - 1
                        ? "col-span-2 sm:col-span-1"
                        : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pb-light text-xl">
                      {activity.icon}
                    </div>
                    <p className="mt-3 text-sm font-black text-pb-green">
                      {activity.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {activity.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Physical visual */}
            <div className="relative overflow-hidden rounded-[1.75rem] bg-pb-green p-5 text-white shadow-xl sm:rounded-[2rem] sm:p-10">
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[#d7c56f]/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d7c56f]">
                      Fitness Track
                    </p>
                    <h3 className="mt-1.5 text-xl font-black sm:text-2xl">
                      Physical Progress
                    </h3>
                  </div>

                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-4xl">
                    🏃
                  </span>
                </div>

                <div className="mt-6 space-y-3.5 sm:mt-8 sm:space-y-4">
                  <div className="rounded-2xl bg-white p-4 text-pb-green shadow-sm sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black sm:text-base">
                        🏃 Running
                      </span>
                      <span className="rounded-full bg-[#f5f1dd] px-3 py-1 text-xs font-extrabold text-pb-khaki">
                        Track
                      </span>
                    </div>
                    <p className="mt-2.5 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                      Record running time and distance as part of your training.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="rounded-2xl bg-white p-4 text-pb-green shadow-sm sm:p-5">
                      <p className="text-xs font-bold text-slate-600">
                        💪 Push-ups
                      </p>
                      <p className="mt-2 text-lg font-black sm:text-xl">
                        Track
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-pb-green shadow-sm sm:p-5">
                      <p className="text-xs font-bold text-slate-600">
                        ⚖️ Weight
                      </p>
                      <p className="mt-2 text-lg font-black sm:text-xl">
                        Track
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          AI
      ===================================================== */}
      <section className="bg-white py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className=" relative overflow-hidden rounded-[1.75rem] bg-pb-green shadow-xl sm:rounded-[2rem]">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#d7c56f]/15 blur-3xl" />

            <div className="relative grid items-center gap-8 p-5 sm:p-10 lg:grid-cols-[1fr_0.85fr] lg:gap-12 lg:p-14">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7c56f] text-2xl shadow-md sm:h-14 sm:w-14 sm:text-3xl">
                  🤖
                </div>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-[#d7c56f]">
                  Marathi AI Assistant
                </p>

                <h2 className="mt-2.5 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
                  Police Bharti साठी तुमचा AI Study Assistant
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base sm:leading-8">
                  Police Bharti related questions समजून घेण्यासाठी, MCQs तयार
                  करण्यासाठी, topics explain करण्यासाठी आणि study planning साठी
                  Marathi AI assistant वापरता येईल.
                </p>

                <div className="mt-6 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
                  {[
                    "MCQ Generation",
                    "Topic Explanation",
                    "Study Guidance",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-pb-khaki bg-pb-khaki px-3.5 py-1.5 text-xs font-bold text-white shadow-sm sm:px-4 sm:py-2"
                    >
                      ✨ {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-pb-neutral bg-white p-4 text-pb-green shadow-lg sm:rounded-3xl sm:p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d7c56f] text-xl shadow-sm">
                    🤖
                  </div>
                  <div>
                    <p className="text-sm font-black text-pb-green sm:text-base">
                      Police Bharti AI
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Marathi Study Assistant
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="ml-4 rounded-2xl rounded-tr-sm bg-pb-light p-3.5 text-xs font-semibold text-pb-green sm:text-sm">
                    💬 महाराष्ट्राची राजधानी कोणती?
                  </div>

                  <div className="mr-4 rounded-2xl rounded-tl-sm border border-[#e4e0d2] bg-pb-neutral/60 p-3.5 text-xs font-medium leading-6 text-pb-green sm:text-sm">
                    🤖 मुंबई. यासोबत महाराष्ट्राच्या इतिहासातील महत्त्वाचे
                    मुद्देही अभ्यासा.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}
      <section className="bg-pb-light px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] bg-pb-green px-5 py-10 text-center shadow-2xl sm:rounded-[2rem] sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#d7c56f]/15 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-2.5 text-3xl backdrop-blur-sm sm:text-4xl">
              <span>👮</span>
              <span>🚔</span>
              <span>🛡️</span>
            </div>

            <h2 className="mt-6 text-2xl font-black leading-snug text-white sm:text-3xl lg:text-4xl">
              तुमची Police Bharti तयारी
              <span className="mt-1 block text-[#d7c56f]">
                आजपासून सुरू करा.
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-5 sm:text-base">
              अभ्यास करा, प्रश्न सोडवा, tests द्या, performance तपासा आणि
              physical progress track करा.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d7c56f] px-7 py-4 text-sm font-black text-pb-green shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#e4d787] active:scale-[0.98] sm:w-auto sm:text-base"
              >
                <span>👮 Free Registration</span>
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                to="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-pb-green active:scale-[0.98] sm:w-auto sm:text-base"
              >
                📞 Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;