create table public.crime_alerts (
  id uuid not null default extensions.uuid_generate_v4 (),
  type text not null,
  description text not null,
  area text not null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  severity text null default 'medium'::text,
  reported_at timestamp with time zone not null,
  occurred_at timestamp with time zone not null,
  source text null default 'system'::text,
  is_verified boolean null default false,
  status text null default 'active'::text,
  created_at timestamp with time zone null default now(),
  constraint crime_alerts_pkey primary key (id)
) TABLESPACE pg_default;
create table public.location_warnings (
  id uuid not null default extensions.uuid_generate_v4 (),
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  area text not null,
  message text not null,
  warning_type text not null,
  priority text null default 'medium'::text,
  radius integer null default 1000,
  start_time timestamp with time zone null default now(),
  end_time timestamp with time zone null,
  is_active boolean null default true,
  source text null default 'AyaAI System'::text,
  created_at timestamp with time zone null default now(),
  constraint location_warnings_pkey primary key (id)
) TABLESPACE pg_default;
create table public.medical_cards (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name text null,
  dob date null,
  gender text null,
  blood_type text null,
  medical_aid text null,
  media_url text null,
  media_type text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint medical_cards_pkey primary key (id),
  constraint medical_cards_user_id_key unique (user_id)
) TABLESPACE pg_default;create table public.passkeys (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  credential_id text not null,
  public_key text not null,
  provider text null default 'biometric'::text,
  created_at timestamp with time zone null default now(),
  last_used_at timestamp with time zone null,
  constraint passkeys_pkey primary key (id),
  constraint passkeys_credential_id_key unique (credential_id),
  constraint passkeys_user_id_credential_id_key unique (user_id, credential_id)
) TABLESPACE pg_default;

create index IF not exists idx_passkeys_user_id on public.passkeys using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_passkeys_credential_id on public.passkeys using btree (credential_id) TABLESPACE pg_default;

create index IF not exists idx_passkeys_created_at on public.passkeys using btree (created_at desc) TABLESPACE pg_default;create table public.push_tokens (
  token text not null,
  platform text not null,
  inserted_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id text null,
  constraint push_tokens_pkey primary key (id),
  constraint push_tokens_token_key unique (token),
  constraint push_tokens_platform_check check (
    (
      platform = any (array['android'::text, 'ios'::text])
    )
  )
) TABLESPACE pg_default;

create trigger update_push_tokens_updated_at BEFORE
update on push_tokens for EACH row
execute FUNCTION update_updated_at_column ();create table public.reactivation_codes (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_email text not null,
  code text not null,
  is_used boolean null default false,
  created_at timestamp with time zone null default now(),
  expires_at timestamp with time zone null default (now() + '24:00:00'::interval),
  used_at timestamp with time zone null,
  constraint reactivation_codes_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_reactivation_codes_email on public.reactivation_codes using btree (user_email) TABLESPACE pg_default;

create index IF not exists idx_reactivation_codes_code on public.reactivation_codes using btree (code) TABLESPACE pg_default;

create index IF not exists idx_reactivation_codes_expires on public.reactivation_codes using btree (expires_at) TABLESPACE pg_default;create table public.safety_alerts (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  message text not null,
  area text not null,
  priority text null default 'medium'::text,
  alert_type text not null,
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  radius integer null default 5,
  start_time timestamp with time zone null default now(),
  end_time timestamp with time zone null,
  is_active boolean null default true,
  source text null default 'AyaAI System'::text,
  created_at timestamp with time zone null default now(),
  constraint safety_alerts_pkey primary key (id)
) TABLESPACE pg_default;create table public.sos_contacts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  phone text not null,
  created_at timestamp with time zone null default now(),
  constraint sos_contacts_pkey primary key (id),
  constraint sos_contacts_user_phone_unique unique (user_id, phone)
) TABLESPACE pg_default;

