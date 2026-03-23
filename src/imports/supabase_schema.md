--
-- PostgreSQL database dump
--

\restrict 9cYN7lm55zEZHJ86adXjgNi9uaztpGLrCNuHgbTgmng54Y7Zb6h0Nfy011IxaBv

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: decrement_verification_slot_booked_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrement_verification_slot_booked_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.verification_slot_id is not null then
    update public.verification_slots
       set booked_count = greatest(booked_count - 1, 0)
     where id = old.verification_slot_id;
  end if;

  return old;
end;
$$;


--
-- Name: enforce_verification_slot_capacity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_verification_slot_capacity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_slot public.verification_slots%rowtype;
begin
  if new.verification_slot_id is null then
    return new;
  end if;

  select *
    into v_slot
    from public.verification_slots
   where id = new.verification_slot_id
   for update;

  if not found then
    raise exception 'verification slot not found: %', new.verification_slot_id;
  end if;

  if v_slot.is_open is distinct from true then
    raise exception 'verification slot is closed: %', new.verification_slot_id;
  end if;

  if exists (
    select 1
      from public.verification_blackout_dates b
     where b.blackout_date = v_slot.slot_date
  ) then
    raise exception 'verification slot date is blacked out: %', v_slot.slot_date;
  end if;

  if v_slot.booked_count >= v_slot.capacity then
    raise exception 'verification slot is full: %', new.verification_slot_id;
  end if;

  -- Keep existing columns populated for backward compatibility
  new.appointment_date := v_slot.slot_date;
  new.appointment_time := to_char(v_slot.start_time, 'HH24:MI') || '-' || to_char(v_slot.end_time, 'HH24:MI');

  update public.verification_slots
     set booked_count = booked_count + 1
   where id = v_slot.id;

  return new;
end;
$$;


--
-- Name: handle_refund_dispute(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_refund_dispute() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.report_type = 'refund_dispute'
     AND NEW.session_id IS NOT NULL THEN

    UPDATE public.sessions
    SET status = 'dispute_open'
    WHERE id = NEW.session_id;

  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: handle_report_resolution(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_report_resolution() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'resolved'
     AND NEW.session_id IS NOT NULL THEN

    IF NEW.decision_type = 'refund_approved' THEN

      UPDATE public.sessions
      SET status = 'refunded'
      WHERE id = NEW.session_id;

    ELSIF NEW.decision_type = 'refund_rejected' THEN

      UPDATE public.sessions
      SET status = 'completed'
      WHERE id = NEW.session_id;

    END IF;

  END IF;

  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: booking_grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_grades (
    booking_id uuid NOT NULL,
    grade_id integer NOT NULL
);


--
-- Name: booking_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: booking_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    total_amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT booking_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'completed'::text])))
);


--
-- Name: booking_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_subjects (
    booking_id uuid NOT NULL,
    subject_id integer NOT NULL
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid NOT NULL,
    tutor_id uuid NOT NULL,
    number_of_kids integer NOT NULL,
    mode text NOT NULL,
    parent_message text,
    total_price numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bookings_mode_check CHECK ((mode = ANY (ARRAY['online'::text, 'in_person'::text]))),
    CONSTRAINT bookings_number_of_kids_check CHECK ((number_of_kids > 0)),
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'declined'::text, 'cancelled'::text, 'accepted'::text, 'active'::text, 'completed'::text]))),
    CONSTRAINT bookings_total_price_check CHECK ((total_price >= (0)::numeric))
);


--
-- Name: grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grades (
    id integer NOT NULL,
    grade_number integer NOT NULL,
    level_id integer NOT NULL
);


--
-- Name: grades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;


--
-- Name: parent_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parent_profiles (
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    latitude double precision,
    longitude double precision,
    profile_photo_path text,
    created_at timestamp with time zone DEFAULT now(),
    onboarding_complete boolean
);


--
-- Name: parent_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parent_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid NOT NULL,
    verification_type text NOT NULL,
    id_document_path text,
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    CONSTRAINT parent_verifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT parent_verifications_verification_type_check CHECK ((verification_type = ANY (ARRAY['online'::text, 'in_person'::text])))
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    reported_user_id uuid,
    booking_id uuid,
    session_id uuid,
    report_type text NOT NULL,
    reason text NOT NULL,
    description text,
    status text DEFAULT 'open'::text,
    admin_decision text,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    decision_type text,
    CONSTRAINT reports_decision_type_check CHECK (((decision_type IS NULL) OR (decision_type = ANY (ARRAY['refund_approved'::text, 'refund_rejected'::text, 'no_action'::text, 'warning_issued'::text, 'user_suspended'::text]))))
);


