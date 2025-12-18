import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const Profile = () => {

    const { user } = useContext(AuthContext)
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(user);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            profileInfo: {
                ...prev.profileInfo,
                [name]: value,
            },
        }));
    };

    const handleSave = () => {
        // এখানে API call করে ডেটা আপডেট করতে পারো
        console.log("Updated Profile:", formData);
        setIsEditing(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    {
                       user.is_superuser ? <h2 className="text-2xl font-bold text-gray-800">System Admin </h2>
                                        : <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
                    }
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="btn btn-sm btn-primary"
                    >
                        {isEditing ? "Cancel" : "Edit"}
                    </button>
                </div>

                {/* Profile Info */}
                {!isEditing ? (
                    <div className="space-y-3">
                        <p><strong>Username:</strong> {user?.username || "N/A"}</p>
                        <p><strong>Email:</strong> {user?.email || "N/A"}</p>
                        <p><strong>Bio:</strong> {user?.profileInfo?.bio || "No bio available"}</p>
                        <p><strong>Location:</strong> {user?.profileInfo?.location || "Not provided"}</p>
                        <p><strong>Birth Date:</strong> {user?.profileInfo?.birth_date || "Not provided"}</p>
                        <p className="text-sm text-gray-500">
                            Last Login: {user?.last_login ? new Date(user.last_login).toLocaleString() : "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                            Joinig Date: {user?.date_joined ? new Date(user.date_joined).toLocaleString() : "N/A"}
                        </p>
                    </div>

                ) : (
                    <div className="space-y-3">
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="Username"
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="Email"
                        />
                        <textarea
                            name="bio"
                            value={formData.profileInfo.bio}
                            onChange={handleChange}
                            className="textarea textarea-bordered w-full"
                            placeholder="Bio"
                        />
                        <input
                            type="text"
                            name="location"
                            value={formData.profileInfo.location}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                            placeholder="Location"
                        />
                        <input
                            type="date"
                            name="birth_date"
                            value={formData.profileInfo.birth_date}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                        />
                        <button
                            onClick={handleSave}
                            className="btn btn-success w-full mt-3"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;

// // Example usage
// const userData = {
//   id: 17,
//   username: "aaaa",
//   email: "aaa@gmail.com",
//   first_name: "",
//   last_name: "",
//   profileInfo: {
//     bio: "This is call the bio",
//     location: "Gazipure,Dhaka",
//     birth_date: "2025-12-07",
//     created_at: "2025-12-07T22:31:58.879887Z",
//     updated_at: "2025-12-07T22:31:58.879887Z",
//   },
// };

// export default function App() {
//   return <UserProfile user={userData} />;
// }