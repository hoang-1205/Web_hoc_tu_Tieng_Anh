'use client';

import React from 'react';
import { POSCode } from '@/types';
import { Box, Zap, Star, Wind, Link2 } from 'lucide-react';

interface PosChipProps {
  posCode: POSCode;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const POS_CONFIG: Record<
  POSCode,
  {
    name_vi: string;
    short: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  noun: {
    name_vi: 'Danh từ',
    short: 'N',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Box,
  },
  verb: {
    name_vi: 'Động từ',
    short: 'V',
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
    icon: Zap,
  },
  adj: {
    name_vi: 'Tính từ',
    short: 'Adj',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: Star,
  },
  adv: {
    name_vi: 'Trạng từ',
    short: 'Adv',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Wind,
  },
  phrasal_verb: {
    name_vi: 'Cụm ĐT',
    short: 'PV',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    icon: Link2,
  },
};

export const PosChip: React.FC<PosChipProps> = ({
  posCode,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const config = POS_CONFIG[posCode] || POS_CONFIG.noun;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      title={`${config.name_vi} (${config.short})`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{config.short}</span>
      <span className="hidden sm:inline opacity-80 font-normal">· {config.name_vi}</span>
    </span>
  );
};
