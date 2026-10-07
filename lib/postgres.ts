import { Pool } from "pg";

const TABLE = "pneumo_guide_submissions_backup";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool() {
  if (!global._pgPool) {
    if (!process.env.PG_HOST) throw new Error("PG_HOST is not set in .env.local");
    global._pgPool = new Pool({
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT || 5432),
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DB || "postgres",
      ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
      max: 3,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
    });
  }
  return global._pgPool;
}

let tableReady: Promise<void> | null = null;

function ensureTable() {
  if (!tableReady) {
    tableReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS ${TABLE} (
          id                      BIGSERIAL PRIMARY KEY,
          abe_name                TEXT NOT NULL,
          hq                      TEXT NOT NULL,
          emp_id                  TEXT NOT NULL,
          zone                    TEXT NOT NULL,
          zone_manager            TEXT,
          doctor_name             TEXT NOT NULL,
          doctor_unique_id        TEXT NOT NULL,
          doctor_mobile           TEXT NOT NULL,
          doctor_email            TEXT NOT NULL,
          city                    TEXT NOT NULL,
          city_type               TEXT NOT NULL,
          practice_type           TEXT NOT NULL,
          years_experience        NUMERIC NOT NULL,
          monthly_pcv_potential   NUMERIC NOT NULL,
          competitor_brands       TEXT,
          reel_duration           TEXT NOT NULL,
          reel_doctor_name        TEXT NOT NULL,
          reel_doctor_degree      TEXT NOT NULL,
          reel_doctor_speciality  TEXT NOT NULL,
          topic_name              TEXT NOT NULL,
          script                  TEXT,
          photo_url               TEXT NOT NULL,
          voice_url               TEXT NOT NULL,
          voice_seconds           NUMERIC NOT NULL,
          consent                 BOOLEAN NOT NULL,
          submitted_at            TIMESTAMPTZ NOT NULL,
          mongo_error             TEXT,
          created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
      )
      .then(() => undefined)
      .catch((err) => {
        tableReady = null;
        throw err;
      });
  }
  return tableReady;
}

export interface SubmissionRecord {
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
  reelDoctorSpeciality: string;
  topicName: string;
  script: string;
  photoUrl: string;
  voiceUrl: string;
  voiceSeconds: number;
  consent: boolean;
  submittedAt: Date;
}

export async function insertSubmissionBackup(r: SubmissionRecord, mongoError?: string) {
  await ensureTable();
  await getPool().query(
    `INSERT INTO ${TABLE} (
      abe_name, hq, emp_id, zone, zone_manager,
      doctor_name, doctor_unique_id, doctor_mobile, doctor_email,
      city, city_type, practice_type, years_experience, monthly_pcv_potential, competitor_brands,
      reel_duration, reel_doctor_name, reel_doctor_degree, reel_doctor_speciality, topic_name,
      script, photo_url, voice_url, voice_seconds, consent, submitted_at, mongo_error
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
    [
      r.abeName, r.hq, r.empId, r.zone, r.zoneManager,
      r.doctorName, r.doctorUniqueId, r.doctorMobile, r.doctorEmail,
      r.city, r.cityType, r.practiceType, r.yearsExperience, r.monthlyPcvPotential, r.competitorBrands,
      r.reelDuration, r.reelDoctorName, r.reelDoctorDegree, r.reelDoctorSpeciality, r.topicName,
      r.script, r.photoUrl, r.voiceUrl, r.voiceSeconds, r.consent, r.submittedAt, mongoError ?? null,
    ]
  );
}
