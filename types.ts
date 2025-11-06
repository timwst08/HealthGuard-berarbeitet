
export type View = 
  | 'dashboard'
  | 'predictive-analysis'
  | 'ai-coach'
  | 'report'
  | 'share'
  | 'watch'
  | 'settings'
  | 'score-detail'
  | 'hr-detail'
  | 'bp-detail'
  | 'spo2-detail'
  | 'temp-detail'
  | 'steps-detail'
  | 'calories-detail'
  | 'active-detail'
  | 'distance-detail'
  | 'sleep-detail'
  | 'profile-settings'
  | 'notifications-settings'
  | 'privacy-settings'
  | 'demo-mode';

export interface RadarDataItem {
  axis: string;
  value: number;
}

export interface LineChartDataItem {
  time: Date;
  value: number;
}

export interface HealthData {
  score: number;
  scoreChange: string;
  hr: number;
  hrMin: number;
  hrMax: number;
  bp: string;
  spo2: number;
  temp: number;
  steps: number;
  stepsGoal: number;
  calories: number;
  active: number;
  distance: number;
  sleepHours: number;
  sleepQuality: number;
  sleepDeep: number;
  sleepRem: number;
  sleepLight: number;
  stress: number;
  analysisText: string;
  analysisStatus: 'low' | 'medium' | 'high';
  radarData: RadarDataItem[];
  hrvData: { time: string; value: number }[];
}

export interface ProfileData {
  name: string;
  age: number;
  height: number;
  weight: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type DetailViewType =
  | 'hr'
  | 'bp'
  | 'spo2'
  | 'temp'
  | 'steps'
  | 'calories'
  | 'active'
  | 'distance'
  | 'sleep'
  | 'score';
