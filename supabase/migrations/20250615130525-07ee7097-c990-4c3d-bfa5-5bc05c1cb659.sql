
-- Create a table to store available avatar color options
CREATE TABLE public.avatar_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color_value text NOT NULL,
  gradient_value text,
  category text DEFAULT 'solid',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

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

-- Add a column to profiles to track selected avatar
ALTER TABLE public.profiles 
ADD COLUMN selected_avatar_id uuid REFERENCES public.avatar_options(id);

-- Create a function to randomly assign an avatar to new users
CREATE OR REPLACE FUNCTION public.assign_random_avatar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  random_avatar_id uuid;
BEGIN
  -- Get a random avatar ID
  SELECT id INTO random_avatar_id 
  FROM public.avatar_options 
  ORDER BY RANDOM() 
  LIMIT 1;
  
  -- Update the new profile with the random avatar
  IF random_avatar_id IS NOT NULL THEN
    NEW.selected_avatar_id = random_avatar_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign random avatar on profile creation
CREATE TRIGGER assign_avatar_on_profile_creation
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_random_avatar();

-- Enable RLS on avatar_options (read-only for all authenticated users)
ALTER TABLE public.avatar_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view avatar options" 
  ON public.avatar_options 
  FOR SELECT 
  TO authenticated 
  USING (true);
