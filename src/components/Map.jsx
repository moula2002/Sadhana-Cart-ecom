import React from 'react';
import { useTranslation } from 'react-i18next';

const Map = () => {
  const { t } = useTranslation();
  return (
    <div className="map-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      <iframe 
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3846.0897239382048!2d76.53448687512254!3d15.425707985164367!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb781660e8b0255%3A0xe9c5536e94e7b520!2sLIC%20of%20India%2C%20Branch%20Office!5e0!3m2!1sen!2sin!4v1784631074842!5m2!1sen!2sin" 
        width="100%" 
        height="450" 
        style={{ border: 0, maxWidth: '1200px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
        allowFullScreen="" 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        title={t("googleMapsLocation", "Google Maps Location")}
      ></iframe>
    </div>
  );
};

export default Map;