--
-- Name: session_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    booking_payment_id uuid NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT session_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid_out'::text, 'refunded'::text])))
);


--
-- Name: session_reschedule_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_reschedule_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    proposed_date date NOT NULL,
    proposed_time time without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT session_reschedule_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    session_date date NOT NULL,
    start_time time without time zone NOT NULL,
    duration_hours integer NOT NULL,
    hourly_rate_at_booking numeric(10,2) NOT NULL,
    session_price numeric(10,2) NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sessions_duration_hours_check CHECK ((duration_hours > 0)),
    CONSTRAINT sessions_hourly_rate_at_booking_check CHECK ((hourly_rate_at_booking >= (0)::numeric)),
    CONSTRAINT sessions_session_price_check CHECK ((session_price >= (0)::numeric)),
    CONSTRAINT sessions_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'marked_complete'::text, 'refund_requested'::text, 'dispute_open'::text, 'completed'::text, 'refunded'::text, 'missed'::text, 'cancelled'::text])))
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: system_revenue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_revenue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    total_earned numeric(10,2) DEFAULT 0 NOT NULL,
    total_fees numeric(10,2) DEFAULT 0 NOT NULL,
    total_payouts numeric(10,2) DEFAULT 0 NOT NULL,
    total_refunded numeric(10,2) DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now()
);


--
-- Name: tutor_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tutor_id uuid,
    weekday integer NOT NULL,
    time_slot character varying(50) NOT NULL,
    CONSTRAINT tutor_availability_weekday_check CHECK (((weekday >= 1) AND (weekday <= 7)))
);


--
-- Name: tutor_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_levels (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


--
-- Name: tutor_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tutor_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tutor_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tutor_levels_id_seq OWNED BY public.tutor_levels.id;


--
-- Name: tutor_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_profiles (
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    gender text,
    experience character varying(50),
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    address text,
    bio text,
    profile_photo_path text,
    onboarding_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tutor_profiles_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text])))
);


--
-- Name: tutor_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    tutor_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    is_hidden boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tutor_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: tutor_selected_grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_selected_grades (
    tutor_id uuid NOT NULL,
    grade_id integer NOT NULL
);


--
-- Name: tutor_selected_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_selected_levels (
    tutor_id uuid NOT NULL,
    level_id integer NOT NULL,
    hourly_rate numeric(10,2) NOT NULL
);


--
-- Name: tutor_selected_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_selected_subjects (
    tutor_id uuid NOT NULL,
    subject_id integer NOT NULL
);


--
-- Name: tutor_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tutor_id uuid,
    plan_type text NOT NULL,
    start_date timestamp with time zone DEFAULT now() NOT NULL,
    end_date timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tutor_subscriptions_plan_type_check CHECK ((plan_type = ANY (ARRAY['free'::text, 'pro'::text])))
);


--
-- Name: tutor_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tutor_id uuid,
    verification_type text NOT NULL,
    id_document_path text,
    education_document_path text,
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    CONSTRAINT tutor_verifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT tutor_verifications_verification_type_check CHECK ((verification_type = ANY (ARRAY['online'::text, 'in_person'::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['parent'::text, 'tutor'::text, 'admin'::text]))),
    CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'blocked'::text])))
);


--
-- Name: verification_appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_date date NOT NULL,
    appointment_time character varying(50) NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    tutor_verification_id uuid,
    parent_verification_id uuid,
    verification_slot_id uuid,
    CONSTRAINT one_verification_only CHECK ((((tutor_verification_id IS NOT NULL) AND (parent_verification_id IS NULL)) OR ((tutor_verification_id IS NULL) AND (parent_verification_id IS NOT NULL)))),
    CONSTRAINT verification_appointments_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))
);


