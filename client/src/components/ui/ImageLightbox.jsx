import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), details, [tabindex]:not([tabindex="-1"])';

function LightboxImage({ src, alt, onLoad, reducedMotion }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`max-w-full max-h-[75vh] sm:max-h-[90vh] w-auto h-auto object-contain select-none ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transition: reducedMotion ? 'none' : 'opacity 200ms ease' }}
        onLoad={() => { setLoaded(true); onLoad?.(); }}
        onError={() => setLoaded(true)}
        draggable={false}
      />
    </>
  );
}

export default function ImageLightbox({ images, initialIndex = 0, onClose, title }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchDelta, setTouchDelta] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [closing, setClosing] = useState(false);

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
    const handler = (e) => setReducedMotion(e.matches);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const triggerClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onCloseRef.current(), 200);
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
        triggerClose();
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
  }, [triggerClose]);

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
    setTouchStartY(e.touches[0].clientY);
    setTouchDelta({ x: 0, y: 0 });
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null || images.length <= 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    setTouchDelta({ x: dx, y: dy });
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || images.length <= 1) {
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchDelta(null);
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      triggerClose();
    } else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) handlePrev();
      else handleNext();
    }

    setTouchStartX(null);
    setTouchStartY(null);
    setTouchDelta(null);
  };

  if (!images || images.length === 0) return null;

  return createPortal(
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] flex flex-col bg-black/90 transition-opacity duration-200 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) triggerClose();
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
          background: rgba(255,255,255,0.3);
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
            onClick={() => triggerClose()}
            className="p-2.5 text-white bg-white/10 hover:bg-white/25 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-white/50"
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
            transform: touchDelta ? `translateX(${touchDelta.x}px) translateY(${touchDelta.y}px)` : 'none',
            transition:
              touchDelta ? 'none' : reducedMotion ? 'none' : 'opacity 200ms ease',
          }}
        >
          <LightboxImage
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${title || 'Image'} — ${currentIndex + 1} of ${images.length}`}
            reducedMotion={reducedMotion}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="lightbox-arrow absolute left-2 sm:left-4 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
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
              className="lightbox-arrow absolute right-2 sm:right-4 p-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Next image"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none sm:hidden">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentIndex ? 'bg-white w-3' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
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
