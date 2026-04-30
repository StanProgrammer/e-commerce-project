import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import avatar from "../../../assets/avatar.png";
import { useUpdateProfileWithAvatarMutation } from "../../../store/features/auth/authApi";
import { setUser } from "../../../store/features/auth/authSlice";
import getApiErrorMessage from "../../../utils/getApiErrorMessage";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [updateProfileWithAvatar, { isLoading, isError, error: updateError }] =
    useUpdateProfileWithAvatarMutation();
  const [formData, setFormData] = useState({
    name: user?.username || "",
    email: user?.email || "",
    profilePic: user?.profilePic || "",
    bio: user?.bio || "",
    profession: user?.profession || "",
    userId: user?._id || "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.username || "",
        email: user.email || "",
        profilePic: user.profilePic || "",
        bio: user.bio || "",
        profession: user.profession || "",
        userId: user._id || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!selectedAvatar) {
      setAvatarPreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetAvatarSelection = () => {
    setSelectedAvatar(null);
    setAvatarError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    if (isLoading) {
      return;
    }

    setIsModalOpen(false);
    resetAvatarSelection();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    setAvatarError("");

    if (!file) {
      setSelectedAvatar(null);
      return;
    }

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setSelectedAvatar(null);
      setAvatarError("Please choose a JPG, PNG, WEBP, or GIF image.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setSelectedAvatar(null);
      setAvatarError("Avatar image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setSelectedAvatar(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (avatarError) {
      return;
    }

    try {
      const profileData = new FormData();
      profileData.append("username", formData.name);
      profileData.append("bio", formData.bio);
      profileData.append("profession", formData.profession);

      if (selectedAvatar) {
        profileData.append("avatar", selectedAvatar);
      }

      const response = await updateProfileWithAvatar({
        userId: formData.userId,
        formData: profileData,
      }).unwrap();

      dispatch(setUser(response.user));
      localStorage.setItem("user", JSON.stringify(response.user));
      setIsModalOpen(false);
      resetAvatarSelection();
      toast.success("Profile updated. Your changes have been saved.");
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Profile could not be updated. Check your details and try again."));
    }
  };

  const displayName = formData.name || "Your name";
  const displayBio = formData.bio || "Add a short bio so shoppers and support can recognize your account.";
  const displayProfession = formData.profession || "Add your profession";
  const currentAvatar = avatarPreview || formData.profilePic || avatar;
  const updateErrorMessage = getApiErrorMessage(updateError, "Profile could not be updated. Check your details and try again.");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Account profile</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Personal details</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Keep your public details polished and your account information easy to review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20 sm:w-auto cursor-pointer"
        >
          <i className="ri-edit-line text-lg" aria-hidden="true" />
          Edit profile
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="h-28 bg-linear-to-r from-slate-950 via-primary to-sky-400" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative h-28 w-28 shrink-0 rounded-full bg-white p-1 shadow-lg">
                  <img
                    src={formData.profilePic || avatar}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                  {!formData.profilePic && (
                    <span className="absolute inset-1 flex items-center justify-center rounded-full bg-primary-light text-2xl font-bold text-primary">
                      {initials || "U"}
                    </span>
                  )}
                </div>

                <div className="pb-1">
                  <h2 className="text-2xl font-bold text-slate-950">{displayName}</h2>
                  <p className="mt-1 text-sm font-medium text-primary">{displayProfession}</p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <i className="ri-shield-check-line text-base" aria-hidden="true" />
                Active account
              </span>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bio</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{displayBio}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Contact snapshot</h3>
              <p className="mt-1 text-sm text-slate-500">Primary information tied to this account.</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
              <i className="ri-user-settings-line text-xl" aria-hidden="true" />
            </span>
          </div>

          <dl className="mt-6 space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <i className="ri-mail-line text-base" aria-hidden="true" />
                Email address
              </dt>
              <dd className="mt-2 break-all text-sm font-semibold text-slate-800">
                {formData.email || "No email available"}
              </dd>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <i className="ri-briefcase-line text-base" aria-hidden="true" />
                Profession
              </dt>
              <dd className="mt-2 text-sm font-semibold text-slate-800">{displayProfession}</dd>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <i className="ri-id-card-line text-base" aria-hidden="true" />
                User ID
              </dt>
              <dd className="mt-2 break-all text-sm font-semibold text-slate-800">
                {formData.userId || "Not available"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-fadeIn">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Edit profile</h2>
                <p className="mt-1 text-sm text-slate-500">Update how your account appears across the dashboard.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close edit profile modal"
              >
                <i className="ri-close-line text-2xl" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={currentAvatar}
                  alt="Profile preview"
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white"
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-950">{displayName}</p>
                  <p className="truncate text-sm text-slate-500">{displayProfession}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src={currentAvatar}
                    alt="Selected avatar preview"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Avatar upload</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Choose a square JPG, PNG, WEBP, or GIF image up to 5 MB.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_AVATAR_TYPES.join(",")}
                        onChange={handleAvatarChange}
                        disabled={isLoading}
                        className="hidden"
                        id="profile-avatar-upload"
                      />
                      <label
                        htmlFor="profile-avatar-upload"
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <i className="ri-upload-cloud-2-line text-lg" aria-hidden="true" />
                        Choose image
                      </label>
                      {selectedAvatar && (
                        <button
                          type="button"
                          onClick={resetAvatarSelection}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <i className="ri-close-circle-line text-lg" aria-hidden="true" />
                          Remove selection
                        </button>
                      )}
                    </div>
                    {selectedAvatar && (
                      <p className="mt-3 truncate text-xs font-medium text-slate-500">
                        Selected: {selectedAvatar.name}
                      </p>
                    )}
                    {avatarError && (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                        {avatarError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Username</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Your display name"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Profession</span>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Designer, developer, manager..."
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Bio</span>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Write a short introduction..."
                />
              </label>

              {isError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {updateErrorMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || Boolean(avatarError)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
                >
                  {isLoading && <i className="ri-loader-4-line animate-spin text-lg" aria-hidden="true" />}
                  {isLoading ? "Uploading..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default UserProfile;