--
-- Name: verification_blackout_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_blackout_dates (
    blackout_date date NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: verification_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slot_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    capacity integer NOT NULL,
    booked_count integer DEFAULT 0 NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verification_slots_booked_count_check CHECK (((booked_count >= 0) AND (booked_count <= capacity))),
    CONSTRAINT verification_slots_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT verification_slots_time_check CHECK ((end_time > start_time))
);


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    session_id uuid,
    amount numeric(10,2) NOT NULL,
    transaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT wallet_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['session_credit'::text, 'platform_fee'::text, 'withdrawal'::text, 'adjustment'::text])))
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawal_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT withdrawal_requests_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT withdrawal_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: grades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: tutor_levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_levels ALTER COLUMN id SET DEFAULT nextval('public.tutor_levels_id_seq'::regclass);


--
-- Name: booking_grades booking_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_grades
    ADD CONSTRAINT booking_grades_pkey PRIMARY KEY (booking_id, grade_id);


--
-- Name: booking_messages booking_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_messages
    ADD CONSTRAINT booking_messages_pkey PRIMARY KEY (id);


--
-- Name: booking_payments booking_payments_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT booking_payments_booking_id_key UNIQUE (booking_id);


--
-- Name: booking_payments booking_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT booking_payments_pkey PRIMARY KEY (id);


