'use client';

import React, { useEffect } from 'react';
import FloatingStopwatchButton from './FloatingStopwatchButton';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement);
  }, []);

  return (
    <>
      {children}
      <FloatingStopwatchButton />
    </>
  );
}
