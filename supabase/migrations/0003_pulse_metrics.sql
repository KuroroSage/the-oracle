-- founder metrics vs the pre-committed bars (admin-gated; nothing public)
create or replace function pulse(p_admin_key uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from settings where admin_key = p_admin_key) then
    raise exception 'bad admin key';
  end if;
  return json_build_object(
    'users_total', (select count(*) from oracle_users where handle not like '\_%'),
    'forecasts_total', (select count(*) from forecasts),
    'dau_today', (select count(distinct user_id) from forecast_log where (at at time zone 'utc')::date = (now() at time zone 'utc')::date),
    'wau', (select count(distinct user_id) from forecast_log where at > now() - interval '7 days'),
    'dau_wau_pct', (select case when count(distinct user_id) filter (where at > now() - interval '7 days') = 0 then null
      else round(100.0 * count(distinct user_id) filter (where (at at time zone 'utc')::date = (now() at time zone 'utc')::date)
                 / count(distinct user_id) filter (where at > now() - interval '7 days')) end
      from forecast_log),
    'actives_by_day', coalesce((select json_agg(json_build_object('day', d, 'actives', n) order by d)
      from (select (at at time zone 'utc')::date d, count(distinct user_id) n
            from forecast_log where at > now() - interval '14 days' group by 1) t), '[]'::json),
    'd7_cohorts', coalesce((select json_agg(json_build_object('cohort', cohort_day, 'joined', joined, 'retained_d7', retained) order by cohort_day)
      from (
        select (u.created_at at time zone 'utc')::date cohort_day, count(*) joined,
               count(*) filter (where exists (
                 select 1 from forecast_log l where l.user_id = u.id
                   and (l.at at time zone 'utc')::date between (u.created_at at time zone 'utc')::date + 6
                                                           and (u.created_at at time zone 'utc')::date + 8
               )) retained
        from oracle_users u
        where u.handle not like '\_%' and u.created_at < now() - interval '7 days'
        group by 1
      ) c), '[]'::json),
    'answers_by_hour_utc', coalesce((select json_agg(json_build_object('hour', h, 'n', n) order by h)
      from (select extract(hour from at at time zone 'utc')::int h, count(*) n
            from forecast_log where at > now() - interval '7 days' group by 1) t), '[]'::json)
  );
end $$;

grant execute on function pulse(uuid) to anon;
