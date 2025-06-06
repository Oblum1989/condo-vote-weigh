export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface AttendanceStatus {
  enabled: boolean;
}

export interface CachedData<T> {
  timestamp: number;
  data: T;
}

export interface ValidationResponse {
  voteStatus: boolean;
  validation: ValidationResult;
  attendance: AttendanceStatus;
}
