// ============================================================================
// USER ROLES
// ============================================================================

export enum UserRole {
  NOVA = 'NOVA',
  TEAM = 'TEAM',
  AGENT = 'AGENT',
}

// ============================================================================
// AGENT STATS (from backend DTO)
// ============================================================================

export interface AgentStats {
  vicidialId?: number;
  agentName: string;
  totalCalls: number;
  rank: number;
  totalPaidTimeHours: number;
  costPerHour: number;
  paidPauseHours: number;
  customerTimeHours: number;
  talkTimeHours: number;
  waitTimeHours: number;
  talkTimePercentage: string;
  waitTimePercentage: string;
  estimatedEarnings: number;
  campaign: string;
  sale: number;
  ni: number;
  n: number;
  callbk: number;
}

export interface Agent {
  id_agent: number;
  ID: number;
  username: string;
  mostCurrentUserGroup?: string;
  costPerHour?: number;
  campaign?: string;
  most_recent_user_group?: string;
  calls: number;
  time?: string;
  pause?: string;
  wait?: string;
  talk?: string;
  dispo?: string;
  dead?: string;
  customer?: string;
  callbk?: number;
  N?: number;
  NI?: number;
  SALE?: number;
  role?: string;
  team?: Team;
  // Frontend properties
  id?: string;
  name?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  address?: string;
  hourlyRate?: number;
  streakDays?: number;
  stats?: {
    [key: string]: {
      calls: number;
      booked: number;
      talkTimeMinutes: number;
      waitTimeMinutes: number;
      paidPauseHours: number;
      dispositions: {
        booked: number;
        callback: number;
        noAnswer: number;
        notInterested: number;
      };
    };
  };
}

export interface Team {
  id?: number;
  teamName: string;
  agentCount: number;
  totalCalls: number;
  totalSales: number;
  totalNi: number;
  totalN: number;
  totalCallbk: number;
  rank: number;
  totalPaidTimeHours: number;
  totalCustomerTimeHours: number;
  totalWaitTimeHours: number;
  totalEstimatedEarnings: number;
  globalTalkTimePercentage: string;
  globalWaitTimePercentage: string;
  agentsList?: AgentStats[];
  costPerHour?: number;
}

export interface SystemSummary {
  totalAgents: number;
  totalTeams: number;
  totalCalls: number;
  totalSales: number;
  systemStatus: string;
  lastUpdated: string;
}

export interface FullView {
  teams: Team[];
  agents: Agent[];
  systemSummary: SystemSummary;
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export enum TimePeriod {
  TODAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export interface PerformanceStats {
  calls: number;
  booked: number;
  talkTimeMinutes: number;
  waitTimeMinutes: number;
  dispositions: {
    booked: number;
    callback: number;
    noAnswer: number;
    notInterested: number;
  };
}

export interface Stats {
  calls: number;
  booked: number;
  avgHandleTime: number;
  conversionRate: number;
}

// Frontend UI types for components
export interface Client {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string;
  adresse?: string;
  code_postal?: string;
  commentaire?: string;
  date_visite?: string;
  date_creation?: string;
  nom_service?: string;
  statut_service?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'en_attente' | 'confirme' | 'termine' | 'annule';
  recordingUrl?: string;
  agent?: {
    username?: string;
    campaign?: string;
    teamName?: string;
  };
  nomComplet?: string;
  statutService?: string;
  name?: string;
  phone?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledDate?: string;
  address?: string;
  notes?: string;
  dateVisite?: string;
}

// Legacy compatibility types
export interface AgentStatsDTO {
  agentId: string;
  agentName: string;
  teamName: string;
  stats: Stats;
}

export interface TeamStatsDTO {
  teamId: string;
  teamName: string;
  office: string;
  totalCalls: number;
  totalBooked: number;
  conversionRate: number;
  activeAgents: number;
}

// ============================================================================
// FORMATION TYPES
// ============================================================================

export enum FormationType {
  TECHNICAL = 'TECHNICAL',
  PRODUCT = 'PRODUCT',
  PROCESS = 'PROCESS',
  COMPLIANCE = 'COMPLIANCE',
  SOFT_SKILLS = 'SOFT_SKILLS'
}

export enum FormationStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum SessionStatus {
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

export interface Chapter {
  id?: string;
  title: string;
  orderIndex: number;
  contentType: 'VIDEO' | 'TEXT' | 'IMAGE' | 'DOCUMENT';
  contentUrl?: string | null;
  textContent?: string | null;
  description?: string;
  duration?: number;
  videoUrl?: string;
  resources?: string[];
}

export interface Formation {
  id?: string;
  title: string;
  description: string;
  type: FormationType;
  duration: number;
  instructor?: string | null;
  createdBy?: string;
  createdDate?: string;
  status: FormationStatus;
  chapters: Chapter[];
  targetTeams?: string[];
  targetAgents?: string[];
  public?: boolean;
}

export interface FormationDTO {
  id?: string;
  title: string;
  description: string;
  type: FormationType;
  duration: number;
  instructor: string;
  createdBy?: string;
  createdDate?: string;
  status: FormationStatus;
  chapters?: ChapterDTO[];
  targetTeams?: string[];
  targetAgents?: string[];
}

export interface ChapterDTO {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  orderIndex: number;
  duration?: number;
  videoUrl?: string;
  resources?: string[];
}

export interface FormationSession {
  id?: string;
  formationId: string;
  userId: string;
  userType: string;
  status: SessionStatus;
  completionPercentage: number;
  currentChapterId?: string;
  completedChapterIds: string[];
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface FormationSessionDTO {
  id?: string;
  formationId: string;
  userId: string;
  status: SessionStatus;
  completionPercentage: number;
  currentChapterId?: string;
  completedChapterIds?: string[];
}
