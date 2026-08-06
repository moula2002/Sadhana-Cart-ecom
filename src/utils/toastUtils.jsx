import React from 'react';
import { toast } from 'react-toastify';

export const ToastContent = ({ title, img, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '4px 0' }}>
    {img && (
      <div style={{
        width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9'
      }}>
        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>{action}</span>
      <span style={{ 
        fontSize: '13px', color: '#64748b', 
        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4'
      }}>
        {title}
      </span>
    </div>
  </div>
);

export const showProductToast = (title, img, action = "Added to Cart!", type = "success") => {
    const defaultImg = "https://via.placeholder.com/150";
    if (type === "success") {
        toast.success(<ToastContent title={title} img={img || defaultImg} action={action} />, { hideProgressBar: true });
    } else {
        toast.info(<ToastContent title={title} img={img || defaultImg} action={action} />, { hideProgressBar: true });
    }
};
