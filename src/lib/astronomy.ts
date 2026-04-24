import SunCalc from 'suncalc';
import { DateTime } from 'luxon';
import tzlookup from 'tz-lookup';
import { Solar } from 'lunar-javascript';

import geomagnetism from 'geomagnetism';
import * as geomag from 'geomag';

export interface CelestialData {
  sun: {
    azimuth: number;
    altitude: number;
    sunrise: string;
    sunset: string;
  };
  moon: {
    azimuth: number;
    altitude: number;
    phase: number;
  };
  location: {
    magneticDeclination: number;
    bazi: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
  };
  timezone: string;
  localTime: string;
}

export function getCelestialData(lat: number, lng: number, date: Date = new Date()): CelestialData {
  const timezone = tzlookup(lat, lng);
  const localDateTime = DateTime.fromJSDate(date).setZone(timezone);

  const sunTimes = SunCalc.getTimes(date, lat, lng);
  const sunPos = SunCalc.getPosition(date, lat, lng);
  const moonPos = SunCalc.getMoonPosition(date, lat, lng);
  const moonIllum = SunCalc.getMoonIllumination(date);

  // Magnetic Declination
  let magneticDeclination = 0;
  try {
    const geo: any = geomagnetism;
    const modelFn = geo?.model || (geo as any)?.default?.model || (typeof geo === 'function' ? geo : null);
    
    if (typeof modelFn === 'function') {
      const model = modelFn(date);
      if (model && typeof model.point === 'function') {
        const info = model.point([lat, lng]);
        magneticDeclination = info?.decl || 0;
      }
    }
    
    // Fallback if geomagnetism failed or returned exactly 0 (unlikely for most points)
    if (magneticDeclination === 0) {
      const g: any = geomag;
      const fieldFn = g.field || g.default?.field;
      if (typeof fieldFn === 'function') {
        const info = fieldFn(lat, lng);
        magneticDeclination = info?.declination || 0;
      }
    }
  } catch (e) {
    console.warn('Magnetic declination failed:', e);
    // Final fallback to geomag if the first block crashed
    try {
      const g: any = geomag;
      const fieldFn = g.field || g.default?.field;
      if (typeof fieldFn === 'function') {
        const info = fieldFn(lat, lng);
        magneticDeclination = info?.declination || 0;
      }
    } catch (e2) {
      console.error('All magnetic models failed:', e2);
    }
  }

  // Bazi (Chinese Calendar)
  let bazi = { year: '', month: '', day: '', hour: '' };
  try {
    if (Solar && typeof Solar.fromDate === 'function') {
      const solar = Solar.fromDate(date);
      const lunar = solar.getLunar();
      const eightChar = lunar.getEightChar();
      bazi = {
        year: eightChar.getYear() || '',
        month: eightChar.getMonth() || '',
        day: eightChar.getDay() || '',
        hour: eightChar.getHour() || '',
      };
    }
  } catch (e) {
    console.warn('Bazi calculation failed:', e);
  }

  // Convert radians to degrees
  const toDegrees = (rad: number) => (rad * 180) / Math.PI;

  return {
    sun: {
      azimuth: toDegrees(sunPos.azimuth) + 180,
      altitude: toDegrees(sunPos.altitude),
      sunrise: DateTime.fromJSDate(sunTimes.sunrise).setZone(timezone).toFormat('HH:mm'),
      sunset: DateTime.fromJSDate(sunTimes.sunset).setZone(timezone).toFormat('HH:mm'),
    },
    moon: {
      azimuth: toDegrees(moonPos.azimuth) + 180,
      altitude: toDegrees(moonPos.altitude),
      phase: moonIllum.phase,
    },
    location: {
      magneticDeclination,
      bazi: {
        year: bazi.year,
        month: bazi.month,
        day: bazi.day,
        hour: bazi.hour,
      },
    },
    timezone,
    localTime: localDateTime.toFormat('yyyy-MM-dd HH:mm:ss'),
  };
}
