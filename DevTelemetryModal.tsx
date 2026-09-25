/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { TelemetryStats } from '../types/legal';
import { getTelemetryStatsApi } from '../services/api';
import { X, Activity, Cpu, Clock, DollarSign, Database, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DevTelemetryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getTelemetryStatsApi();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-serif">
              Developer Telemetry & Cost Visibility
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded transition-colors cursor-pointer"
            aria-label="Close telemetry modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Real-time backend usage telemetry for the current session. Provider secrets and raw legal text are never logged or exposed.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mb-1">
                <Cpu size={14} />
                <span>MODEL RUNNER</span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                {stats?.model || 'gemini-3.8-flash'}
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mb-1">
                <Activity size={14} />
                <span>MODEL CALLS</span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {stats?.totalRequests ?? 0} requests
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mb-1">
                <Database size={14} />
                <span>TOTAL TOKENS</span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {stats?.totalTokens?.toLocaleString() ?? 0}
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono mb-1">
                <Clock size={14} />
                <span>AVG LATENCY</span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
                {stats?.avgLatencyMs ?? 0} ms
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <DollarSign size={15} className="text-emerald-600" />
              <span>Estimated Session GenAI Cost:</span>
            </div>
            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
              ${stats?.estimatedCostUsd?.toFixed(5) ?? '0.00000'} USD
            </span>
          </div>

          <div className="pt-2 text-[11px] text-neutral-500 leading-normal">
            Calculated at Gemini 3.8 Flash blended rate (~$0.15 / 1M tokens). Client requests are cached locally in IndexedDB by document hash and normalized question string to minimize token usage.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Stats</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