--
-- Name: booking_subjects booking_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_subjects
    ADD CONSTRAINT booking_subjects_pkey PRIMARY KEY (booking_id, subject_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: grades grades_grade_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_grade_number_key UNIQUE (grade_number);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: parent_profiles parent_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_profiles
    ADD CONSTRAINT parent_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: parent_verifications parent_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_verifications
    ADD CONSTRAINT parent_verifications_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: session_payments session_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_payments
    ADD CONSTRAINT session_payments_pkey PRIMARY KEY (id);


--
-- Name: session_payments session_payments_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_payments
    ADD CONSTRAINT session_payments_session_id_key UNIQUE (session_id);


--
-- Name: session_reschedule_requests session_reschedule_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_reschedule_requests
    ADD CONSTRAINT session_reschedule_requests_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: system_revenue system_revenue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_revenue
    ADD CONSTRAINT system_revenue_pkey PRIMARY KEY (id);


--
-- Name: tutor_availability tutor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_availability
    ADD CONSTRAINT tutor_availability_pkey PRIMARY KEY (id);


--
-- Name: tutor_availability tutor_availability_tutor_id_weekday_time_slot_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_availability
    ADD CONSTRAINT tutor_availability_tutor_id_weekday_time_slot_key UNIQUE (tutor_id, weekday, time_slot);


--
-- Name: tutor_levels tutor_levels_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_levels
    ADD CONSTRAINT tutor_levels_name_key UNIQUE (name);


--
-- Name: tutor_levels tutor_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_levels
    ADD CONSTRAINT tutor_levels_pkey PRIMARY KEY (id);


--
-- Name: tutor_profiles tutor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: tutor_reviews tutor_reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_reviews
    ADD CONSTRAINT tutor_reviews_booking_id_key UNIQUE (booking_id);


--
-- Name: tutor_reviews tutor_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_reviews
    ADD CONSTRAINT tutor_reviews_pkey PRIMARY KEY (id);


--
-- Name: tutor_selected_grades tutor_selected_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_grades
    ADD CONSTRAINT tutor_selected_grades_pkey PRIMARY KEY (tutor_id, grade_id);


--
-- Name: tutor_selected_levels tutor_selected_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_levels
    ADD CONSTRAINT tutor_selected_levels_pkey PRIMARY KEY (tutor_id, level_id);


--
-- Name: tutor_selected_subjects tutor_selected_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_subjects
    ADD CONSTRAINT tutor_selected_subjects_pkey PRIMARY KEY (tutor_id, subject_id);


--
-- Name: tutor_subscriptions tutor_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_subscriptions
    ADD CONSTRAINT tutor_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tutor_verifications tutor_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_verifications
    ADD CONSTRAINT tutor_verifications_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_appointments verification_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_appointments
    ADD CONSTRAINT verification_appointments_pkey PRIMARY KEY (id);


--
-- Name: verification_blackout_dates verification_blackout_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_blackout_dates
    ADD CONSTRAINT verification_blackout_dates_pkey PRIMARY KEY (blackout_date);


--
-- Name: verification_slots verification_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_slots
    ADD CONSTRAINT verification_slots_pkey PRIMARY KEY (id);


--
-- Name: verification_slots verification_slots_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_slots
    ADD CONSTRAINT verification_slots_unique UNIQUE (slot_date, start_time, end_time);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


--
-- Name: tutor_reviews_tutor_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tutor_reviews_tutor_id_created_at_idx ON public.tutor_reviews USING btree (tutor_id, created_at DESC);


--
-- Name: verification_slots_slot_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verification_slots_slot_date_idx ON public.verification_slots USING btree (slot_date);


--
-- Name: verification_appointments trigger_decrement_verification_slot_booked_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_decrement_verification_slot_booked_count AFTER DELETE ON public.verification_appointments FOR EACH ROW EXECUTE FUNCTION public.decrement_verification_slot_booked_count();


--
-- Name: verification_appointments trigger_enforce_verification_slot_capacity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_enforce_verification_slot_capacity BEFORE INSERT ON public.verification_appointments FOR EACH ROW EXECUTE FUNCTION public.enforce_verification_slot_capacity();


--
-- Name: reports trigger_refund_dispute; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_refund_dispute AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_refund_dispute();


--
-- Name: reports trigger_report_resolution; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_report_resolution AFTER UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.handle_report_resolution();


--
-- Name: booking_grades booking_grades_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_grades
    ADD CONSTRAINT booking_grades_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_grades booking_grades_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_grades
    ADD CONSTRAINT booking_grades_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE CASCADE;


--
-- Name: booking_messages booking_messages_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_messages
    ADD CONSTRAINT booking_messages_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_messages booking_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_messages
    ADD CONSTRAINT booking_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: booking_payments booking_payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT booking_payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_payments booking_payments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT booking_payments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: booking_subjects booking_subjects_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_subjects
    ADD CONSTRAINT booking_subjects_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_subjects booking_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_subjects
    ADD CONSTRAINT booking_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent_profiles(user_id) ON DELETE CASCADE;


--
-- Name: bookings bookings_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: grades grades_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.tutor_levels(id) ON DELETE CASCADE;


--
-- Name: parent_profiles parent_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_profiles
    ADD CONSTRAINT parent_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parent_verifications parent_verifications_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent_verifications
    ADD CONSTRAINT parent_verifications_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent_profiles(user_id) ON DELETE CASCADE;


--
-- Name: reports reports_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: reports reports_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.users(id);


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- Name: session_payments session_payments_booking_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_payments
    ADD CONSTRAINT session_payments_booking_payment_id_fkey FOREIGN KEY (booking_payment_id) REFERENCES public.booking_payments(id) ON DELETE CASCADE;


--
-- Name: session_payments session_payments_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_payments
    ADD CONSTRAINT session_payments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_reschedule_requests session_reschedule_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_reschedule_requests
    ADD CONSTRAINT session_reschedule_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_reschedule_requests session_reschedule_requests_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_reschedule_requests
    ADD CONSTRAINT session_reschedule_requests_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: tutor_availability tutor_availability_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_availability
    ADD CONSTRAINT tutor_availability_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: tutor_profiles tutor_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutor_reviews tutor_reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_reviews
    ADD CONSTRAINT tutor_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: tutor_reviews tutor_reviews_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_reviews
    ADD CONSTRAINT tutor_reviews_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent_profiles(user_id) ON DELETE CASCADE;


--
-- Name: tutor_reviews tutor_reviews_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_reviews
    ADD CONSTRAINT tutor_reviews_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: tutor_selected_grades tutor_selected_grades_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_grades
    ADD CONSTRAINT tutor_selected_grades_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE CASCADE;


--
-- Name: tutor_selected_grades tutor_selected_grades_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_grades
    ADD CONSTRAINT tutor_selected_grades_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: tutor_selected_levels tutor_selected_levels_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_levels
    ADD CONSTRAINT tutor_selected_levels_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.tutor_levels(id) ON DELETE CASCADE;


--
-- Name: tutor_selected_levels tutor_selected_levels_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_levels
    ADD CONSTRAINT tutor_selected_levels_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: tutor_selected_subjects tutor_selected_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_subjects
    ADD CONSTRAINT tutor_selected_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: tutor_selected_subjects tutor_selected_subjects_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_selected_subjects
    ADD CONSTRAINT tutor_selected_subjects_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: tutor_subscriptions tutor_subscriptions_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_subscriptions
    ADD CONSTRAINT tutor_subscriptions_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: tutor_verifications tutor_verifications_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_verifications
    ADD CONSTRAINT tutor_verifications_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.tutor_profiles(user_id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: verification_appointments verification_appointments_parent_verification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_appointments
    ADD CONSTRAINT verification_appointments_parent_verification_id_fkey FOREIGN KEY (parent_verification_id) REFERENCES public.parent_verifications(id) ON DELETE CASCADE;


--
-- Name: verification_appointments verification_appointments_tutor_verification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_appointments
    ADD CONSTRAINT verification_appointments_tutor_verification_id_fkey FOREIGN KEY (tutor_verification_id) REFERENCES public.tutor_verifications(id) ON DELETE CASCADE;


--
-- Name: verification_appointments verification_appointments_verification_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_appointments
    ADD CONSTRAINT verification_appointments_verification_slot_id_fkey FOREIGN KEY (verification_slot_id) REFERENCES public.verification_slots(id);


--
-- Name: wallet_transactions wallet_transactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: wallet_transactions wallet_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: withdrawal_requests withdrawal_requests_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- Name: tutor_reviews Active users can view tutor reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active users can view tutor reviews" ON public.tutor_reviews FOR SELECT USING (((is_hidden = false) AND (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.status = 'active'::text))))));


--
-- Name: verification_blackout_dates Active users can view verification blackout dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active users can view verification blackout dates" ON public.verification_blackout_dates FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.status = 'active'::text)))));


--
-- Name: verification_slots Active users can view verification slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active users can view verification slots" ON public.verification_slots FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.status = 'active'::text)))));


--
-- Name: verification_appointments Admin can delete appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete appointments" ON public.verification_appointments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: reports Admin can delete reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete reports" ON public.reports FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: tutor_reviews Admin can delete tutor reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete tutor reviews" ON public.tutor_reviews FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_blackout_dates Admin can delete verification blackout dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete verification blackout dates" ON public.verification_blackout_dates FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_slots Admin can delete verification slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete verification slots" ON public.verification_slots FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_blackout_dates Admin can insert verification blackout dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert verification blackout dates" ON public.verification_blackout_dates FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_slots Admin can insert verification slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert verification slots" ON public.verification_slots FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_appointments Admin can update appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update appointments" ON public.verification_appointments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: reports Admin can update reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update reports" ON public.reports FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: tutor_reviews Admin can update tutor reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update tutor reviews" ON public.tutor_reviews FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_blackout_dates Admin can update verification blackout dates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update verification blackout dates" ON public.verification_blackout_dates FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_slots Admin can update verification slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update verification slots" ON public.verification_slots FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text) AND (u.status = 'active'::text)))));


