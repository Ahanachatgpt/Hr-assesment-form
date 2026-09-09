import fs from "fs";
import path from "path";
import { Database, AssessmentForm, Submission, AppSettings, AdminAccount } from "./types";
import { createInitialDatabase } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

let writeQueue: Promise<void> = Promise.resolve();

export function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, "resumes"), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, "photos"), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, "docs"), { recursive: true });
}

async function readDb(): Promise<Database> {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const initial = await createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw) as Database;
}

function writeDb(db: Database) {
  ensureDirs();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function withWrite<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    writeDb(db);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export const store = {
  get: () => readDb(),

  settings: () => readDb().then((d) => d.settings),
  updateSettings: (patch: Partial<AppSettings>) =>
    withWrite((db) => {
      db.settings = { ...db.settings, ...patch };
      return db.settings;
    }),

  admin: () => readDb().then((d) => d.admin),
  updateAdmin: (admin: AdminAccount) =>
    withWrite((db) => {
      db.admin = admin;
      return db.admin;
    }),

  forms: () => readDb().then((d) => d.forms),
  formById: async (id: string) => (await readDb()).forms.find((f) => f.id === id),
  formBySlug: async (slug: string) => (await readDb()).forms.find((f) => f.slug === slug),
  saveForm: (form: AssessmentForm) =>
    withWrite((db) => {
      const i = db.forms.findIndex((f) => f.id === form.id);
      if (i >= 0) db.forms[i] = form;
      else db.forms.unshift(form);
      return form;
    }),
  deleteForm: (id: string) =>
    withWrite((db) => {
      db.forms = db.forms.filter((f) => f.id !== id);
    }),

  submissions: () => readDb().then((d) => d.submissions),
  submissionById: async (id: string) => (await readDb()).submissions.find((s) => s.id === id),
  addSubmission: (sub: Submission) =>
    withWrite((db) => {
      db.submissions.unshift(sub);
      return sub;
    }),
  updateSubmission: (id: string, patch: Partial<Submission>) =>
    withWrite((db) => {
      const i = db.submissions.findIndex((s) => s.id === id);
      if (i < 0) return undefined;
      db.submissions[i] = { ...db.submissions[i], ...patch };
      return db.submissions[i];
    }),
  deleteSubmission: (id: string) =>
    withWrite((db) => {
      db.submissions = db.submissions.filter((s) => s.id !== id);
    }),
};

export { UPLOAD_DIR, DATA_DIR };
