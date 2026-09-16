
create extension if not exists pgcrypto;

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  initial_percentage numeric(6,3) not null,
  target_before_transfer numeric(6,3) not null,
  final_percentage numeric(6,3) not null default 50,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id text primary key,
  name text not null,
  original_amount numeric(12,2) not null check (original_amount >= 0),
  prior_paid numeric(12,2) not null default 0 check (prior_paid >= 0),
  opening_balance numeric(12,2) not null check (opening_balance >= 0),
  affects_participation boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  debt_id text not null references public.debts(id) on delete restrict,
  payment_date date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  concept text not null,
  amount_usd numeric(12,2) not null check (amount_usd >= 0),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.partners(name,initial_percentage,target_before_transfer,final_percentage)
values ('Víctor',80,60,50),('Carlos',20,40,50)
on conflict(name) do update set initial_percentage=excluded.initial_percentage,target_before_transfer=excluded.target_before_transfer,final_percentage=excluded.final_percentage;

insert into public.debts(id,name,original_amount,prior_paid,opening_balance,affects_participation,sort_order)
values
 ('bordado','Máquina de bordado',12500,1600,10900,false,1),
 ('dtf','Máquina DTF',5400,0,5400,false,2),
 ('liquidacion','Liquidación socios anteriores',4700,0,4700,true,3),
 ('victor','Deuda con Víctor',2500,0,2500,true,4)
on conflict(id) do update set name=excluded.name,original_amount=excluded.original_amount,prior_paid=excluded.prior_paid,opening_balance=excluded.opening_balance,affects_participation=excluded.affects_participation,sort_order=excluded.sort_order;

insert into public.investments(concept,amount_usd,notes,sort_order)
select * from (values
 ('Activos fijos originales',14521.06,'Convertidos de córdobas a dólares según la tabla original',1),
 ('Base inicial (efectivo)',1000.00,'Capital/base inicial',2),
 ('Ecosolvente',3800.00,null,3),
 ('Máquina de ojete',100.00,null,4),
 ('Convertidor 220',245.00,null,5),
 ('Máquina de broche',100.00,null,6),
 ('Pistola de calor',50.00,null,7),
 ('Pago previo bordado',1600.00,'Forma parte de los US$12,500 de la bordadora; no es otra máquina',8)
) v(concept,amount_usd,notes,sort_order)
where not exists(select 1 from public.investments);

insert into public.settings(key,value) values
 ('participation_rule','{"carlos_start":20,"carlos_target":40,"victor_start":80,"victor_target":60,"carlos_required_contribution":3600,"special_payment_split":0.5,"final_transfer_from_victor_to_carlos":10}'::jsonb)
on conflict(key) do update set value=excluded.value,updated_at=now();

alter table public.partners enable row level security;
alter table public.debts enable row level security;
alter table public.payments enable row level security;
alter table public.investments enable row level security;
alter table public.settings enable row level security;

drop policy if exists "public_read_partners" on public.partners;
drop policy if exists "public_read_debts" on public.debts;
drop policy if exists "public_read_payments" on public.payments;
drop policy if exists "public_insert_payments" on public.payments;
drop policy if exists "public_delete_payments" on public.payments;
drop policy if exists "public_read_investments" on public.investments;
drop policy if exists "public_read_settings" on public.settings;

create policy "public_read_partners" on public.partners for select to anon, authenticated using (true);
create policy "public_read_debts" on public.debts for select to anon, authenticated using (true);
create policy "public_read_payments" on public.payments for select to anon, authenticated using (true);
create policy "public_insert_payments" on public.payments for insert to anon, authenticated with check (true);
create policy "public_delete_payments" on public.payments for delete to anon, authenticated using (true);
create policy "public_read_investments" on public.investments for select to anon, authenticated using (true);
create policy "public_read_settings" on public.settings for select to anon, authenticated using (true);