--
-- Name: verification_appointments Admin can view all appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view all appointments" ON public.verification_appointments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: parent_profiles Admin can view parent profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view parent profiles" ON public.parent_profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: parent_verifications Admin can view parent verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view parent verifications" ON public.parent_verifications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: wallet_transactions Admin can view wallet transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view wallet transactions" ON public.wallet_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: wallets Admin can view wallets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view wallets" ON public.wallets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


--
-- Name: grades Anyone can read grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read grades" ON public.grades FOR SELECT USING (true);


--
-- Name: subjects Anyone can read subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);


--
-- Name: tutor_levels Anyone can read tutor levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read tutor levels" ON public.tutor_levels FOR SELECT USING (true);


--
-- Name: reports Booking participants can view related reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Booking participants can view related reports" ON public.reports FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = reports.booking_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (public.sessions s
     JOIN public.bookings b ON ((b.id = s.booking_id)))
  WHERE ((s.id = reports.session_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid())))))));


--
-- Name: wallet_transactions No direct wallet transaction modification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No direct wallet transaction modification" ON public.wallet_transactions USING (false);


--
-- Name: wallets No direct wallet updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No direct wallet updates" ON public.wallets FOR UPDATE USING (false);


--
-- Name: withdrawal_requests No direct withdrawal deletes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No direct withdrawal deletes" ON public.withdrawal_requests FOR DELETE USING (false);


