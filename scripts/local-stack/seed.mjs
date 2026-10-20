// LOCAL ONLY. Onboards SPDC on the local ClinicFlow stack (.local-stack, API on :8089 by default) and seeds demo data
// for every role through the real API — the same calls the ClinicFlow UI makes. Never point this at staging/production.
//
//   node scripts/local-stack/seed.mjs            (idempotent: safe to re-run)
//
// Writes .local-stack/test-logins.json (gitignored) and .local-stack/seed-report.json.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const stack = path.join(root, '.local-stack');
const API = (process.env.LOCAL_API_URL || 'http://localhost:8089/api/v1').replace(/\/$/, '');
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(`${API}/`)) throw new Error(`Refusing to seed a non-local API: ${API}`);

// Local-only test accounts (throwaway database; documented in CLAUDE.md). .test is a reserved TLD: never deliverable.
const LOGINS = {
  superAdmin: { email: 'superadmin@clinicflow.com', password: 'Clinic@123', note: 'seeded by core migration V9 (local DB only)' },
  clinicAdmin: { email: 'admin@spdc.test', password: 'SpdcAdmin@2026', firstName: 'Lakshmi', lastName: 'Reception' },
  doctor: { email: 'dr.ramakanth@spdc.test', password: 'SpdcDoctor@2026' },
  patient: { email: 'ravi.teja@spdc.test', password: 'SpdcPatient@2026', firstName: 'Ravi', lastName: 'Teja', phone: '9000000001' },
  patient2: { email: 'sravani.k@spdc.test', password: 'SpdcPatient@2026', firstName: 'Sravani', lastName: 'Kolli', phone: '9000000002' },
};
const LOCAL_DOMAIN = 'spdc.localhost'; // white-label host for the local portal: http://spdc.localhost:3301

