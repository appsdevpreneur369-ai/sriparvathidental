#!/usr/bin/env python3
"""
Reset a SUPER_ADMIN password on the ClinicFlow STAGING database -- run by the account owner, never by an agent.

  python scripts/staging/reset-superadmin-password.py superadmin@clinicflow.com

- STAGING ONLY: reads the staging datasource from Secret Manager (clinicflow-staging-db-*) with your own gcloud
  login. Connection details stay in memory; nothing is printed or written to disk.
- If the email is not a SUPER_ADMIN on staging, lists the SUPER_ADMIN emails that do exist (emails only) and stops.
- Asks for the new password twice (hidden), stores it as a BCrypt(12) hash -- the same encoder the API uses
  (SecurityConfig) -- updates exactly that one row, then checks the login against the staging API.
"""
import getpass
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request

import bcrypt
import psycopg2

API = "https://clinicflow-api-staging-1071497363324.asia-south1.run.app/api/v1"
SECRETS = {"url": "clinicflow-staging-db-url", "user": "clinicflow-staging-db-user", "password": "clinicflow-staging-db-pass"}


def secret(name):
    assert "staging" in name
    out = subprocess.run(f"gcloud secrets versions access latest --secret={name}", shell=True, capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f"Could not read secret {name}: {out.stderr.strip()[:200]}")
    return out.stdout.strip()


def connect():
    url, user, pw = (secret(SECRETS[k]) for k in ("url", "user", "password"))
    m = re.match(r"jdbc:postgresql://([^:/?]+)(?::(\d+))?/([^?]+)(?:\?(.*))?$", url)
    if not m:
        sys.exit("Unexpected staging datasource URL format.")
    host, port, db, query = m.groups()
    params = dict(p.split("=", 1) for p in (query or "").split("&") if "=" in p)
    return psycopg2.connect(host=host, port=int(port or 5432), dbname=db, user=user, password=pw,
                            sslmode=params.get("sslmode", "require"), connect_timeout=20)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    email = sys.argv[1].strip()
    conn = connect()
    cur = conn.cursor()
    cur.execute("SELECT id, role, is_active FROM app_users WHERE lower(email) = lower(%s)", (email,))
    rows = cur.fetchall()
    if len(rows) != 1 or rows[0][1] != "SUPER_ADMIN":
        cur.execute("SELECT email, is_active FROM app_users WHERE role = 'SUPER_ADMIN' ORDER BY email")
        found = cur.fetchall()
        print(f"{email} is not a SUPER_ADMIN on staging." if rows else f"{email} does not exist on staging.")
        print("SUPER_ADMIN accounts on staging:", ", ".join(f"{e}{'' if a else ' (inactive)'}" for e, a in found) or "none")
        sys.exit(1)
    user_id, _, active = rows[0]
    if not active:
        print("Note: this account is INACTIVE on staging; a new password alone will not let it sign in.")

    pw = getpass.getpass(f"New staging password for {email}: ")
    if len(pw) < 8 or getpass.getpass("Repeat it: ") != pw:
        sys.exit("Passwords did not match or are shorter than 8 characters. Nothing changed.")
    hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12, prefix=b"2a")).decode()
    cur.execute("UPDATE app_users SET password_hash = %s WHERE id = %s", (hashed, user_id))
    if cur.rowcount != 1:
        conn.rollback()
        sys.exit("Update did not touch exactly one row. Rolled back.")
    conn.commit()
    conn.close()
    print("Password updated on staging. Checking the login ...")

    req = urllib.request.Request(API + "/auth/login", method="POST", headers={"Content-Type": "application/json"},
                                 data=json.dumps({"email": email, "password": pw}).encode())
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            role = (json.loads(r.read()).get("data", {}).get("user") or {}).get("role")
            print(f"Login OK (role {role}). Now run: python D:\\SPDC\\scripts\\staging\\setup-staging.py --admin-email {email}")
    except urllib.error.HTTPError as e:
        print(f"Login check returned HTTP {e.code}: {e.read().decode()[:200]}")


if __name__ == "__main__":
    main()