--
-- Name: withdrawal_requests No direct withdrawal updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No direct withdrawal updates" ON public.withdrawal_requests FOR UPDATE USING (false);


--
-- Name: bookings Parent can cancel pending booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can cancel pending booking" ON public.bookings FOR UPDATE USING (((auth.uid() = parent_id) AND (status = 'pending'::text))) WITH CHECK ((auth.uid() = parent_id));


--
-- Name: verification_appointments Parent can create appointment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can create appointment" ON public.verification_appointments FOR INSERT WITH CHECK (((verification_slot_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.parent_verifications pv
  WHERE ((pv.id = verification_appointments.parent_verification_id) AND (pv.parent_id = auth.uid()) AND (pv.verification_type = 'in_person'::text))))));


--
-- Name: bookings Parent can create booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can create booking" ON public.bookings FOR INSERT WITH CHECK ((auth.uid() = parent_id));


--
-- Name: booking_payments Parent can create booking payment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can create booking payment" ON public.booking_payments FOR INSERT WITH CHECK (((parent_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_payments.booking_id) AND (b.parent_id = auth.uid()))))));


--
-- Name: tutor_reviews Parent can create review for completed booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can create review for completed booking" ON public.tutor_reviews FOR INSERT WITH CHECK (((parent_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = tutor_reviews.booking_id) AND (b.parent_id = auth.uid()) AND (b.tutor_id = tutor_reviews.tutor_id) AND (b.status = 'completed'::text))))));


--
-- Name: sessions Parent can create sessions for own booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can create sessions for own booking" ON public.sessions FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = sessions.booking_id) AND (b.parent_id = auth.uid())))));


--
-- Name: booking_grades Parent can delete booking grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can delete booking grades" ON public.booking_grades FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_grades.booking_id) AND (b.parent_id = auth.uid())))));


--
-- Name: booking_subjects Parent can delete booking subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can delete booking subjects" ON public.booking_subjects FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_subjects.booking_id) AND (b.parent_id = auth.uid())))));


--
-- Name: booking_grades Parent can insert booking grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can insert booking grades" ON public.booking_grades FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_grades.booking_id) AND (b.parent_id = auth.uid())))));


--
-- Name: booking_subjects Parent can insert booking subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can insert booking subjects" ON public.booking_subjects FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_subjects.booking_id) AND (b.parent_id = auth.uid())))));


--
-- Name: parent_profiles Parent can manage own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can manage own profile" ON public.parent_profiles USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: parent_verifications Parent can manage own verification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can manage own verification" ON public.parent_verifications USING ((auth.uid() = parent_id)) WITH CHECK ((auth.uid() = parent_id));


--
-- Name: verification_appointments Parent can read own appointment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can read own appointment" ON public.verification_appointments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.parent_verifications pv
  WHERE ((pv.id = verification_appointments.parent_verification_id) AND (pv.parent_id = auth.uid())))));


--
-- Name: tutor_reviews Parent can update own tutor review; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can update own tutor review" ON public.tutor_reviews FOR UPDATE USING ((parent_id = auth.uid())) WITH CHECK ((parent_id = auth.uid()));


--
-- Name: sessions Parent can update sessions of own booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can update sessions of own booking" ON public.sessions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = sessions.booking_id) AND (b.parent_id = auth.uid())))));


--
-- Name: bookings Parent can view own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parent can view own bookings" ON public.bookings FOR SELECT USING ((auth.uid() = parent_id));


--
-- Name: tutor_profiles Parents can view active verified tutors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parents can view active verified tutors" ON public.tutor_profiles FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'parent'::text) AND (u.status = 'active'::text)))) AND (EXISTS ( SELECT 1
   FROM public.users tu
  WHERE ((tu.id = tutor_profiles.user_id) AND (tu.status = 'active'::text)))) AND (EXISTS ( SELECT 1
   FROM public.tutor_verifications v
  WHERE ((v.tutor_id = tutor_profiles.user_id) AND (v.status = 'approved'::text))))));


--
-- Name: tutor_availability Parents can view tutor availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parents can view tutor availability" ON public.tutor_availability FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'parent'::text) AND (u.status = 'active'::text)))));


