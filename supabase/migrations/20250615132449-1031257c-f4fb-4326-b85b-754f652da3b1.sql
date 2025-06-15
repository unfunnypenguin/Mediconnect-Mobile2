
-- First, clear all selected_avatar_id references to avoid foreign key constraint violations
UPDATE public.profiles SET selected_avatar_id = NULL;

-- Now we can safely update the avatar_options table
DELETE FROM public.avatar_options;

-- Update the table structure
ALTER TABLE public.avatar_options 
DROP COLUMN IF EXISTS image_url;

ALTER TABLE public.avatar_options 
ADD COLUMN IF NOT EXISTS color_value text NOT NULL DEFAULT '#3b82f6';

ALTER TABLE public.avatar_options 
ADD COLUMN IF NOT EXISTS gradient_value text;

-- Insert color and gradient options
INSERT INTO public.avatar_options (name, color_value, gradient_value, category) VALUES
('Ocean Blue', '#3b82f6', 'linear-gradient(135deg, #3b82f6, #1e40af)', 'gradient'),
('Sunset Orange', '#f97316', 'linear-gradient(135deg, #f97316, #ea580c)', 'gradient'),
('Forest Green', '#16a34a', 'linear-gradient(135deg, #16a34a, #15803d)', 'gradient'),
('Purple Dream', '#a855f7', 'linear-gradient(135deg, #a855f7, #9333ea)', 'gradient'),
('Rose Pink', '#ec4899', 'linear-gradient(135deg, #ec4899, #db2777)', 'gradient'),
('Emerald', '#10b981', null, 'solid'),
('Blue', '#3b82f6', null, 'solid'),
('Purple', '#8b5cf6', null, 'solid'),
('Pink', '#ec4899', null, 'solid'),
('Orange', '#f97316', null, 'solid'),
('Red', '#ef4444', null, 'solid'),
('Yellow', '#eab308', null, 'solid'),
('Indigo', '#6366f1', null, 'solid'),
('Teal', '#14b8a6', null, 'solid'),
('Gray', '#6b7280', null, 'solid');

-- Randomly assign new avatar colors to existing users
UPDATE public.profiles 
SET selected_avatar_id = (
  SELECT id FROM public.avatar_options 
  ORDER BY RANDOM() 
  LIMIT 1
) 
WHERE selected_avatar_id IS NULL;
