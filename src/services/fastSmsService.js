// fastSmsService.js
import axios from "axios";

export const sendOtp = async ({ phone }) => {
  try {
    // Clean phone number - remove +91 if present
    const cleanPhone = phone.replace("+91", "").trim();

    const response = await axios.post(
      "https://us-central1-sadhana-cart.cloudfunctions.net/sendOtp",
      {
        phone: cleanPhone
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000 // 20 second timeout
      }
    );

    if (response.data?.success) {
      return { success: true, message: response.data.message };
    } else {
      return { 
        success: false, 
        message: response.data?.message || "Failed to send OTP" 
      };
    }

  } catch (error) {
    console.error("OTP Error Details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Extract user-friendly error message
    let errorMessage = "Failed to send OTP. Please try again.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "Request timed out. Please check your connection.";
    }
    
    return { success: false, message: errorMessage };
  }
};