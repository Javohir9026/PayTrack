import { z } from 'zod';

export const phoneError = "Telefon raqami to'liq emas";
export function normalizePhone(value: string): string | null {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  return /^\d{9}$/.test(digits) ? `+998${digits}` : null;
}
export const phoneSchema = z.string().transform((v, ctx) => {
  const phone = normalizePhone(v);
  if (!phone) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: phoneError }); return z.NEVER; }
  return phone;
});
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").refine(v => {
  const d = new Date(`${v}T00:00:00Z`); return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v;
}, "Haqiqiy sanani kiriting");
export const studentSchema = z.object({
  name: z.string().trim().min(2, "Ism kamida 2 belgi bo'lishi kerak").max(80, "Ism 80 belgidan oshmasin"),
  phone: phoneSchema,
  group: z.string().trim().min(1, "Guruhni kiriting").max(40, "Guruh 40 belgidan oshmasin"),
  monthlyFee: z.coerce.number().int("Summa butun son bo'lishi kerak").min(1000, "Oylik kamida 1 000 so'm").max(100000000, "Summa juda katta")
});
export const paymentSchema = z.object({
  studentId: z.coerce.number({ invalid_type_error: "O'quvchini tanlang" }).int("O'quvchini tanlang").positive("O'quvchini tanlang"),
  amount: z.coerce.number().int("Summa butun son bo'lishi kerak").positive("Summa 0 dan katta bo'lishi kerak").max(100000000, "Summa juda katta"),
  date: dateSchema
});
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Oy YYYY-MM formatida bo'lishi kerak");
export type StudentInput = z.infer<typeof studentSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
