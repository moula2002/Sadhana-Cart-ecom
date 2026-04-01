import axios from "axios";

export const sendOtp = async ({ phone }) => {
  try {
    const cleanPhone = phone.replace("+91", "").trim();

    const response = await axios.post(
      "https://us-central1-sadhana-cart.cloudfunctions.net/sendOtp",
      {
        phone: cleanPhone
      }
    );

    if (response.data?.success) {
      return { success: true };
    } else {
      return { success: false, message: response.data?.message || "Failed to send OTP" };
    }

  } catch (error) {
    console.error("OTP Error:", error);
    const errorMessage = error.response?.data?.message || error.message;
    return { success: false, message: errorMessage };
  }
};