-- Function to increment request counter
CREATE OR REPLACE FUNCTION public.increment_request_counter(
    p_user_id UUID,
    p_window_type TEXT,
    p_window_start TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.request_counters (user_id, window_type, window_start, request_count)
    VALUES (p_user_id, p_window_type, p_window_start, 1)
    ON CONFLICT (user_id, window_type, window_start)
    DO UPDATE SET
        request_count = public.request_counters.request_count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old request counters (should be run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_request_counters()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.request_counters
    WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
