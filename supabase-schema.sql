-- Unproductive App Tracker - Supabase Schema
-- This file contains the SQL schema for setting up the Supabase database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{"timeLimit": 60, "roastLevel": "medium", "shareStats": false, "offlineMode": false}'::jsonb,
  tracked_sites JSONB
);

-- Set up Row Level Security for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can only access their own data" ON users
  FOR ALL USING (auth.uid() = id);

-- Time Entries Table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  day TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Set up Row Level Security for time_entries table
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own time entries
CREATE POLICY "Users can only access their own time entries" ON time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Daily Summaries Table
CREATE TABLE IF NOT EXISTS daily_summaries (
  id TEXT PRIMARY KEY, -- Format: user_id_YYYY-MM-DD
  user_id UUID REFERENCES auth.users NOT NULL,
  date TEXT NOT NULL,
  total_time INTEGER DEFAULT 0,
  site_breakdown JSONB DEFAULT '{}'::jsonb,
  category_breakdown JSONB DEFAULT '{}'::jsonb
);

-- Set up Row Level Security for daily_summaries table
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own daily summaries
CREATE POLICY "Users can only access their own daily summaries" ON daily_summaries
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_day ON time_entries (day);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_id ON daily_summaries (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries (date);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at)
  VALUES (new.id, new.email, SPLIT_PART(new.email, '@', 1), NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to set up default tracked sites for new users
CREATE OR REPLACE FUNCTION public.setup_default_tracked_sites()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET tracked_sites = '[
    {"domain": "facebook.com", "category": "social"},
    {"domain": "twitter.com", "category": "social"},
    {"domain": "instagram.com", "category": "social"},
    {"domain": "reddit.com", "category": "social"},
    {"domain": "youtube.com", "category": "entertainment"},
    {"domain": "netflix.com", "category": "entertainment"},
    {"domain": "hulu.com", "category": "entertainment"},
    {"domain": "disneyplus.com", "category": "entertainment"},
    {"domain": "tiktok.com", "category": "social"},
    {"domain": "pinterest.com", "category": "social"},
    {"domain": "linkedin.com", "category": "social"},
    {"domain": "twitch.tv", "category": "entertainment"},
    {"domain": "amazon.com", "category": "shopping"},
    {"domain": "ebay.com", "category": "shopping"},
    {"domain": "espn.com", "category": "sports"},
    {"domain": "cnn.com", "category": "news"},
    {"domain": "buzzfeed.com", "category": "entertainment"},
    {"domain": "vimeo.com", "category": "entertainment"}
  ]'::jsonb
  WHERE id = NEW.id AND tracked_sites IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is added to the users table
DROP TRIGGER IF EXISTS on_public_user_created ON public.users;
CREATE TRIGGER on_public_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.setup_default_tracked_sites();
