export const ZONE_MANAGERS: Record<string, string> = {
  "South 1": "Mr.Chelvan",
  "South 2": "Mr.Rajeev",
  West: "Mr.Shajie",
  North: "Mr.Serveshwer",
  East: "Mr.Subir",
};

export const ZONES = Object.keys(ZONE_MANAGERS);

export const CITY_TYPES = ["Metro", "Non-metro"];

export const PRACTICE_TYPES = ["Private clinic", "Corporate Hospital", "Nursing Home/Polyclinic"];

export const REEL_DURATIONS = ["45", "60", "75", "90"];

export const VOICE_SCRIPT_TEMPLATE = `Hello, I am Dr. [Your Name], [Your Degree]. As a paediatrician, I meet many new
parents who want to give their baby the healthiest possible start in life. Pneumococcal
disease can be serious for infants, but timely vaccination offers strong protection
against it. I recommend the PneuMO vaccination schedule to my patients because it is
safe, well-tolerated, and backed by strong clinical evidence. It is important to complete
all the recommended doses on schedule, even if your baby seems perfectly healthy. If you
notice any unusual symptoms after vaccination, please reach out to your doctor right away.
As always, please consult your paediatrician about the right vaccination schedule for
your baby. Thank you, and here's to a healthy start for your little one.`;
