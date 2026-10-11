import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import {
  createStudentProfile,
  getStudentProfile,
  uploadStudentProfilePhoto,
  updateStudentProfile,
} from "../../services/studentProfileService";

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

const profileFields = profileSections.flatMap(
  (section) => section.fields
);

const allowedPhotoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedPhotoExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

const maxPhotoSize = 5 * 1024 * 1024;

function createEmptyProfile() {
  return Object.fromEntries(
    profileFields.map(({ name }) => [name, ""])
  );
}

function toFormValues(profile) {
  return Object.fromEntries(
    profileFields.map(({ name }) => [
      name,
      profile[name] ?? "",
    ])
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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "माहिती उपलब्ध नाही";
  }

  return unit ? `${value} ${unit}` : value;
}

/*
 * Backend returns:
 *
 * /uploads/profile_photos/student_4_xxx.png
 *
 * API base URL is:
 *
 * http://127.0.0.1:5000/api
 *
 * Therefore we must use the API origin:
 *
 * http://127.0.0.1:5000
 *
 * Final image URL becomes:
 *
 * http://127.0.0.1:5000/uploads/profile_photos/...
 */
function getProfilePhotoUrl(photoPath) {
  if (!photoPath) {
    return "";
  }

  try {
    const apiUrl = new URL(api.defaults.baseURL);

    const backendOrigin = apiUrl.origin;

    return new URL(photoPath, backendOrigin).toString();
  } catch {
    return "";
  }
}

