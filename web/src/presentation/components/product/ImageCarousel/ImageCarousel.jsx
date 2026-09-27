import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [], productName = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="image-carousel">
      <div className="image-carousel__main">
        <img
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="image-carousel__main-image"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="image-carousel__arrow image-carousel__arrow--left"
              aria-label="Previous image"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={handleNext}
              className="image-carousel__arrow image-carousel__arrow--right"
              aria-label="Next image"
            >
              <ChevronRight />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="image-carousel__counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="image-carousel__thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`image-carousel__thumbnail ${
                index === currentIndex ? 'active' : ''
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="image-carousel__thumbnail-image"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
