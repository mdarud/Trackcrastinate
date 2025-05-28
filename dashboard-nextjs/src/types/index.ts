export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  domain: string;
  duration: number; // in seconds
  category: string;
  day: string; // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD format
  total_time: number; // in seconds
  site_breakdown: Record<string, number>; // domain -> seconds
  category_breakdown: Record<string, number>; // category -> seconds
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  tracked_sites: string[];
  time_limits: Record<string, number>; // domain -> seconds per day
  notification_settings: {
    enabled: boolean;
    frequency: 'low' | 'medium' | 'high';
    sound_enabled: boolean;
    sound_volume: number;
    thresholds: number[];
  };
  dashboard_preferences: {
    theme: 'light' | 'dark';
    default_view: 'daily' | 'weekly' | 'monthly';
    show_wellness_metrics: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface TopSite {
  domain: string;
  totalTime: number;
  category: string;
  percentage: number;
}

export interface CategoryData {
  category: string;
  totalTime: number;
  percentage: number;
  color: string;
}

export interface WellnessMetrics {
  productivityScore: number;
  focusScore: number;
  deviationScore: number;
  recommendations: string[];
}

export interface ActivitySession {
  id: string;
  user_id: string;
  domain: string;
  start_time: string;
  end_time: string | null;
  duration: number; // in seconds
  tab_id: number;
  window_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductivityGoal {
  id: string;
  user_id: string;
  goal_type: 'daily_limit' | 'weekly_limit' | 'productivity_score';
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  is_achieved: boolean;
  created_at: string;
  updated_at: string;
}

// Chart.js types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordForm {
  email: string;
}

export interface UpdatePasswordForm {
  password: string;
  confirmPassword: string;
}

// Dashboard data types
export interface DashboardData {
  dailyStats: {
    totalTime: number;
    firstDeviation: string | null;
    mostRecentDeviation: string | null;
    deviationCount: number;
  };
  topSites: TopSite[];
  categoryBreakdown: CategoryData[];
  wellnessMetrics: WellnessMetrics;
  roastMessage: string;
}

// Database table types (for Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      time_entries: {
        Row: TimeEntry;
        Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>>;
      };
      daily_summaries: {
        Row: DailySummary;
        Insert: Omit<DailySummary, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailySummary, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      activity_sessions: {
        Row: ActivitySession;
        Insert: Omit<ActivitySession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ActivitySession, 'id' | 'created_at' | 'updated_at'>>;
      };
      productivity_goals: {
        Row: ProductivityGoal;
        Insert: Omit<ProductivityGoal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductivityGoal, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
