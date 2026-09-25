/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClauseCategory } from '../types/legal';
import {
  AlertTriangle,
  CheckSquare,
  Coins,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Lock,
  Calendar,
  HelpCircle,
  Ban,
  Scale
} from 'lucide-react';

interface Props {
  category: ClauseCategory;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<Props> = ({ category, className = '', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs py-0.5 px-2' : 'text-sm py-1 px-2.5';
  const iconSize = size === 'sm' ? 13 : 15;

  const renderIcon = () => {
    switch (category) {
      case 'Potential Concern':
        return <AlertTriangle size={iconSize} className="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />;
      case 'Obligation':
        return <CheckSquare size={iconSize} className="text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />;
      case 'Financial':
        return <Coins size={iconSize} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />;
      case 'Termination':
        return <LogOut size={iconSize} className="text-orange-600 dark:text-orange-400 shrink-0" aria-hidden="true" />;
      case 'Auto-Renewal':
        return <RefreshCw size={iconSize} className="text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />;
      case 'Liability':
        return <ShieldAlert size={iconSize} className="text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />;
      case 'Data/Privacy':
        return <Lock size={iconSize} className="text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />;
      case 'Deadline':
        return <Calendar size={iconSize} className="text-cyan-600 dark:text-cyan-400 shrink-0" aria-hidden="true" />;
      case 'Ambiguity':
        return <HelpCircle size={iconSize} className="text-yellow-600 dark:text-yellow-400 shrink-0" aria-hidden="true" />;
      case 'Restriction':
      case 'Penalty':
        return <Ban size={iconSize} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />;
      default:
        return <Scale size={iconSize} className="text-neutral-600 dark:text-neutral-400 shrink-0" aria-hidden="true" />;
    }
  };

  const getStyle = () => {
    switch (category) {
      case 'Potential Concern':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/60';
      case 'Obligation':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800/60';
      case 'Financial':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60';
      case 'Termination':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800/60';
      case 'Auto-Renewal':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800/60';
      case 'Liability':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800/60';
      case 'Data/Privacy':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800/60';
      case 'Deadline':
        return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800/60';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${getStyle()} ${sizeClasses} ${className}`}
    >
      {renderIcon()}
      <span>{category}</span>
    </span>
  );
};
