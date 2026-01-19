/**
 * Sidebar Navigation Component
 *
 * Main navigation interface allowing users to switch between different system roles.
 * Provides access to Agent, Team Leader, and Headquarters dashboards.
 * Responsive design with mobile-friendly collapsible sidebar.
 */

import React, { useState } from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  /** Current active user role */
  currentRole: UserRole;
  /** User email address */
  userEmail: string;
  /** Callback for role changes */
  onRoleChange: (role: UserRole) => void;
  /** Whether sidebar is open */
  isOpen: boolean;
  /** Callback to toggle sidebar */
  onToggle: () => void;
  /** Callback triggered when logout is clicked */
  onLogout: () => void;
  /** Current view (dashboard, leaderboard, formations, or management) */
  currentView?: 'dashboard' | 'leaderboard' | 'formations' | 'management';
  /** Callback for view changes */
  onViewChange?: (view: 'dashboard' | 'leaderboard' | 'formations' | 'management') => void;
}

/**
 * Renders a responsive sidebar with role display and logout
 */
const Sidebar: React.FC<SidebarProps> = ({ currentRole, userEmail, onRoleChange, isOpen, onToggle, onLogout, currentView = 'dashboard', onViewChange }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['navigation']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'AGENT':
        return '👤';
      case 'TEAM':
        return '👥';
      case 'NOVA':
        return '🏢';
      default:
        return '⚙️';
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40 transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white flex flex-col shadow-2xl transition-all duration-300 z-50 ${
          isOpen 
            ? 'translate-x-0 lg:translate-x-0 w-72' 
            : '-translate-x-full lg:translate-x-0 lg:w-0 w-72'
        } ${!isOpen && 'lg:overflow-hidden'}`}
        style={!isOpen ? { width: window.innerWidth >= 1024 ? '0px' : undefined } : {}}
      >
        {/* Header with Logo and Close Button */}
        <div className="px-6 py-5 border-b border-slate-700/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg">
                N
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-tight">NOVA</h1>
                <p className="text-xs text-slate-400">CRM Dashboard</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide px-4 py-6 min-h-0">
          {/* Navigation Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('navigation')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors mb-3"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Navigation</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${expandedSections.has('navigation') ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {expandedSections.has('navigation') && (
              <div className="space-y-2 pl-0">
                <button
                  onClick={() => {
                    onViewChange?.('dashboard');
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                    currentView === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    onViewChange?.('leaderboard');
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                    currentView === 'leaderboard'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h1a1 1 0 001-1v-6a1 1 0 00-1-1h-1z" />
                  </svg>
                  <span>Leaderboard</span>
                </button>

                <button
                  onClick={() => {
                    onViewChange?.('formations');
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`w-full px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                    currentView === 'formations'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.669 0-3.218.51-4.5 1.385A7.968 7.968 0 009 4.804z" />
                  </svg>
                  <span>Formations</span>
                </button>

                {/* Formation Management - NOVA Only */}
                {currentRole === 'NOVA' && (
                  <button
                    onClick={() => {
                      onViewChange?.('management');
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    className={`w-full px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                      currentView === 'management'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5zM15 3a2 2 0 00-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-2zM5 13a2 2 0 00-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2H5zM15 13a2 2 0 00-2 2v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2h-2z" />
                    </svg>
                    <span>Management</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Info Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('account')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors mb-3"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Account</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${expandedSections.has('account') ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {expandedSections.has('account') && (
              <div className="space-y-3 pl-0">
                {/* Role Card */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/70 transition-colors">
                  <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">Current Role</p>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getRoleIcon(currentRole as UserRole)}</div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{(currentRole as UserRole).replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500">Active</p>
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/70 transition-colors">
                  <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-blue-400 truncate">{userEmail}</p>
                  <p className="text-xs text-slate-500 mt-1">Logged in</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Section */}
          <div className="mb-6 p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/10 rounded-lg border border-green-700/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-xs font-semibold text-green-400">System Status</p>
            </div>
            <p className="text-xs text-slate-300">Connected & Ready</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-6 border-t border-slate-700/50 space-y-3 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={onLogout}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;