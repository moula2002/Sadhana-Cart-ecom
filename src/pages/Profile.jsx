// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { auth, storage } from "../firebase";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FaUser,
    FaEnvelope,
    FaCamera,
    FaSave,
    FaSpinner,
    FaEdit,
    FaTimesCircle,
    FaLock,
    FaArrowRight
} from "react-icons/fa";

function Profile() {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [name, setName] = useState("");
    const [photo, setPhoto] = useState("");
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setName(user.displayName || "");
                setPhoto(user.photoURL || "");
                setPreviewPhoto(user.photoURL || "");
            } else {
                setCurrentUser(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size must be less than 2MB");
                return;
            }
            setSelectedFile(file);
            setPreviewPhoto(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        try {
            setLoading(true);
            let finalPhotoURL = photo;
            if (selectedFile) {
                const storageRef = ref(storage, `profiles/${currentUser.uid}`);
                await uploadBytes(storageRef, selectedFile);
                finalPhotoURL = await getDownloadURL(storageRef);
            }
            await updateProfile(currentUser, {
                displayName: name,
                photoURL: finalPhotoURL,
            });
            setPhoto(finalPhotoURL);
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setName(currentUser.displayName || "");
        setPreviewPhoto(currentUser.photoURL || "");
        setSelectedFile(null);
        setIsEditing(false);
    };

    // 1. Loading State
    if (authLoading) {
        return (
            <div className="loader-container">
                <FaSpinner className="spin main-spinner" />
                <p>Synchronizing Profile...</p>
                <style jsx>{`
                    .loader-container {
                        height: 60vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .main-spinner {
                        font-size: 2.5rem;
                        color: #6366f1;
                        margin-bottom: 1rem;
                    }
                    .spin {
                        animation: rotate 1s linear infinite;
                    }
                    @keyframes rotate {
                        from {transform: rotate(0deg)}
                        to {transform: rotate(360deg)}
                    }
                `}</style>
            </div>
        );
    }

    // 2. Access Denied UI
    if (!currentUser) {
        return (
            <div className="access-denied-container">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="denied-card"
                >
                    <div className="lock-icon-wrapper">
                        <FaLock className="lock-icon" />
                    </div>
                    <h2>Access Restricted</h2>
                    <p>Please log in to your account to view your profile, manage orders, and update your personal information.</p>
                    <button className="login-btn" onClick={() => window.location.href = "/login"}>
                        Go to Login <FaArrowRight />
                    </button>
                </motion.div>
                <style jsx>{`
                    .access-denied-container {
                        min-height: 60vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 1.5rem;
                    }
                    .denied-card {
                        background: white;
                        border-radius: 16px;
                        padding: 2.5rem 2rem;
                        text-align: center;
                        max-width: 420px;
                        width: 100%;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    }
                    .lock-icon-wrapper {
                        width: 70px;
                        height: 70px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        margin: 0 auto 1.5rem;
                        font-size: 1.8rem;
                    }
                    .denied-card h2 {
                        color: #1a202c;
                        margin-bottom: 1rem;
                        font-size: 1.5rem;
                    }
                    .denied-card p {
                        color: #4a5568;
                        line-height: 1.5;
                        margin-bottom: 2rem;
                        font-size: 0.95rem;
                    }
                    .login-btn {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 28px;
                        border-radius: 10px;
                        font-weight: 600;
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    .login-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
                    }
                `}</style>
            </div>
        );
    }

    // 3. Main Profile UI
    return (
        <div className="profile-container">
            <ToastContainer position="top-right" autoClose={3000} />

            <motion.div
                className="profile-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="profile-header">
                    <div className="avatar-section">
                        <div className="avatar-wrapper">
                            {previewPhoto ? (
                                <img src={previewPhoto} alt="User" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder"><FaUser /></div>
                            )}
                            {isEditing && (
                                <label htmlFor="file-upload" className="upload-overlay">
                                    <FaCamera />
                                    <input type="file" id="file-upload" hidden onChange={handlePhotoChange} accept="image/*" />
                                </label>
                            )}
                        </div>
                        <div className="user-meta">
                            <h1>{name || "Customer"}</h1>
                            <p><FaEnvelope /> {currentUser.email}</p>
                            <span className="badge">Verified Member</span>
                        </div>
                    </div>

                    {!isEditing && (
                        <button className="edit-toggle-btn" onClick={() => setIsEditing(true)}>
                            <FaEdit /> Edit
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {isEditing ? (
                        <motion.form
                            onSubmit={handleUpdate}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="edit-form"
                        >
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Email Address</label>
                                <div className="input-wrapper disabled">
                                    <FaEnvelope className="input-icon" />
                                    <input type="email" value={currentUser.email} disabled />
                                </div>
                                <small>Email cannot be changed.</small>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={handleCancel}>
                                    <FaTimesCircle /> Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? <FaSpinner className="spin" /> : <FaSave />}
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <div className="account-overview">
                            <h3>Account Overview</h3>
                            <div className="detail-row">
                                <span>Member Since</span>
                                <strong>{new Date(currentUser.metadata.creationTime).toLocaleDateString()}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Last Activity</span>
                                <strong>{new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()}</strong>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>

            <style jsx>{`
                .profile-container {
                    min-height: 60vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                }
                .profile-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    padding: 2rem;
                    width: 100%;
                    max-width: 480px;
                }
                .profile-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .avatar-section {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .avatar-wrapper {
                    position: relative;
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    background: #6366f1;
                    overflow: hidden;
                    border: 3px solid #fff;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.1);
                }
                .avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.8rem;
                }
                .upload-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .user-meta h1 {
                    font-size: 1.3rem;
                    margin: 0;
                    color: #1e293b;
                }
                .user-meta p {
                    margin: 4px 0;
                    color: #64748b;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .badge {
                    display: inline-block;
                    padding: 3px 10px;
                    background: #dcfce7;
                    color: #16a34a;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    margin-top: 6px;
                }
                .edit-toggle-btn {
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: 0.2s;
                    color: #475569;
                }
                .edit-toggle-btn:hover {
                    background: #e2e8f0;
                }
                .input-group {
                    margin-bottom: 1.2rem;
                }
                .input-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 600;
                    color: #334155;
                    font-size: 0.9rem;
                }
                .input-wrapper {
                    display: flex;
                    align-items: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 0 12px;
                    transition: 0.3s;
                    height: 44px;
                }
                .input-wrapper:focus-within {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
                }
                .input-wrapper.disabled {
                    background: #f8fafc;
                    border-color: #f1f5f9;
                }
                .input-icon {
                    color: #94a3b8;
                    margin-right: 10px;
                    font-size: 0.9rem;
                }
                .input-wrapper input {
                    border: none;
                    width: 100%;
                    outline: none;
                    background: transparent;
                    font-size: 0.95rem;
                }
                .input-group small {
                    color: #94a3b8;
                    font-size: 0.8rem;
                    margin-top: 4px;
                    display: block;
                }
                .form-actions {
                    display: flex;
                    gap: 0.8rem;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }
                .btn-primary {
                    background: #6366f1;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: 0.3s;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #4f46e5;
                }
                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .btn-secondary {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #64748b;
                }
                .btn-secondary:hover {
                    background: #f8fafc;
                }
                .account-overview h3 {
                    color: #1e293b;
                    margin-bottom: 1rem;
                    font-size: 1.1rem;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 0.9rem;
                }
                .detail-row span {
                    color: #64748b;
                }
                .detail-row strong {
                    color: #1e293b;
                }
                .spin {
                    animation: rotate 1s linear infinite;
                }
                @keyframes rotate {
                    from {transform: rotate(0deg)}
                    to {transform: rotate(360deg)}
                }
                @media (max-width: 480px) {
                    .profile-card {
                        padding: 1.5rem;
                    }
                    .profile-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    .avatar-section {
                        flex-direction: column;
                    }
                    .user-meta p {
                        justify-content: center;
                    }
                    .form-actions {
                        flex-direction: column;
                    }
                    .btn-primary, .btn-secondary {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}

export default Profile;