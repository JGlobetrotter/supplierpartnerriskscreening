
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  user_role TEXT,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create screenings table
CREATE TABLE public.screenings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  current_step INTEGER NOT NULL DEFAULT 1,
  overall_score NUMERIC,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screenings" ON public.screenings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own screenings" ON public.screenings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own screenings" ON public.screenings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own screenings" ON public.screenings FOR DELETE USING (auth.uid() = user_id);

-- Create screening_responses table
CREATE TABLE public.screening_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screening_id UUID NOT NULL REFERENCES public.screenings(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(screening_id, step_number)
);

ALTER TABLE public.screening_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screening responses" ON public.screening_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.screenings WHERE screenings.id = screening_responses.screening_id AND screenings.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own screening responses" ON public.screening_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.screenings WHERE screenings.id = screening_responses.screening_id AND screenings.user_id = auth.uid())
  );
CREATE POLICY "Users can update own screening responses" ON public.screening_responses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.screenings WHERE screenings.id = screening_responses.screening_id AND screenings.user_id = auth.uid())
  );

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_screenings_updated_at BEFORE UPDATE ON public.screenings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_screening_responses_updated_at BEFORE UPDATE ON public.screening_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
