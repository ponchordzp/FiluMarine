import React from 'react';

export default function LuxuryPattern({ opacity = 0.05 }) {
  return (
    <svg 
      className="absolute inset-0 w-full h-full"
      style={{ opacity }}
    >
      <defs>
        <pattern id="luxury-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          {/* Anchor Icon */}
          <g transform="translate(100, 100)">
            <path
              d="M0-15 L0,15 M-8,10 L0,15 L8,10 M-12,0 A12,12 0 1,1 12,0 A12,12 0 1,1 -12,0"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          
          {/* Wave Pattern */}
          <g transform="translate(50, 50)">
            <path
              d="M-15,0 Q-10,-5 -5,0 T5,0 T15,0"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M-15,5 Q-10,0 -5,5 T5,5 T15,5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          
          {/* Ship Wheel */}
          <g transform="translate(150, 150)">
            <circle cx="0" cy="0" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="0" cy="0" r="3" fill="currentColor" />
            <line x1="0" y1="-10" x2="0" y2="-15" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="10" x2="0" y2="15" stroke="currentColor" strokeWidth="1.5" />
            <line x1="-10" y1="0" x2="-15" y2="0" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="0" x2="15" y2="0" stroke="currentColor" strokeWidth="1.5" />
            <line x1="-7" y1="-7" x2="-11" y2="-11" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="7" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="-7" x2="11" y2="-11" stroke="currentColor" strokeWidth="1.5" />
            <line x1="-7" y1="7" x2="-11" y2="11" stroke="currentColor" strokeWidth="1.5" />
          </g>

          {/* Diamond Frame */}
          <g transform="translate(50, 150)">
            <path
              d="M0,-12 L12,0 L0,12 L-12,0 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </g>

          {/* Additional Wave */}
          <g transform="translate(150, 50)">
            <path
              d="M-15,0 Q-10,-5 -5,0 T5,0 T15,0"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M-15,5 Q-10,0 -5,5 T5,5 T15,5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Small Anchor */}
          <g transform="translate(0, 0)">
            <path
              d="M0-8 L0,8 M-5,5 L0,8 L5,5 M-7,0 A7,7 0 1,1 7,0 A7,7 0 1,1 -7,0"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Small Diamond */}
          <g transform="translate(200, 100)">
            <path
              d="M0,-8 L8,0 L0,8 L-8,0 Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </g>

          {/* Decorative Circle */}
          <g transform="translate(100, 0)">
            <circle cx="0" cy="0" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="0" cy="0" r="2" fill="currentColor" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#luxury-pattern)" className="text-slate-700" />
    </svg>
  );
}