'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookingError } from '@/lib/booking/api';
import type { BookingClientConfig } from '@/lib/booking/config';
import { preferredTimes, todayInZone, weekdayOf } from '@/lib/booking/dates';
import { buildIcs } from '@/lib/booking/ics';
import type { ResolvedMode } from '@/lib/booking/selectMode';
import { resolveBookingService, type BookingResult, type BookingService, type NextAvailable, type SlotOption } from '@/lib/booking/services';
import { doctorsForOption, findOption, resolvePrefill } from '@/lib/booking/treatments';
import { isSixDigitOtp, isValidEmail, isValidFullName, maskIndianMobile, normalizeIndianMobile } from '@/lib/booking/validation';
import { cn } from '@/lib/cn';
import { Icon, WhatsAppIcon } from '../ui/Icon';
import type { BookingPrefill } from './BookingProvider';

type Step = 'problem' | 'doctor' | 'date' | 'time' | 'details' | 'otp' | 'done';
const ANY = '__any__';

const ERRORS: Record<string, string> = {
  network: "We couldn't reach the booking system. Check your connection and try again.",
  rateLimit: 'Too many attempts from this connection. Please wait a few minutes and try again.',
  server: 'The booking system had a problem. Please try again in a moment.',
  request: 'Something in the request was not accepted. Please check your details.',
  slotTaken: 'Sorry — that time was just taken. Please choose another time.',
  emailTaken: 'This email already has a patient account. Sign in on the patient portal to book, or use a different email.',
  conflict: 'The booking system could not accept this booking. Please check your details or choose another time.',
  otpInvalid: 'That code is not correct or has expired. Check the SMS or ask for a new code.',
  notFound: 'Online booking is not available for this doctor right now.',
  invalidResponse: 'The booking system sent an unexpected reply. Please try again.',
  unavailable: 'Online booking is not available right now.',
};

