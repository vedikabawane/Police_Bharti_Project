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
    <div className="w-full min-w-0 overflow-hidden bg-pb-light">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="pb-public-hero relative overflow-hidden">

        <div className="pointer-events-none absolute inset-0 hidden">

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[40px] border-[#d7c56f]/10" />

          <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full border-[45px] border-white/5" />

          <div className="absolute right-[15%] top-[20%] text-8xl opacity-[0.04] animate-pulse">
            🚔
          </div>

          <div className="absolute bottom-[15%] left-[8%] text-7xl opacity-[0.04]">
            👮
          </div>

        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">

          <div className="grid min-w-0 items-center gap-14 lg:grid-cols-2 lg:gap-20">

            {/* =========================
                LEFT
            ========================= */}

            <div className="min-w-0">

              <div className="inline-flex items-center gap-3 rounded-full border border-[#d7c56f] bg-[#d7c56f] px-4 py-2 text-pb-green">

                <span className="animate-pulse text-lg">
                  🚔
                </span>

                <span className="text-xs font-bold text-pb-green sm:text-sm">
                  महाराष्ट्र पोलीस भरती तयारी
                </span>

              </div>

              <h1 className="mt-7 text-balance text-3xl font-black leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">

                वर्दीचं स्वप्न,
                <span className="block text-[#d7c56f]">
                  मेहनतीची तयारी.
                </span>

              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-white/90 sm:text-lg">

                पोलीस भरतीची तयारी करण्यासाठी अभ्यास,
                प्रश्नसंच, Previous Year Questions, Mock Tests,
                Performance Analysis आणि Physical Tracking —
                सर्व काही एका मोफत platform वर.

              </p>

              {/* CTA */}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#d7c56f] px-6 py-4 text-sm font-black text-pb-green shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#e4d787] hover:shadow-lg sm:px-7"
                >
                  👮 तयारी सुरू करा

                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-pb-light bg-pb-light px-6 py-4 text-sm font-bold text-pb-green transition duration-300 hover:bg-white sm:px-7"
                >
                  🛡️ Platform बद्दल
                </Link>

              </div>

              {/* Trust */}

              <div className="mt-8 flex flex-wrap gap-3">

                <span className="rounded-full border border-pb-khaki bg-pb-khaki px-4 py-2 text-xs font-bold text-white">
                  🆓 Completely Free
                </span>

                <span className="rounded-full border border-pb-khaki bg-pb-khaki px-4 py-2 text-xs font-bold text-white">
                  🇮🇳 Maharashtra Focused
                </span>

                <span className="rounded-full border border-pb-khaki bg-pb-khaki px-4 py-2 text-xs font-bold text-white">
                  📚 Study + Physical
                </span>

              </div>

            </div>

            {/* =========================
                RIGHT PREPARATION CARD
            ========================= */}

            <div className="relative min-w-0">

              <div className="absolute -right-4 -top-5 hidden text-5xl opacity-30 animate-bounce">
                ⭐
              </div>

              <div className="mx-auto max-w-xl rounded-[2rem] border border-pb-neutral bg-pb-neutral p-3 shadow-lg sm:p-5">

                <div className="rounded-[1.5rem] bg-[#faf9f4] p-6 sm:p-8">

                  {/* Card heading */}

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-green text-3xl shadow-lg">
                        👮
                      </div>

                      <div>

                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-pb-khaki">
                          Preparation
                        </p>

                        <h2 className="mt-1 text-xl font-black text-pb-green">
                          तुमची तयारी
                        </h2>

                      </div>

                    </div>

                    <span className="text-3xl">
                      🚔
                    </span>

                  </div>

                  <p className="mt-6 rounded-2xl bg-[#f1eee2] p-4 text-sm leading-6 text-slate-600">
                    Study, practice, take tests, and track physical preparation in one place.
                  </p>

                  {/* Preparation cards */}

                  <div className="mt-5 space-y-3">

                    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#e4e0d2] bg-white p-4">

                      <span className="text-2xl">
                        📚
                      </span>

                      <div className="min-w-0 flex-1">

                        <p className="font-black text-pb-green">
                          Study Material
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Subjects • Topics • Notes
                        </p>

                      </div>


                    </div>

                    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#e4e0d2] bg-white p-4">

                      <span className="text-2xl">
                        📝
                      </span>

                      <div className="min-w-0 flex-1">

                        <p className="font-black text-pb-green">
                          PYQ & Questions
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Topic-wise practice
                        </p>

                      </div>


                    </div>

                    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#e4e0d2] bg-[#f5f1dd] p-4">

                      <span className="text-2xl">
                        🏆
                      </span>

                      <div className="min-w-0 flex-1">

                        <p className="font-black text-pb-green">
                          Mock Tests
                        </p>

                        <p className="mt-1 text-xs text-pb-khaki">
                          Test • Score • Analysis
                        </p>

                      </div>


                    </div>

                    <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#e4e0d2] bg-white p-4">

                      <span className="text-2xl">
                        🏃
                      </span>

                      <div className="min-w-0 flex-1">

                        <p className="font-black text-pb-green">
                          Physical Tracking
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
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

      <section className="border-b border-[#ddd8c7] bg-[#faf9f4]">

        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 sm:grid-cols-4">

          <div className="border-b border-[#ddd8c7] px-4 py-7 text-center sm:border-b-0 sm:border-r">

            <p className="text-2xl font-black text-pb-green sm:text-3xl">
              9
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              मुख्य विषय
            </p>

          </div>

          <div className="border-b border-[#ddd8c7] px-4 py-7 text-center sm:border-b-0 sm:border-r">

            <p className="text-2xl font-black text-pb-green sm:text-3xl">
              PYQ
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              Previous Year Questions
            </p>

          </div>

          <div className="border-b border-[#ddd8c7] px-4 py-7 text-center sm:border-b-0 sm:border-r">

            <p className="text-2xl font-black text-pb-green sm:text-3xl">
              Mock
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              Test Practice
            </p>

          </div>

          <div className="px-4 py-7 text-center">

            <p className="text-2xl font-black text-pb-khaki sm:text-3xl">
              FREE
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              सर्व विद्यार्थ्यांसाठी
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          WHY PLATFORM
      ===================================================== */}

      <section className="bg-pb-light py-16 sm:py-20">

        <div className="mx-auto w-full max-w-7xl">

          <div className="px-4 sm:px-6 lg:px-8">

          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-pb-khaki sm:text-sm">
                👮 Why This Platform?
              </p>

              <h2 className="mt-3 text-2xl font-black leading-tight text-pb-green sm:text-3xl">
                तयारी फक्त अभ्यासाची नाही,
                <span className="block text-pb-khaki">
                  पूर्ण preparation ची आहे.
                </span>
              </h2>

              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                Police Bharti साठी written preparation सोबत physical
                preparation देखील महत्त्वाची आहे. त्यामुळे या platform वर
                दोन्ही बाजू एकत्र manage करण्याचा प्रयत्न केला आहे.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                <span className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-pb-green shadow-sm">
                  📚 Written Preparation
                </span>

                <span className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-pb-green shadow-sm">
                  🏃 Physical Preparation
                </span>

                <span className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-pb-green shadow-sm">
                  📊 Performance
                </span>

              </div>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <div className="rounded-3xl bg-pb-green p-6 text-white shadow-xl transition duration-300 hover:-translate-y-1">

                <div className="text-3xl">
                  📚
                </div>

                <h3 className="mt-5 text-lg font-black">
                  Structured Study
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Subjects आणि topics व्यवस्थित क्रमाने अभ्यासण्याची
                  सुविधा.
                </p>

              </div>

              <div className="rounded-3xl bg-pb-green p-6 text-white shadow-xl transition duration-300 hover:-translate-y-1">

                <div className="text-3xl">
                  📝
                </div>

                <h3 className="mt-5 text-lg font-black">
                  Smart Practice
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Questions आणि PYQ च्या मदतीने regular practice.
                </p>

              </div>

              <div className="rounded-3xl border border-[#ddd7c3] bg-white p-6 shadow-lg transition duration-300 hover:-translate-y-1">

                <div className="text-3xl">
                  📊
                </div>

                <h3 className="mt-5 text-lg font-black text-pb-green">
                  Performance
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  तुमच्या scores आणि weak areas चा आढावा.
                </p>

              </div>

              <div className="rounded-3xl border border-[#ddd7c3] bg-white p-6 shadow-lg transition duration-300 hover:-translate-y-1">

                <div className="text-3xl">
                  🏃
                </div>

                <h3 className="mt-5 text-lg font-black text-pb-green">
                  Physical
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Fitness आणि running progress track करा.
                </p>

              </div>

            </div>

          </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="bg-white py-16 sm:py-20">

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-pb-khaki sm:text-sm">
              Platform Features
            </p>

            <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl">
              तुमच्या तयारीसाठी आवश्यक सर्व काही
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Written exam पासून physical preparation आणि
              performance tracking पर्यंत एक complete preparation experience.
            </p>

          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">

            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-[#ddd8c7] bg-[#faf9f4] p-6 transition duration-300 hover:-translate-y-2 hover:border-[#c9bd8c] hover:bg-white hover:shadow-xl"
              >

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-green text-2xl text-white transition duration-300 group-hover:scale-110 group-hover:bg-pb-khaki">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-lg font-black text-pb-green">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          SUBJECTS
      ===================================================== */}

      <section className="bg-pb-light py-16 sm:py-20">

        <div className="mx-auto w-full max-w-7xl">

          <div className="px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div className="max-w-3xl">

              <p className="text-xs font-black uppercase tracking-[0.2em] text-pb-khaki sm:text-sm">
                📚 Study Subjects
              </p>

              <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl">
                विषयानुसार तुमची तयारी करा
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                प्रत्येक subject चे topics, notes, questions आणि tests
                व्यवस्थित पद्धतीने अभ्यासण्यासाठी.
              </p>

            </div>

            <div className="hidden">
              📚 📝 👮
            </div>

          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {subjects.map((subject) => (
              <div
                key={subject.title}
                className="group rounded-3xl border border-[#ddd8c7] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
              >

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0ecdc] text-xl font-black text-pb-khaki transition duration-300 group-hover:bg-pb-khaki group-hover:text-white">
                    {subject.icon}
                  </div>

                  <div className="min-w-0">

                    <h3 className="font-black text-pb-green">
                      {subject.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {subject.description}
                    </p>

                  </div>

                </div>

              </div>
            ))}

          </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          TEST TYPES
      ===================================================== */}

      <section className="bg-white py-16 sm:py-20">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid items-center gap-10 lg:grid-cols-2">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-pb-khaki sm:text-sm">
                📝 Practice System
              </p>

              <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl">
                तुमच्या level नुसार Test द्या
              </h2>

              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                फक्त questions सोडवण्यापेक्षा वेगवेगळ्या प्रकारच्या
                tests देऊन तुमची actual preparation तपासा.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                {testTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-[#ddd8c7] bg-[#faf9f4] px-4 py-2 text-xs font-bold text-pb-green"
                  >
                    {type}
                  </span>
                ))}

              </div>

            </div>

            <div className="rounded-[2rem] bg-pb-green p-7 text-white shadow-lg sm:p-9">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d7c56f] text-2xl">
                    🏆
                  </div>

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d7c56f]">
                      Test Result
                    </p>

                    <p className="font-black">
                      Performance Overview
                    </p>

                  </div>

                </div>

                <span className="text-3xl">
                  📊
                </span>

              </div>

              <div className="mt-7 space-y-3">
                <div className="rounded-2xl bg-white p-4 text-pb-green sm:p-5">
                  <p className="font-bold">Review each test</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">See your score and accuracy after completing a test.</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-pb-green sm:p-5">
                  <p className="font-bold">Plan what to practice next</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Use your results to revisit questions and topics that need more practice.</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          PREPARATION ROADMAP
      ===================================================== */}

      <section className="bg-pb-green py-12 sm:py-16">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d7c56f] sm:text-sm">
              🎯 Preparation Roadmap
            </p>

            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              तयारीचा योग्य flow
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Study → Practice → Test → Analysis → Physical
            </p>

          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            {preparationSteps.map((step) => (
              <div
                key={step.number}
                className="group rounded-3xl border border-pb-neutral bg-white p-6 text-pb-green shadow-sm transition duration-300 hover:-translate-y-2 hover:border-pb-accent"
              >

                <div className="flex items-center justify-between">

                  <span className="text-sm font-black text-pb-khaki">
                    {step.number}
                  </span>

                  <span className="text-2xl transition duration-300 group-hover:scale-125">
                    {step.icon}
                  </span>

                </div>

                <h3 className="mt-6 font-black text-pb-green">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          PHYSICAL
      ===================================================== */}

      <section className="bg-pb-light py-16 sm:py-20">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.2em] text-pb-khaki sm:text-sm">
                🏃 Physical Preparation
              </p>

              <h2 className="mt-3 text-2xl font-black text-pb-green sm:text-3xl">
                Written सोबत Physical तयारीही track करा
              </h2>

              <p className="mt-5 text-sm leading-8 text-slate-600 sm:text-base">
                तुमच्या physical preparation ची रोजची किंवा नियमित
                नोंद ठेवा. Running time, distance, jumps, push-ups
                आणि weight यासारखी माहिती एकाच ठिकाणी manage करा.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">

                {physicalActivities.map((activity) => (
                  <div
                    key={activity.title}
                    className="rounded-2xl border border-[#ddd8c7] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >

                    <div className="text-2xl">
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

            <div className="relative overflow-hidden rounded-[2rem] bg-pb-green p-7 text-white shadow-lg sm:p-10">


              <div className="relative">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d7c56f]">
                      Fitness Track
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      Physical Progress
                    </h3>

                  </div>

                  <span className="text-5xl">
                    🏃
                  </span>

                </div>

                <div className="mt-8 space-y-4">

                  <div className="rounded-2xl bg-white p-5 text-pb-green">

                    <div className="flex items-center justify-between">

                      <span className="text-sm font-bold">
                        🏃 Running
                      </span>

                      <span className="text-xs text-pb-khaki">
                        Track
                      </span>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Record running time and distance as part of your training.
                    </p>

                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <div className="rounded-2xl bg-white p-5 text-pb-green">

                      <p className="text-xs text-slate-600">
                        💪 Push-ups
                      </p>

                      <p className="mt-2 text-xl font-black">
                        Track
                      </p>

                    </div>

                    <div className="rounded-2xl bg-white p-5 text-pb-green">

                      <p className="text-xs text-slate-600">
                        ⚖️ Weight
                      </p>

                      <p className="mt-2 text-xl font-black">
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

      <section className="bg-white py-16 sm:py-20">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="overflow-hidden rounded-[2rem] bg-pb-green shadow-lg">

            <div className="grid items-center gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_0.8fr] lg:p-14">

              <div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d7c56f] text-3xl">
                  🤖
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#d7c56f]">
                  Marathi AI Assistant
                </p>

              <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                  Police Bharti साठी तुमचा AI Study Assistant
                </h2>

                <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
                  Police Bharti related questions समजून घेण्यासाठी,
                  MCQs तयार करण्यासाठी, topics explain करण्यासाठी आणि
                  study planning साठी Marathi AI assistant वापरता येईल.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">

                  {[
                    "MCQ Generation",
                    "Topic Explanation",
                    "Study Guidance",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-pb-khaki bg-pb-khaki px-4 py-2 text-xs font-bold text-white"
                    >
                      {item}
                    </span>
                  ))}

                </div>

              </div>

              <div className="rounded-3xl border border-pb-neutral bg-white p-6 text-pb-green shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7c56f] text-xl">
                    🤖
                  </div>

                  <div>

                    <p className="font-black text-pb-green">
                      Police Bharti AI
                    </p>

                    <p className="text-xs text-slate-600">
                      Marathi Study Assistant
                    </p>

                  </div>

                </div>

                <div className="mt-6 space-y-3">

                  <div className="rounded-2xl bg-pb-light p-4 text-sm text-pb-green">
                    💬 महाराष्ट्राची राजधानी कोणती?
                  </div>

                  <div className="rounded-2xl bg-pb-neutral p-4 text-sm font-medium text-pb-green">
                    🤖 मुंबई. यासोबत महाराष्ट्राच्या
                    इतिहासातील महत्त्वाचे मुद्देही अभ्यासा.
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

      <section className="bg-pb-light px-4 py-16 sm:px-6 lg:px-8 lg:py-20">

        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-pb-green px-6 py-12 text-center shadow-lg sm:px-10 sm:py-14">

          <div className="text-5xl">
            👮 🚔 🛡️
          </div>

          <h2 className="mt-6 text-2xl font-black leading-tight text-white sm:text-3xl">
            तुमची Police Bharti तयारी
            <span className="block text-[#d7c56f]">
              आजपासून सुरू करा.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            अभ्यास करा, प्रश्न सोडवा, tests द्या, performance तपासा
            आणि physical progress track करा.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d7c56f] px-7 py-4 text-sm font-black text-pb-green transition hover:-translate-y-1 hover:bg-[#e4d787]"
            >
              👮 Free Registration
              <span>→</span>
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-pb-light bg-pb-light px-7 py-4 text-sm font-bold text-pb-green transition hover:bg-white"
            >
              📞 Contact Us
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;
