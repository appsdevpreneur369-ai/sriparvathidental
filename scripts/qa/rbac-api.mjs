// TEST-ONLY role-based access control matrix against the LOCAL ClinicFlow API (never staging/production).
// Usage: node scripts/qa/rbac-api.mjs [http://localhost:8089/api/v1] [qa/rbac]
// Roles: anonymous, super admin, SPDC clinic admin, SPDC doctor, two SPDC patients, and the admin + doctor of a
// DIFFERENT clinic (core's seeded "Demo Health Clinic") for tenant isolation.
//  - GET rows: allowed roles must get 2xx (proves the path is real); every other role must get 401/403/404.
//  - Write rows: only denials are exercised (no side effects); they must be exactly 401/403 (a guard, not a typo).
//    Bodies are VALID on purpose: core validates the body before the role check, so an invalid body would give 400.
//  - 'observe' rows record what core does where its guard looks broader than one clinic; reported, not failed.
import fs from 'node:fs';

const [API = 'http://localhost:8089/api/v1', out = 'qa/rbac'] = process.argv.slice(2);
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(API)) throw new Error('local API only');
fs.mkdirSync(out, { recursive: true });
const logins = JSON.parse(fs.readFileSync('.local-stack/test-logins.json', 'utf8'));
const L = logins.logins;

async function call(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let j = null;
  try {
    j = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, data: j && typeof j === 'object' && 'data' in j ? j.data : j };
}
const login = async (email, password) => {
  const r = await call('POST', '/auth/login', null, { email, password });
  if (r.status !== 200) throw new Error(`login ${email}: ${r.status}`);
  return r.data.accessToken;
};

const T = {
  anon: null,
  superAdmin: await login(L.superAdmin.email, L.superAdmin.password),
  spdcAdmin: await login(L.clinicAdmin.email, L.clinicAdmin.password),
  spdcDoctor: await login(L.doctor.email, L.doctor.password),
  patientA: await login(L.patient.email, L.patient.password),
  patientB: await login(L.patient2.email, L.patient2.password),
  // Core migration V9 seeds another clinic with these local-only accounts.
  otherAdmin: await login('admin@demohealth.com', 'Clinic@123'),
  otherDoctor: await login('dr.sharma@demohealth.com', 'Clinic@123'),
};
const ROLES = Object.keys(T);
const list = (d) => (Array.isArray(d) ? d : d?.content ?? []);

const spdc = logins.clinicId;
const allClinics = list((await call('GET', '/clinics', T.superAdmin)).data);
const other = allClinics.find((c) => c.name === 'Demo Health Clinic').id;
const patientA = (await call('GET', '/patients/me', T.patientA)).data.id;
const apptA = list((await call('GET', '/appointments/my', T.patientA)).data)[0].id;
const planA = list((await call('GET', '/treatment-plans/my', T.patientA)).data)[0]?.id;

// [method, path, allowed roles | 'deny', denied roles (for writes / observe), body, kind]
const ROWS = [
  ['GET', '/analytics/platform', ['superAdmin']],
  ['GET', '/kyc/admin/pending', ['superAdmin']],
  ['GET', '/analytics/clinic', ['spdcAdmin', 'otherAdmin']],
  ['GET', `/appointments/clinic/${spdc}`, ['superAdmin', 'spdcAdmin']],
  ['GET', `/invoices/clinic/${spdc}`, ['superAdmin', 'spdcAdmin']],
  ['GET', `/appointments/queue/clinic/${spdc}`, ['superAdmin', 'spdcAdmin']],
  ['GET', `/clinics/${spdc}/notification-settings`, ['superAdmin', 'spdcAdmin']],
  ['GET', '/appointments/queue/my-clinic', ['spdcAdmin', 'otherAdmin']],
  ['GET', '/appointments/doctor/my', ['spdcDoctor', 'otherDoctor']],
  ['GET', '/prescriptions/written', ['spdcDoctor', 'otherDoctor']],
  ['GET', '/doctors/me', ['spdcDoctor', 'otherDoctor']],
  ['GET', '/appointments/my', ['patientA', 'patientB']],
  ['GET', '/invoices/my', ['patientA', 'patientB']],
  ['GET', '/prescriptions/my', ['patientA', 'patientB']],
  ['GET', '/treatment-plans/my', ['patientA', 'patientB']],
  ['GET', '/patients/me', ['patientA', 'patientB']],
  // Patient A's own records: the other patient and the other clinic must not read them.
  ['GET', `/appointments/${apptA}/history`, 'observe', ['anon', 'patientB', 'otherAdmin', 'otherDoctor'], undefined, 'owner', ['patientA', 'superAdmin']],
  ['GET', `/patients/${patientA}`, 'observe', ['anon', 'patientB', 'otherAdmin', 'otherDoctor'], undefined, 'owner', ['superAdmin', 'spdcDoctor']],
  ['GET', `/appointments/patient/${patientA}`, 'observe', ['anon', 'patientB', 'otherAdmin', 'otherDoctor'], undefined, 'owner', ['superAdmin', 'spdcAdmin']],
  ...(planA ? [['GET', `/treatment-plans/${planA}`, 'observe', ['anon', 'patientB', 'otherAdmin', 'otherDoctor'], undefined, 'owner', ['patientA', 'spdcDoctor']]] : []),
  // Writes: denials only (no side effects).
  ['PATCH', `/clinics/${spdc}/plan`, 'deny', ['anon', 'spdcAdmin', 'spdcDoctor', 'patientA', 'otherAdmin'], { plan: 'STARTER' }],
  ['PATCH', `/clinics/${spdc}/features`, 'deny', ['anon', 'spdcAdmin', 'spdcDoctor', 'patientA', 'otherAdmin'], { overrides: { dental_suite: false } }],
  ['PUT', `/clinics/${spdc}`, 'deny', ['anon', 'spdcDoctor', 'patientA', 'otherAdmin'], { name: 'Hijacked' }],
  ['POST', '/prescriptions', 'deny', ['anon', 'spdcAdmin', 'patientA', 'otherAdmin'], { appointmentId: apptA, state: 'DRAFT' }],
  ['POST', '/treatment-plans', 'deny', ['anon', 'spdcAdmin', 'patientA', 'otherAdmin'], { patientId: patientA, appointmentId: apptA, title: 'RBAC probe', items: [{ procedureName: 'Probe', sittingsPlanned: 1, estimatedCostPaise: 100 }] }],
  ['POST', `/clinics/${spdc}/doctors/${logins.doctorId}/schedules`, 'deny', ['anon', 'spdcDoctor', 'patientA', 'otherAdmin'], { branchId: logins.branchId, dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }],
  ['PATCH', `/clinics/${spdc}/notification-settings`, 'deny', ['anon', 'spdcDoctor', 'patientA', 'otherAdmin'], {}],
  ['POST', `/invoices/appointment/${apptA}`, 'deny', ['anon', 'patientA', 'patientB', 'otherAdmin', 'otherDoctor'], { lineItems: [{ description: 'RBAC probe', amountPaise: 100 }] }],
  ['POST', `/clinics/${spdc}/admins`, 'deny', ['anon', 'spdcDoctor', 'patientA', 'otherAdmin'], { email: 'x@spdc.test', password: 'Xx@12345678', firstName: 'x', lastName: 'y', adminRole: 'CLINIC_ADMIN' }],
];

