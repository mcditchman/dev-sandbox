create table roast_confirmations (
  id integer primary key,
  count integer not null default 0
);

-- Seed the single row the app expects
insert into roast_confirmations (id, count) values (1, 0);
