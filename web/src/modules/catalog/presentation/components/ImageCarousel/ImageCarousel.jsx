import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import './ImageCarousel.css';

export default function ImageCarousel({ images = [], productName = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length <= 1) return undefined;

    let timerId = null;

    const syncActiveSlide = () => {
      const slideWidth = track.clientWidth || 1;
      const nextIndex = Math.max(
        0,
        Math.min(images.length - 1, Math.round(track.scrollLeft / slideWidth)),
      );
      setCurrentIndex((prev) => {
        if (prev !== nextIndex) {
          setAnnouncement(
            `${productName ? `${productName} - ` : ''}Image ${nextIndex + 1} of ${images.length}`,
          );
        }
        return nextIndex;
      });
    };

    const handleDebouncedScroll = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(syncActiveSlide, 100);
    };

    if ('onscrollend' in window) {
      track.addEventListener('scrollend', syncActiveSlide);
      return () => track.removeEventListener('scrollend', syncActiveSlide);
    }

    track.addEventListener('scroll', handleDebouncedScroll, { passive: true });
    return () => {
      window.clearTimeout(timerId);
      track.removeEventListener('scroll', handleDebouncedScroll);
    };
  }, [images.length, productName]);

  if (!images || images.length === 0) {
    return null;
  }

  const scrollToSlide = (targetIndex) => {
    const track = trackRef.current;
    if (targetIndex !== currentIndex) {
      setAnnouncement(
        `${productName ? `${productName} - ` : ''}Image ${targetIndex + 1} of ${images.length}`,
      );
      setCurrentIndex(targetIndex);
    }
    if (track) {
      track.scrollTo({ left: targetIndex * track.clientWidth });
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    scrollToSlide(prevIndex);
  };

  const handleNext = () => {
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    scrollToSlide(nextIndex);
  };

  const handleThumbnailClick = (index) => {
    scrollToSlide(index);
  };

  return (
    <div
      className="image-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={productName || 'Product gallery'}
    >
      <div className="image-carousel__main">
        <div
          ref={trackRef}
          className="image-carousel__track"
          tabIndex={images.length > 1 ? 0 : undefined}
          aria-label={productName ? `${productName} slides` : 'Product slides'}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="image-carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${images.length}`}
            >
              <img
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                className="image-carousel__main-image"
                width={600}
                height={600}
                fetchPriority={index === 0 ? 'high' : undefined}
                loading={index === 0 ? undefined : 'lazy'}
                decoding="async"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="image-carousel__arrow image-carousel__arrow--left"
              aria-label="Previous image"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="image-carousel__arrow image-carousel__arrow--right"
              aria-label="Next image"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="image-carousel__counter" aria-hidden="true">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      {images.length > 1 && (
        <div className="image-carousel__thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={`image-carousel__thumbnail ${
                index === currentIndex ? 'active' : ''
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="image-carousel__thumbnail-image"
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
