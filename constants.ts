
import { UserRole, TimePeriod, Agent, Team, Client } from './types';

/**
 * Team definitions for the organization
 */
export const MOCK_TEAMS: Team[] = [
  { id: 1, teamName: 'Montreal Alpha', agentCount: 3, totalCalls: 0, totalSales: 0, totalNi: 0, totalN: 0, totalCallbk: 0, rank: 1, totalPaidTimeHours: 0, totalCustomerTimeHours: 0, totalWaitTimeHours: 0, totalEstimatedEarnings: 0, globalTalkTimePercentage: '0%', globalWaitTimePercentage: '0%' },
  { id: 2, teamName: 'Casablanca Phoenix', agentCount: 1, totalCalls: 0, totalSales: 0, totalNi: 0, totalN: 0, totalCallbk: 0, rank: 2, totalPaidTimeHours: 0, totalCustomerTimeHours: 0, totalWaitTimeHours: 0, totalEstimatedEarnings: 0, globalTalkTimePercentage: '0%', globalWaitTimePercentage: '0%' },
  { id: 3, teamName: 'Toronto Raptors', agentCount: 1, totalCalls: 0, totalSales: 0, totalNi: 0, totalN: 0, totalCallbk: 0, rank: 3, totalPaidTimeHours: 0, totalCustomerTimeHours: 0, totalWaitTimeHours: 0, totalEstimatedEarnings: 0, globalTalkTimePercentage: '0%', globalWaitTimePercentage: '0%' },
];

/**
 * Generates realistic performance statistics for different time periods
 */
const generateStats = (bookedBase: number, callsBase: number = 60, talkMinutesBase: number = 240): Record<TimePeriod, any> => ({
  [TimePeriod.TODAY]: {
    calls: callsBase,
    booked: bookedBase,
    talkTimeMinutes: talkMinutesBase,
    waitTimeMinutes: Math.floor(talkMinutesBase / 2),
    dispositions: { booked: bookedBase, callback: 10, noAnswer: 20, notInterested: 22 }
  },
  [TimePeriod.WEEK]: {
    calls: callsBase * 5,
    booked: bookedBase * 5,
    talkTimeMinutes: talkMinutesBase * 5,
    waitTimeMinutes: Math.floor(talkMinutesBase * 5 / 2),
    dispositions: { booked: bookedBase * 5, callback: 50, noAnswer: 100, notInterested: 110 }
  },
  [TimePeriod.MONTH]: {
    calls: callsBase * 20,
    booked: bookedBase * 20,
    talkTimeMinutes: talkMinutesBase * 20,
    waitTimeMinutes: Math.floor(talkMinutesBase * 20 / 2),
    dispositions: { booked: bookedBase * 20, callback: 200, noAnswer: 400, notInterested: 440 }
  }
});

/**
 * Mock agent data with realistic contact information
 */