--
-- Name: tutor_selected_grades Parents can view tutor grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parents can view tutor grades" ON public.tutor_selected_grades FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'parent'::text) AND (u.status = 'active'::text)))));


--
-- Name: tutor_selected_levels Parents can view tutor levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parents can view tutor levels" ON public.tutor_selected_levels FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'parent'::text) AND (u.status = 'active'::text)))));


--
-- Name: tutor_selected_subjects Parents can view tutor subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Parents can view tutor subjects" ON public.tutor_selected_subjects FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'parent'::text) AND (u.status = 'active'::text)))));


--
-- Name: tutor_profiles Public can view tutor profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view tutor profiles" ON public.tutor_profiles FOR SELECT USING (true);


--
-- Name: reports Reported user can view reports about them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reported user can view reports about them" ON public.reports FOR SELECT USING ((reported_user_id = auth.uid()));


--
-- Name: reports Reporter can view own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reporter can view own reports" ON public.reports FOR SELECT USING ((reporter_id = auth.uid()));


--
-- Name: verification_appointments Tutor can create appointment for own verification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can create appointment for own verification" ON public.verification_appointments FOR INSERT WITH CHECK (((verification_slot_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.tutor_verifications tv
  WHERE ((tv.id = verification_appointments.tutor_verification_id) AND (tv.tutor_id = auth.uid()) AND (tv.verification_type = 'in_person'::text))))));


--
-- Name: tutor_availability Tutor can delete own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can delete own availability" ON public.tutor_availability FOR DELETE USING ((auth.uid() = tutor_id));


--
-- Name: tutor_selected_grades Tutor can delete own grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can delete own grades" ON public.tutor_selected_grades FOR DELETE USING ((auth.uid() = tutor_id));


--
-- Name: tutor_selected_levels Tutor can delete own levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can delete own levels" ON public.tutor_selected_levels FOR DELETE USING ((auth.uid() = tutor_id));


--
-- Name: tutor_selected_subjects Tutor can delete own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can delete own subjects" ON public.tutor_selected_subjects FOR DELETE USING ((auth.uid() = tutor_id));


--
-- Name: tutor_availability Tutor can insert own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can insert own availability" ON public.tutor_availability FOR INSERT WITH CHECK ((auth.uid() = tutor_id));


--
-- Name: tutor_selected_grades Tutor can insert own grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can insert own grades" ON public.tutor_selected_grades FOR INSERT WITH CHECK ((auth.uid() = tutor_id));


--
-- Name: tutor_selected_levels Tutor can insert own levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can insert own levels" ON public.tutor_selected_levels FOR INSERT WITH CHECK ((auth.uid() = tutor_id));


--
-- Name: tutor_profiles Tutor can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can insert own profile" ON public.tutor_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tutor_selected_subjects Tutor can insert own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can insert own subjects" ON public.tutor_selected_subjects FOR INSERT WITH CHECK ((auth.uid() = tutor_id));


--
-- Name: tutor_verifications Tutor can insert own verification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can insert own verification" ON public.tutor_verifications FOR INSERT WITH CHECK ((auth.uid() = tutor_id));


--
-- Name: verification_appointments Tutor can read own appointment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own appointment" ON public.verification_appointments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tutor_verifications tv
  WHERE ((tv.id = verification_appointments.tutor_verification_id) AND (tv.tutor_id = auth.uid())))));


--
-- Name: tutor_availability Tutor can read own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own availability" ON public.tutor_availability FOR SELECT USING ((auth.uid() = tutor_id));


--
-- Name: tutor_selected_grades Tutor can read own grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own grades" ON public.tutor_selected_grades FOR SELECT USING ((auth.uid() = tutor_id));


--
-- Name: tutor_selected_levels Tutor can read own levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own levels" ON public.tutor_selected_levels FOR SELECT USING ((auth.uid() = tutor_id));


--
-- Name: tutor_profiles Tutor can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own profile" ON public.tutor_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tutor_selected_subjects Tutor can read own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own subjects" ON public.tutor_selected_subjects FOR SELECT USING ((auth.uid() = tutor_id));


--
-- Name: tutor_subscriptions Tutor can read own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own subscription" ON public.tutor_subscriptions FOR SELECT USING ((auth.uid() = tutor_id));


