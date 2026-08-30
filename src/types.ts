export interface BroadcasterConfig {
  title: string;
  welcomeMessage: string;
  accentColor: string;
  pollQuestion: string;
  pollOptions: string[];
}

export interface PollOption {
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  totalVotes: number;
  options: PollOption[];
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export interface EBSState {
  config: BroadcasterConfig;
  poll: PollData;
  leaderboard: LeaderboardEntry[];
  stats: {
    totalPings: number;
    totalActions: number;
    totalBroadcasts: number;
  };
}

export interface RigAuth {
  channelId: string;
  clientId: string;
  token: string;
  userId: string;
  role: 'broadcaster' | 'moderator' | 'viewer' | 'external';
  helixToken: string;
}

export interface RigContext {
  theme: 'dark' | 'light';
  mode: 'viewer' | 'dashboard' | 'config';
  isFullScreen: boolean;
  arePlayerControlsVisible: boolean;
  displayResolution: string;
  game: string;
  language: string;
  bitrate: number;
  hlsLatencyBroadcaster: number;
}

export type AspectRatioPreset = '16:9 (1080p)' | '16:9 (720p)' | '4:3 (Classic)' | '21:9 (Ultrawide)' | 'Fluid';

export type VideoViewMode = 'overlay' | 'component';
export type ComponentDockPosition = 'right' | 'left' | 'floating';
