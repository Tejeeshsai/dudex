-- Migration: Add rich properties to tasks
-- Run this in the Supabase SQL editor at https://supabase.com/dashboard

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_name TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS labels        TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS story_points  INTEGER;
