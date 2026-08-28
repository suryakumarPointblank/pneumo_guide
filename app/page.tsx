"use client";

import { useMemo, useRef, useState, ChangeEvent } from "react";
import {
  Baby,
  MapPin,
  Stethoscope,
  Clapperboard,
  Camera,
  Mic,
  Square,
  CheckCircle2,
  ShieldCheck,
  Quote,
  Upload,
} from "lucide-react";
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
  const [topicName, setTopicName]       = useState("");

  const [voiceScript, setVoiceScript]   = useState(VOICE_SCRIPT_TEMPLATE);

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

  const minVoiceSeconds = DEFAULT_MIN_VOICE_SECONDS;

  const progress = useMemo(() => {
    const requiredValues = [
      abeName, hq, empId, zone,
      doctorName, doctorUniqueId, doctorMobile, doctorEmail,
      city, cityType, practiceType, yearsExperience, monthlyPcvPotential,
      reelDuration, reelDoctorName, reelDoctorDegree, topicName,
      photoFile ? "1" : "", voiceBlob ? "1" : "", consent ? "1" : "",
    ];
    const filled = requiredValues.filter((v) => String(v).trim().length > 0).length;
    return Math.round((filled / requiredValues.length) * 100);
  }, [
    abeName, hq, empId, zone, doctorName, doctorUniqueId, doctorMobile, doctorEmail,
    city, cityType, practiceType, yearsExperience, monthlyPcvPotential,
    reelDuration, reelDoctorName, reelDoctorDegree, topicName, photoFile, voiceBlob, consent,
  ]);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleMobileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setDoctorMobile(digits);
  };

  const handleVoiceUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setApiError("");
    setVoiceBlob(file);
    setVoiceUrl(URL.createObjectURL(file));

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      setVoiceSeconds(Math.round(audio.duration));
    };
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
    if (!topicName.trim())    e.topicName = "Topic name is required";

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
      form.append("topicName", topicName);
      form.append("script", voiceScript);

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
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-white px-4">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-xl shadow-teal-900/5 ring-1 ring-zinc-100">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Submission received</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Doctor details, photo, and voice recording have been uploaded successfully for the
            PneuMO Guide AI reel.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-to-br from-teal-50 via-sky-50 to-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Hero */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-sky-600 px-6 py-8 text-white shadow-lg shadow-teal-900/10 sm:px-10 sm:py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Baby className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">PneuMO Guide</h1>
              <p className="mt-0.5 text-sm text-teal-50/85">
                A new mother guide for baby&apos;s healthy start
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-zinc-100 backdrop-blur">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-zinc-500">{progress}% complete</span>
        </div>

        {/* ABE Details */}
        <Section icon={MapPin} title="ABE Details" subtitle="Who is submitting this onboarding request">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </Section>

        {/* Doctor Details */}
        <Section icon={Stethoscope} title="Doctor Details" subtitle="As per BESMARTR">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Doctor's name" error={errors.doctorName}>
              <input className={inputCls(errors.doctorName)} value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
            </Field>

            <Field label="Doctor's unique ID" error={errors.doctorUniqueId}>
              <input className={inputCls(errors.doctorUniqueId)} value={doctorUniqueId} onChange={(e) => setDoctorUniqueId(e.target.value)} />
            </Field>

            <Field label="Doctor's mobile number" error={errors.doctorMobile}>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={inputCls(errors.doctorMobile)}
                value={doctorMobile}
                onChange={handleMobileChange}
              />
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
        </Section>

        {/* AI Reel Details */}
        <Section icon={Clapperboard} title="AI Reel Details" subtitle="How the doctor will appear in the reel">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <Field label="Topic name" error={errors.topicName}>
              <input className={inputCls(errors.topicName)} value={topicName} onChange={(e) => setTopicName(e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Photo & Voice */}
        <Section icon={Camera} title="Photo & Voice" subtitle="Media used to generate the AI reel">
          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-zinc-700">Doctor&apos;s high resolution photo</label>
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-zinc-200">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Doctor preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-zinc-400" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePhoto}
                className="block text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-teal-600 file:to-sky-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90" />
            </div>
            {errors.photo && <p className="mt-1 text-xs text-red-600">{errors.photo}</p>}
          </div>

          {/* Voice */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-zinc-700">
              Doctor&apos;s voice for reel <span className="text-zinc-400">(minimum {minVoiceSeconds}s)</span>
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              Please read the script below aloud while recording.
            </p>

            <div className="mt-2 flex gap-2 rounded-xl border border-teal-100 bg-teal-50/60 p-3">
              <Quote className="h-4 w-4 flex-shrink-0 text-teal-500" />
              <div className="flex-1">
                <textarea
                  rows={6}
                  className="w-full resize-y rounded-lg border border-teal-100 bg-white p-2 text-sm leading-6 text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  value={voiceScript}
                  onChange={(e) => setVoiceScript(e.target.value)}
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">You can edit or paste your own script above.</p>
                  {voiceScript !== VOICE_SCRIPT_TEMPLATE && (
                    <button
                      type="button"
                      onClick={() => setVoiceScript(VOICE_SCRIPT_TEMPLATE)}
                      className="text-xs font-medium text-teal-600 hover:underline"
                    >
                      Reset to default script
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!recording ? (
                <button type="button" onClick={startRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">
                  <Mic className="h-4 w-4" />
                  {voiceBlob ? "Re-record" : "Start recording"}
                </button>
              ) : (
                <button type="button" onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700">
                  <Square className="h-4 w-4" />
                  Stop ({voiceSeconds}s)
                </button>
              )}

              {!recording && (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm hover:bg-teal-50">
                  <Upload className="h-4 w-4" />
                  Upload recording
                  <input type="file" accept="audio/*" onChange={handleVoiceUpload} className="hidden" />
                </label>
              )}

              {recording && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Recording…
                </span>
              )}

              {!recording && voiceUrl && (
                <audio controls src={voiceUrl} className="h-9" />
              )}

              {!recording && voiceBlob && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${voiceSeconds >= minVoiceSeconds ? "text-teal-600" : "text-red-600"}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {voiceSeconds}s recorded
                </span>
              )}
            </div>
            {errors.voice && <p className="mt-1 text-xs text-red-600">{errors.voice}</p>}
          </div>
        </Section>

        {/* Consent */}
        <Section icon={ShieldCheck} title="Consent">
          <label className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-teal-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I consent to my photo &amp; audio being used to develop the PneuMO Guide AI reel content
          </label>
          {errors.consent && <p className="mt-1 text-xs text-red-600">{errors.consent}</p>}

          {apiError && <p className="mt-4 text-sm text-red-600">{apiError}</p>}

          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:opacity-90 disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </Section>
      </div>
    </main>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
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
  return `w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 transition focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 ${
    error ? "border-red-400" : "border-zinc-200"
  }`;
}