const fmtDate = (ymd: string, opts: Intl.DateTimeFormatOptions) => new Date(`${ymd}T00:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', ...opts });
const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const nowHHMM = (tz: string) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());

export function BookingWizard({ config, prefill = {}, onBooked, headingLevel = 'h2' }: { config: BookingClientConfig; prefill?: BookingPrefill; onBooked?: () => void; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel;
  const [resolved, setResolved] = useState<{ service: BookingService | null; mode: ResolvedMode } | null>(null);
  const initial = useMemo(() => resolvePrefill(config.treatments, prefill), [config.treatments, prefill]);
  // A clinic with a single doctor never shows the "Choose your doctor" step (content-driven, not clinic-specific).
  const soleDoctor = config.doctors.length === 1 ? config.doctors[0].slug : null;
  const [step, setStep] = useState<Step>(initial.treatmentId ? (soleDoctor ? 'date' : 'doctor') : 'problem');
  const [treatmentId, setTreatmentId] = useState<string | null>(initial.treatmentId);
  const [doctorChoice, setDoctorChoice] = useState<string | null>(soleDoctor ?? initial.preferredDoctor);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<{ time: string; doctorSlug: string } | null>(null);
  const [slots, setSlots] = useState<SlotOption[] | null>(null);
  const [next, setNext] = useState<NextAvailable>(null);
  const [branchId, setBranchId] = useState<string>('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', consent: false, honeypot: '' });
  const [touched, setTouched] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Health check + fallback once per wizard.
  useEffect(() => {
    let alive = true;
    resolveBookingService(config).then((r) => alive && setResolved(r));
    return () => {
      alive = false;
    };
  }, [config]);

  const service = resolved?.service ?? null;
  const option = findOption(config.treatments, treatmentId);
  const optionKey = doctorsForOption(option, null).join(',');
  const optionDoctors = useMemo(() => (optionKey ? optionKey.split(',') : []), [optionKey]);
  const doctorSlugs = useMemo(
    () => (doctorChoice && doctorChoice !== ANY && optionDoctors.includes(doctorChoice) ? [doctorChoice] : optionDoctors),
    [doctorChoice, optionDoctors],
  );
  const dates = useMemo(() => (service ? service.getAvailableDates(doctorSlugs) : []), [service, doctorSlugs]);
  const doctor = (slug: string) => config.doctors.find((d) => d.slug === slug);

  const go = useCallback((s: Step) => {
    setError(null);
    setStep(s);
    requestAnimationFrame(() => headingRef.current?.focus());
  }, []);
  /** After a reason is chosen: the doctor step, or straight to the day when there is only one doctor. */
  const afterReason = () => {
    setDoctorChoice(soleDoctor);
    go(soleDoctor ? 'date' : 'doctor');
  };

  // Branch + next available (clinicflow only).
  useEffect(() => {
    if (!service) return;
    service.getBranches().then((b) => setBranchId(b[0]?.id ?? ''));
  }, [service]);
  useEffect(() => {
    if (!service?.liveSlots || step !== 'date' || !branchId) return;
    setNext(null);
    service.getNextAvailable(doctorSlugs, branchId).then(setNext).catch(() => setNext(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, step, branchId, doctorSlugs.join(',')]);

  // Load live slots for the chosen day.
  const loadSlots = useCallback(
    async (d: string, fresh = false) => {
      if (!service?.liveSlots) return;
      setSlots(null);
      try {
        setSlots(await service.getSlots(doctorSlugs, branchId, d, { fresh }));
      } catch (e) {
        setSlots([]);
        setError(ERRORS[e instanceof BookingError ? e.kind : 'network']);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service, branchId, doctorSlugs.join(',')],
  );

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const phone10 = normalizeIndianMobile(form.phone);
  const emailRequired = service?.mode !== 'whatsapp';
  const fieldErrors = {
    name: !isValidFullName(form.name) ? 'Please enter your name.' : null,
    phone: !phone10 ? 'Enter a 10-digit Indian mobile number.' : null,
    email: form.email ? (!isValidEmail(form.email) ? 'Enter a valid email address.' : null) : emailRequired ? 'Email is needed for your confirmation.' : null,
    consent: !form.consent ? 'Please tick the box to continue.' : null,
  };
  const formOk = !Object.values(fieldErrors).some(Boolean);

  const request = () => ({
    fullName: form.name,
    phone: phone10 ?? '',
    email: form.email,
    branchId,
    treatmentLabel: option?.label ?? '',
    doctorSlug: slot?.doctorSlug ?? doctorSlugs[0] ?? '',
    date: date ?? '',
    time: slot?.time ?? '',
    otp,
    honeypot: form.honeypot,
  });

  async function submitDetails() {
    setTouched(true);
    if (!formOk || !service) return;
    setBusy(true);
    setError(null);
    try {
      if (service.requiresOtp) {
        await service.sendOtp(phone10!);
        setResendIn(config.otpResendSeconds);
        go('otp');
      } else {
        await finish();
      }
    } catch (e) {
      setError(ERRORS[e instanceof BookingError ? e.kind : 'network']);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!service) return;
    const r = await service.book(request());
    setResult(r);
    if (r.kind === 'booked') onBooked?.();
    go('done');
  }

  async function confirmOtp() {
    if (!service || !(await service.verifyOtp(phone10!, otp))) return setError('Enter the 6-digit code from the SMS.');
    setBusy(true);
    setError(null);
    try {
      await finish();
    } catch (e) {
      const kind = e instanceof BookingError ? e.kind : 'network';
      setError(ERRORS[kind]);
      if (kind === 'emailTaken') {
        go('details');
        setError(ERRORS.emailTaken);
      }
      if (kind === 'slotTaken' && date) {
        setSlot(null);
        await loadSlots(date, true);
        go('time');
        setError(ERRORS.slotTaken);
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!service || resendIn > 0) return;
    try {
      await service.sendOtp(phone10!, true);
      setResendIn(config.otpResendSeconds);
    } catch (e) {
      setError(ERRORS[e instanceof BookingError ? e.kind : 'network']);
    }
  }

  // ---------- Rendering ----------
  // The first two steps only need content, so they render immediately (no layout shift while the booking
  // system is checked in the background). From the date step on, the resolved service is required.
  const needsService = step !== 'problem' && step !== 'doctor';
  if (!resolved && needsService) {
    return (
      <p className="flex items-center gap-3 py-10 text-textSecondary" role="status">
        <Icon name="loader" className="h-5 w-5 animate-spin" /> Checking availability…
      </p>
    );
  }

  if (resolved?.mode === 'unavailable') {
    return (
      <div className="space-y-4 py-4" role="status">
        <H className="text-2xl">Online booking is not available right now</H>
        <p className="text-textSecondary">
          We could not connect to the clinic&apos;s booking system, so we can&apos;t take your request online at the moment. Nothing has been sent.
        </p>
        {config.clinic.telHref ? (
          <a className="btn-primary" href={config.clinic.telHref}>
            <Icon name="phone" /> Call {config.clinic.phoneDisplay}
          </a>
        ) : (
          <p className="text-textSecondary">Please try again later.</p>
        )}
      </div>
    );
  }

  const modeNote =
    service?.mode === 'enquiry'
      ? 'You are sending an appointment request. The clinic will contact you to confirm the time.'
      : service?.mode === 'whatsapp'
        ? 'Your request will open in WhatsApp for you to send. The appointment is confirmed once the clinic replies.'
        : null;

  const stepsOrder: Step[] = ['problem', ...(soleDoctor ? [] : (['doctor'] as Step[])), 'date', 'time', 'details', ...(!resolved || service?.requiresOtp ? (['otp'] as Step[]) : [])];
  const stepIndex = stepsOrder.indexOf(step);
  const back = stepIndex > 0 && step !== 'done' ? () => go(stepsOrder[stepIndex - 1]) : null;

  const heading = (children: ReactNode) => (
    <H ref={headingRef} tabIndex={-1} className="text-2xl outline-none">
      {children}
    </H>
  );

  return (
    <div>
      {step !== 'done' && (
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3 text-sm text-textSecondary">
            <span>
              Step {stepIndex + 1} of {stepsOrder.length}
            </span>
            {back && (
              <button type="button" onClick={back} className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-primary hover:underline">
                <Icon name="chevron-left" className="h-4 w-4" /> Back
              </button>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint" aria-hidden="true">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((stepIndex + 1) / stepsOrder.length) * 100}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-warning/30 bg-surface px-4 py-3 text-sm font-medium text-warning">
          <Icon name="circle-alert" className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {step === 'problem' && (
        <div>
          {heading(<>What&apos;s troubling you?</>)}
          <p className="mt-1 text-textSecondary">Pick the closest match{soleDoctor ? '' : ". We'll suggest the right doctor"}.</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {config.problems.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn('chip', treatmentId === `problem:${p.id}` && 'border-primary bg-tint')}
                onClick={() => {
                  setTreatmentId(`problem:${p.id}`);
                  afterReason();
                }}
              >
                <Icon name={p.icon} className="h-4 w-4 text-primary" /> {p.label}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => { setTreatmentId('general'); afterReason(); }}>
              <Icon name="stethoscope" className="h-4 w-4 text-primary" /> {findOption(config.treatments, 'general')?.label}
            </button>
          </div>
          <label className="mt-6 block text-sm font-semibold text-text" htmlFor="bk-treatment">
            Or choose a specific treatment
          </label>
          <select
            id="bk-treatment"
            className="mt-2 min-h-[48px] w-full rounded-xl border border-border bg-surface px-3 text-base"
            value={treatmentId && treatmentId.startsWith('treatment:') ? treatmentId : ''}
            onChange={(e) => {
              if (!e.target.value) return;
              setTreatmentId(e.target.value);
              afterReason();
            }}
          >
            <option value="">Select a treatment…</option>
            {config.treatments
              .filter((g) => g.id !== 'general')
              .map((g) => (
                <optgroup key={g.id} label={g.label}>
                  {g.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </div>
      )}

      {step === 'doctor' && option && (
        <div>
          {heading(<>Choose your doctor</>)}
          <p className="mt-1 text-textSecondary">
            For <strong className="text-text">{option.label}</strong>
          </p>
          <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Doctor">
            {optionDoctors.length > 1 && (
              <Choice selected={doctorChoice === ANY || !doctorChoice} onClick={() => setDoctorChoice(ANY)} title="First available" text="Any of the doctors below — the earliest time wins." icon="calendar-check" />
            )}
            {optionDoctors.map((slug) => {
              const d = doctor(slug)!;
              return (
                <Choice
                  key={slug}
                  selected={doctorChoice === slug || (optionDoctors.length === 1 && !doctorChoice)}
                  onClick={() => setDoctorChoice(slug)}
                  title={d.displayName}
                  text={d.specialty}
                  initials={d.initials}
                />
              );
            })}
          </div>
          <button type="button" className="btn-primary mt-6 w-full sm:w-auto" onClick={() => { if (!doctorChoice) setDoctorChoice(optionDoctors.length === 1 ? optionDoctors[0] : ANY); go('date'); }}>
            Continue <Icon name="arrow-right" className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 'date' && (
        <div>
          {heading(<>Pick a day</>)}
          {next && (
            <button
              type="button"
              className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-tint px-4 py-3 text-left hover:border-primary"
              onClick={() => {
                setDate(next.date);
                setDoctorChoice(next.doctorSlug);
                loadSlots(next.date);
                go('time');
              }}
            >
              <Icon name="zap" className="h-5 w-5 text-primary" />
              <span>
                <span className="block font-semibold text-text">Next available</span>
                <span className="text-sm text-textSecondary">
                  {fmtDate(next.date, { weekday: 'long', day: 'numeric', month: 'short' })}, {fmtTime(next.time)} · {doctor(next.doctorSlug)?.displayName}
                </span>
              </span>
            </button>
          )}
          {dates.length ? (
            <div className="no-scrollbar -mx-1 mt-5 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Available days">
              {dates.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="option"
                  aria-selected={date === d}
                  onClick={() => {
                    setDate(d);
                    setSlot(null);
                    loadSlots(d);
                    go('time');
                  }}
                  className={cn('flex min-h-[72px] w-[4.5rem] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border bg-surface', date === d ? 'border-primary bg-tint' : 'border-border hover:border-primary')}
                >
                  <span className="text-xs font-semibold uppercase text-textSecondary">{fmtDate(d, { weekday: 'short' })}</span>
                  <span className="font-heading text-2xl font-semibold text-text">{fmtDate(d, { day: 'numeric' })}</span>
                  <span className="text-xs text-textSecondary">{fmtDate(d, { month: 'short' })}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-textSecondary">No consultation days are open in the next {config.advanceDays} days.</p>
          )}
        </div>
      )}

      {step === 'time' && date && (
        <div>
          {heading(<>{service?.liveSlots ? 'Pick a time' : 'Preferred time'}</>)}
          <p className="mt-1 text-textSecondary">{fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          {service?.liveSlots ? (
            slots === null ? (
              <p className="mt-6 flex items-center gap-2 text-textSecondary" role="status">
                <Icon name="loader" className="h-4 w-4 animate-spin" /> Loading free times…
              </p>
            ) : slots.length ? (
              <SlotGrid
                items={slots.map((s) => ({ key: `${s.doctorSlug}-${s.time}`, time: s.time, sub: doctorSlugs.length > 1 ? s.doctorName : undefined, selected: slot?.time === s.time && slot.doctorSlug === s.doctorSlug, pick: () => setSlot({ time: s.time, doctorSlug: s.doctorSlug }) }))}
              />
            ) : (
              <p className="mt-6 text-textSecondary">No free times on this day. Please go back and pick another day.</p>
            )
          ) : (
            <SlotGrid
              items={[
                { key: 'any', time: '', label: 'Any time', selected: slot?.time === '', pick: () => setSlot({ time: '', doctorSlug: doctorSlugs[0] }) },
                ...preferredTimes(
                  doctorSlugs.flatMap((s) => doctor(s)?.consultation ?? []),
                  weekdayOf(date),
                  30,
                  date === todayInZone(config.timezone) ? nowHHMM(config.timezone) : undefined,
                ).map((t) => ({ key: t, time: t, selected: slot?.time === t, pick: () => setSlot({ time: t, doctorSlug: doctorSlugs[0] }) })),
              ]}
            />
          )}
          <button type="button" className="btn-primary mt-6 w-full sm:w-auto" disabled={!slot} onClick={() => go('details')}>
            Continue <Icon name="arrow-right" className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 'details' && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submitDetails();
          }}
        >
          {heading(<>Your details</>)}
          {modeNote && <p className="mt-3 rounded-xl bg-tint px-4 py-2.5 text-sm text-text">{modeNote}</p>}
          <Summary config={config} option={option?.label} doctor={doctor(slot?.doctorSlug ?? '')?.displayName} date={date} time={slot?.time} />
          <div className="mt-5 grid gap-4">
            <Field id="bk-name" label="Full name" error={touched ? fieldErrors.name : null}>
              <input id="bk-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field id="bk-phone" label="Mobile number" hint={service?.requiresOtp ? "10 digits. We'll text you a code to confirm." : '10-digit mobile number, so the clinic can reach you.'} error={touched ? fieldErrors.phone : null}>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border bg-tint px-3 text-textSecondary">+91</span>
                <input id="bk-phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input rounded-l-none" />
              </div>
            </Field>
            <Field id="bk-email" label={emailRequired ? 'Email' : 'Email (optional)'} hint={emailRequired ? 'Your confirmation and reminder are sent here.' : undefined} error={touched ? fieldErrors.email : null}>
              <input id="bk-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </Field>
            <div className="hidden" aria-hidden="true">
              <label htmlFor="bk-website">Website</label>
              <input id="bk-website" tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={(e) => setForm({ ...form, honeypot: e.target.value })} />
            </div>
            <div>
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm text-text">
                <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" aria-describedby="bk-consent-err" />
                <span>
                  {config.consentText}{' '}
                  <a href={config.privacyHref} className="font-semibold text-primary underline" target="_blank" rel="noopener">
                    Privacy policy
                  </a>
                </span>
              </label>
              {touched && fieldErrors.consent && (
                <p id="bk-consent-err" className="mt-1 text-sm font-medium text-warning">
                  {fieldErrors.consent}
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-textSecondary">{config.note}</p>
          <button type="submit" className="btn-cta mt-5 w-full sm:w-auto" disabled={busy}>
            {busy && <Icon name="loader" className="h-4 w-4 animate-spin" />}
            {service?.requiresOtp ? 'Send verification code' : service?.mode === 'whatsapp' ? 'Continue to WhatsApp' : 'Send request'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            confirmOtp();
          }}
        >
          {heading(<>Enter the code</>)}
          <p className="mt-1 text-textSecondary">We sent a 6-digit code by SMS to {phone10 ? maskIndianMobile(phone10) : 'your mobile'}.</p>
          <label htmlFor="bk-otp" className="mt-5 block text-sm font-semibold text-text">
            Verification code
          </label>
          <input
            id="bk-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="input mt-2 max-w-[12rem] text-center font-heading text-2xl tracking-[0.4em]"
          />
          {config.otpHint && <p className="mt-2 text-sm text-textSecondary">Test mode: use {config.otpHint}</p>}
          <div className="mt-3">
            <button type="button" onClick={resend} disabled={resendIn > 0} className="min-h-[44px] text-sm font-semibold text-primary underline disabled:text-textSecondary disabled:no-underline">
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
          <button type="submit" className="btn-cta mt-4 w-full sm:w-auto" disabled={busy || !isSixDigitOtp(otp)}>
            {busy && <Icon name="loader" className="h-4 w-4 animate-spin" />} Confirm appointment
          </button>
        </form>
      )}

      {step === 'done' && result && <Result result={result} config={config} optionLabel={option?.label ?? ''} headingRef={headingRef} H={H} />}
    </div>
  );
}

function Choice({ selected, onClick, title, text, initials, icon }: { selected: boolean; onClick: () => void; title: string; text: string; initials?: string; icon?: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick} className={cn('flex min-h-[64px] items-center gap-4 rounded-2xl border bg-surface px-4 py-3 text-left transition-colors', selected ? 'border-primary bg-tint' : 'border-border hover:border-primary')}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[38%] bg-tint font-heading font-semibold text-primaryDeep ring-1 ring-mint">{initials ?? <Icon name={icon ?? 'check'} />}</span>
      <span className="flex-1">
        <span className="block font-semibold text-text">{title}</span>
        <span className="text-sm text-textSecondary">{text}</span>
      </span>
      <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2', selected ? 'border-primary bg-primary text-surface' : 'border-border')}>{selected && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}</span>
    </button>
  );
}

function SlotGrid({ items }: { items: { key: string; time: string; label?: string; sub?: string; selected: boolean; pick: () => void }[] }) {
  const groups = [
    { label: 'Morning', items: items.filter((i) => i.time && i.time < '12:00') },
    { label: 'Afternoon & evening', items: items.filter((i) => i.time && i.time >= '12:00') },
  ];
  const special = items.filter((i) => !i.time);
  return (
    <div className="mt-5 space-y-5" role="radiogroup" aria-label="Time">
      {special.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {special.map((i) => (
            <SlotButton {...i} key={i.key} />
          ))}
        </div>
      )}
      {groups
        .filter((g) => g.items.length)
        .map((g) => (
          <div key={g.label}>
            <p className="mb-2 text-sm font-semibold text-textSecondary">{g.label}</p>
            <div className="grid grid-cols-3 gap-2 xs:grid-cols-4">
              {g.items.map((i) => (
                <SlotButton {...i} key={i.key} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function SlotButton({ time, label, sub, selected, pick }: { time: string; label?: string; sub?: string; selected: boolean; pick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={pick} className={cn('min-h-[48px] rounded-xl border px-3 py-2 text-sm font-semibold', selected ? 'border-primary bg-primary text-surface' : 'border-border bg-surface text-text hover:border-primary')}>
      {label ?? fmtTime(time)}
      {sub && <span className={cn('block text-xs font-normal', selected ? 'text-surface' : 'text-textSecondary')}>{sub}</span>}
    </button>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error: string | null; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-textSecondary">{hint}</p>}
      {error && (
        <p className="mt-1 text-sm font-medium text-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Summary({ option, doctor, date, time }: { config: BookingClientConfig; option?: string; doctor?: string; date: string | null; time?: string }) {
  return (
    <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 rounded-2xl bg-tint px-4 py-3 text-sm">
      <dt className="text-textSecondary">Concern</dt>
      <dd className="font-medium text-text">{option}</dd>
      <dt className="text-textSecondary">Doctor</dt>
      <dd className="font-medium text-text">{doctor}</dd>
      <dt className="text-textSecondary">When</dt>
      <dd className="font-medium text-text">
        {date ? fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}, {time ? fmtTime(time) : 'any time'}
      </dd>
    </dl>
  );
}

function Result({ result, config, optionLabel, headingRef, H }: { result: BookingResult; config: BookingClientConfig; optionLabel: string; headingRef: React.RefObject<HTMLHeadingElement>; H: 'h2' | 'h3' }) {
  if (result.kind === 'booked') {
    const confirmed = result.status.toUpperCase() === 'CONFIRMED';
    const end = result.endTime ?? result.time;
    const ics = buildIcs({
      uid: `${result.appointmentId}@spdc`,
      title: `Dental appointment — ${config.clinic.name}`,
      description: `${optionLabel} with ${result.doctorName}`,
      location: config.clinic.address,
      date: result.date,
      start: result.time,
      end,
    });
    return (
      <div className="py-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tint text-primary">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <H ref={headingRef} tabIndex={-1} className="mt-4 text-2xl outline-none">
          {confirmed ? 'Your appointment is confirmed' : 'Your booking has been received'}
        </H>
        <p className="mt-2 text-textSecondary">
          {result.doctorName} · {fmtDate(result.date, { weekday: 'long', day: 'numeric', month: 'long' })} at {fmtTime(result.time)}
        </p>
        {!confirmed && <p className="mt-2 text-sm text-textSecondary">Status from the clinic&apos;s system: {result.status}. The clinic will confirm it.</p>}
        <p className="mt-2 text-sm text-textSecondary">A confirmation email is on its way, and you&apos;ll get a reminder before the visit.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="btn-ghost" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`} download="dental-appointment.ics">
            <Icon name="calendar" /> Add to calendar
          </a>
          <a className="btn-ghost" href={config.portal.login} target="_blank" rel="noopener">
            <Icon name="log-in" /> Manage in patient portal
          </a>
        </div>
      </div>
    );
  }
  if (result.kind === 'enquiry') {
    return (
      <div className="py-2">
        <H ref={headingRef} tabIndex={-1} className="text-2xl outline-none">
          Request sent
        </H>
        <p className="mt-2 text-textSecondary">The clinic has received your request. This is not a confirmed appointment yet — the clinic will contact you to confirm a time.</p>
        {config.clinic.telHref && (
          <a className="btn-ghost mt-5" href={config.clinic.telHref}>
            <Icon name="phone" /> Call {config.clinic.phoneDisplay}
          </a>
        )}
      </div>
    );
  }
  return (
    <div className="py-2">
      <H ref={headingRef} tabIndex={-1} className="text-2xl outline-none">
        One more step: send it on WhatsApp
      </H>
      <p className="mt-2 text-textSecondary">Your details are ready in a WhatsApp message. Send it to request this time — the appointment is confirmed only when the clinic replies.</p>
      <a className="btn-whatsapp mt-5" href={result.href} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon /> Open WhatsApp
      </a>
    </div>
  );
}

