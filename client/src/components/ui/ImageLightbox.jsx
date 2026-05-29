import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])';

export default function ImageLightbox({ images, initialIndex = 0, onClose, title }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const prevFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  
  const reducedMotionRef = useRef(reducedMotion);
  
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handlePrevRef = useRef(handlePrev);
  const handleNextRef = useRef(handleNext);

  useEffect(() => {
    onCloseRef.current = onClose;
    reducedMotionRef.current = reducedMotion;
    handlePrevRef.current = handlePrev;
    handleNextRef.current = handleNext;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageLoaded(false);
    setTouchDelta(0);
  }, [currentIndex]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    prevFocusRef.current = document.activeElement;

    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.setAttribute('aria-hidden', 'true');

    container.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevRef.current();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = container.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;

      if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
        prevFocusRef.current.focus();
      }

      if (rootEl) rootEl.removeAttribute('aria-hidden');
    };
  }, []);

  useEffect(() => {
    const thumb = containerRef.current?.querySelector(`[data-thumb="${currentIndex}"]`);
    if (thumb) {
      thumb.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex, reducedMotion]);

  const handleTouchStart = (e) => {
    if (images.length <= 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null || images.length <= 1) return;
    setTouchDelta(e.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || images.length <= 1) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) handlePrev();
      else handleNext();
    }
    setTouchStartX(null);
    setTouchDelta(0);
  };

  if (!images || images.length === 0) return null;

  const transition = reducedMotion ? 'none' : 'opacity 200ms ease';

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media (hover: none) and (pointer: coarse) {
          .lightbox-arrow { display: none; }
        }
        .lightbox-thumb-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .lightbox-thumb-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .lightbox-thumb-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
      `}</style>

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 sm:px-5 py-3 bg-black/60 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onClose()}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0"
            aria-label="Close lightbox"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <span className="text-sm text-white/70 font-medium select-none" aria-live="polite">
              <span className="sr-only">Image </span>
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {title && (
          <span className="text-sm text-white/60 truncate ml-4 max-w-[50%] hidden sm:block select-none">
            {title}
          </span>
        )}
      </div>

      {/* Main stage */}
      <div
        ref={stageRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden touch-pan-y"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative flex items-center justify-center w-full h-full px-4"
          style={{
            transform: touchStartX !== null ? `translateX(${touchDelta}px)` : 'none',
            transition:
              touchStartX !== null ? 'none' : reducedMotion ? 'none' : 'opacity 200ms ease',
          }}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          <img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${title || 'Image'} — ${currentIndex + 1} of ${images.length}`}
            className={`max-w-full max-h-[75vh] sm:max-h-[90vh] w-auto h-auto object-contain select-none ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transition }}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="lightbox-arrow absolute left-2 sm:left-4 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="lightbox-arrow absolute right-2 sm:right-4 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex items-center justify-start gap-2 overflow-x-auto px-4 py-3 bg-black/70 shrink-0 lightbox-thumb-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              data-thumb={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                idx === currentIndex
                  ? 'ring-2 ring-white scale-105 opacity-100 shadow-lg'
                  : 'opacity-50 hover:opacity-80 ring-1 ring-transparent'
              }`}
              aria-label={`Image ${idx + 1} of ${images.length}`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
