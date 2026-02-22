import { MarkerType } from '@xyflow/react';
import { AppState, Tab, SetState, GetState } from './types';

// ── Layout Constants ─────────────────────────────────────────────

export const HORIZONTAL_SPACING = 580;
export const VERTICAL_MARGIN = 120;

// ── Shared Edge Style ────────────────────────────────────────────

export const DEFAULT_EDGE_STYLE = {
  type: 'default' as const,
  animated: false,
  markerEnd: { type: MarkerType.ArrowClosed, color: '#a1a1aa', width: 14, height: 14 },
  style: { strokeWidth: 3, stroke: '#a1a1aa' },
};

// ── Active Tab Updater ───────────────────────────────────────────

/**
 * Convenience helper to update the currently active tab's nodes/edges.
 * Returns early with no changes if no active tab is found.
 */
export const updateActiveTab = (
  get: GetState,
  set: SetState,
  updater: (tab: Tab) => Partial<Tab>,
) => {
  set((state: AppState) => {
    const tabIndex = state.tabs.findIndex(t => t.id === state.activeTabId);
    if (tabIndex === -1) return {};
    const newTabs = [...state.tabs];
    newTabs[tabIndex] = { ...newTabs[tabIndex], ...updater(newTabs[tabIndex]) };
    return { tabs: newTabs };
  });
};
