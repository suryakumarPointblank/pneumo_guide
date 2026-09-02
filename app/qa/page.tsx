"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ClipboardList, Lock, LogOut } from "lucide-react";
import * as XLSX from "xlsx";
import { ZONES } from "@/lib/constants";

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

const EXPORT_COLUMNS: { key: keyof Submission; label: string }[] = [
  { key: "submittedAt", label: "Submitted At" },
  { key: "abeName", label: "ABE Name" },
  { key: "hq", label: "HQ" },
  { key: "empId", label: "Employee ID" },
  { key: "zone", label: "Zone" },
  { key: "zoneManager", label: "Zone Manager" },
  { key: "doctorName", label: "Doctor (BESMARTR)" },
  { key: "doctorUniqueId", label: "Doctor Unique ID" },
  { key: "doctorMobile", label: "Doctor Mobile" },
  { key: "doctorEmail", label: "Doctor Email" },
  { key: "city", label: "City" },
  { key: "cityType", label: "City Type" },
  { key: "practiceType", label: "Practice Type" },
  { key: "yearsExperience", label: "Years of Experience" },
  { key: "monthlyPcvPotential", label: "Monthly PCV Potential" },
  { key: "competitorBrands", label: "Competitor Brands" },
  { key: "reelDuration", label: "Reel Duration" },
  { key: "reelDoctorName", label: "Reel Doctor Name" },
  { key: "reelDoctorDegree", label: "Reel Doctor Degree" },
  { key: "topicName", label: "Topic Name" },
  { key: "script", label: "Script" },
  { key: "voiceSeconds", label: "Voice Seconds" },
  { key: "consent", label: "Consent" },
  { key: "photoUrl", label: "Photo URL" },
  { key: "voiceUrl", label: "Voice URL" },
];

export default function QaPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState("all");

  const filteredSubmissions = useMemo(
    () => (zoneFilter === "all" ? submissions : submissions.filter((s) => s.zone === zoneFilter)),
    [submissions, zoneFilter]
  );

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

  const handleExport = () => {
    const rows = filteredSubmissions.map((s) =>
      Object.fromEntries(
        EXPORT_COLUMNS.map(({ key, label }) => [
          label,
          key === "consent" ? (s.consent ? "Yes" : "No") : s[key],
        ])
      )
    );
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    const date = new Date().toISOString().slice(0, 10);
    const zoneSlug = zoneFilter === "all" ? "all-zones" : zoneFilter.toLowerCase().replace(/\s+/g, "-");
    XLSX.writeFile(workbook, `pneumo-guide-${zoneSlug}-submissions-${date}.xlsx`);
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
          <h1 className="text-center text-lg font-semibold text-zinc-900">QA Login</h1>
          <p className="mt-1 text-center text-sm text-zinc-500">Sign in to review PneuMO Guide submissions.</p>

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
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 px-6 py-5 text-white shadow-lg shadow-teal-900/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">QA — PneuMO Guide Submissions</h1>
              <p className="text-xs text-teal-50/85">{filteredSubmissions.length} submission(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="zone-filter">Filter by zone</label>
            <select
              id="zone-filter"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <option className="text-zinc-900" value="all">All zones</option>
              {ZONES.map((zone) => (
                <option className="text-zinc-900" key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredSubmissions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/25 disabled:opacity-50"
            >
              Export to Excel
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/25"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-zinc-500">Loading submissions…</p>}
        {loadError && <p className="mt-6 text-sm text-red-600">{loadError}</p>}

        {!loading && !loadError && filteredSubmissions.length === 0 && (
          <p className="mt-6 text-sm text-zinc-500">
            {submissions.length === 0 ? "No submissions yet." : "No submissions for this zone."}
          </p>
        )}

        {filteredSubmissions.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Submitted</Th>
                  <Th>Doctor</Th>
                  <Th>Doctor Unique ID</Th>
                  <Th>ABE Name</Th>
                  <Th>Zone</Th>
                  <Th>City</Th>
                  <Th>Topic</Th>
                  <Th>Content</Th>
                  <Th>Consent</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSubmissions.map((s) => (
                  <Fragment key={s._id}>
                    <tr className="hover:bg-zinc-50">
                      <Td>{new Date(s.submittedAt).toLocaleString()}</Td>
                      <Td>{s.doctorName}</Td>
                      <Td>{s.doctorUniqueId}</Td>
                      <Td>{s.abeName}</Td>
                      <Td>{s.zone}</Td>
                      <Td>{s.city}</Td>
                      <Td>{s.topicName}</Td>
                      <Td>
                        <div className="flex gap-3">
                          <a
                            href={s.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 underline underline-offset-2 hover:text-teal-500"
                          >
                            Photo
                          </a>
                          <a
                            href={s.voiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 underline underline-offset-2 hover:text-teal-500"
                          >
                            Voice
                          </a>
                        </div>
                      </Td>
                      <Td>
                        <span className={s.consent ? "text-teal-600" : "text-red-600"}>
                          {s.consent ? "Yes" : "No"}
                        </span>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
                          className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
                        >
                          {expandedId === s._id ? "Hide" : "Details"}
                        </button>
                      </Td>
                    </tr>
                    {expandedId === s._id && (
                      <tr>
                        <td colSpan={10} className="bg-zinc-50 px-4 py-4">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                            <Info label="Mobile" value={s.doctorMobile} />
                            <Info label="Email" value={s.doctorEmail} />
                            <Info label="HQ" value={s.hq} />
                            <Info label="Employee ID" value={s.empId} />
                            <Info label="Zone Manager" value={s.zoneManager} />
                            <Info label="City Type" value={s.cityType} />
                            <Info label="Type of Practice" value={s.practiceType} />
                            <Info label="Years of Experience" value={String(s.yearsExperience)} />
                            <Info label="Monthly PCV Potential" value={String(s.monthlyPcvPotential)} />
                            <Info label="Competitor Brands" value={s.competitorBrands || "—"} />
                            <Info label="Reel Duration" value={`${s.reelDuration} sec.`} />
                            <Info label="Reel Doctor Name" value={s.reelDoctorName} />
                            <Info label="Reel Doctor Degree" value={s.reelDoctorDegree} />
                            <Info label="Voice Duration" value={`${s.voiceSeconds}s`} />
                          </div>
                          {s.script && (
                            <div className="mt-3 rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-100">
                              <div className="text-xs text-zinc-400">Script</div>
                              <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{s.script}</p>
                            </div>
                          )}
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.photoUrl}
                              alt={s.doctorName}
                              className="h-24 w-24 rounded-full object-cover ring-2 ring-teal-100"
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
      {children}
    </th>
  );
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-zinc-800">{children}</td>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-zinc-800">{value}</div>
    </div>
  );
}
