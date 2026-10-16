import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import {
  createStudentProfile,
  getStudentProfile,
  uploadStudentProfilePhoto,
  updateStudentProfile,
} from "../../services/studentProfileService";

/* ---------- SVG ICON SET ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const UserIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
const CameraIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
const UploadIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 17V4M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);
const EditIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m4 20 4-1 10-10a2 2 0 0 0-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
  </svg>
);
const SaveIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v6h7V3M8 17h8" />
  </svg>
);
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);
const RefreshIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
);
const IdCardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="9" cy="12" r="2.2" />
    <path d="M14 10h5M14 14h4" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const ActivityIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    <path d="M3 20h18" />
  </svg>
);
const MapPinIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const TagIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);
const TrendingUpIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 17 5-5 4 3 8-8" />
    <path d="M14 7h6v6" />
  </svg>
);
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);
const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
const RulerIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 8h18v8H3z" />
    <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
  </svg>
);
const WeightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 8h12l2 12H4L6 8Z" />
    <path d="M9 8a3 3 0 1 1 6 0" />
  </svg>
);

/* ---------- ICON MAP ---------- */
const fieldIcons = {
  district: MapPinIcon,
  date_of_birth: CalendarIcon,
  category: TagIcon,
  education: BookIcon,
  qualification: BookIcon,
  study_goal: TrendingUpIcon,
  target_exam: TargetIcon,
  physical_goal: ActivityIcon,
  height: RulerIcon,
  chest: RulerIcon,
  weight: WeightIcon,
};

const sectionIcons = {
  "वैयक्तिक माहिती": UserIcon,
  "शैक्षणिक माहिती": BookIcon,
  "पोलीस भरती माहिती": TargetIcon,
  "शारीरिक माहिती": ActivityIcon,
};

const profileSections = [
  {
    title: "वैयक्तिक माहिती",
    fields: [
      { name: "district", label: "जिल्हा", type: "text" },
      {
        name: "date_of_birth",
        label: "जन्मतारीख",
        type: "date",
      },
      { name: "category", label: "प्रवर्ग", type: "text" },
    ],
  },
  {
    title: "शैक्षणिक माहिती",
    fields: [
      { name: "education", label: "शिक्षण", type: "text" },
      { name: "qualification", label: "शैक्षणिक पात्रता", type: "text" },
      {
        name: "study_goal",
        label: "अभ्यासाचे ध्येय",
        type: "textarea",
      },
    ],
  },
  {
    title: "पोलीस भरती माहिती",
    fields: [
      {
        name: "target_exam",
        label: "लक्ष्य परीक्षा",
        type: "text",
      },
      {
        name: "physical_goal",
        label: "शारीरिक प्रशिक्षणाचे ध्येय",
        type: "textarea",
      },
    ],
  },
  {
    title: "शारीरिक माहिती",
    fields: [
      {
        name: "height",
        label: "उंची",
        type: "number",
        step: "0.01",
        unit: "से.मी.",
      },
      {
        name: "chest",
        label: "छाती",
        type: "number",
        step: "0.01",
        unit: "से.मी.",
      },
      {
        name: "weight",
        label: "वजन",
        type: "number",
        step: "0.01",
        unit: "कि.ग्रॅ.",
      },
    ],
  },
];

const profileFields = profileSections.flatMap((section) => section.fields);

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedPhotoExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const maxPhotoSize = 5 * 1024 * 1024;

function createEmptyProfile() {
  return Object.fromEntries(profileFields.map(({ name }) => [name, ""]));
}

function toFormValues(profile) {
  return Object.fromEntries(
    profileFields.map(({ name }) => [name, profile[name] ?? ""]),
  );
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return "तुमचे सत्र संपले आहे. कृपया पुन्हा लॉग इन करा.";
  }
  if (error.response?.status === 403) {
    return "प्रोफाइल पाहण्याची किंवा बदलण्याची परवानगी नाही.";
  }
  if (error.response?.status === 404) {
    return "प्रोफाइल उपलब्ध नाही. कृपया पुन्हा लोड करून प्रयत्न करा.";
  }
  if (error.response?.status === 422) {
    return "कृपया दिलेली प्रोफाइल माहिती तपासून पुन्हा प्रयत्न करा.";
  }
  if (!error.response && error.isAxiosError) {
    return "सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.";
  }
  return "प्रोफाइल लोड किंवा जतन करता आली नाही. कृपया पुन्हा प्रयत्न करा.";
}