export const MOCK_AGENTS: Agent[] = [
  {
    id_agent: 1, ID: 1, username: 'hassan.belkadi', calls: 0,
    name: 'Hassan Belkadi',
    avatar: 'https://picsum.photos/seed/hassan/200',
    team: MOCK_TEAMS[0],
    role: UserRole.AGENT,
    streakDays: 8,
    hourlyRate: 20,
    email: 'hassan.belkadi@callcenter.com',
    phone: '+1 (514) 555-0101',
    address: '123 Rue Sainte-Catherine, Montreal, QC H2X 1K6',
    stats: generateStats(14, 88, 215)
  },
  {
    id_agent: 2, ID: 2, username: 'reda.timmermans', calls: 0,
    name: 'Reda Timmermans',
    avatar: 'https://picsum.photos/seed/reda/200',
    team: MOCK_TEAMS[0],
    role: UserRole.AGENT,
    streakDays: 5,
    hourlyRate: 18,
    email: 'reda.timmermans@callcenter.com',
    phone: '+1 (514) 555-0102',
    address: '456 Boulevard Saint-Germain, Montreal, QC H2L 1H8',
    stats: generateStats(12, 78, 195)
  },
  {
    id_agent: 3, ID: 3, username: 'yasmine.ahmadi', calls: 0,
    name: 'Yasmine Ahmadi',
    avatar: 'https://picsum.photos/seed/yasmine/200',
    team: MOCK_TEAMS[0],
    role: UserRole.AGENT,
    streakDays: 6,
    hourlyRate: 19,
    email: 'yasmine.ahmadi@callcenter.com',
    phone: '+1 (514) 555-0103',
    address: '789 Avenue du Mont-Royal, Montreal, QC H2H 1B2',
    stats: generateStats(10, 85, 210)
  },
  {
    id_agent: 4, ID: 4, username: 'elena.gilbert', calls: 0,
    name: 'Elena Gilbert',
    avatar: 'https://picsum.photos/seed/elena/200',
    team: MOCK_TEAMS[1],
    role: UserRole.AGENT,
    streakDays: 7,
    hourlyRate: 20,
    email: 'elena.gilbert@callcenter.com',
    phone: '+212 5 22 36 7890',
    address: '321 Boulevard Anfa, Casablanca, Morocco 20000',
    stats: generateStats(15)
  },
  {
    id_agent: 5, ID: 5, username: 'john.wick', calls: 0,
    name: 'John Wick',
    avatar: 'https://picsum.photos/seed/john/200',
    team: MOCK_TEAMS[2],
    role: UserRole.AGENT,
    streakDays: 12,
    hourlyRate: 22,
    email: 'john.wick@callcenter.com',
    phone: '+1 (416) 555-0105',
    address: '555 King Street West, Toronto, ON M5H 2Y2',
    stats: generateStats(18)
  }
];

/**
 * Application theme color palette
 */
export const APP_THEME = {
  primary: '#3b82f6', // blue-500
  secondary: '#6366f1', // indigo-500
  accent: '#a855f7', // purple-500
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
} as const;

/**
 * Number of top agents to display in rankings
 */
export const TOP_AGENTS_COUNT = 3;

/**
 * Mock client interaction data
 */
export const MOCK_CLIENTS: Client[] = [
  {
    id: 1,
    nom_complet: 'John Smith',
    email: 'john.smith@email.com',
    telephone: '+1-555-0101',
    statut_service: 'pending',
    date_visite: '2025-12-21',
    agent: { username: 'hassan.belkadi', campaign: '', teamName: 'Montreal Alpha' }
  },
  {
    id: 2,
    nom_complet: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    telephone: '+1-555-0102',
    statut_service: 'confirmed',
    date_visite: '2025-12-21',
    agent: { username: 'hassan.belkadi', campaign: '', teamName: 'Montreal Alpha' }
  },
  {
    id: 3,
    nom_complet: 'Michael Brown',
    email: 'michael.brown@email.com',
    telephone: '+1-555-0103',
    statut_service: 'pending',
    date_visite: '2025-12-20',
    agent: { username: 'hassan.belkadi', campaign: '', teamName: 'Montreal Alpha' }
  },
  {
    id: 4,
    nom_complet: 'Sarah Davis',
    email: 'sarah.davis@email.com',
    telephone: '+1-555-0104',
    statut_service: 'cancelled',
    date_visite: '2025-12-20',
    agent: { username: 'hassan.belkadi', campaign: '', teamName: 'Montreal Alpha' }
  },
  {
    id: 5,
    nom_complet: 'Robert Johnson',
    email: 'robert.johnson@email.com',
    telephone: '+1-555-0105',
    statut_service: 'completed',
    date_visite: '2025-12-19',
    agent: { username: 'hassan.belkadi', campaign: '', teamName: 'Montreal Alpha' }
  },
  {
    id: 6,
    nom_complet: 'Lisa Anderson',
    email: 'lisa.anderson@email.com',
    telephone: '+1-555-0106',
    statut_service: 'confirmed',
    date_visite: '2025-12-21',
    agent: { username: 'reda.timmermans', campaign: '', teamName: 'Montreal Alpha' }
  },
];
