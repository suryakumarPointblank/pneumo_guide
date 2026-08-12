"use client";

import { useRef, useState, ChangeEvent } from "react";
import {
  ZONES,
  ZONE_MANAGERS,
  CITY_TYPES,
  PRACTICE_TYPES,
  REEL_DURATIONS,
  VOICE_SCRIPT_TEMPLATE,
} from "@/lib/constants";

const DEFAULT_MIN_VOICE_SECONDS = 30;

export default function Home() {
  const [abeName, setAbeName]           = useState("");
  const [hq, setHq]                     = useState("");
  const [empId, setEmpId]               = useState("");
  const [zone, setZone]                 = useState("");

  const [doctorName, setDoctorName]     = useState("");
  const [doctorUniqueId, setDoctorUniqueId] = useState("");
  const [doctorMobile, setDoctorMobile] = useState("");
  const [doctorEmail, setDoctorEmail]   = useState("");

  const [city, setCity]                 = useState("");
  const [cityType, setCityType]         = useState("");
  const [practiceType, setPracticeType] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [monthlyPcvPotential, setMonthlyPcvPotential] = useState("");
  const [competitorBrands, setCompetitorBrands] = useState("");

  const [reelDuration, setReelDuration] = useState("");
  const [reelDoctorName, setReelDoctorName]     = useState("");
  const [reelDoctorDegree, setReelDoctorDegree] = useState("");

  const [consent, setConsent]           = useState(false);

  const [photoFile, setPhotoFile]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [recording, setRecording]       = useState(false);
  const [voiceBlob, setVoiceBlob]       = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl]         = useState<string>("");
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [apiError, setApiError]         = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  const minVoiceSeconds = reelDuration ? Number(reelDuration) : DEFAULT_MIN_VOICE_SECONDS;

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    setApiError("");
    setVoiceBlob(null);
    setVoiceUrl("");
    setVoiceSeconds(0);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setVoiceBlob(blob);
      setVoiceUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setRecording(true);

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setVoiceSeconds(elapsed);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!abeName.trim())       e.abeName = "ABE name is required";
    if (!hq.trim())            e.hq = "HQ is required";
    if (!empId.trim())         e.empId = "Employee ID is required";
    if (!zone)                 e.zone = "Zone is required";

    if (!doctorName.trim())    e.doctorName = "Doctor's name is required";
    if (!doctorUniqueId.trim()) e.doctorUniqueId = "Doctor's unique ID is required";
    if (!/^[0-9]{10}$/.test(doctorMobile.trim()))
      e.doctorMobile = "Enter a valid 10-digit mobile number";
    if (!/^\S+@\S+\.\S+$/.test(doctorEmail.trim()))
      e.doctorEmail = "Enter a valid email address";

    if (!city.trim())          e.city = "City is required";
    if (!cityType)             e.cityType = "Select metro or non-metro";
    if (!practiceType)         e.practiceType = "Type of practice is required";
    if (!yearsExperience || Number(yearsExperience) < 0)
      e.yearsExperience = "Years of experience is required";
    if (!monthlyPcvPotential || Number(monthlyPcvPotential) < 0)
      e.monthlyPcvPotential = "Monthly PCV potential is required";

    if (!reelDuration)         e.reelDuration = "AI reel duration is required";
    if (!reelDoctorName.trim()) e.reelDoctorName = "Doctor's name for the reel is required";
    if (!reelDoctorDegree.trim()) e.reelDoctorDegree = "Doctor's degree for the reel is required";

    if (!photoFile)            e.photo = "Doctor's high resolution photo is required";
    if (!voiceBlob)            e.voice = "Doctor's voice recording is required";
    else if (voiceSeconds < minVoiceSeconds)
      e.voice = `Recording must be at least ${minVoiceSeconds} seconds`;
    if (!consent)              e.consent = "Doctor's consent is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");

    try {
      const form = new FormData();
      form.append("abeName", abeName);
      form.append("hq", hq);
      form.append("empId", empId);
      form.append("zone", zone);
      form.append("zoneManager", ZONE_MANAGERS[zone] ?? "");

      form.append("doctorName", doctorName);
      form.append("doctorUniqueId", doctorUniqueId);
      form.append("doctorMobile", doctorMobile);
      form.append("doctorEmail", doctorEmail);

      form.append("city", city);
      form.append("cityType", cityType);
      form.append("practiceType", practiceType);
      form.append("yearsExperience", yearsExperience);
      form.append("monthlyPcvPotential", monthlyPcvPotential);
      form.append("competitorBrands", competitorBrands);

      form.append("reelDuration", reelDuration);
      form.append("reelDoctorName", reelDoctorName);
      form.append("reelDoctorDegree", reelDoctorDegree);

      form.append("consent", consent ? "true" : "false");
      form.append("voiceSeconds", String(voiceSeconds));
      form.append("photo", photoFile as File);
      form.append("voice", voiceBlob as Blob, "voice.webm");

      const res  = await fetch("/api/submit", { method: "POST", body: form });
      const json = await res.json();

      if (json.success) {
        setSubmitted(true);
      } else {
        setApiError(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Submission received</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Doctor details, photo, and voice recording have been uploaded successfully for the PneuMO Guide AI reel.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-900">
          PneuMO Guide – A new mother guide for baby&apos;s healthy start
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fill in the details below to onboard a doctor for the PneuMO Guide AI reel.
        </p>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-400">ABE Details</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ABE Name" error={errors.abeName}>
            <input className={inputCls(errors.abeName)} value={abeName} onChange={(e) => setAbeName(e.target.value)} />
          </Field>

          <Field label="HQ" error={errors.hq}>
            <input className={inputCls(errors.hq)} value={hq} onChange={(e) => setHq(e.target.value)} />
          </Field>

          <Field label="Employee ID" error={errors.empId}>
            <input className={inputCls(errors.empId)} value={empId} onChange={(e) => setEmpId(e.target.value)} />
          </Field>

          <Field label="Zone" error={errors.zone}>
            <select className={inputCls(errors.zone)} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Select zone</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z} ({ZONE_MANAGERS[z]})</option>
              ))}
            </select>
          </Field>
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-400">Doctor Details (as per BESMARTR)</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Doctor's name" error={errors.doctorName}>
            <input className={inputCls(errors.doctorName)} value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </Field>

          <Field label="Doctor's unique ID" error={errors.doctorUniqueId}>
            <input className={inputCls(errors.doctorUniqueId)} value={doctorUniqueId} onChange={(e) => setDoctorUniqueId(e.target.value)} />
          </Field>

          <Field label="Doctor's mobile number" error={errors.doctorMobile}>
            <input className={inputCls(errors.doctorMobile)} value={doctorMobile} onChange={(e) => setDoctorMobile(e.target.value)} />
          </Field>

          <Field label="Doctor's email ID" error={errors.doctorEmail}>
            <input type="email" className={inputCls(errors.doctorEmail)} value={doctorEmail} onChange={(e) => setDoctorEmail(e.target.value)} />
          </Field>

          <Field label="City" error={errors.city}>
            <input className={inputCls(errors.city)} value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>

          <Field label="Metro / Non-metro" error={errors.cityType}>
            <select className={inputCls(errors.cityType)} value={cityType} onChange={(e) => setCityType(e.target.value)}>
              <option value="">Select type</option>
              {CITY_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Type of practice" error={errors.practiceType}>
            <select className={inputCls(errors.practiceType)} value={practiceType} onChange={(e) => setPracticeType(e.target.value)}>
              <option value="">Select type of practice</option>
              {PRACTICE_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="Years of experience" error={errors.yearsExperience}>
            <input type="number" min={0} className={inputCls(errors.yearsExperience)} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />
          </Field>

          <Field label="Total monthly PCV potential (in units)" error={errors.monthlyPcvPotential}>
            <input type="number" min={0} className={inputCls(errors.monthlyPcvPotential)} value={monthlyPcvPotential} onChange={(e) => setMonthlyPcvPotential(e.target.value)} />
          </Field>

          <Field label="Competitor brand(s) currently used">
            <input className={inputCls()} value={competitorBrands} onChange={(e) => setCompetitorBrands(e.target.value)} />
          </Field>
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-400">AI Reel Details</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="AI Reel duration" error={errors.reelDuration}>
            <select className={inputCls(errors.reelDuration)} value={reelDuration} onChange={(e) => setReelDuration(e.target.value)}>
              <option value="">Select duration</option>
              {REEL_DURATIONS.map((d) => <option key={d} value={d}>{d} sec.</option>)}
            </select>
          </Field>

          <Field label="Doctor's name to mention on AI reel" error={errors.reelDoctorName}>
            <input className={inputCls(errors.reelDoctorName)} value={reelDoctorName} onChange={(e) => setReelDoctorName(e.target.value)} />
          </Field>

          <Field label="Doctor's degree to mention on AI reel" error={errors.reelDoctorDegree}>
            <input className={inputCls(errors.reelDoctorDegree)} value={reelDoctorDegree} onChange={(e) => setReelDoctorDegree(e.target.value)} />
          </Field>
        </div>

        {/* Photo */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-zinc-700">Doctor&apos;s high resolution photo</label>
          <div className="mt-2 flex items-center gap-4">
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Doctor preview" className="h-16 w-16 rounded-full object-cover" />
            )}
            <input type="file" accept="image/*" onChange={handlePhoto}
              className="block text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-700" />
          </div>
          {errors.photo && <p className="mt-1 text-xs text-red-600">{errors.photo}</p>}
        </div>

        {/* Voice */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-zinc-700">
            Doctor&apos;s voice for reel (minimum {minVoiceSeconds} seconds)
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            {reelDuration
              ? `Matches the selected ${reelDuration} sec. reel duration. Please read the script below aloud while recording.`
              : "Select an AI reel duration above, then read the script below aloud while recording."}
          </p>
          <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 whitespace-pre-line">
            {VOICE_SCRIPT_TEMPLATE}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {!recording ? (
              <button type="button" onClick={startRecording}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
                {voiceBlob ? "Re-record" : "Start recording"}
              </button>
            ) : (
              <button type="button" onClick={stopRecording}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Stop ({voiceSeconds}s)
              </button>
            )}

            {!recording && voiceUrl && (
              <audio controls src={voiceUrl} className="h-9" />
            )}

            {!recording && voiceBlob && (
              <span className={`text-xs ${voiceSeconds >= minVoiceSeconds ? "text-green-600" : "text-red-600"}`}>
                {voiceSeconds}s recorded
              </span>
            )}
          </div>
          {errors.voice && <p className="mt-1 text-xs text-red-600">{errors.voice}</p>}
        </div>

        {/* Consent */}
        <div className="mt-6">
          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I consent to my photo &amp; audio being used to develop the PneuMO Guide AI reel content
          </label>
          {errors.consent && <p className="mt-1 text-xs text-red-600">{errors.consent}</p>}
        </div>

        {apiError && <p className="mt-4 text-sm text-red-600">{apiError}</p>}

        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-md border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 ${
    error ? "border-red-400" : "border-zinc-300"
  }`;
}