const report = [];
const log = (step, ok, detail = '') => {
  report.push({ step, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${step}${detail ? ` — ${detail}` : ''}`);
};

async function call(method, p, token, body) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  const data = json && typeof json === 'object' && 'success' in json && 'data' in json ? json.data : json;
  return { status: res.status, data, raw: json };
}
const must = (r, step, ...ok) => {
  if (!ok.includes(r.status)) throw new Error(`${step}: HTTP ${r.status} ${JSON.stringify(r.raw).slice(0, 400)}`);
  return r.data;
};
const login = async (email, password) => must(await call('POST', '/auth/login', null, { email, password }), `login ${email}`, 200).accessToken;

const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

// ---------- 1. Tenant onboarding through the core importer (exported copy, unchanged) ----------
const tenant = JSON.parse(fs.readFileSync(path.join(root, 'tenant', 'sri-parvathi.json'), 'utf8'));
const local = structuredClone(tenant);
local._note = 'LOCAL ONLY variant of tenant/sri-parvathi.json written by scripts/local-stack/seed.mjs (test passwords + local domain).';
local.clinic.customDomain = LOCAL_DOMAIN;
local.owner = { ...local.owner, email: LOGINS.clinicAdmin.email, password: LOGINS.clinicAdmin.password, firstName: LOGINS.clinicAdmin.firstName, lastName: LOGINS.clinicAdmin.lastName };
local.doctors[0] = { ...local.doctors[0], email: LOGINS.doctor.email, password: LOGINS.doctor.password };
const localTenantFile = path.join(stack, 'tenant.local.json');
fs.writeFileSync(localTenantFile, JSON.stringify(local, null, 2));

const importer = path.join(stack, 'clinicflow-api', 'tools', 'tenant-onboarding', 'onboard_tenant.py');
try {
  const out = execFileSync('python', ['-I', importer, '--base-url', API, '--admin-email', LOGINS.superAdmin.email, '--admin-password', LOGINS.superAdmin.password, '--config', localTenantFile, '--report', path.join(stack, 'onboard-report.json')], { encoding: 'utf8' });
  log('tenant importer', true, out.trim().split('\n').filter((l) => /Created|Onboarded|Provisioned|already/.test(l)).join(' | ').slice(0, 300));
} catch (e) {
  log('tenant importer', false, String(e.stdout || e.message).slice(-500));
  throw e;
}

const sa = await login(LOGINS.superAdmin.email, LOGINS.superAdmin.password);
const clinics = must(await call('GET', '/clinics', sa), 'list clinics', 200);
const clinic = (Array.isArray(clinics) ? clinics : clinics.content).find((c) => c.slug === tenant.clinic.slug);
if (!clinic) throw new Error('SPDC clinic not found after import');
const clinicId = clinic.id;

// ---------- 2. Super admin: activate (the importer leaves new clinics PENDING) ----------
// Logo + favicon: core's upload-image endpoint writes to GCS (none locally), so point the URLs at the site's own copies.
const SITE = process.env.LOCAL_SITE_URL || 'http://localhost:3300';
must(
  await call('PUT', `/clinics/${clinicId}`, sa, { name: tenant.clinic.name, status: 'ACTIVE', customDomain: LOCAL_DOMAIN, logoUrl: `${SITE}/brand/logo-mark.png`, faviconUrl: `${SITE}/icon.png` }),
  'activate clinic',
  200,
);
log('super admin: clinic ACTIVE + local white-label domain + logo/favicon', true, `${clinicId} → ${LOCAL_DOMAIN}`);
// Dental workflow (treatment plans, estimates, walk-in tokens) is a per-clinic switch, in no plan by default.
must(await call('PATCH', `/clinics/${clinicId}/features`, sa, { overrides: { dental_suite: true } }), 'dental suite', 200);
log('super admin: dental suite switched on for the clinic', true);

// ---------- 3. Clinic admin: doctor duration + weekly schedule from content (clinic hours) ----------
const admin = await login(LOGINS.clinicAdmin.email, LOGINS.clinicAdmin.password);
const branches = must(await call('GET', `/clinics/${clinicId}/branches`, admin), 'branches', 200);
const branchId = branches[0].id;
const doctors = must(await call('GET', `/clinics/${clinicId}/doctors`, admin), 'doctors', 200);
const doctor = doctors.find((d) => d.firstName === 'Ramakanth');
const doctorId = doctor.id;
const slotMinutes = JSON.parse(fs.readFileSync(path.join(root, 'content', 'doctors.json'), 'utf8')).consultSlotMinutes;
must(await call('PUT', `/clinics/${clinicId}/doctors/${doctorId}`, admin, { appointmentDurationMinutes: slotMinutes }), 'doctor duration', 200);
const ISO = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
for (const h of tenant.clinic.businessHours)
  must(await call('POST', `/clinics/${clinicId}/doctors/${doctorId}/schedules`, admin, { branchId, dayOfWeek: ISO[h.dayOfWeek], startTime: h.opens, endTime: h.closes, isActive: true }), `schedule ${h.dayOfWeek}`, 200, 201);
log('clinic admin: doctor slot length + weekly schedule', true, `${slotMinutes} min, ${tenant.clinic.businessHours.length} days`);

// ---------- 4. Patients register themselves (patient portal) ----------
for (const k of ['patient', 'patient2']) {
  const p = LOGINS[k];
  const r = await call('POST', '/auth/register', null, { firstName: p.firstName, lastName: p.lastName, email: p.email, password: p.password, phone: p.phone });
  log(`patient registers: ${p.email}`, [200, 201, 409].includes(r.status), r.status === 409 ? 'already registered' : `HTTP ${r.status}`);
}
const patientTok = await login(LOGINS.patient.email, LOGINS.patient.password);
const patient2Tok = await login(LOGINS.patient2.email, LOGINS.patient2.password);
const me = must(await call('GET', '/patients/me', patientTok), 'patient profile', 200);

// ---------- 5. Appointments ----------
const today = istToday();
const existing = must(await call('GET', '/appointments/my', patientTok), 'my appointments', 200);
const mine = Array.isArray(existing) ? existing : existing.content ?? [];
if (mine.length >= 2) {
  log('appointments', true, `already seeded (${mine.length} for ${LOGINS.patient.email}) — skipping visit workflow`);
} else {
  // 5a. Patient self-books an upcoming slot (lock → book), exactly like the portal.
  let upcoming = null;
  for (let i = 1; i <= 7 && !upcoming; i++) {
    const date = addDays(today, i);
    const slots = must(await call('GET', `/clinics/${clinicId}/doctors/${doctorId}/slots?branchId=${branchId}&date=${date}`, patientTok), 'slots', 200);
    const free = (slots ?? []).find((s) => s.available && s.startTime >= '10:00');
    if (!free) continue;
    const lock = must(await call('POST', `/clinics/${clinicId}/doctors/${doctorId}/slots/lock`, patientTok, { clinicId, doctorId, branchId, date, startTime: free.startTime }), 'lock slot', 200, 201);
    upcoming = must(await call('POST', '/appointments', patientTok, { lockId: lock.lockId ?? lock.id, notes: 'Website booking — Routine check-up', bookingSource: 'WEB' }), 'patient book', 200, 201);
  }
  log('patient: books an upcoming check-up (lock → book)', !!upcoming, upcoming ? `${upcoming.appointmentDate} ${upcoming.startTime} ${upcoming.status}` : 'no free slot in 7 days');

  // 5b. Reception books today's visit for the patient (phone booking), checks them in.
  const visit = must(
    await call('POST', '/appointments/admin-book', admin, { patientId: me.id, doctorId, branchId, date: today, startTime: '10:00', notes: 'Phone booking — Toothache, lower left', allowOutsideSchedule: true }),
    'admin book',
    200,
    201,
  );
  log('clinic admin: books today by phone for the patient', true, `${visit.id} ${visit.status}`);
  const ci = await call('PUT', `/appointments/${visit.id}/check-in`, admin);
  log('clinic admin: checks the patient in (live queue)', [200, 204].includes(ci.status), `HTTP ${ci.status}`);

  // 5c. Walk-in patient (no account) — reception registers + books in one step.
  const walk = await call('POST', '/appointments/admin-book', admin, {
    walkIn: { firstName: 'Venkata', lastName: 'Rao', phone: '9000000003', gender: 'MALE', clinicId },
    doctorId, branchId, date: today, startTime: '11:00', notes: 'Walk-in — Broken tooth', allowOutsideSchedule: true,
  });
  log('clinic admin: walk-in patient registered + booked', [200, 201].includes(walk.status), `HTTP ${walk.status}`);

  // 5d. Doctor consults: start → final e-prescription that completes the visit.
  const doc = await login(LOGINS.doctor.email, LOGINS.doctor.password);
  const st = await call('PUT', `/appointments/${visit.id}/start`, doc);
  log('doctor: starts the consultation', [200, 204].includes(st.status), `HTTP ${st.status}`);
  const rx = await call('POST', '/prescriptions', doc, {
    appointmentId: visit.id,
    state: 'FINAL',
    completeVisit: true,
    chiefComplaint: 'Pain in lower left back tooth for 3 days, worse with cold',
    diagnosis: 'Irreversible pulpitis, 36 (demo data)',
    advice: 'Chew on the right side. Avoid very hot or cold food. Root canal treatment advised.',
    followUpDate: addDays(today, 7),
    items: [
      { medicineName: 'Paracetamol 650 mg', dosage: '1 tablet', frequency: 'Every 8 hours if needed', duration: '3 days', instructions: 'After food' },
      { medicineName: 'Chlorhexidine 0.2% mouthwash', dosage: '10 ml', frequency: 'Twice daily', duration: '7 days', instructions: 'Rinse for 30 seconds; do not swallow' },
    ],
  });
  log('doctor: issues a final e-prescription and completes the visit', [200, 201].includes(rx.status), `HTTP ${rx.status}${rx.status >= 300 ? ` ${JSON.stringify(rx.raw).slice(0, 200)}` : ''}`);
  if (rx.status < 300) {
    const after = await call('GET', `/appointments/${visit.id}/history`, doc);
    if (after.status === 200 && !JSON.stringify(after.data).includes('COMPLETED')) await call('PUT', `/appointments/${visit.id}/complete`, doc);
  }

  // 5f. Reception raises the invoice for today's visit (billing).
  const inv = await call('POST', `/invoices/appointment/${visit.id}`, admin, { lineItems: [{ description: 'Consultation and examination', amountPaise: 30000 }, { description: 'Intraoral X-ray (IOPA)', amountPaise: 20000 }] });
  log('clinic admin: invoices the visit', [200, 201].includes(inv.status), `HTTP ${inv.status}${inv.status >= 300 ? ` ${JSON.stringify(inv.raw).slice(0, 200)}` : ''}`);

  // 5g. A second patient books and then cancels (cancellation workflow).
  const date2 = addDays(today, 2);
  const slots2 = must(await call('GET', `/clinics/${clinicId}/doctors/${doctorId}/slots?branchId=${branchId}&date=${date2}`, patient2Tok), 'slots 2', 200);
  const free2 = (slots2 ?? []).filter((s) => s.available).at(-2);
  if (free2) {
    const lock2 = must(await call('POST', `/clinics/${clinicId}/doctors/${doctorId}/slots/lock`, patient2Tok, { clinicId, doctorId, branchId, date: date2, startTime: free2.startTime }), 'lock 2', 200, 201);
    const appt2 = must(await call('POST', '/appointments', patient2Tok, { lockId: lock2.lockId ?? lock2.id, notes: 'Website booking — Kids check-up', bookingSource: 'WEB' }), 'book 2', 200, 201);
    log('patient 2: books online', true, `${appt2.appointmentDate} ${appt2.startTime}`);
  }
}

// ---------- 5e. Doctor writes a treatment plan with an estimate (idempotent: once per patient) ----------
{
  const doc = await login(LOGINS.doctor.email, LOGINS.doctor.password);
  const plans = await call('GET', '/treatment-plans/my', patientTok);
  const have = plans.status === 200 ? (Array.isArray(plans.data) ? plans.data : plans.data?.content ?? []) : [];
  const appts = must(await call('GET', '/appointments/my', patientTok), 'my appointments', 200);
  const visit = (Array.isArray(appts) ? appts : appts.content ?? []).find((x) => x.appointmentDate === today) ?? null;
  if (have.length) log('doctor: treatment plan', true, `already seeded (${have.length})`);
  else if (!visit) log('doctor: treatment plan', false, "no visit today to attach it to");
  else {
    const plan = await call('POST', '/treatment-plans', doc, {
      patientId: me.id,
      appointmentId: visit.id,
      title: 'Root canal treatment and crown, 36',
      notes: 'Demo plan. Estimate valid for 30 days.',
      estimateValidUntil: addDays(today, 30),
      items: [
        { procedureName: 'Root canal treatment', area: '36', sittingsPlanned: 2, estimatedCostPaise: 450000 },
        { procedureName: 'Metal-ceramic crown', area: '36', sittingsPlanned: 2, estimatedCostPaise: 550000 },
      ],
    });
    log('doctor: creates a treatment plan with an estimate', [200, 201].includes(plan.status), `HTTP ${plan.status}${plan.status >= 300 ? ` ${JSON.stringify(plan.raw).slice(0, 200)}` : ''}`);
    if (plan.status < 300) {
      // Plans are internal until released; release makes the estimate visible in the patient portal.
      const rel = await call('POST', `/treatment-plans/${plan.data.id}/release`, doc, {});
      log('doctor: releases the plan to the patient', [200, 201, 204].includes(rel.status), `HTTP ${rel.status}${rel.status >= 300 ? ` ${JSON.stringify(rel.raw).slice(0, 200)}` : ''}`);
    }

  }
}

// ---------- 6. Write logins + report ----------
fs.writeFileSync(
  path.join(stack, 'test-logins.json'),
  JSON.stringify({ _note: 'LOCAL ONLY test logins for the throwaway database in .local-stack. Never valid anywhere else.', portal: 'http://spdc.localhost:3301', site: 'http://localhost:3300', clinicId, branchId, doctorId, logins: LOGINS }, null, 2),
);
fs.writeFileSync(path.join(stack, 'seed-report.json'), JSON.stringify({ at: new Date().toISOString(), api: API, report }, null, 2));
const failed = report.filter((r) => !r.ok).length;
console.log(`\n${report.length - failed}/${report.length} steps ok. Logins: .local-stack/test-logins.json`);
process.exitCode = failed ? 1 : 0;
