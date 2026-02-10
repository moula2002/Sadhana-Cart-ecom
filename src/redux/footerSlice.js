// src/redux/footerSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sections: [
    {
      title: "About Us",
      links: [
        // The About Us section in the image has descriptive text and copyright,
        // but no links. We can keep a placeholder or structure it as:
        "SadhanaCart is a multipurpose Ecommerce Platform...",
      ],
      // Add separate fields for contact details, as links are complex to manage in a simple array
      contact: {
          call: "+91 94488 10877",
          mail: "support@sadhanacart.com",
          hours: "Monday to Saturday, 9:00 AM – 6:00 PM",
      }
    },
    {
      title: "Useful Links",
      links: [
        "Return Policy",
        "Shipping Policy",
        "Terms & Condition",
        "Privacy Policy",
        "About Us",
        "Chat With Us",
        "Faqs",
      ]
    },
    {
      title: "Located At",
      links: [
        "Registered Office",
        "Ground Floor, Ward No. 24, A No. 4-14-155/36A,",
        "Teachers Colony, Near LIC Office,",
        "Gangawati – 583222, District Koppal, Karnataka.",
      ]
    }
  ]
};

const footerSlice = createSlice({
  name: "footer",
  initialState,
  reducers: {
    // You can add reducers here if you ever need to dynamically change footer links
  }
});

export default footerSlice.reducer;