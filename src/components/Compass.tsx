import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

import { cn } from '../lib/utils';

interface CompassProps {
  sunAzimuth: number;
  moonAzimuth: number;
  magneticDeclination: number;
  className?: string;
}

const Compass: React.FC<CompassProps> = ({ sunAzimuth, moonAzimuth, magneticDeclination, className }) => {
  const directions = [
    { label: 'N', angle: 0 },
    { label: 'NE', angle: 45 },
    { label: 'E', angle: 90 },
    { label: 'SE', angle: 135 },
    { label: 'S', angle: 180 },
    { label: 'SW', angle: 225 },
    { label: 'W', angle: 270 },
    { label: 'NW', angle: 315 },
  ];

  const size = 320;
  const center = size / 2;
  const radius = center - 55;

  return (
    <div className={cn("relative flex items-center justify-center pointer-events-none", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background Grid Lines - Thinner and more subtle for overlay */}
        <line x1={0} y1={center} x2={size} y2={center} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        
        {/* Outer Ring - Glow effect for visibility on varying map backgrounds */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(0,209,255,0.5)"
          strokeWidth="2"
          className="drop-shadow-[0_0_8px_rgba(0,209,255,0.3)]"
        />

        {/* Direction Labels with stroke for legibility - USING HEX for PNG export consistency */}
        {directions.map((dir) => {
          const x = center + (radius + 20) * Math.sin((dir.angle * Math.PI) / 180);
          const y = center - (radius + 20) * Math.cos((dir.angle * Math.PI) / 180);
          return (
            <text
              key={dir.label}
              x={x}
              y={y}
              textAnchor="middle"
              alignmentBaseline="middle"
              style={{ 
                fill: dir.angle === 0 ? "#FF4444" : "#FFFFFF",
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,1))'
              }}
            >
              {dir.label}
            </text>
          );
        })}

        {/* Ticks */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = i * 5;
          const isMajor = angle % 45 === 0;
          const tickLen = isMajor ? 12 : 6;
          const x1 = center + radius * Math.sin((angle * Math.PI) / 180);
          const y1 = center - radius * Math.cos((angle * Math.PI) / 180);
          const x2 = center + (radius - tickLen) * Math.sin((angle * Math.PI) / 180);
          const y2 = center - (radius - tickLen) * Math.cos((angle * Math.PI) / 180);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isMajor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)"}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}

        {/* Magnetic North Indicator */}
        <g transform={`rotate(${magneticDeclination}, ${center}, ${center})`}>
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius + 10}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={center}
            y={center - radius + 5}
            textAnchor="middle"
            style={{ fill: "#10b981", fontSize: '8px', fontWeight: 'bold' }}
          >
            MN
          </text>
        </g>

        {/* Center Point - Minimalist */}
        <circle cx={center} cy={center} r={3} fill="#00D1FF" stroke="white" strokeWidth="1" />

        {/* Sun Indicator - Fixed rotation and origin for better export support */}
        <g transform={`rotate(${sunAzimuth}, ${center}, ${center})`}>
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius}
            stroke="#FFD700"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }}
          />
          <text 
            x={center} 
            y={center - radius} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            style={{ fontSize: '20px' }}
          >
            ☀️
          </text>
        </g>

        {/* Moon Indicator */}
        <g transform={`rotate(${moonAzimuth}, ${center}, ${center})`}>
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - (radius * 0.75)}
            stroke="#00D1FF"
            strokeWidth="2"
            strokeDasharray="4 2"
            style={{ filter: 'drop-shadow(0 0 8px #00D1FF)' }}
          />
          <text 
            x={center} 
            y={center - (radius * 0.75)} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            style={{ fontSize: '18px' }}
          >
            🌙
          </text>
        </g>
      </svg>
    </div>
  );
};

export default Compass;
