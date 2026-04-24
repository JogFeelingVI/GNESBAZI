import SunCalc from 'suncalc';
import { DateTime } from 'luxon';
import tzlookup from 'tz-lookup';
import { Solar } from 'lunar-javascript';

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
  // Note: geomagnetism library is intentionally disabled due to potential browser compatibility issues (fs dependency)
  // If needed, replace with a browser-safe WMM implementation.

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
