# Local ClinicFlow stack (e2e and QA only)

SPDC has no copy of ClinicFlow. Every role (super admin, clinic admin, doctor, patient) runs on **ClinicFlow core**, branded for SPDC through the Enterprise theme tokens in `tenant/sri-parvathi.json`. To test the website's booking and the branded portal end to end without touching staging, the scripts in `scripts/local-stack/` start a private, throwaway copy of core on this machine.

Everything lives in `.local-stack/`, which is gitignored and safe to delete at any time.

- **Read-only towards `D:\ClinicFlow`.** `setup.sh` exports the committed `HEAD` with `git archive`. It never builds in, writes to, or checks out the ClinicFlow working tree. The exported commits are recorded in `.local-stack/CORE_VERSIONS.txt`.
- **Local only.** `seed.mjs`, `scripts/qa/rbac-api.mjs` and `scripts/qa/e2e-booking.mjs` refuse any API that isn't `localhost`.
- **No messages leave the machine.** Email is off, and SMS and WhatsApp stay in core's dry-run, so the OTP is always `123456`.

## Requirements

Git Bash, Java 21, Node 20+, Python 3, PostgreSQL 18 binaries (`PG_BIN`, default `C:\Program Files\PostgreSQL\18\bin`) and Chrome (for the QA scripts).

## Ports

| Port | What |
| --- | --- |
| 55433 | Throwaway Postgres (`.local-stack/pgdata`, trust auth, localhost only). DR-SINDHU's stack uses 55432, so the two can run side by side. |
| 8089 | ClinicFlow API (`/api/v1`) |
| 3301 | ClinicFlow portal, built from core. **http://spdc.localhost:3301** is the white-label host and shows SPDC branding. |
| 3300 | This website (`next dev`, or the production build with `--prod`) |

## Commands

```bash
bash scripts/local-stack/setup.sh       # once, or to refresh core: export HEAD, init Postgres, build the API jar + portal
bash scripts/local-stack/start.sh       # Postgres + API + portal + site (add --prod for the site's production build)
node scripts/local-stack/seed.mjs       # idempotent onboarding + demo data for every role
bash scripts/local-stack/stop.sh        # stops :3300, :3301, :8089 and the throwaway Postgres
```

`start.sh` generates a new random JWT secret each time, so after a restart everyone simply signs in again. The site reads `.env.local`, which points it at `localhost:8089` and the slug `sri-parvathi-dental-clinic`.

## What `seed.mjs` does (through the real API, as the UI would)

1. Runs core's tenant importer with `tenant/sri-parvathi.json`, which creates the clinic, owner, branch, doctor and theme tokens.
2. Signs in as **super admin**, sets the clinic **ACTIVE** (new clinics start PENDING), maps the white-label host `spdc.localhost`, and switches on the dental suite.
3. Signs in as **clinic admin** and sets Dr. Ramakanth's slot length (20 min) and weekly schedule from `content/clinic.json` hours.
4. Registers two test **patients** and books and completes sample visits, so the doctor and patient dashboards have data.
5. Writes `.local-stack/test-logins.json` (local test logins, `.test` emails, never valid anywhere else) and `.local-stack/seed-report.json`.

Re-running it is safe: existing records are detected and skipped.

## Tests that use the stack

```bash
node scripts/qa/e2e-booking.mjs http://localhost:3300 qa/e2e   # website booking: popup, live booking + OTP, fallbacks
node scripts/qa/rbac-api.mjs http://localhost:8089/api/v1 qa/rbac   # role/tenant access matrix (8 roles, incl. another clinic)
```

Results land in `qa/` (gitignored). The latest summary is in `docs/E2E_2026-10-20.md`.

## Known core quirks (reported, not patched here)

- `next build` of core `HEAD` fails on lint errors, so `setup.sh` builds the portal with `--no-lint`.
- New clinics start PENDING, and the importer doesn't activate them.
- Core requires a surname, so the doctor is stored as "Ramakanth MDS". The site shows its own display name.
