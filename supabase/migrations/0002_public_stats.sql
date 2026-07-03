-- masthead stats: safe aggregate counts only
create view public_stats as
select
  (select count(*) from oracle_users where handle not like '\_%') as builders,
  (select count(distinct user_id) from forecasts) as forecasters,
  (select count(*) from forecasts) as forecasts,
  (select count(*) from questions where status = 'resolved') as resolved;

grant select on public_stats to anon;