function StudentProfile() {
  const [profile, setProfile] = useState(null);

  const [formValues, setFormValues] = useState(
    createEmptyProfile
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");

  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const photoInputRef = useRef(null);

  const photoUploadInProgress = useRef(false);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl("");
      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(selectedPhoto);

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
          throw new Error(
            "Unexpected student profile response"
          );
        }

        if (isActive) {
          setProfile(response.data);

          setFormValues(
            toFormValues(response.data)
          );
        }
      } catch (requestError) {
        if (!isActive) {
          return;
        }

        if (requestError.response?.status === 404) {
          setProfile(null);

          setFormValues(
            createEmptyProfile()
          );

          setEditing(true);
        } else {
          console.error(
            "Failed to load student profile:",
            requestError
          );

          setErrorMessage(
            getErrorMessage(requestError)
          );
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
    const file =
      event.target.files?.[0] || null;

    setPhotoSuccess("");
    setPhotoError("");

    if (!file) {
      setSelectedPhoto(null);
      return;
    }

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      !allowedPhotoTypes.has(file.type) ||
      !allowedPhotoExtensions.has(extension)
    ) {
      setSelectedPhoto(null);

      setPhotoError(
        "कृपया JPG, PNG किंवा WEBP स्वरूपातील फोटो निवडा."
      );

      event.target.value = "";

      return;
    }

    if (file.size > maxPhotoSize) {
      setSelectedPhoto(null);

      setPhotoError(
        "फोटोचा आकार 5 MB किंवा त्यापेक्षा कमी असावा."
      );

      event.target.value = "";

      return;
    }

    setSelectedPhoto(file);
  };

  const handlePhotoUpload = async () => {
    if (
      !selectedPhoto ||
      photoUploadInProgress.current
    ) {
      if (!selectedPhoto) {
        setPhotoError(
          "अपलोड करण्यासाठी आधी फोटो निवडा."
        );
      }

      return;
    }

    photoUploadInProgress.current = true;

    setUploadingPhoto(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const response =
        await uploadStudentProfilePhoto(
          selectedPhoto
        );

      const photoPath =
        response.data?.profile_photo;

      if (!response.success || !photoPath) {
        throw new Error(
          "Unexpected profile photo upload response"
        );
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        profile_photo: photoPath,
      }));

      setSelectedPhoto(null);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      setPhotoSuccess(
        "प्रोफाइल फोटो यशस्वीरित्या अपलोड झाला."
      );
    } catch (uploadError) {
      console.error(
        "Failed to upload student profile photo:",
        uploadError
      );

      if (
        uploadError.response?.status === 400
      ) {
        setPhotoError(
          uploadError.response.data?.message ||
            "हा फोटो अपलोड करता येत नाही. JPG, PNG किंवा WEBP फोटो (कमाल 5 MB) निवडा."
        );
      } else if (
        uploadError.response?.status === 401
      ) {
        setPhotoError(
          "तुमचे सत्र संपले आहे. कृपया पुन्हा लॉग इन करा."
        );
      } else if (
        uploadError.response?.status === 403
      ) {
        setPhotoError(
          "फोटो अपलोड करण्याची परवानगी नाही."
        );
      } else if (
        uploadError.response?.status === 404
      ) {
        setPhotoError(
          "आधी प्रोफाइल तयार करा, त्यानंतर फोटो अपलोड करा."
        );
      } else if (
        !uploadError.response &&
        uploadError.isAxiosError
      ) {
        setPhotoError(
          "सर्व्हरशी संपर्क होऊ शकला नाही. पुन्हा प्रयत्न करा."
        );
      } else {
        setPhotoError(
          "फोटो अपलोड करता आला नाही. कृपया पुन्हा प्रयत्न करा."
        );
      }
    } finally {
      photoUploadInProgress.current = false;

      setUploadingPhoto(false);
    }
  };

  const handleEdit = () => {
    setFormValues(
      toFormValues(profile)
    );

    setErrorMessage("");
    setSuccessMessage("");

    setPhotoError("");
    setPhotoSuccess("");

    setEditing(true);
  };

  const handleCancel = () => {
    setFormValues(
      profile
        ? toFormValues(profile)
        : createEmptyProfile()
    );

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

    if (saving) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const profileData = Object.fromEntries(
      profileFields.map(
        ({ name, type }) => {
          const value = formValues[name];

          return [
            name,
            value === ""
              ? null
              : type === "number"
                ? String(value)
                : value,
          ];
        }
      )
    );

    try {
      const saveResponse = profile
        ? await updateStudentProfile(
            profileData
          )
        : await createStudentProfile(
            profileData
          );

      if (!saveResponse.success) {
        throw new Error(
          "Student profile save was unsuccessful"
        );
      }

      const refreshedResponse =
        await getStudentProfile();

      if (
        !refreshedResponse.success ||
        !refreshedResponse.data
      ) {
        throw new Error(
          "Unexpected refreshed student profile response"
        );
      }

      setProfile(
        refreshedResponse.data
      );

      setFormValues(
        toFormValues(
          refreshedResponse.data
        )
      );

      setEditing(false);

      setSuccessMessage(
        "तुमची प्रोफाइल यशस्वीरित्या जतन झाली."
      );
    } catch (requestError) {
      console.error(
        "Failed to save student profile:",
        requestError
      );

      setErrorMessage(
        getErrorMessage(requestError)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-pb-light">

      {/* Header */}
      <section className="border-b border-pb-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">

          <p className="text-sm font-bold text-pb-khaki">
            विद्यार्थी खाते
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <h1 className="text-2xl font-extrabold text-pb-green sm:text-3xl">
                माझी प्रोफाइल
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                तुमची वैयक्तिक, शैक्षणिक आणि
                भरतीसंबंधित माहिती व्यवस्थापित करा.
              </p>
            </div>

            {profile && !editing && (
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki"
              >
                प्रोफाइल संपादित करा
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">

        {/* Success */}
        {successMessage && (
          <p
            role="status"
            className="rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-pb-green"
          >
            {successMessage}
          </p>
        )}

        {/* Error */}
        {errorMessage && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700"
          >
            {errorMessage}
          </p>
        )}

        {/* Profile Photo */}
        {!loading && profile && (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">

            <h2 className="text-lg font-extrabold text-pb-green">
              प्रोफाइल फोटो
            </h2>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">

              {/* Image */}
              <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-pb-border bg-pb-light">

                {(
                  photoPreviewUrl ||
                  getProfilePhotoUrl(
                    profile.profile_photo
                  )
                ) ? (
                  <img
                    src={
                      photoPreviewUrl ||
                      getProfilePhotoUrl(
                        profile.profile_photo
                      )
                    }
                    alt={
                      photoPreviewUrl
                        ? "निवडलेल्या फोटोचा पूर्वावलोकन"
                        : "प्रोफाइल फोटो"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="text-5xl"
                    aria-hidden="true"
                  >
                    👤
                  </span>
                )}
              </div>

              {/* Upload */}
              <div className="min-w-0 flex-1">

                <p className="text-sm font-bold text-slate-700">
                  {photoPreviewUrl
                    ? "फोटो पूर्वावलोकन"
                    : "सध्याचा फोटो"}
                </p>

                <div className="mt-3 space-y-3">

                  <label
                    htmlFor="profile-photo-file"
                    className="block text-sm font-medium text-slate-600"
                  >
                    फोटो निवडा
                  </label>

                  <input
                    id="profile-photo-file"
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handlePhotoSelection
                    }
                    disabled={uploadingPhoto}
                    className="block w-full max-w-xl rounded-xl border border-[#d8d1bf] bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-pb-light file:px-3 file:py-2 file:font-bold file:text-pb-green disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    disabled={
                      !selectedPhoto ||
                      uploadingPhoto
                    }
                    className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingPhoto
                      ? "फोटो अपलोड होत आहे..."
                      : "Upload Photo"}
                  </button>
                </div>

                {photoError && (
                  <p
                    role="alert"
                    className="mt-3 text-sm font-medium text-red-700"
                  >
                    {photoError}
                  </p>
                )}

                {photoSuccess && (
                  <p
                    role="status"
                    className="mt-3 text-sm font-bold text-pb-green"
                  >
                    {photoSuccess}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Loading */}
        {loading ? (
          <section
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-white p-8 text-center text-sm font-medium text-slate-600 shadow-sm"
          >
            प्रोफाइल लोड होत आहे...
          </section>
        ) : errorMessage && !editing ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki"
            >
              पुन्हा प्रयत्न करा
            </button>

          </section>
        ) : editing ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">

            {!profile && (
              <div className="mb-6 rounded-xl border border-pb-border bg-pb-light p-5">

                <h2 className="text-lg font-extrabold text-pb-green">
                  प्रोफाइल अजून तयार केलेली नाही
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  खालील माहिती भरून तुमची Student
                  Profile तयार करा.
                </p>

              </div>
            )}

            {!profile && (
              <p className="mb-5 rounded-xl bg-pb-light p-4 text-sm text-slate-600">
                प्रोफाइल तयार झाल्यानंतर तुम्ही येथे
                प्रोफाइल फोटो अपलोड करू शकता.
              </p>
            )}

            <div>
              <p className="text-sm font-bold text-pb-khaki">
                {profile
                  ? "प्रोफाइल अपडेट"
                  : "नवीन प्रोफाइल"}
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-pb-green">
                {profile
                  ? "प्रोफाइल संपादित करा"
                  : "तुमची प्रोफाइल तयार करा"}
              </h2>
            </div>

            <form
              className="mt-7 space-y-7"
              onSubmit={handleSubmit}
            >
              {profileSections
                .filter(
                  (section) =>
                    section.fields.length > 0
                )
                .map((section) => (
                  <fieldset key={section.title}>

                    <legend className="mb-4 text-base font-extrabold text-pb-green">
                      {section.title}
                    </legend>

                    <div className="grid gap-4 sm:grid-cols-2">

                      {section.fields.map(
                        (field) => (
                          <div
                            key={field.name}
                            className={
                              field.type ===
                              "textarea"
                                ? "sm:col-span-2"
                                : ""
                            }
                          >

                            <label
                              htmlFor={`profile-${field.name}`}
                              className="block text-sm font-bold text-slate-700"
                            >
                              {field.label}

                              {field.unit && (
                                <span className="ml-1 font-normal text-slate-500">
                                  ({field.unit})
                                </span>
                              )}
                            </label>

                            {field.type ===
                            "textarea" ? (
                              <textarea
                                id={`profile-${field.name}`}
                                name={field.name}
                                value={
                                  formValues[
                                    field.name
                                  ]
                                }
                                onChange={
                                  handleFieldChange
                                }
                                rows={3}
                                className="mt-2 w-full rounded-xl border border-[#d8d1bf] px-4 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
                              />
                            ) : (
                              <input
                                id={`profile-${field.name}`}
                                name={field.name}
                                type={field.type}
                                value={
                                  formValues[
                                    field.name
                                  ]
                                }
                                onChange={
                                  handleFieldChange
                                }
                                min={
                                  field.type ===
                                  "number"
                                    ? "0"
                                    : undefined
                                }
                                step={field.step}
                                placeholder={
                                  field.placeholder
                                }
                                className="mt-2 w-full rounded-xl border border-[#d8d1bf] px-4 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
                              />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </fieldset>
                ))}

              <div className="flex flex-col-reverse gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:justify-end">

                {profile && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60"
                  >
                    रद्द करा
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "प्रोफाइल जतन होत आहे..."
                    : profile
                      ? "बदल जतन करा"
                      : "प्रोफाइल तयार करा"}
                </button>

              </div>
            </form>
          </section>
        ) : profile ? (
          <div className="space-y-6">

            {profileSections
              .filter(
                (section) =>
                  section.fields.length > 0
              )
              .map((section) => (
                <section
                  key={section.title}
                  className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"
                >

                  <h2 className="text-lg font-extrabold text-pb-green">
                    {section.title}
                  </h2>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    {section.fields.map(
                      (field) => (
                        <div
                          key={field.name}
                          className="min-w-0 rounded-xl bg-pb-light p-4"
                        >

                          <dt className="text-xs font-bold text-slate-500">
                            {field.label}
                          </dt>

                          <dd className="mt-1 break-words text-sm font-extrabold text-pb-green">
                            {formatProfileValue(
                              profile[field.name],
                              field.unit
                            )}
                          </dd>

                        </div>
                      )
                    )}

                  </dl>
                </section>
              ))}
          </div>
        ) : (
          <section className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm sm:px-8">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pb-light text-3xl">
              👤
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-pb-green">
              प्रोफाइल अजून तयार केलेली नाही
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              खालील माहिती भरून तुमची प्रोफाइल तयार करा.
            </p>

          </section>
        )}
      </main>
    </div>
  );
}

export default StudentProfile;