"use client";

import { useEffect, useState } from "react";
import { Baby, Lock, LogOut, Mic, User } from "lucide-react";

type Submission = {
  _id: string;
  abeName: string;
  hq: string;
  empId: string;
  zone: string;
  zoneManager: string;
  doctorName: string;
  doctorUniqueId: string;
  doctorMobile: string;
  doctorEmail: string;
  city: string;
  cityType: string;
  practiceType: string;
  yearsExperience: number;
  monthlyPcvPotential: number;
  competitorBrands: string;
  reelDuration: string;
  reelDoctorName: string;
  reelDoctorDegree: string;
  topicName: string;
  script: string;
  photoUrl: string;
  voiceUrl: string;
  voiceSeconds: number;
  consent: boolean;
  submittedAt: string;
};

export default function AdminPage() {
  const [checking, setChecking]       = useState(true);
  const [authed, setAuthed]           = useState(false);
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [loginError, setLoginError]   = useState("");
  const [loggingIn, setLoggingIn]     = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadError, setLoadError]     = useState("");
  const [loading, setLoading]         = useState(false);

  const loadSubmissions = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/submissions");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setAuthed(true);
        setSubmissions(json.submissions);
      } else {
        setLoadError(json.error || "Failed to load submissions.");
      }
    } catch {
      setLoadError("Network error while loading submissions.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleLogin = async () => {
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json.success) {
        setAuthed(true);
        setPassword("");
        await loadSubmissions();
      } else {
        setLoginError(json.error || "Invalid credentials.");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setSubmissions([]);
    setUsername("");
  };

  if (checking) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-white">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-white px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-teal-900/5 ring-1 ring-zinc-100">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-center text-lg font-semibold text-zinc-900">Admin Login</h1>
          <p className="mt-1 text-center text-sm text-zinc-500">Sign in to view PneuMO Guide submissions.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Username</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {loginError && <p className="text-sm text-red-600">{loginError}</p>}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:opacity-90 disabled:opacity-50"
            >
              {loggingIn ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-to-br from-teal-50 via-sky-50 to-white px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 px-6 py-5 text-white shadow-lg shadow-teal-900/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Baby className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">PneuMO Guide Submissions</h1>
              <p className="text-xs text-teal-50/85">{submissions.length} submission(s)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/25"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-zinc-500">Loading submissions…</p>}
        {loadError && <p className="mt-6 text-sm text-red-600">{loadError}</p>}

        {!loading && !loadError && submissions.length === 0 && (
          <p className="mt-6 text-sm text-zinc-500">No submissions yet.</p>
        )}

        <div className="mt-6 space-y-4">
          {submissions.map((s) => (
            <div key={s._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photoUrl}
                    alt={s.doctorName}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-100"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white ring-2 ring-white">
                    <User className="h-3 w-3" />
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                  <Info label="Doctor (BESMARTR)" value={s.doctorName} />
                  <Info label="Doctor Unique ID" value={s.doctorUniqueId} />
                  <Info label="Mobile" value={s.doctorMobile} />
                  <Info label="Email" value={s.doctorEmail} />
                  <Info label="ABE Name" value={s.abeName} />
                  <Info label="HQ" value={s.hq} />
                  <Info label="Employee ID" value={s.empId} />
                  <Info label="Zone" value={`${s.zone} (${s.zoneManager})`} />
                  <Info label="City" value={`${s.city} (${s.cityType})`} />
                  <Info label="Type of Practice" value={s.practiceType} />
                  <Info label="Years of Experience" value={String(s.yearsExperience)} />
                  <Info label="Monthly PCV Potential" value={String(s.monthlyPcvPotential)} />
                  <Info label="Competitor Brands" value={s.competitorBrands || "—"} />
                  <Info label="Reel Duration" value={`${s.reelDuration} sec.`} />
                  <Info label="Reel Doctor Name" value={s.reelDoctorName} />
                  <Info label="Reel Doctor Degree" value={s.reelDoctorDegree} />
                  <Info label="Topic Name" value={s.topicName} />
                  <Info
                    label="Consent"
                    value={s.consent ? "Yes" : "No"}
                    valueClassName={s.consent ? "text-teal-600" : "text-red-600"}
                  />
                  <Info label="Submitted" value={new Date(s.submittedAt).toLocaleString()} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2">
                <Mic className="h-4 w-4 flex-shrink-0 text-teal-500" />
                <span className="text-xs font-medium text-zinc-500">
                  Voice ({s.voiceSeconds}s)
                </span>
                <audio controls src={s.voiceUrl} className="h-9 flex-1" />
              </div>

              {s.script && (
                <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2">
                  <div className="text-xs text-zinc-400">Script</div>
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{s.script}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Info({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`text-zinc-800 ${valueClassName ?? ""}`}>{value}</div>
    </div>
  );
}
