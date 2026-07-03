-- THE ORACLE · core schema v0
-- Design: all tables deny-by-default (RLS, no policies). Every interaction goes
-- through SECURITY DEFINER RPCs (api-key auth) or read-only public views.

create extension if not exists pgcrypto;

-- single-row settings (holds admin key for resolutions)
create table settings (
  id boolean primary key default true check (id),
  admin_key uuid not null default gen_random_uuid()
);
insert into settings default values;

create table oracle_users (
  id uuid primary key default gen_random_uuid(),
  founding_number int generated always as identity,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  api_key uuid unique not null default gen_random_uuid(),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  detail text not null,                 -- resolution contract: source named in advance + edge cases
  domain text not null check (domain in ('ai','world','fast','meta')),
  publish_date date not null,           -- appears as part of that day's Daily Three
  lock_at timestamptz not null,         -- no answers or updates after this
  resolve_by date not null,
  resolution_source text not null,
  status text not null default 'draft' check (status in ('draft','live','resolved','void')),
  outcome boolean,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table forecasts (
  user_id uuid not null references oracle_users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  prob numeric(4,3) not null check (prob >= 0.01 and prob <= 0.99),  -- 0% and 100% are for gods, not forecasters
  rationale text not null default '' check (char_length(rationale) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- append-only history: powers overnight-movement, streaks, and the one-move-per-day rule
create table forecast_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  question_id uuid not null,
  prob numeric(4,3) not null,
  rationale text not null default '',
  at timestamptz not null default now()
);
create index forecast_log_uq on forecast_log (user_id, question_id, at desc);
create index forecast_log_q on forecast_log (question_id, at desc);

create table scores (
  user_id uuid not null references oracle_users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  brier numeric not null,
  points numeric not null,
  primary key (user_id, question_id)
);

alter table settings enable row level security;
alter table oracle_users enable row level security;
alter table questions enable row level security;
alter table forecasts enable row level security;
alter table forecast_log enable row level security;
alter table scores enable row level security;
revoke all on all tables in schema public from anon, authenticated;

-- ---------- helpers ----------

create or replace function _auth(p_api_key uuid) returns oracle_users
language plpgsql security definer set search_path = public as $$
declare u oracle_users;
begin
  select * into u from oracle_users where api_key = p_api_key;
  if not found then raise exception 'unknown api key — run oracle_join first'; end if;
  return u;
end $$;

-- consecutive UTC days with >=1 submission, anchored at today (or yesterday if not yet played today)
create or replace function _streak(p_user uuid) returns int
language sql security definer set search_path = public as $$
  with days as (
    select distinct (at at time zone 'utc')::date d from forecast_log where user_id = p_user
  ),
  anchor as (
    select case when exists (select 1 from days where d = (now() at time zone 'utc')::date)
                then (now() at time zone 'utc')::date
                else (now() at time zone 'utc')::date - 1 end a
  ),
  seq as (
    select d, (row_number() over (order by d desc) - 1)::int as k
    from days, anchor where d <= anchor.a
  )
  select coalesce(count(*), 0)::int from seq, anchor where d = anchor.a - k;
$$;

create or replace function _crowd_median(p_question uuid) returns numeric
language sql security definer set search_path = public as $$
  select round((percentile_cont(0.5) within group (order by prob))::numeric, 3)
  from forecasts where question_id = p_question;
$$;

create or replace function _crowd_median_at(p_question uuid, p_at timestamptz) returns numeric
language sql security definer set search_path = public as $$
  select round((percentile_cont(0.5) within group (order by l.prob))::numeric, 3)
  from (
    select distinct on (user_id) prob
    from forecast_log
    where question_id = p_question and at <= p_at
    order by user_id, at desc
  ) l;
$$;

-- ---------- RPCs ----------

create or replace function join_oracle(p_handle text) returns json
language plpgsql security definer set search_path = public as $$
declare u oracle_users;
begin
  insert into oracle_users (handle) values (lower(trim(p_handle))) returning * into u;
  return json_build_object(
    'handle', u.handle,
    'api_key', u.api_key,
    'founding_number', u.founding_number,
    'message', 'Welcome, Oracle #' || u.founding_number || '. Your key is stored locally — do not share it. Your first 30 forecasts are provisional (private).');
exception when unique_violation then
  raise exception 'handle "%" is taken — pick another', p_handle;
end $$;

create or replace function today(p_api_key uuid) returns json
language plpgsql security definer set search_path = public as $$
declare
  u oracle_users;
  v_today date := (now() at time zone 'utc')::date;
begin
  u := _auth(p_api_key);
  return json_build_object(
    'handle', u.handle,
    'streak', _streak(u.id),
    'todays_questions', coalesce((
      select json_agg(json_build_object(
        'slug', q.slug, 'title', q.title, 'detail', q.detail, 'domain', q.domain,
        'closes_in_hours', round(extract(epoch from (q.lock_at - now())) / 3600),
        'your_percent', (select round(f.prob * 100) from forecasts f where f.user_id = u.id and f.question_id = q.id),
        'your_rationale', (select f.rationale from forecasts f where f.user_id = u.id and f.question_id = q.id),
        -- crowd revealed only after you answer (no anchoring)
        'crowd_percent', case when exists (select 1 from forecasts f where f.user_id = u.id and f.question_id = q.id)
                              then round(_crowd_median(q.id) * 100) end,
        'crowd_n', case when exists (select 1 from forecasts f where f.user_id = u.id and f.question_id = q.id)
                        then (select count(*) from forecasts f2 where f2.question_id = q.id) end
      ) order by q.domain)
      from questions q
      where q.status = 'live' and q.publish_date = v_today and q.lock_at > now()
    ), '[]'::json),
    'open_positions', coalesce((
      select json_agg(json_build_object(
        'slug', q.slug, 'title', q.title,
        'your_percent', round(f.prob * 100),
        'crowd_percent', round(_crowd_median(q.id) * 100),
        'crowd_percent_24h_ago', round(coalesce(_crowd_median_at(q.id, now() - interval '24 hours'), _crowd_median(q.id)) * 100),
        'closes_in_hours', round(extract(epoch from (q.lock_at - now())) / 3600)
      ) order by q.publish_date)
      from questions q join forecasts f on f.question_id = q.id and f.user_id = u.id
      where q.status = 'live' and q.publish_date < v_today and q.lock_at > now()
    ), '[]'::json),
    'catch_up', coalesce((
      select json_agg(q.slug)
      from questions q
      where q.status = 'live' and q.publish_date < v_today and q.lock_at > now()
        and not exists (select 1 from forecasts f where f.question_id = q.id and f.user_id = u.id)
    ), '[]'::json)
  );
end $$;

create or replace function submit_forecast(p_api_key uuid, p_slug text, p_percent int, p_rationale text default '')
returns json language plpgsql security definer set search_path = public as $$
declare
  u oracle_users;
  q questions;
  v_prob numeric(4,3);
  v_existing forecasts;
  v_today date := (now() at time zone 'utc')::date;
begin
  u := _auth(p_api_key);
  if p_percent < 1 or p_percent > 99 then
    raise exception 'percent must be 1-99 (0 and 100 are for gods, not forecasters)';
  end if;
  v_prob := p_percent / 100.0;

  select * into q from questions where slug = p_slug;
  if not found then raise exception 'no question with slug "%"', p_slug; end if;
  if q.status <> 'live' then raise exception 'question "%" is % — not answerable', p_slug, q.status; end if;
  if q.publish_date > v_today then raise exception 'question "%" is not published yet', p_slug; end if;
  if q.lock_at <= now() then raise exception 'question "%" is locked', p_slug; end if;

  select * into v_existing from forecasts where user_id = u.id and question_id = q.id;
  -- one move per question per UTC day: the ration is the ritual
  if found and exists (
    select 1 from forecast_log
    where user_id = u.id and question_id = q.id and (at at time zone 'utc')::date = v_today
  ) then
    raise exception 'you already moved on "%" today — one move per day, choose carefully. Hold.', p_slug;
  end if;

  insert into forecasts (user_id, question_id, prob, rationale)
  values (u.id, q.id, v_prob, coalesce(p_rationale, ''))
  on conflict (user_id, question_id)
  do update set prob = excluded.prob, rationale = excluded.rationale, updated_at = now();

  insert into forecast_log (user_id, question_id, prob, rationale)
  values (u.id, q.id, v_prob, coalesce(p_rationale, ''));

  return json_build_object(
    'locked', p_percent,
    'question', q.slug,
    'crowd_percent', round(_crowd_median(q.id) * 100),
    'crowd_n', (select count(*) from forecasts f where f.question_id = q.id),
    'streak', _streak(u.id),
    'remaining_today', (
      select count(*) from questions qq
      where qq.status = 'live' and qq.publish_date = v_today and qq.lock_at > now()
        and not exists (select 1 from forecasts f where f.question_id = qq.id and f.user_id = u.id)
    )
  );
end $$;

create or replace function me(p_api_key uuid) returns json
language plpgsql security definer set search_path = public as $$
declare u oracle_users;
begin
  u := _auth(p_api_key);
  return json_build_object(
    'handle', u.handle,
    'founding_number', u.founding_number,
    'streak', _streak(u.id),
    'answered_total', (select count(*) from forecasts where user_id = u.id),
    'resolved_total', (select count(*) from scores where user_id = u.id),
    'provisional', (select count(*) from scores where user_id = u.id) < 30,
    'points_total', coalesce((select round(sum(points), 1) from scores where user_id = u.id), 0),
    'mean_brier', (select round(avg(brier), 3) from scores where user_id = u.id),
    'calibration', coalesce((
      select json_agg(json_build_object('bucket', b, 'n', n, 'avg_percent', avg_p, 'hit_percent', hit) order by b)
      from (
        select width_bucket(f.prob, 0, 1, 10) b, count(*) n,
               round(avg(f.prob) * 100) avg_p,
               round(100.0 * avg(case when q.outcome then 1 else 0 end)) hit
        from scores s
        join forecasts f on f.user_id = s.user_id and f.question_id = s.question_id
        join questions q on q.id = s.question_id
        where s.user_id = u.id
        group by 1
      ) t
    ), '[]'::json)
  );
end $$;

create or replace function resolve_question(p_admin_key uuid, p_slug text, p_outcome boolean) returns json
language plpgsql security definer set search_path = public as $$
declare
  q questions;
  v_crowd numeric;
  v_crowd_brier numeric;
  v_n int;
begin
  if not exists (select 1 from settings where admin_key = p_admin_key) then
    raise exception 'bad admin key';
  end if;
  select * into q from questions where slug = p_slug;
  if not found then raise exception 'no question with slug "%"', p_slug; end if;
  if q.status = 'resolved' then raise exception 'already resolved'; end if;

  update questions set status = 'resolved', outcome = p_outcome, resolved_at = now() where id = q.id;

  v_crowd := _crowd_median(q.id);
  select count(*) into v_n from forecasts where question_id = q.id;
  -- crowd brier = brier of the median forecast (beat-the-crowd baseline)
  v_crowd_brier := coalesce(power(v_crowd - (case when p_outcome then 1 else 0 end), 2), 0.25);

  insert into scores (user_id, question_id, brier, points)
  select f.user_id, f.question_id,
         round(power(f.prob - (case when p_outcome then 1 else 0 end), 2), 4),
         round(least(greatest((v_crowd_brier - power(f.prob - (case when p_outcome then 1 else 0 end), 2)) * 100, -25), 25), 1)
  from forecasts f where f.question_id = q.id
  on conflict (user_id, question_id) do nothing;

  return json_build_object('resolved', p_slug, 'outcome', p_outcome, 'n', v_n,
    'crowd_percent', round(v_crowd * 100), 'crowd_brier', round(v_crowd_brier, 4));
end $$;

create or replace function void_question(p_admin_key uuid, p_slug text) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from settings where admin_key = p_admin_key) then
    raise exception 'bad admin key';
  end if;
  update questions set status = 'void' where slug = p_slug;
  delete from scores where question_id = (select id from questions where slug = p_slug);
  return json_build_object('voided', p_slug, 'note', 'ambiguous questions get voided, streaks unharmed, postmortem owed');
end $$;

-- ---------- public read surface (dashboard + leaderboard) ----------

create view public_dashboard as
select q.slug, q.title, q.domain, q.publish_date, q.status, q.outcome, q.lock_at, q.resolution_source,
       (select count(*) from forecasts f where f.question_id = q.id) as n,
       -- k-floor: aggregate hidden until 5 forecasters
       case when (select count(*) from forecasts f where f.question_id = q.id) >= 5
            then round(_crowd_median(q.id) * 100) end as crowd_percent,
       case when (select count(*) from forecasts f where f.question_id = q.id) >= 5
            then round(coalesce(_crowd_median_at(q.id, now() - interval '24 hours'), _crowd_median(q.id)) * 100) end as crowd_percent_24h_ago
from questions q
where q.status in ('live', 'resolved') and q.publish_date <= (now() at time zone 'utc')::date;

create view public_leaderboard as
select u.handle, u.founding_number,
       round(sum(s.points), 1) as points,
       count(s.question_id) as resolved,
       round(avg(s.brier), 3) as mean_brier,
       _streak(u.id) as streak
from oracle_users u join scores s on s.user_id = u.id
where u.is_public and (select count(*) from scores s2 where s2.user_id = u.id) >= 30  -- provisional period: unranked until 30 resolved
group by u.id, u.handle, u.founding_number;

grant select on public_dashboard, public_leaderboard to anon;
grant execute on function join_oracle(text), today(uuid), submit_forecast(uuid, text, int, text), me(uuid),
  resolve_question(uuid, text, boolean), void_question(uuid, text) to anon;
