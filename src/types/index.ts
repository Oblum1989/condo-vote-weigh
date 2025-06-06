export interface VoteData {
  id: string;
  apartment: string;
  vote: string;
  weight: number;
  timestamp?: number;
}

export interface VoterWeights {
  [key: string]: number;
}

export interface Voter {
  cedula: string;
  apartment: string;
}

export interface Voters {
  [apartment: string]: Voter;
}

export interface VotingQuestion {
  id: string;
  title: string;
  description: string;
  options: string[];
  isActive: boolean;
  startTime?: number;
  endTime?: number;
}

export interface VotingState {
  isActive: boolean;
  question: VotingQuestion | null;
  startTime?: number;
  endTime?: number;
  showResults: boolean;
}

export interface VoterData {
  cedula: string;
  apartment: string;
  attendanceApartment?: string;
}

export interface AttendanceData {
  cedula: string;
  apartment: string;
  enabled: boolean;
  timestamp: number;
}

export interface AdminPanelProps {
  votingState: VotingState;
  onUpdateVotingState: (newState: Partial<VotingState>) => void;
  voterWeights: VoterWeights;
  onUpdateVoterWeights: (newWeights: VoterWeights) => void;
  votes: VoteData[];
  isAuthenticated: boolean;
  onAuthenticate: (authenticated: boolean) => void;
}

export interface AttendancePanelProps {
  attendance: AttendanceData[];
  onToggleAttendance: (record: AttendanceData) => void;
  voterWeights: VoterWeights;
  voters: Voters;
  onUpdateVoterWeights: (weights: VoterWeights) => void;
  onAttendanceUpdate?: () => void;
}
