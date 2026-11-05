'use client';

import { useState, useCallback } from 'react';

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

// 浏览器 GPS 定位封装(H5,移动端与桌面端均可用)
export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback((): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setError('当前设备不支持定位');
        resolve(null);
        return;
      }
      setLocating(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeoLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setLocation(result);
          setLocating(false);
          resolve(result);
        },
        (err) => {
          setError(`定位失败: ${err.message}。可继续打卡,但不会记录位置。`);
          setLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return { location, locating, error, locate };
}