const results = [];
let fail = 0;
const ok2xx = (s) => s >= 200 && s < 300;
for (const [method, path, allowed, denied = [], body, kind, mustAllow = []] of ROWS) {
  if (allowed === 'deny' || allowed === 'observe') {
    for (const r of denied) {
      const { status } = await call(method, path, T[r], body);
      const pass = allowed === 'deny' ? [401, 403].includes(status) : [401, 403, 404].includes(status);
      if (!pass && allowed === 'deny') fail++;
      results.push({ method, path, role: r, expect: allowed === 'deny' ? '401/403' : 'denied (401/403/404)', status, result: pass ? 'PASS' : allowed === 'deny' ? 'FAIL' : 'OBSERVE' });
    }
    for (const r of mustAllow) {
      const { status } = await call(method, path, T[r], body);
      if (!ok2xx(status)) fail++;
      results.push({ method, path, role: r, expect: '2xx (owner / clinic staff)', status, result: ok2xx(status) ? 'PASS' : 'FAIL' });
    }
    continue;
  }
  for (const r of ROLES) {
    const { status } = await call(method, path, T[r], body);
    const want = allowed.includes(r);
    const pass = want ? ok2xx(status) : [401, 403, 404].includes(status);
    if (!pass) fail++;
    results.push({ method, path, role: r, expect: want ? '2xx' : '401/403/404', status, result: pass ? 'PASS' : 'FAIL' });
  }
}

// Tenant isolation of list endpoints.
const iso = async (name, cond) => {
  const pass = await cond();
  if (!pass) fail++;
  results.push({ method: 'GET', path: name, role: '-', expect: 'isolated', status: '-', result: pass ? 'PASS' : 'FAIL' });
};
await iso('SPDC admin /clinics lists only SPDC', async () => list((await call('GET', '/clinics', T.spdcAdmin)).data).every((c) => c.id === spdc));
await iso('other clinic admin /clinics never lists SPDC', async () => !list((await call('GET', '/clinics', T.otherAdmin)).data).some((c) => c.id === spdc));
await iso('other clinic admin /patients never lists SPDC patients', async () => !JSON.stringify((await call('GET', '/patients', T.otherAdmin)).data ?? '').includes(patientA));
await iso('SPDC admin /patients includes its own patient', async () => JSON.stringify((await call('GET', '/patients', T.spdcAdmin)).data ?? '').includes(patientA));

fs.writeFileSync(`${out}/rbac-results.json`, JSON.stringify(results, null, 2));
const by = (x) => results.filter((r) => r.result === x).length;
for (const r of results.filter((x) => x.result !== 'PASS')) console.log(`${r.result.padEnd(8)} ${r.method} ${r.path} as ${r.role} → ${r.status} (expected ${r.expect})`);
console.log(`\nRBAC: ${by('PASS')} pass, ${by('FAIL')} fail, ${by('OBSERVE')} observe (${results.length} checks, ${ROWS.length} endpoints, ${ROLES.length} roles)`);
process.exitCode = fail ? 1 : 0;
