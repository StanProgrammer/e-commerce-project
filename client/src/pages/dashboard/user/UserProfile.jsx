import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEditProfileMutation } from "../../../store/features/auth/authApi";
import avatar from "../../../assets/avatar.png";
import { setUser } from "../../../store/features/auth/authSlice";
import toast from "react-hot-toast";
const UserProfile = () => {
   
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [editProfile, { isLoading, isError, isSuccess }] = useEditProfileMutation();
  const [formData, setFormData] = useState({
    name: user?.username || "",
    email: user?.email || "",
    profilePic: user?.profilePic || "",
    bio: user?.bio || "",
    profession: user?.profession || "",
    userId: user?._id || "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await editProfile({
      userId: formData.userId,
      body: {
        username: formData.name,
        profilePic: formData.profilePic,
        bio: formData.bio,
        profession: formData.profession,
      },
    }).unwrap();

    dispatch(setUser(response.user));
    localStorage.setItem("user", JSON.stringify(response.user));
    setIsModalOpen(false);
    // removed reset()
    setTimeout(() => {
      toast.success("Profile updated successfully!");
    }, 100);
  } catch (error) {
    console.error(error);
    toast.error("Failed to update profile. Please try again.");
  }
};

  return (
   <div className="min-h-screen bg-gray-50 py-10 px-4">

  <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
    
    {/* Profile Header */}
    <div className="flex items-center gap-6">
      <div className="relative">
        <img
          src={formData.profilePic || avatar}
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-sm"
        />
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-semibold text-gray-800">
          {formData?.name || "N/A"}
        </h2>
        <p className="text-gray-500 mt-1">{formData?.bio || "No bio added"}</p>
        <p className="text-sm text-blue-600 mt-1 font-medium">
          {formData?.profession || "No profession"}
        </p>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
      >
        <i className="ri-edit-line"></i>
        Edit
      </button>
    </div>
  </div>

  {/* Modal */}
  {isModalOpen && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative animate-fadeIn">
        
        {/* Close */}
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <i className="ri-close-line text-2xl cursor-pointer"></i>
        </button>

        <h2 className="text-xl font-semibold mb-5 text-gray-800">
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username */}
          <div>
            <label className="text-sm text-gray-600">Username</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Profile Pic */}
          <div>
            <label className="text-sm text-gray-600">Profile Image URL</label>
            <input
              type="text"
              name="profilePic"
              value={formData.profilePic}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-600">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Profession */}
          <div>
            <label className="text-sm text-gray-600">Profession</label>
            <input
              type="text"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 rounded-lg text-white font-medium transition cursor-pointer ${
              isLoading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>

          {/* Feedback */}
          {isError && (
            <p className="text-red-500 text-sm">Something went wrong.</p>
          )}
          {isSuccess && (
            <p className="text-green-500 text-sm">
              Profile updated successfully.
            </p>
          )}
        </form>
      </div>
    </div>
  )}
</div>
  );
};

export default UserProfile;
