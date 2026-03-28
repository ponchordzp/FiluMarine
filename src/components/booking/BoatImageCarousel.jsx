import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';

export default function BoatImageCarousel({ boat, className = '', aspectClass = 'aspect-[16/9]' }) {
  const allImages = [boat?.image, ...(boat?.images || [])].filter(Boolean);
  const [current, setCurrent] = useState(0);

  // deduplicate
  const unique = allImages.filter((img, i, arr) => arr.indexOf(img) === i);

  if (unique.length === 0) {
    return (
      <div className={`${aspectClass} ${className} bg-slate-800 flex items-center justify-center`}>
        <Images className="h-10 w-10 text-slate-600" />
      </div>
    );
  }

  const prev = (e) => {
    e.stopPropagation();
    setCurrent(i => (i - 1 + unique.length) % unique.length);
  };

  const next = (e) => {
    e.stopPropagation();
    setCurrent(i => (i + 1) % unique.length);
  };

  return (
    <div className={`${aspectClass} ${className} relative overflow-hidden group`}>
      <img
        src={unique[current]}
        alt={`${boat?.name || 'Boat'} photo ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {unique.length > 1 && (
        <>
          {/* Arrows */}
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {unique.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
              />
            ))}
          </div>

          {/* Photo counter badge */}
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <Images className="h-3 w-3" />
            {current + 1}/{unique.length}
          </div>
        </>
      )}
    </div>
  );
}