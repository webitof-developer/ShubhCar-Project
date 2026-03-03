'use client';

import { useEffect, useMemo, useState } from 'react';

const parseDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toParts = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
};

const pad = (value) => String(value).padStart(2, '0');

export function FlashDealCountdown({ dealEndsAt, referenceNow, className = '' }) {
  const endDate = useMemo(() => parseDate(dealEndsAt), [dealEndsAt]);
  const referenceDate = useMemo(() => parseDate(referenceNow) || new Date(), [referenceNow]);
  const baseRefMs = referenceDate.getTime();
  const [currentRefMs, setCurrentRefMs] = useState(baseRefMs);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setCurrentRefMs(baseRefMs + (Date.now() - startedAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [baseRefMs]);

  if (!endDate) {
    return <span className={className}>No active timer</span>;
  }

  const remainingMs = endDate.getTime() - currentRefMs;
  const { days, hours, minutes, seconds, totalSeconds } = toParts(remainingMs);

  if (totalSeconds <= 0) {
    return <span className={className}>Deal ended</span>;
  }

  if (days > 0) {
    return (
      <span className={className}>
        {days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    );
  }

  return (
    <span className={className}>
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}

