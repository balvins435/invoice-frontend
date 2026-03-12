'use client';

import React from 'react';

type SpinnerProps = {
  size?: number;
  className?: string;
};

export function Spinner({ size = 16, className = '' }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-emerald-500 border-t-transparent dark:border-emerald-400 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