create index IF not exists idx_sos_contacts_user_id on public.sos_contacts using btree (user_id) TABLESPACE pg_default;create table public.time_tips (
  id uuid not null default extensions.uuid_generate_v4 (),
  hour_start integer not null,
  hour_end integer not null,
  time_range text not null,
  awareness text not null,
  tip text not null,
  priority text null default 'medium'::text,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint time_tips_pkey primary key (id)
) TABLESPACE pg_default;create table public.training_sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  user_email text not null,
  training_type text not null,
  training_title text not null,
  score integer null default 0,
  reps_completed integer null default 0,
  total_reps integer null default 0,
  duration_seconds integer null default 0,
  accuracy_percentage integer null default 0,
  perfect_moves integer null default 0,
  good_moves integer null default 0,
  movements_data jsonb null,
  completed_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint training_sessions_pkey primary key (id),
  constraint training_sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_training_sessions_user_id on public.training_sessions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_training_sessions_user_email on public.training_sessions using btree (user_email) TABLESPACE pg_default;

create index IF not exists idx_training_sessions_training_type on public.training_sessions using btree (training_type) TABLESPACE pg_default;

create index IF not exists idx_training_sessions_completed_at on public.training_sessions using btree (completed_at desc) TABLESPACE pg_default;create table public.user_profiles (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  email text not null,
  full_name text null,
  username text null,
  phone text null,
  location text null,
  age integer null,
  gender text null,
  profile_picture_url text null,
  provider text null default 'email'::text,
  bio text null,
  emergency_contacts jsonb null default '[]'::jsonb,
  safety_preferences jsonb null default '{}'::jsonb,
  achievements jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_login_at timestamp with time zone null,
  is_active boolean null default true,
  deactivated_at timestamp with time zone null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_key unique (user_id)
) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_user_id on public.user_profiles using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_email on public.user_profiles using btree (email) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_is_active on public.user_profiles using btree (is_active) TABLESPACE pg_default;

create trigger update_user_profiles_updated_at BEFORE
update on user_profiles for EACH row
execute FUNCTION update_updated_at_column ();create table public.user_subscriptions (
  id uuid not null default gen_random_uuid (),
  email text not null,
  subscription_tier text not null default 'free'::text,
  expires_at timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_subscriptions_pkey primary key (id),
  constraint user_subscriptions_email_key unique (email),
  constraint valid_subscription_tier check (
    (
      subscription_tier = any (
        array[
          'free'::text,
          'personal'::text,
          'family'::text,
          'personal_pro'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_subscriptions_email on public.user_subscriptions using btree (email) TABLESPACE pg_default;

create index IF not exists idx_user_subscriptions_active on public.user_subscriptions using btree (is_active) TABLESPACE pg_default;

create trigger update_user_subscriptions_updated_at BEFORE
update on user_subscriptions for EACH row
execute FUNCTION update_updated_at_column ();create table public.posts (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  username text not null,
  content text null,
  media_type text null default 'none'::text,
  media_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  avatar text null,
  comments jsonb null default '[]'::jsonb,
  likes text[] null default '{}'::text[],
  media_urls text[] null default '{}'::text[],
  constraint posts_pkey primary key (id),
  constraint posts_user_id_fkey foreign KEY (user_id) references auth.users (id),
  constraint posts_media_type_check check (
    (
      media_type = any (array['image'::text, 'video'::text, 'none'::text])
    )
  )
) TABLESPACE pg_default;create table public.user_profiles (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  email text not null,
  full_name text null,
  username text null,
  phone text null,
  location text null,
  age integer null,
  gender text null,
  profile_picture_url text null,
  provider text null default 'email'::text,
  bio text null,
  emergency_contacts jsonb null default '[]'::jsonb,
  safety_preferences jsonb null default '{}'::jsonb,
  achievements jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_login_at timestamp with time zone null,
  is_active boolean null default true,
  deactivated_at timestamp with time zone null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_key unique (user_id)
) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_user_id on public.user_profiles using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_email on public.user_profiles using btree (email) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_is_active on public.user_profiles using btree (is_active) TABLESPACE pg_default;

create trigger update_user_profiles_updated_at BEFORE
update on user_profiles for EACH row
execute FUNCTION update_updated_at_column ();