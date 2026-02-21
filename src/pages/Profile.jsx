import React, { useEffect, useState } from "react";
import { auth, storage, db } from "../firebase";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
  FaArrowRight,
  FaPhone,
  FaVenusMars,
  FaCheckCircle,
} from "react-icons/fa";
import "./Profile.css";

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setName(user.displayName || "");
        setPhoto(user.photoURL || "");
        setPreviewPhoto(user.photoURL || "");
        setEmail(user.email || "");

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPhone(docSnap.data().phone || "");
          setGender(docSnap.data().gender || "");
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setSelectedFile(file);
    setPreviewPhoto(URL.createObjectURL(file));
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

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          uid: currentUser.uid,
          name,
          email,
          phone,
          gender,
          photoURL: finalPhotoURL,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setPhoto(finalPhotoURL);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (field) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  if (authLoading) {
    return (
      <div className="loader-container">
        <div className="spinner-wrapper">
          <div className="main-spinner"></div>
        </div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="access-denied-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="denied-card"
        >
          <div className="denied-icon">
            <FaLock />
          </div>
          <h2>Access Restricted</h2>
          <p>Please log in to view your profile</p>
          <button 
            className="denied-btn"
            onClick={() => (window.location.href = "/login")}
          >
            Go to Login <FaArrowRight />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="profile-bg-decoration">
        <div className="profile-circle profile-circle-1"></div>
        <div className="profile-circle profile-circle-2"></div>
      </div>

      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {previewPhoto ? (
                <img src={previewPhoto} alt={name} className="avatar-img" />
              ) : (
                <div className="avatar-icon">
                  <FaUser />
                </div>
              )}
            </div>
            
            {!isEditing && (
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="profile-content">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form
                key="edit-form"
                onSubmit={handleUpdate}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="floating-input-group">
                  <div className="floating-input-wrapper">
                    <FaUser className="floating-icon" />
                    <input
                      type="text"
                      className="floating-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => handleFocus('name')}
                      onBlur={handleBlur}
                      required
                    />
                    <label className={`floating-label ${name ? 'filled' : ''}`}>
                      Full Name
                    </label>
                  </div>
                </div>

                <div className="floating-input-group">
                  <div className="floating-input-wrapper">
                    <FaEnvelope className="floating-icon" />
                    <input
                      type="email"
                      className="floating-input"
                      value={email}
                      disabled
                    />
                    <label className="floating-label filled">Email Address</label>
                  </div>
                </div>

                <div className="floating-input-group">
                  <div className="floating-input-wrapper">
                    <FaPhone className="floating-icon" />
                    <input
                      type="tel"
                      className="floating-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => handleFocus('phone')}
                      onBlur={handleBlur}
                    />
                    <label className={`floating-label ${phone ? 'filled' : ''}`}>
                      Phone Number
                    </label>
                  </div>
                </div>

                <div className="floating-input-group">
                  <div className="floating-input-wrapper">
                    <FaVenusMars className="floating-icon" />
                    <select
                      className="floating-select"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      onFocus={() => handleFocus('gender')}
                      onBlur={handleBlur}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <label className={`floating-label ${gender ? 'filled' : ''}`}>
                      Gender
                    </label>
                  </div>
                </div>

                <div className="file-input-group">
                  <label className="file-input-label">
                    <FaCamera />
                    <span>{selectedFile ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      className="file-input"
                      onChange={handlePhotoChange}
                      accept="image/*"
                    />
                  </label>
                  {selectedFile && (
                    <div className="file-preview">
                      <FaCheckCircle /> {selectedFile.name}
                    </div>
                  )}
                </div>

                <div className="button-group">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaSave /> Save Changes
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedFile(null);
                      setPreviewPhoto(photo);
                    }}
                  >
                    <FaTimesCircle /> Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="profile-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="info-card">
                  <div className="d-flex">
                    <FaEnvelope className="info-icon" />
                    <div>
                      <div className="info-label">Email Address</div>
                      <div className="info-value">{email}</div>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="d-flex">
                    <FaPhone className="info-icon" />
                    <div>
                      <div className="info-label">Phone Number</div>
                      <div className={`info-value ${!phone ? 'empty' : ''}`}>
                        {phone || "Not added yet"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="d-flex">
                    <FaVenusMars className="info-icon" />
                    <div>
                      <div className="info-label">Gender</div>
                      <div className={`info-value ${!gender ? 'empty' : ''}`}>
                        {gender || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;