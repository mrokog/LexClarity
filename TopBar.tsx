/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ReadingLevel } from '../types/legal';
import {
  Sun,
  Moon,
  Activity,
  UploadCloud,
  FileText
} from 'lucide-react';

export type NavTab = 'workspace' | 'brief' | 'compare' | 'actions' | 'security';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  readingLevel: ReadingLevel;
  onReadingLevelChange: (level: ReadingLevel) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  hasDocument: boolean;
  onOpenUpload: () => void;
  onOpenTelemetry: () => void;
}

export const TopBar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  readingLevel,
  onReadingLevelChange,
  darkMode,
  onToggleDarkMode,
  hasDocument,
  onOpenUpload,
  onOpenTelemetry
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Zone */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onTabChange('workspace')}
            className="text-lg font-bold tracking-tight text-neutral-950 dark:text-neutral-50 hover:opacity-80 transition-opacity font-serif text-left cursor-pointer"
          >
            LexClarity
          </button>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium" aria-label="Main Navigation">
            <button
              onClick={() => onTabChange('workspace')}
              className={`pb-1 text-sm transition-colors cursor-pointer ${
                activeTab === 'workspace'
                  ? 'text-neutral-900 dark:text-neutral-50 font-semibold border-b-2 border-neutral-900 dark:border-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => onTabChange('brief')}
              disabled={!hasDocument}
              className={`pb-1 text-sm transition-colors ${
                !hasDocument
                  ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                  : activeTab === 'brief'
                  ? 'text-neutral-900 dark:text-neutral-50 font-semibold border-b-2 border-neutral-900 dark:border-neutral-100 cursor-pointer'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 cursor-pointer'
              }`}
            >
              5-Minute Brief
            </button>
            <button
              onClick={() => onTabChange('compare')}
              className={`pb-1 text-sm transition-colors cursor-pointer ${
                activeTab === 'compare'
                  ? 'text-neutral-900 dark:text-neutral-50 font-semibold border-b-2 border-neutral-900 dark:border-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              Comparison
            </button>
            <button
              onClick={() => onTabChange('actions')}
              disabled={!hasDocument}
              className={`pb-1 text-sm transition-colors ${
                !hasDocument
                  ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                  : activeTab === 'actions'
                  ? 'text-neutral-900 dark:text-neutral-50 font-semibold border-b-2 border-neutral-900 dark:border-neutral-100 cursor-pointer'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 cursor-pointer'
              }`}
            >
              Actions & Prep
            </button>
            <button
              onClick={() => onTabChange('security')}
              className={`pb-1 text-sm transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'text-neutral-900 dark:text-neutral-50 font-semibold border-b-2 border-neutral-900 dark:border-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              Security Test
            </button>
          </nav>
        </div>

        {/* Zone 3: 1-2 primary actions and utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reading Level Selector (Segmented control) */}
          <div className="hidden sm:inline-flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 text-xs">
            <button
              onClick={() => onReadingLevelChange('simple')}
              className={`px-2.5 py-1 font-medium rounded transition-all cursor-pointer ${
                readingLevel === 'simple'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Plain-language simple explanation (6th-8th grade reading level)"
            >
              Simple
            </button>
            <button
              onClick={() => onReadingLevelChange('standard')}
              className={`px-2.5 py-1 font-medium rounded transition-all cursor-pointer ${
                readingLevel === 'standard'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Standard plain-language explanation"
            >
              Standard
            </button>
          </div>

          {/* New / Change Document Button */}
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded transition-colors cursor-pointer"
            title="Upload or paste a document"
          >
            <UploadCloud size={14} aria-hidden="true" />
            <span className="hidden sm:inline">{hasDocument ? 'Change Doc' : 'Load Doc'}</span>
          </button>

          {/* Telemetry / Developer Drawer Trigger */}
          <button
            onClick={onOpenTelemetry}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Developer Telemetry & Token Cost Visibility"
            aria-label="Developer Telemetry"
          >
            <Activity size={16} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex md:hidden items-center justify-around border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 text-xs overflow-x-auto">
        <button
          onClick={() => onTabChange('workspace')}
          className={`px-2 py-1 font-medium whitespace-nowrap ${
            activeTab === 'workspace' ? 'text-neutral-900 dark:text-neutral-50 font-bold' : 'text-neutral-500'
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => onTabChange('brief')}
          disabled={!hasDocument}
          className={`px-2 py-1 font-medium whitespace-nowrap ${
            !hasDocument ? 'text-neutral-300' : activeTab === 'brief' ? 'text-neutral-900 dark:text-neutral-50 font-bold' : 'text-neutral-500'
          }`}
        >
          5-Min Brief
        </button>
        <button
          onClick={() => onTabChange('compare')}
          className={`px-2 py-1 font-medium whitespace-nowrap ${
            activeTab === 'compare' ? 'text-neutral-900 dark:text-neutral-50 font-bold' : 'text-neutral-500'
          }`}
        >
          Compare
        </button>
        <button
          onClick={() => onTabChange('actions')}
          disabled={!hasDocument}
          className={`px-2 py-1 font-medium whitespace-nowrap ${
            !hasDocument ? 'text-neutral-300' : activeTab === 'actions' ? 'text-neutral-900 dark:text-neutral-50 font-bold' : 'text-neutral-500'
          }`}
        >
          Actions
        </button>
        <button
          onClick={() => onTabChange('security')}
          className={`px-2 py-1 font-medium whitespace-nowrap ${
            activeTab === 'security' ? 'text-neutral-900 dark:text-neutral-50 font-bold' : 'text-neutral-500'
          }`}
        >
          Security
        </button>
      </div>
    </header>
  );
};