--
-- Name: tutor_verifications Tutor can read own verification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can read own verification" ON public.tutor_verifications FOR SELECT USING ((auth.uid() = tutor_id));


--
-- Name: bookings Tutor can respond to booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can respond to booking" ON public.bookings FOR UPDATE USING (((auth.uid() = tutor_id) AND (status = 'pending'::text))) WITH CHECK ((auth.uid() = tutor_id));


--
-- Name: tutor_availability Tutor can update own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can update own availability" ON public.tutor_availability FOR UPDATE USING ((auth.uid() = tutor_id));


--
-- Name: tutor_profiles Tutor can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can update own profile" ON public.tutor_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: sessions Tutor can update sessions of assigned booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can update sessions of assigned booking" ON public.sessions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = sessions.booking_id) AND (b.tutor_id = auth.uid())))));


--
-- Name: bookings Tutor can view bookings assigned to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tutor can view bookings assigned to them" ON public.bookings FOR SELECT USING ((auth.uid() = tutor_id));


--
-- Name: withdrawal_requests User can create withdrawal request; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can create withdrawal request" ON public.withdrawal_requests FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.wallets w
  WHERE ((w.id = withdrawal_requests.wallet_id) AND (w.user_id = auth.uid())))));


--
-- Name: wallets User can view own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can view own wallet" ON public.wallets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wallet_transactions User can view own wallet transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can view own wallet transactions" ON public.wallet_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.wallets w
  WHERE ((w.id = wallet_transactions.wallet_id) AND (w.user_id = auth.uid())))));


--
-- Name: withdrawal_requests User can view own withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.wallets w
  WHERE ((w.id = withdrawal_requests.wallet_id) AND (w.user_id = auth.uid())))));


--
-- Name: reports Users can create reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK ((reporter_id = auth.uid()));


--
-- Name: session_reschedule_requests Users can create reschedule request; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reschedule request" ON public.session_reschedule_requests FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.sessions s
     JOIN public.bookings b ON ((b.id = s.booking_id)))
  WHERE ((s.id = session_reschedule_requests.session_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: users Users can insert their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own record" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: booking_messages Users can send booking messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send booking messages" ON public.booking_messages FOR INSERT WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_messages.booking_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid())) AND (b.status = 'active'::text))))));


--
-- Name: session_reschedule_requests Users can update reschedule request; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update reschedule request" ON public.session_reschedule_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.sessions s
     JOIN public.bookings b ON ((b.id = s.booking_id)))
  WHERE ((s.id = session_reschedule_requests.session_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: booking_grades Users can view booking grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view booking grades" ON public.booking_grades FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_grades.booking_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: booking_messages Users can view booking messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view booking messages" ON public.booking_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_messages.booking_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid())) AND (b.status = 'active'::text)))));


--
-- Name: booking_payments Users can view booking payment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view booking payment" ON public.booking_payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_payments.booking_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: booking_subjects Users can view booking subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view booking subjects" ON public.booking_subjects FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = booking_subjects.booking_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: session_reschedule_requests Users can view reschedule requests of their session; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view reschedule requests of their session" ON public.session_reschedule_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.sessions s
     JOIN public.bookings b ON ((b.id = s.booking_id)))
  WHERE ((s.id = session_reschedule_requests.session_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: session_payments Users can view session payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view session payments" ON public.session_payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.sessions s
     JOIN public.bookings b ON ((b.id = s.booking_id)))
  WHERE ((s.id = session_payments.session_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: sessions Users can view sessions of their booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view sessions of their booking" ON public.sessions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.bookings b
  WHERE ((b.id = sessions.booking_id) AND ((b.parent_id = auth.uid()) OR (b.tutor_id = auth.uid()))))));


--
-- Name: users Users can view their own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: booking_grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_grades ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: booking_subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.booking_subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

--
-- Name: parent_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: parent_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parent_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: session_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: session_reschedule_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_reschedule_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_selected_grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_selected_grades ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_selected_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_selected_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_selected_subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_selected_subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_blackout_dates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_blackout_dates ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: wallet_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawal_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 9cYN7lm55zEZHJ86adXjgNi9uaztpGLrCNuHgbTgmng54Y7Zb6h0Nfy011IxaBv

