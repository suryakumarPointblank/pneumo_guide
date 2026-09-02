"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import * as XLSX from "xlsx";

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

export default function ZoneQaPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zone, setZone] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/zone/${token}/submissions`);
        const json = await res.json();
        if (json.success) {
          setZone(json.zone);
          setSubmissions(json.submissions);
        } else {
          setError(json.error || "Invalid or expired link.");
        }
      } catch {
        setError("Network error while loading submissions.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleExport = () => {
    const rows = submissions.map((s) =>
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
    const zoneSlug = zone.toLowerCase().replace(/\s+/g, "-") || "zone";
    XLSX.writeFile(workbook, `pneumo-guide-${zoneSlug}-submissions-${date}.xlsx`);
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-white">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-white px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl shadow-teal-900/5 ring-1 ring-zinc-100">
          <h1 className="text-lg font-semibold text-zinc-900">Link not valid</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
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
              <h1 className="text-lg font-semibold">{zone} — PneuMO Guide Submissions</h1>
              <p className="text-xs text-teal-50/85">{submissions.length} submission(s)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={submissions.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/25 hover:bg-white/25 disabled:opacity-50"
          >
            Export to Excel
          </button>
        </div>

        {submissions.length === 0 && (
          <p className="mt-6 text-sm text-zinc-500">No submissions yet for this zone.</p>
        )}

        {submissions.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Submitted</Th>
                  <Th>Doctor</Th>
                  <Th>Doctor Unique ID</Th>
                  <Th>City</Th>
                  <Th>Topic</Th>
                  <Th>Content</Th>
                  <Th>Consent</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {submissions.map((s) => (
                  <Fragment key={s._id}>
                    <tr className="hover:bg-zinc-50">
                      <Td>{new Date(s.submittedAt).toLocaleString()}</Td>
                      <Td>{s.doctorName}</Td>
                      <Td>{s.doctorUniqueId}</Td>
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
                        <td colSpan={8} className="bg-zinc-50 px-4 py-4">
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
