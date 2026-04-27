-- Fix streak calculation: use app timezone (America/Sao_Paulo) and correct goals_config columns
-- Without this, CURRENT_DATE in UTC can be a different day than the user's, so consecutive streak returns 0.

CREATE OR REPLACE FUNCTION public.calculate_user_streak(target_user_id UUID)
RETURNS TABLE (weekly_streak INT, total_streak INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calorie_target NUMERIC;
  today_date DATE;
  week_start DATE;
  current_date_check DATE;
  daily_calories NUMERIC;
  consecutive_days INT := 0;
  week_days INT := 0;
BEGIN
  -- Use same timezone as the app (America/Sao_Paulo) so "today" matches the user's date
  today_date := (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;

  -- Get user's calorie target: goals_config uses id (user id), not user_id; column is manual_calories
  SELECT COALESCE(NULLIF(g.manual_calories, 0), 2000) INTO calorie_target
  FROM public.goals_config g
  WHERE g.id = target_user_id;

  IF calorie_target IS NULL OR calorie_target <= 0 THEN
    calorie_target := 2000;
  END IF;

  -- Week start (Sunday) in same timezone
  week_start := today_date - EXTRACT(DOW FROM today_date)::INT;

  -- Count days within goal this week
  SELECT COUNT(DISTINCT date)::INT INTO week_days
  FROM (
    SELECT date, SUM(kcal)::NUMERIC as daily_total
    FROM public.meals
    WHERE user_id = target_user_id
      AND status = true
      AND date >= week_start::TEXT
      AND date <= today_date::TEXT
    GROUP BY date
    HAVING SUM(kcal)::NUMERIC <= calorie_target
  ) daily_meals;

  -- Consecutive days streak (going backwards from today)
  current_date_check := today_date;
  LOOP
    SELECT COALESCE(SUM(kcal), -1) INTO daily_calories
    FROM public.meals
    WHERE user_id = target_user_id
      AND status = true
      AND date = current_date_check::TEXT;

    IF daily_calories < 0 OR daily_calories > calorie_target THEN
      EXIT;
    END IF;

    consecutive_days := consecutive_days + 1;
    current_date_check := current_date_check - INTERVAL '1 day';

    IF consecutive_days > 365 THEN
      EXIT;
    END IF;
  END LOOP;

  weekly_streak := COALESCE(week_days, 0);
  total_streak := consecutive_days;
  RETURN NEXT;
END;
$$;
-- Re-run streak update for all users so existing rows get correct values (optional, can be heavy)
-- PERFORM is no-op here; uncomment the block below to backfill once if needed:
/*
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.users
  LOOP
    PERFORM public.update_user_streak(r.id);
  END LOOP;
END $$;
*/;