function formatProfileValue(value, unit) {
  if (value === null || value === undefined || value === "") {
    return "माहिती उपलब्ध नाही";
  }
  return unit ? `${value} ${unit}` : value;
}

function getProfilePhotoUrl(photoPath) {
  if (!photoPath) return "";
  try {
    const apiUrl = new URL(api.defaults.baseURL);
    const backendOrigin = apiUrl.origin;
    return new URL(photoPath, backendOrigin).toString();
  } catch {
    return "";
  }
}

/* ---------- ANIMATIONS ---------- */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes blobMove {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(40px, -60px) scale(1.12); }
        66% { transform: translate(-30px, 30px) scale(0.94); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes gradientPan {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes softGlow {
        0%, 100% { opacity: 0.45; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.12); }
      }
      @keyframes spinSoft { to { transform: rotate(360deg); } }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft { animation: none !important; }
      }
    `}</style>
  );
}

function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-pb-light via-white to-pb-light" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="animate-blob absolute -top-32 -left-28 h-80 w-80 rounded-full bg-pb-khaki/20 blur-3xl" />
      <div className="animate-blob delay-2 absolute top-1/3 -right-28 h-72 w-72 rounded-full bg-pb-green/12 blur-3xl" />
      <div className="animate-blob delay-4 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pb-khaki/15 blur-3xl" />
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-pb-border bg-white px-4 py-3 text-sm font-medium text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-100";

/* ================= FIELD VIEW TILE ================= */
function FieldTile({ field, value }) {
  const Icon = fieldIcons[field.name] || InfoIcon;
  const missing = value === "माहिती उपलब्ध नाही";

  return (
    <div className="min-w-0 rounded-xl border border-pb-border-soft bg-white/70 p-3.5 transition-colors duration-200 hover:bg-white">
      <dt className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase sm:text-[11px]">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
          <Icon className="h-3 w-3" />
        </span>
        {field.label}
      </dt>
      <dd
        className={`mt-1.5 text-sm font-extrabold break-words ${missing ? "text-slate-400" : "text-pb-green"
          }`}
      >
        {value}
      </dd>
    </div>
  );
}

function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [formValues, setFormValues] = useState(createEmptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const photoUploadInProgress = useRef(false);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedPhoto]);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getStudentProfile();

        if (!response.success || !response.data) {
          throw new Error("Unexpected student profile response");
        }

        if (isActive) {
          setProfile(response.data);
          setFormValues(toFormValues(response.data));
        }
      } catch (requestError) {
        if (!isActive) return;

        if (requestError.response?.status === 404) {
          setProfile(null);
          setFormValues(createEmptyProfile());
          setEditing(true);
        } else {
          setErrorMessage(getErrorMessage(requestError));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0] || null;

    setPhotoSuccess("");
    setPhotoError("");

    if (!file) {
      setSelectedPhoto(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (
      !allowedPhotoTypes.has(file.type) ||
      !allowedPhotoExtensions.has(extension)
    ) {
      setSelectedPhoto(null);
      setPhotoError("कृपया JPG, PNG किंवा WEBP स्वरूपातील फोटो निवडा.");
      event.target.value = "";
      return;
    }

    if (file.size > maxPhotoSize) {
      setSelectedPhoto(null);
      setPhotoError("फोटोचा आकार 5 MB किंवा त्यापेक्षा कमी असावा.");
      event.target.value = "";
      return;
    }

    setSelectedPhoto(file);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || photoUploadInProgress.current) {
      if (!selectedPhoto) {
        setPhotoError("अपलोड करण्यासाठी आधी फोटो निवडा.");
      }
      return;
    }

    photoUploadInProgress.current = true;
    setUploadingPhoto(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const response = await uploadStudentProfilePhoto(selectedPhoto);
      const photoPath = response.data?.profile_photo;

      if (!response.success || !photoPath) {
        throw new Error("Unexpected profile photo upload response");
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        profile_photo: photoPath,
      }));

      setSelectedPhoto(null);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      setPhotoSuccess("प्रोफाइल फोटो यशस्वीरित्या अपलोड झाला.");
    } catch (uploadError) {
      if (uploadError.response?.status === 400) {
        setPhotoError(
          uploadError.response.data?.message ||
          "हा फोटो अपलोड करता येत नाही. JPG, PNG किंवा WEBP फोटो (कमाल 5 MB) निवडा.",
        );
      } else if (uploadError.response?.status === 401) {
        setPhotoError("तुमचे सत्र संपले आहे. कृपया पुन्हा लॉग इन करा.");
      } else if (uploadError.response?.status === 403) {
        setPhotoError("फोटो अपलोड करण्याची परवानगी नाही.");
      } else if (uploadError.response?.status === 404) {
        setPhotoError("आधी प्रोफाइल तयार करा, त्यानंतर फोटो अपलोड करा.");
      } else if (!uploadError.response && uploadError.isAxiosError) {
        setPhotoError("सर्व्हरशी संपर्क होऊ शकला नाही. पुन्हा प्रयत्न करा.");
      } else {
        setPhotoError("फोटो अपलोड करता आला नाही. कृपया पुन्हा प्रयत्न करा.");
      }
    } finally {
      photoUploadInProgress.current = false;
      setUploadingPhoto(false);
    }
  };

  const handleEdit = () => {
    setFormValues(toFormValues(profile));
    setErrorMessage("");
    setSuccessMessage("");
    setPhotoError("");
    setPhotoSuccess("");
    setEditing(true);
  };

  const handleCancel = () => {
    setFormValues(profile ? toFormValues(profile) : createEmptyProfile());
    setSelectedPhoto(null);
    setPhotoError("");
    setPhotoSuccess("");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
    setErrorMessage("");
    setEditing(Boolean(!profile));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const profileData = Object.fromEntries(
      profileFields.map(({ name, type }) => {
        const value = formValues[name];
        return [
          name,
          value === "" ? null : type === "number" ? String(value) : value,
        ];
      }),
    );

    try {
      const saveResponse = profile
        ? await updateStudentProfile(profileData)
        : await createStudentProfile(profileData);

      if (!saveResponse.success) {
        throw new Error("Student profile save was unsuccessful");
      }

      const refreshedResponse = await getStudentProfile();

      if (!refreshedResponse.success || !refreshedResponse.data) {
        throw new Error("Unexpected refreshed student profile response");
      }

      setProfile(refreshedResponse.data);
      setFormValues(toFormValues(refreshedResponse.data));
      setEditing(false);
      setSuccessMessage("तुमची प्रोफाइल यशस्वीरित्या जतन झाली.");
    } catch (requestError) {
      setErrorMessage(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">

        {/* ================= PAGE HEADER ================= */}
        <div className="animate-fade-up mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm sm:mt-6 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                />
                <IdCardIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  विद्यार्थी खाते
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  माझी प्रोफाइल
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  तुमची वैयक्तिक, शैक्षणिक आणि भरतीसंबंधित माहिती व्यवस्थापित
                  करा.
                </p>
              </div>
            </div>

            {profile && !editing && (
              <button
                type="button"
                onClick={handleEdit}
                className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <EditIcon className="h-4 w-4" />
                प्रोफाइल संपादित करा
              </button>
            )}
          </div>
        </div>

        <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ================= SUCCESS ================= */}
          {successMessage && (
            <div
              role="status"
              className="animate-fade-up flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800"
            >
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{successMessage}</span>
            </div>
          )}

          {/* ================= ERROR ================= */}
          {errorMessage && (
            <div
              role="alert"
              className="animate-fade-up flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{errorMessage}</span>
            </div>
          )}

          {/* ================= PROFILE PHOTO ================= */}
          {!loading && profile && (
            <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
              />

              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                    <CameraIcon className="h-4 w-4" />
                  </span>
                  <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                    प्रोफाइल फोटो
                  </h2>
                  <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  {/* Photo preview */}
                  <div className="relative shrink-0">
                    <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-pb-light to-white shadow-md ring-1 ring-pb-khaki/30">
                      {photoPreviewUrl ||
                        getProfilePhotoUrl(profile.profile_photo) ? (
                        <img
                          src={
                            photoPreviewUrl ||
                            getProfilePhotoUrl(profile.profile_photo)
                          }
                          alt={
                            photoPreviewUrl
                              ? "निवडलेल्या फोटोचा पूर्वावलोकन"
                              : "प्रोफाइल फोटो"
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon
                          className="h-14 w-14 text-pb-khaki"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    {photoPreviewUrl && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 rounded-full border border-pb-khaki/30 bg-pb-khaki/15 px-2 py-0.5 text-[10px] font-extrabold text-pb-khaki shadow-sm">
                        <SparklesIcon className="h-3 w-3" />
                        नवीन
                      </span>
                    )}
                  </div>

                  {/* Upload controls */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-700">
                      {photoPreviewUrl
                        ? "फोटो पूर्वावलोकन"
                        : "सध्याचा फोटो"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG किंवा WEBP · कमाल 5 MB
                    </p>

                    <div className="mt-4 space-y-3">
                      <label
                        htmlFor="profile-photo-file"
                        className="block text-sm font-bold text-pb-green"
                      >
                        फोटो निवडा
                      </label>

                      <input
                        id="profile-photo-file"
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoSelection}
                        disabled={uploadingPhoto}
                        className="block w-full max-w-xl cursor-pointer rounded-xl border border-pb-border bg-white p-2 text-sm text-slate-700 transition-colors file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-pb-light file:px-3 file:py-2 file:text-xs file:font-bold file:text-pb-green hover:file:bg-pb-neutral disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={handlePhotoUpload}
                        disabled={!selectedPhoto || uploadingPhoto}
                        className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {uploadingPhoto ? (
                          <>
                            <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                            फोटो अपलोड होत आहे...
                          </>
                        ) : (
                          <>
                            <UploadIcon className="h-4 w-4" />
                            Upload Photo
                          </>
                        )}
                      </button>
                    </div>

                    {photoError && (
                      <div
                        role="alert"
                        className="animate-fade-up mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
                      >
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="min-w-0 break-words">{photoError}</span>
                      </div>
                    )}

                    {photoSuccess && (
                      <div
                        role="status"
                        className="animate-fade-up mt-3 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm font-bold text-green-800"
                      >
                        <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="min-w-0 break-words">
                          {photoSuccess}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= LOADING ================= */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                प्रोफाइल लोड होत आहे...
              </p>
              <p className="text-xs text-slate-500">Fetching your profile.</p>
            </div>
          ) : errorMessage && !editing ? (
            /* ================= ERROR FALLBACK ================= */
            <div
              role="alert"
              className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
              />
              <div className="flex flex-col items-center gap-4 p-7 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertIcon className="h-6 w-6" />
                </span>
                <p className="max-w-md text-sm font-semibold text-red-700">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : editing ? (
            /* ================= EDIT FORM ================= */
            <section className="animate-fade-up space-y-5">
              {!profile && (
                <div className="relative overflow-hidden rounded-2xl border border-pb-khaki/30 bg-gradient-to-br from-pb-light via-white to-pb-light p-5 shadow-sm sm:p-6">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pb-khaki via-[#e1d37f] to-pb-khaki"
                  />
                  <div className="flex items-start gap-3 pl-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pb-khaki/15 text-pb-khaki shadow-sm">
                      <InfoIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                        प्रोफाइल अजून तयार केलेली नाही
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                        खालील माहिती भरून तुमची Student Profile तयार करा. प्रोफाइल
                        तयार झाल्यानंतर तुम्ही वर प्रोफाइल फोटो अपलोड करू शकता.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {profileSections
                  .filter((section) => section.fields.length > 0)
                  .map((section, sectionIndex) => {
                    const SectionIcon =
                      sectionIcons[section.title] || InfoIcon;
                    return (
                      <div
                        key={section.title}
                        className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
                        style={{
                          animationDelay: `${60 + sectionIndex * 50}ms`,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                        />

                        <fieldset className="p-5 sm:p-6">
                          <legend className="mb-4 flex w-full items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
                              <SectionIcon className="h-4 w-4" />
                            </span>
                            <span className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                              {section.title}
                            </span>
                            <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                          </legend>

                          <div className="grid gap-4 sm:grid-cols-2">
                            {section.fields.map((field) => {
                              const FieldIcon =
                                fieldIcons[field.name] || InfoIcon;
                              return (
                                <div
                                  key={field.name}
                                  className={
                                    field.type === "textarea"
                                      ? "sm:col-span-2"
                                      : ""
                                  }
                                >
                                  <label
                                    htmlFor={`profile-${field.name}`}
                                    className="flex items-center gap-2 text-sm font-bold text-pb-green"
                                  >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                                      <FieldIcon className="h-3.5 w-3.5" />
                                    </span>
                                    <span>
                                      {field.label}
                                      {field.unit && (
                                        <span className="ml-1 font-normal text-slate-500">
                                          ({field.unit})
                                        </span>
                                      )}
                                    </span>
                                  </label>

                                  {field.type === "textarea" ? (
                                    <textarea
                                      id={`profile-${field.name}`}
                                      name={field.name}
                                      value={formValues[field.name]}
                                      onChange={handleFieldChange}
                                      rows={3}
                                      className={`${inputClass} resize-y`}
                                    />
                                  ) : (
                                    <input
                                      id={`profile-${field.name}`}
                                      name={field.name}
                                      type={field.type}
                                      value={formValues[field.name]}
                                      onChange={handleFieldChange}
                                      min={
                                        field.type === "number"
                                          ? "0"
                                          : undefined
                                      }
                                      step={field.step}
                                      placeholder={field.placeholder}
                                      className={inputClass}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </fieldset>
                      </div>
                    );
                  })}

                {/* Form actions */}
                <div className="animate-fade-up flex flex-col-reverse gap-3 rounded-2xl border border-pb-border bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-end sm:p-5">
                  {profile && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-5 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <CloseIcon className="h-4 w-4" />
                      रद्द करा
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {saving ? (
                      <>
                        <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                        प्रोफाइल जतन होत आहे...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="h-4 w-4" />
                        {profile ? "बदल जतन करा" : "प्रोफाइल तयार करा"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          ) : profile ? (
            /* ================= VIEW MODE ================= */
            <div className="space-y-5">
              {profileSections
                .filter((section) => section.fields.length > 0)
                .map((section, sectionIndex) => {
                  const SectionIcon = sectionIcons[section.title] || InfoIcon;
                  return (
                    <section
                      key={section.title}
                      className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
                      style={{
                        animationDelay: `${Math.min(sectionIndex * 60, 400)}ms`,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                      />

                      <div className="p-5 sm:p-6">
                        <div className="mb-4 flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                            <SectionIcon className="h-4 w-4" />
                          </span>
                          <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                            {section.title}
                          </h2>
                          <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                        </div>

                        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {section.fields.map((field) => (
                            <FieldTile
                              key={field.name}
                              field={field}
                              value={formatProfileValue(
                                profile[field.name],
                                field.unit,
                              )}
                            />
                          ))}
                        </dl>
                      </div>
                    </section>
                  );
                })}
            </div>
          ) : (
            /* ================= EMPTY STATE ================= */
            <div className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <UserIcon className="h-6 w-6" />
              </span>
              <h2 className="text-base font-extrabold text-pb-green sm:text-lg">
                प्रोफाइल अजून तयार केलेली नाही
              </h2>
              <p className="max-w-md text-sm text-slate-500">
                खालील माहिती भरून तुमची प्रोफाइल तयार करा.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentProfile;