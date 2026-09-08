import { NextRequest, NextResponse } from "next/server";
import { uploadToGCS } from "@/lib/gcs";
import { getDatabase } from "@/lib/mongodb";
import { ZONES, ZONE_MANAGERS, CITY_TYPES, PRACTICE_TYPES, REEL_DURATIONS } from "@/lib/constants";
import { logInfo, logError } from "@/lib/logger";

const ROUTE = "POST /api/submit";

export const runtime = "nodejs";

const DEFAULT_MIN_VOICE_SECONDS = 30;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const abeName      = (form.get("abeName")      as string | null)?.trim();
    const hq           = (form.get("hq")           as string | null)?.trim();
    const empId        = (form.get("empId")        as string | null)?.trim();
    const zone         = (form.get("zone")         as string | null)?.trim();

    const doctorName       = (form.get("doctorName")       as string | null)?.trim();
    const doctorUniqueId   = (form.get("doctorUniqueId")   as string | null)?.trim();
    const doctorMobile     = (form.get("doctorMobile")     as string | null)?.trim();
    const doctorEmail      = (form.get("doctorEmail")      as string | null)?.trim();

    const city              = (form.get("city")              as string | null)?.trim();
    const cityType          = (form.get("cityType")          as string | null)?.trim();
    const practiceType      = (form.get("practiceType")      as string | null)?.trim();
    const yearsExperience   = Number(form.get("yearsExperience") ?? NaN);
    const monthlyPcvPotential = Number(form.get("monthlyPcvPotential") ?? NaN);
    const competitorBrands  = (form.get("competitorBrands")  as string | null)?.trim() ?? "";

    const reelDuration      = (form.get("reelDuration")      as string | null)?.trim();
    const reelDoctorName    = (form.get("reelDoctorName")    as string | null)?.trim();
    const reelDoctorDegree  = (form.get("reelDoctorDegree")  as string | null)?.trim();
    const topicName         = (form.get("topicName")         as string | null)?.trim();
    const script            = (form.get("script")            as string | null)?.trim() ?? "";

    const consent      = (form.get("consent")      as string | null) === "true";
    const voiceSeconds = Number(form.get("voiceSeconds") ?? 0);

    const photo = form.get("photo") as File | null;
    const voice = form.get("voice") as File | null;

    if (
      !abeName || !hq || !empId || !zone ||
      !doctorName || !doctorUniqueId || !doctorMobile || !doctorEmail ||
      !city || !cityType || !practiceType ||
      Number.isNaN(yearsExperience) || Number.isNaN(monthlyPcvPotential) ||
      !reelDuration || !reelDoctorName || !reelDoctorDegree || !topicName ||
      !photo || !voice
    ) {
      logError(ROUTE, "Validation failed: missing required fields", null, { empId, doctorUniqueId });
      return NextResponse.json(
        { success: false, error: "All fields including photo and voice recording are required." },
        { status: 400 }
      );
    }

    if (!ZONES.includes(zone)) {
      logError(ROUTE, "Validation failed: invalid zone", null, { empId, zone });
      return NextResponse.json({ success: false, error: "Invalid zone." }, { status: 400 });
    }
    if (!CITY_TYPES.includes(cityType)) {
      logError(ROUTE, "Validation failed: invalid city type", null, { empId, cityType });
      return NextResponse.json({ success: false, error: "Invalid city type." }, { status: 400 });
    }
    if (!PRACTICE_TYPES.includes(practiceType)) {
      logError(ROUTE, "Validation failed: invalid practice type", null, { empId, practiceType });
      return NextResponse.json({ success: false, error: "Invalid type of practice." }, { status: 400 });
    }
    if (!REEL_DURATIONS.includes(reelDuration)) {
      logError(ROUTE, "Validation failed: invalid reel duration", null, { empId, reelDuration });
      return NextResponse.json({ success: false, error: "Invalid AI reel duration." }, { status: 400 });
    }
    if (!/^[0-9]{10}$/.test(doctorMobile)) {
      logError(ROUTE, "Validation failed: invalid doctor mobile", null, { empId, doctorUniqueId });
      return NextResponse.json({ success: false, error: "Invalid doctor's mobile number." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(doctorEmail)) {
      logError(ROUTE, "Validation failed: invalid doctor email", null, { empId, doctorUniqueId });
      return NextResponse.json({ success: false, error: "Invalid doctor's email address." }, { status: 400 });
    }
    if (!consent) {
      logError(ROUTE, "Validation failed: consent not given", null, { empId, doctorUniqueId });
      return NextResponse.json(
        { success: false, error: "Doctor's consent is required." },
        { status: 400 }
      );
    }

    const minVoiceSeconds = DEFAULT_MIN_VOICE_SECONDS;
    if (voiceSeconds < minVoiceSeconds) {
      logError(ROUTE, "Validation failed: voice recording too short", null, { empId, doctorUniqueId, voiceSeconds });
      return NextResponse.json(
        { success: false, error: `Voice recording must be at least ${minVoiceSeconds} seconds.` },
        { status: 400 }
      );
    }

    let photoUrl: string;
    let voiceUrl: string;
    try {
      const photoBuffer = Buffer.from(await photo.arrayBuffer());
      photoUrl = await uploadToGCS(photoBuffer, photo.name, photo.type, "pneumo-guide/photos");

      const voiceBuffer = Buffer.from(await voice.arrayBuffer());
      voiceUrl = await uploadToGCS(voiceBuffer, voice.name, voice.type, "pneumo-guide/voice");
    } catch (err) {
      logError(ROUTE, "GCS upload failed", err, { empId, doctorUniqueId });
      return NextResponse.json(
        { success: false, error: "Failed to upload photo/voice recording. Please try again." },
        { status: 502 }
      );
    }

    try {
      const collectionName = process.env.MONGODB_COLLECTION || "pneumo_guide_submissions";
      const db = await getDatabase();
      await db.collection(collectionName).insertOne({
        abeName,
        hq,
        empId,
        zone,
        zoneManager: ZONE_MANAGERS[zone] ?? "",
        doctorName,
        doctorUniqueId,
        doctorMobile,
        doctorEmail,
        city,
        cityType,
        practiceType,
        yearsExperience,
        monthlyPcvPotential,
        competitorBrands,
        reelDuration,
        reelDoctorName,
        reelDoctorDegree,
        topicName,
        script,
        photoUrl,
        voiceUrl,
        voiceSeconds,
        consent,
        submittedAt: new Date(),
      });
    } catch (err) {
      logError(ROUTE, "MongoDB insert failed", err, { empId, doctorUniqueId, photoUrl, voiceUrl });
      return NextResponse.json(
        { success: false, error: "Submission failed. Please try again." },
        { status: 500 }
      );
    }

    logInfo(ROUTE, "Submission succeeded", { empId, doctorUniqueId });
    return NextResponse.json({ success: true, photoUrl, voiceUrl });
  } catch (err) {
    logError(ROUTE, "Unhandled submission error", err);
    return NextResponse.json(
      { success: false, error: "Submission failed. Please try again." },
      { status: 500 }
    );
  }
}
