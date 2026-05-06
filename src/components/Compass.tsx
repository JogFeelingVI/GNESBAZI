import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

import { cn } from '../lib/utils';

interface CompassProps {
  sunAzimuth: number;
  moonAzimuth: number;
  magneticDeclination: number;
  rotation?: number;
  className?: string;
}

const Compass: React.FC<CompassProps> = ({ sunAzimuth, moonAzimuth, magneticDeclination, rotation = 0, className }) => {
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
  const radius = center - 35; // Enlarged from center - 55
  const squareScale = 2.2;

  return (
    <div className={cn("relative flex items-center justify-center pointer-events-none", className)}>
      <motion.svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="overflow-visible"
        animate={{ rotate: -rotation }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      >
        {/* Square Frame from User - Centered and now rotates with SVG */}
        <g transform={`translate(${center}, ${center}) scale(${squareScale})`}>
          <g transform="translate(-133, -150)">
            <g>
              <g style={{ opacity: 0.75, fill: '#ff4444', fillOpacity: 1 }} transform="translate(-7.7081787e-5,-0.75464094)">
                <path d="m 86.231946,209.8244 v -3.77341 h -8.113717 v -8.11372 h -3.77393 v 11.88713 z" />
                <path d="m 180.57761,206.05099 v 3.77341 h 11.88764 v -11.88713 h -3.77393 v 8.11372 z" />
                <path d="m 180.57761,91.703963 v 3.77393 h 8.11371 v 8.113717 h 3.77393 V 91.703963 Z" />
                <path d="m 74.344299,103.59161 h 3.77393 v -8.113717 h 8.113717 v -3.77393 H 74.344299 Z" />
              </g>
              <path style={{ fill: 'none', stroke: '#ff4444', strokeWidth: 0.2, strokeDasharray: '1, 3', opacity: 0.75 }} d="m 78.118151,102.83697 v 94.34566" />
              <path style={{ fill: 'none', stroke: '#ff4444', strokeWidth: 0.2, strokeDasharray: '1, 3', opacity: 0.75 }} d="M 86.231869,94.72325 H 180.57753" />
              <path style={{ fill: 'none', stroke: '#ff4444', strokeWidth: 0.2, strokeDasharray: '1, 3', opacity: 0.75 }} d="m 188.69124,102.83697 v 94.34566" />
              <path style={{ fill: 'none', stroke: '#ff4444', strokeWidth: 0.2, strokeDasharray: '1, 3', opacity: 0.75 }} d="M 86.231869,205.29635 H 180.57753" />
            </g>
          </g>
        </g>

        {/* Direction Labels with stroke for legibility */}
        {directions.map((dir) => {
          const labelDist = radius + 20;
          const x = center + labelDist * Math.sin((dir.angle * Math.PI) / 180);
          const y = center - labelDist * Math.cos((dir.angle * Math.PI) / 180);
          return (
            <text
              key={dir.label}
              x={x}
              y={y}
              textAnchor="middle"
              alignmentBaseline="middle"
              style={{ 
                fill: dir.angle === 0 ? "#FF4444" : "#FFFFFF",
                fontSize: dir.angle % 90 === 0 ? '14px' : '10px',
                fontWeight: '900',
                fontFamily: 'monospace',
                filter: 'drop-shadow(0px 0px 3px rgba(0,0,0,1))',
                transformBox: 'fill-box',
                transformOrigin: 'center'
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
              stroke={isMajor ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)"}
              strokeWidth={isMajor ? 3 : 1.5}
            />
          );
        })}

        {/* Magnetic North Indicator - Always at the top relative to the rotating square dial */}
        <g>
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius + 5}
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="3 2"
          />
          <path
            d={`M ${center - 8} ${center - radius + 10} L ${center} ${center - radius - 5} L ${center + 8} ${center - radius + 10} Z`}
            fill="#10b981"
          />
          <text
            x={center}
            y={center - radius - 20}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ 
              fill: "#00FFC2", 
              fontSize: '12px', 
              fontWeight: '900', 
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
            }}
          >
            MN
          </text>
        </g>

        {/* Center Point - Minimalist */}
        <circle cx={center} cy={center} r={4} fill="#0F1115" stroke="#00D1FF" strokeWidth="1.5" />
        <circle cx={center} cy={center} r={1.5} fill="#00D1FF" />

        {/* Sun Indicator - Adjusted for global SVG rotation to stay relative to True North */}
        <g transform={`rotate(${sunAzimuth + rotation}, ${center}, ${center})`}>
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius}
            stroke="#FFD700"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))' }}
          />
          <text 
            x={center} 
            y={center - radius - 20} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            style={{ 
              fontSize: '24px', 
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))',
              transform: `rotate(${-rotation}deg)`,
              transformBox: 'fill-box',
              transformOrigin: 'center'
            }}
          >
            ☀️
          </text>
        </g>

        {/* Moon Indicator - Adjusted for global SVG rotation */}
        <g transform={`rotate(${moonAzimuth + rotation}, ${center}, ${center})`}>
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius}
            stroke="#00D1FF"
            strokeWidth="2"
            strokeDasharray="4 2"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0, 209, 255, 0.4))' }}
          />
          <text 
            x={center} 
            y={center - radius - 20} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            style={{ 
              fontSize: '22px', 
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))',
              transform: `rotate(${-rotation}deg)`,
              transformBox: 'fill-box',
              transformOrigin: 'center'
            }}
          >
            🌙
          </text>
        </g>
      </motion.svg>
    </div>
  );
};

export default Compass;
