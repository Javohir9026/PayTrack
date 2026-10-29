import Fastify from "fastify";
import cors from "@fastify/cors";
import type { ZodError } from "zod";
import { studentSchema, paymentSchema, monthSchema } from "@ecom/shared";
import { createDatabase, tashkentToday, type Db } from "./db/database.js";

const fail = (
  code: string,
  message: string,
  fields?: Record<string, string>,
) => ({ error: { code, message, ...(fields ? { fields } : {}) } });
const fieldErrors = (error: ZodError) =>
  Object.fromEntries(
    error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
  );
const dateRange = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return {
    from: `${month}-01`,
    to: `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`,
  };
};
export function buildApp(db: Db = createDatabase()) {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });
  const openApi = {
    openapi: "3.0.3",
    info: {
      title: "PayTrack API",
      version: "1.0.0",
      description: "Учёт учеников, оплат и должников учебного центра.",
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "Students", description: "Управление учениками" },
      { name: "Payments", description: "Учёт оплат" },
      { name: "Debtors", description: "Должники за месяц" },
    ],
    paths: {
      "/students": {
        get: { tags: ["Students"], summary: "Список учеников", parameters: [{ name: "search", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Список учеников" } } },
        post: { tags: ["Students"], summary: "Создать ученика", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/StudentInput" } } } }, responses: { 201: { description: "Ученик создан" }, 422: { description: "Ошибка валидации" } } },
      },
      "/students/{id}": {
        get: { tags: ["Students"], summary: "Получить ученика", parameters: [{ $ref: "#/components/parameters/StudentId" }], responses: { 200: { description: "Ученик" }, 404: { description: "Не найден" } } },
        patch: { tags: ["Students"], summary: "Изменить ученика", parameters: [{ $ref: "#/components/parameters/StudentId" }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/StudentInput" } } } }, responses: { 200: { description: "Ученик обновлён" } } },
        delete: { tags: ["Students"], summary: "Удалить ученика", parameters: [{ $ref: "#/components/parameters/StudentId" }], responses: { 204: { description: "Ученик и его оплаты удалены" } } },
      },
      "/students/{id}/payments": {
        get: { tags: ["Payments"], summary: "История оплат ученика", parameters: [{ $ref: "#/components/parameters/StudentId" }], responses: { 200: { description: "Список оплат" } } },
      },
      "/payments": {
        post: { tags: ["Payments"], summary: "Добавить оплату", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentInput" } } } }, responses: { 201: { description: "Оплата добавлена" }, 422: { description: "Ошибка валидации" } } },
      },
      "/debtors": {
        get: { tags: ["Debtors"], summary: "Должники за месяц", parameters: [{ name: "month", in: "query", required: true, schema: { type: "string", pattern: "^\\d{4}-\\d{2}$", example: "2026-10" } }], responses: { 200: { description: "Список должников" } } },
      },
    },
    components: {
      parameters: { StudentId: { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } } },
      schemas: {
        StudentInput: { type: "object", required: ["name", "phone", "group", "monthlyFee"], properties: { name: { type: "string", example: "Dilnoza Usmonova" }, phone: { type: "string", example: "+998941234567" }, group: { type: "string", example: "Backend" }, monthlyFee: { type: "integer", example: 1500000 } } },
        PaymentInput: { type: "object", required: ["studentId", "amount", "date"], properties: { studentId: { type: "integer", example: 1 }, amount: { type: "integer", example: 500000 }, date: { type: "string", format: "date", example: "2026-10-29" } } },
      },
    },
  };
  app.get("/docs/json", async () => openApi);
  app.get("/docs", async (_request, reply) =>
    reply.type("text/html").send(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PayTrack API Docs</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/docs/json',dom_id:'#swagger-ui',persistAuthorization:true});</script></body></html>`),
  );
  app.setErrorHandler((e, _r, reply) =>
    reply.status(500).send(fail("INTERNAL_ERROR", "Ichki server xatosi")),
  );
  const row = (id: number) =>
    db
      .prepare(
        'SELECT id,name,phone,group_name as "group",monthly_fee as monthlyFee,created_at as createdAt FROM students WHERE id=?',
      )
      .get(id) as Record<string, unknown> | undefined;
  app.post("/students", async (req, reply) => {
    const p = studentSchema.safeParse(req.body);
    if (!p.success)
      return reply
        .status(422)
        .send(
          fail(
            "VALIDATION_ERROR",
            "Ma'lumotlarni tekshiring",
            fieldErrors(p.error),
          ),
        );
    const today = tashkentToday();
    const r = db
      .prepare(
        "INSERT INTO students(name,phone,group_name,monthly_fee,created_at) VALUES(?,?,?,?,?)",
      )
      .run(p.data.name, p.data.phone, p.data.group, p.data.monthlyFee, today);
    return reply.status(201).send(row(Number(r.lastInsertRowid)));
  });
  app.get("/students", async (req) => {
    const q = (req.query as { search?: string }).search?.trim();
    let rows;
    if (q) {
      const s = `%${q}%`;
      rows = db
        .prepare(
          'SELECT id,name,phone,group_name as "group",monthly_fee as monthlyFee,created_at as createdAt FROM students WHERE name LIKE ? OR phone LIKE ? OR group_name LIKE ? ORDER BY name',
        )
        .all(s, s, s);
    } else
      rows = db
        .prepare(
          'SELECT id,name,phone,group_name as "group",monthly_fee as monthlyFee,created_at as createdAt FROM students ORDER BY name',
        )
        .all();
    return rows;
  });
  app.get("/students/:id", async (req, reply) => {
    const x = row(Number((req.params as { id: string }).id));
    return x ?? reply.status(404).send(fail("NOT_FOUND", "O'quvchi topilmadi"));
  });
  app.patch("/students/:id", async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (!row(id))
      return reply.status(404).send(fail("NOT_FOUND", "O'quvchi topilmadi"));
    const p = studentSchema.safeParse(req.body);
    if (!p.success)
      return reply
        .status(422)
        .send(
          fail(
            "VALIDATION_ERROR",
            "Ma'lumotlarni tekshiring",
            fieldErrors(p.error),
          ),
        );
    db.prepare(
      "UPDATE students SET name=?,phone=?,group_name=?,monthly_fee=? WHERE id=?",
    ).run(p.data.name, p.data.phone, p.data.group, p.data.monthlyFee, id);
    return row(id);
  });
  app.delete("/students/:id", async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (!row(id))
      return reply.status(404).send(fail("NOT_FOUND", "O'quvchi topilmadi"));
    db.transaction((studentId: number) => {
      db.prepare("DELETE FROM payments WHERE student_id=?").run(studentId);
      db.prepare("DELETE FROM students WHERE id=?").run(studentId);
    })(id);
    return reply.status(204).send();
  });
  app.post("/payments", async (req, reply) => {
    const p = paymentSchema.safeParse(req.body);
    if (!p.success)
      return reply
        .status(422)
        .send(
          fail(
            "VALIDATION_ERROR",
            "Ma'lumotlarni tekshiring",
            fieldErrors(p.error),
          ),
        );
    if (p.data.date > tashkentToday())
      return reply
        .status(422)
        .send(
          fail("VALIDATION_ERROR", "Ma'lumotlarni tekshiring", {
            date: "Kelajak sanasini tanlab bo'lmaydi",
          }),
        );
    if (!row(p.data.studentId))
      return reply.status(404).send(fail("NOT_FOUND", "O'quvchi topilmadi"));
    const r = db
      .prepare(
        "INSERT INTO payments(student_id,amount,paid_at,created_at) VALUES(?,?,?,?)",
      )
      .run(p.data.studentId, p.data.amount, p.data.date, tashkentToday());
    return reply.status(201).send({ id: Number(r.lastInsertRowid), ...p.data });
  });
  app.get("/students/:id/payments", async (req, reply) => {
    const id = Number((req.params as { id: string }).id);
    if (!row(id))
      return reply.status(404).send(fail("NOT_FOUND", "O'quvchi topilmadi"));
    return db
      .prepare(
        "SELECT id,student_id as studentId,amount,paid_at as date,created_at as createdAt FROM payments WHERE student_id=? ORDER BY paid_at DESC,id DESC",
      )
      .all(id);
  });
  app.get("/debtors", async (req, reply) => {
    const requested =
      (req.query as { month?: string }).month ?? tashkentToday().slice(0, 7);
    const parsed = monthSchema.safeParse(requested);
    if (!parsed.success)
      return reply
        .status(400)
        .send(fail("INVALID_MONTH", "Oy YYYY-MM formatida bo'lishi kerak"));
    const { from, to } = dateRange(requested);
    return db
      .prepare(
        `SELECT s.id as studentId,s.name,s.phone,s.group_name as "group",s.monthly_fee as monthlyFee,COALESCE(SUM(p.amount),0) as paid,s.monthly_fee-COALESCE(SUM(p.amount),0) as debt FROM students s LEFT JOIN payments p ON p.student_id=s.id AND p.paid_at BETWEEN ? AND ? WHERE substr(s.created_at,1,7)<=? GROUP BY s.id HAVING debt>0 ORDER BY debt DESC,s.name`,
      )
      .all(from, to, requested);
  });
  return app;
}
