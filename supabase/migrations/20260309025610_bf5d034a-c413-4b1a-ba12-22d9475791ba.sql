CREATE POLICY "Users can delete own screening responses" ON public.screening_responses
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.screenings WHERE screenings.id = screening_responses.screening_id AND screenings.user_id = auth.uid())
);