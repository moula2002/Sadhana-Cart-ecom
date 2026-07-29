import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';

const HoverImageCarousel = ({ images, fallbackImage, alt, style, className, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Extract valid images array, ensuring at least the fallback image exists
    const validImages = Array.isArray(images) && images.length > 0 
        ? images.filter(img => img && typeof img === 'string') 
        : [];
        
    const displayImages = validImages.length > 0 ? validImages : [fallbackImage || "https://via.placeholder.com/300"];

    useEffect(() => {
        let interval;
        if (isHovered && displayImages.length > 1) {
            interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % displayImages.length);
            }, 1000); // Change image every 1 second
        } else {
            setCurrentIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, displayImages.length]);

    return (
        <div 
            className={`position-relative w-100 h-100 ${className || ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <Card.Img
                src={displayImages[currentIndex]}
                alt={alt}
                style={{ ...style, transition: 'all 0.3s ease-in-out' }}
                className="cursor-pointer"
                onError={(e) => { e.target.src = fallbackImage || "https://via.placeholder.com/300"; }}
            />
            
            {/* Carousel Dots */}
            {displayImages.length > 1 && isHovered && (
                <div className="position-absolute bottom-0 w-100 d-flex justify-content-center pb-2 gap-1" style={{ zIndex: 10 }}>
                    {displayImages.map((_, idx) => (
                        <div 
                            key={idx}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: currentIndex === idx ? '#ff3b3b' : '#d1d5db',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HoverImageCarousel;
