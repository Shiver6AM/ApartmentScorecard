-- Apartment Match — Supabase schema
-- Run this once in your Supabase project's SQL editor (Project → SQL Editor → New query),
-- or via the Supabase CLI: supabase db execute -f supabase/schema.sql

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  listing_type text not null default 'rent' check (listing_type in ('rent','buy')),
  name text not null default '',
  neighborhood text not null default '',
  status text not null default 'researching'
    check (status in ('researching','toured','applied','offer received','rejected')),

  -- rent fields
  rent numeric,
  bedroom_type text default '1br',
  util_heat boolean not null default false,
  util_water boolean not null default false,
  util_hydro boolean not null default false,
  util_internet boolean not null default false,
  parking_cost numeric,
  locker_cost numeric,
  last_month_deposit numeric,
  key_deposit numeric,
  other_deposit_amount numeric,
  other_deposit_desc text default '',
  application_fee_asked boolean not null default false,

  -- buy fields
  price numeric,
  condo_fees numeric,
  property_tax_annual numeric,
  deposit_pct numeric,
  first_time_buyer boolean not null default false,
  reviewed_status_certificate boolean not null default false,
  reserve_fund_concern boolean not null default false,
  special_assessment_recent boolean not null default false,
  by_wire_to_individual boolean not null default false,
  by_unverified_wire_change boolean not null default false,
  by_pressured_waive_conditions boolean not null default false,
  by_no_lawyer boolean not null default false,

  -- shared
  commute_label text default '',
  commute_minutes numeric,
  closest_stop text default '',
  source_url text default '',
  busy_road_facing boolean not null default false,
  util_est_monthly numeric,
  listed_days_ago numeric,

  bedrooms numeric,
  bathrooms numeric,
  sqft numeric,
  floor numeric,
  building_type text default '',
  occupancy_year numeric,
  heating text default '',
  laundry text default '',
  ac boolean not null default false,
  elevator boolean not null default false,

  am_gym boolean not null default false,
  am_pool boolean not null default false,
  am_concierge boolean not null default false,
  am_package boolean not null default false,
  am_bike boolean not null default false,
  am_visitor_parking boolean not null default false,
  am_rooftop boolean not null default false,
  am_pet_friendly boolean not null default false,
  pet_fee numeric,
  am_dishwasher boolean not null default false,
  am_locker boolean not null default false,

  sc_pay_before_view boolean not null default false,
  sc_no_meet boolean not null default false,
  sc_wire_crypto_gift boolean not null default false,
  sc_below_market boolean not null default false,
  sc_pressure boolean not null default false,
  sc_no_standard_lease boolean not null default false,

  notes text default '',
  listing_url text default '',
  date_added date not null default current_date
);

-- keep updated_at current on every UPDATE
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- Row Level Security. This app has no login system (it's a single-household tool), so we
-- open read/write to anyone holding the project's anon key. That's fine as long as you
-- (a) never commit your service_role key, only the anon key, and (b) don't publish the
-- deployed URL publicly. If you want real per-user auth later, add a `user_id` column,
-- enable Supabase Auth, and scope these policies to `auth.uid() = user_id` instead.
alter table public.listings enable row level security;

drop policy if exists "anon full access" on public.listings;
create policy "anon full access" on public.listings
  for all
  using (true)
  with check (true);

-- realtime: lets the app subscribe to live changes across tabs/devices
alter publication supabase_realtime add table public.listings;
