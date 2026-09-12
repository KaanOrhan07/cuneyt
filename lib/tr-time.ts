import { TR_TIMEZONE } from "./format";

// Türkiye 2016'dan beri yaz saati uygulamıyor, sabit UTC+3.
const TR_OFFSET_HOURS = 3;

function istanbulParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24 };
}

/** Şu anın İstanbul takvim gününü (yıl/ay/gün) verir. */
export function istanbulToday() {
  const { year, month, day } = istanbulParts(new Date());
  return { year, month, day };
}

/** Verilen İstanbul takvim gününün gece yarısına karşılık gelen gerçek UTC anını döner. */
export function istanbulMidnightUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, -TR_OFFSET_HOURS, 0, 0, 0));
}

/** "YYYY-MM-DD" formatındaki bir İstanbul takvim gününü UTC anına çevirir. */
export function parseIstanbulDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return istanbulMidnightUTC(y, m, d);
}

/** Bir zaman damgasının İstanbul takvimindeki gün anahtarını ("YYYY-MM-DD") döner. */
export function istanbulDayKey(value: string | Date): string {
  const { year, month, day } = istanbulParts(new Date(value));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** İstanbul takviminde n gün önceki günü {year, month, day} olarak döner. */
export function istanbulDaysAgo(n: number) {
  const { year, month, day } = istanbulToday();
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12));
  utcNoon.setUTCDate(utcNoon.getUTCDate() - n);
  return { year: utcNoon.getUTCFullYear(), month: utcNoon.getUTCMonth() + 1, day: utcNoon.getUTCDate() };
}
