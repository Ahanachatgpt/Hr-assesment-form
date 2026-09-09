import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import PDFDocument from "pdfkit";
import { AssessmentForm, FormField, Submission, AppSettings, HrReview } from "./types";
import { UPLOAD_DIR } from "./store";
import { emptyHrReview } from "./hrReview";
import { ageLabel, followUpHeading, hasEmploymentExperience, isCertificateField, isDobField, isResumeField, isRolesField, padRepeaterRows, yesNoChoice } from "./utils";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 32;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LABEL_W = 186;
const VALUE_W = CONTENT_W - LABEL_W;
const NAVY = "#1b365d";
const INK = "#111111";
const MUTED = "#1a1a1a";
const LINE = "#7a848e";
const LABEL_BG = "#efefef";
const HEAD_BG = "#e6e6e6";
const HEADER_BG = "#dcdcdc";
const ROW_H_MIN = 28;
const GRID_ROW_H = 30;
const TEXTAREA_MIN_H = 56;
const SECTION_GAP = 12;

function runPython(script: string, args: string[], timeout: number) {
  const bins = process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
  let lastErr: unknown;
  for (const bin of bins) {
    try {
      execFileSync(bin, ["-c", script, ...args], { timeout, windowsHide: true });
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

const FONT_TITLE = 15;
const FONT_SECTION = 14;
const FONT_BODY = 12;
const FONT_LABEL = 11;
const FONT_TABLE = 11;
const FONT_TABLE_HEAD = 10;
const LINE_BODY = 15;
const LINE_LABEL = 14;
const LINE_TABLE = 14;

function str(value: unknown): string {
  if (value == null || value === "") return "";
  if (value && typeof value === "object" && !Array.isArray(value) && "answer" in (value as object)) {
    const answer = String((value as { answer?: string }).answer ?? "");
    const details = String((value as { details?: string }).details ?? "").trim();
    if (!answer) return "";
    return details ? `${answer} — ${details}` : answer;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (typeof value[0] === "object") return "";
    return value.join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function display(value: unknown): string {
  const raw = str(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00`);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}-01T00:00:00`);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }
  if (
    /^i agree that the information/i.test(raw) ||
    /^i hereby declare/i.test(raw) ||
    /true, complete and correct to the best of my knowledge/i.test(raw)
  ) {
    return "Agreed";
  }
  return raw;
}

function preparePhoto(src: string): string {
  if (!src || !fs.existsSync(src)) return src;
  const dest = src.replace(/(\.[^.]+)$/i, "-rgb.jpg");
  try {
    if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) return dest;
    const py = `
from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert("RGB")
w, h = im.size
canvas_w, canvas_h = 330, 440
if h >= w:
    t = canvas_w / canvas_h
    if w / h > t:
        nw = int(h * t); left = (w - nw) // 2; im = im.crop((left, 0, left + nw, h))
    else:
        nh = int(w / t); top = (h - nh) // 2; im = im.crop((0, top, w, top + nh))
    im = im.resize((canvas_w, canvas_h))
    im.save(sys.argv[2], "JPEG", quality=90)
else:
    im.thumbnail((canvas_w, canvas_h))
    canvas = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
    canvas.paste(im, ((canvas_w - im.width) // 2, (canvas_h - im.height) // 2))
    canvas.save(sys.argv[2], "JPEG", quality=90)
`;
    runPython(py, [src, dest], 20000);
    if (fs.existsSync(dest)) return dest;
  } catch {
    /* use original */
  }
  return src;
}

function prepareLogo(src: string): string {
  if (!src || !fs.existsSync(src)) return src;
  const dest = src.replace(/(\.[^.]+)$/i, "-print.png");
  try {
    if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) return dest;
    const py = `
from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert("RGBA")
box = im.getbbox()
if box:
    pad = 6
    l, t, r, b = box
    l = max(0, l - pad); t = max(0, t - pad)
    r = min(im.width, r + pad); b = min(im.height, b + pad)
    im = im.crop((l, t, r, b))
bg = Image.new("RGB", im.size, (255, 255, 255))
bg.paste(im, mask=im.split()[-1])
bg.save(sys.argv[2], "PNG")
`;
    runPython(py, [src, dest], 15000);
    if (fs.existsSync(dest)) return dest;
  } catch {
    /* use original */
  }
  return src;
}

function wrap(doc: PDFKit.PDFDocument, text: string, width: number, font: string, size: number): string[] {
  doc.font(font).fontSize(size);
  const paragraphs = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let line = "";
    for (const word of words) {
      const test = line.length ? `${line} ${word}` : word;
      if (doc.widthOfString(test) <= width) {
        line = test;
      } else {
        if (line) lines.push(line);
        if (doc.widthOfString(word) <= width) {
          line = word;
        } else {
          let chunk = "";
          for (const ch of word) {
            if (doc.widthOfString(chunk + ch) <= width) chunk += ch;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        }
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

export function generateSubmissionPdf(
  form: AssessmentForm,
  submission: Submission,
  settings: AppSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    const dir = path.join(UPLOAD_DIR, "pdfs");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${submission.id}.pdf`);
    const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const cursor = { y: MARGIN };

    const ensure = (need: number) => {
      if (cursor.y + need > PAGE_H - MARGIN) {
        doc.addPage();
        cursor.y = MARGIN;
      }
    };

    const sectionTitle = (title: string, following = 90) => {
      ensure(24 + following);
      cursor.y += 8;
      doc.font("Helvetica-Bold").fontSize(FONT_SECTION).fillColor(INK).text(title, MARGIN, cursor.y, {
        width: CONTENT_W,
        align: "center",
      });
      cursor.y += 18;
    };

    const remarksSignature = (rightTitle: string, remarks: string, signature: string) => {
      const pad = 6;
      const sigW = Math.round(CONTENT_W * 0.26);
      const remW = CONTENT_W - sigW;
      const remarksLines = wrap(doc, remarks || " ", remW - pad * 2, "Helvetica", FONT_BODY);
      const signLines = wrap(doc, signature || " ", sigW - pad * 2, "Helvetica", FONT_BODY);
      const textH = Math.max(remarksLines.length, signLines.length) * LINE_BODY;
      const boxH = Math.max(96, 26 + textH);
      ensure(boxH + 10);
      const y = cursor.y;

      doc.lineWidth(0.8).strokeColor("#000000");
      doc.rect(MARGIN, y, remW, boxH).stroke();
      doc.rect(MARGIN + remW, y, sigW, boxH).stroke();

      doc.font("Helvetica-Bold").fontSize(FONT_LABEL).fillColor(INK);
      doc.text("Remarks", MARGIN + pad, y + 6, { width: remW - pad * 2, lineBreak: false });
      doc.text(rightTitle, MARGIN + remW + 3, y + 6, {
        width: sigW - 6,
        align: "center",
        lineBreak: false,
      });

      if (remarks) {
        let ty = y + 24;
        doc.font("Helvetica").fontSize(FONT_BODY).fillColor(MUTED);
        for (const ln of remarksLines) {
          if (ln.trim()) {
            doc.text(ln, MARGIN + pad, ty, { width: remW - pad * 2, lineBreak: false });
          }
          ty += LINE_BODY;
        }
      }
      if (signature) {
        let ty = y + 24;
        doc.font("Helvetica").fontSize(FONT_BODY).fillColor(MUTED);
        for (const ln of signLines) {
          if (ln.trim()) {
            doc.text(ln, MARGIN + remW + 3, ty, { width: sigW - 6, align: "center", lineBreak: false });
          }
          ty += LINE_BODY;
        }
      }
      cursor.y += boxH + 10;
    };

    const kvRow = (
      label: string,
      value: string,
      opts?: { minHeight?: number; width?: number; alignTop?: boolean }
    ) => {
      const pad = 8;
      const rowW = opts?.width ?? CONTENT_W;
      const valueW = Math.max(48, rowW - LABEL_W);
      const lines = wrap(doc, value || " ", Math.max(24, valueW - pad * 2), "Helvetica", FONT_BODY);
      const labelLines = wrap(doc, label, Math.max(24, LABEL_W - pad * 2), "Helvetica-Bold", FONT_LABEL);
      const textH = Math.max(lines.length, 1) * LINE_BODY;
      const labelBlock = Math.max(labelLines.length, 1) * LINE_LABEL;
      const rowH = Math.max(opts?.minHeight || ROW_H_MIN, textH + pad * 2, labelBlock + pad * 2);
      ensure(rowH + 1);
      const y = cursor.y;

      doc.rect(MARGIN, y, LABEL_W, rowH).fill(LABEL_BG);
      doc.rect(MARGIN + LABEL_W, y, valueW, rowH).fill("#ffffff");
      doc.lineWidth(0.7).strokeColor(LINE);
      doc.rect(MARGIN, y, rowW, rowH).stroke();
      doc.moveTo(MARGIN + LABEL_W, y).lineTo(MARGIN + LABEL_W, y + rowH).stroke();

      let ly = y + (opts?.alignTop ? pad : Math.max(pad, (rowH - labelBlock) / 2));
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(FONT_LABEL);
      for (const ln of labelLines) {
        doc.text(ln, MARGIN + pad, ly, { width: LABEL_W - pad * 2, lineBreak: false });
        ly += LINE_LABEL;
      }

      let vy = y + (opts?.alignTop ? pad : Math.max(pad, (rowH - textH) / 2));
      doc.fillColor(MUTED).font("Helvetica").fontSize(FONT_BODY);
      for (const ln of lines) {
        if (ln) {
          doc.text(ln, MARGIN + LABEL_W + pad, vy, { width: valueW - pad * 2, lineBreak: false });
        }
        vy += LINE_BODY;
      }
      cursor.y += rowH;
    };

    const logoPath = path.join(process.cwd(), "public", "ahana-logo-official.png");
    const LOGO_W = 230;
    const LOGO_H = 70;
    const hasLogo = fs.existsSync(logoPath);
    if (hasLogo) {
      doc.image(prepareLogo(logoPath), MARGIN + CONTENT_W - LOGO_W, cursor.y, {
        fit: [LOGO_W, LOGO_H],
        align: "right",
        valign: "center",
      });
    }
    const headerTextW = hasLogo ? CONTENT_W - LOGO_W - 14 : CONTENT_W;
    const orgName = settings.companyName || "Ahana Hospitals & Research Center";
    const nameLines = wrap(doc, orgName, headerTextW, "Helvetica-Bold", FONT_SECTION);
    let ty = cursor.y + 6;
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(FONT_SECTION);
    for (const ln of nameLines) {
      doc.text(ln, MARGIN, ty, { width: headerTextW, lineBreak: false });
      ty += LINE_BODY;
    }
    doc.font("Helvetica").fontSize(FONT_LABEL).fillColor(NAVY);
    doc.text(new Date(submission.createdAt).toLocaleDateString("en-IN"), MARGIN, ty + 2, {
      width: headerTextW,
    });
    cursor.y += Math.max(hasLogo ? LOGO_H : 32, nameLines.length * LINE_BODY + 24) + 6;
    doc.rect(MARGIN, cursor.y, CONTENT_W, 28).fill(HEADER_BG);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(FONT_TITLE);
    doc.text("INTERVIEW ASSESSMENT FORM", MARGIN, cursor.y + 7, { width: CONTENT_W, align: "center" });
    cursor.y += 28;

    const PHOTO_W = 110;
    const PHOTO_H = 132;
    const photoGap = 8;
    const photoAbs = submission.photoPath
      ? path.join(UPLOAD_DIR, "photos", path.basename(submission.photoPath))
      : "";
    const photoX = MARGIN + CONTENT_W - PHOTO_W;
    const photoY = cursor.y;
    const besideW = CONTENT_W - PHOTO_W - photoGap;
    drawPhoto(doc, preparePhoto(photoAbs || "missing"), photoX, photoY, PHOTO_W, PHOTO_H);
    const photoBottom = photoY + PHOTO_H;

    const eduIdx = form.fields.findIndex((f) => f.label === "Education Details");
    const headerFields = form.fields
      .slice(0, eduIdx === -1 ? form.fields.length : eduIdx)
      .filter((f) => f.type !== "section" && f.type !== "file");

    for (const f of headerFields) {
      const useNarrow = cursor.y + ROW_H_MIN < photoBottom;
      const rowW = useNarrow ? besideW : CONTENT_W;
      kvRow(f.label, display(submission.answers[f.id]) || " ", { width: rowW });
      if (isDobField(f)) {
        const ageW = cursor.y + ROW_H_MIN < photoBottom ? besideW : CONTENT_W;
        kvRow("Age", ageLabel(submission.answers[f.id], submission.createdAt) || " ", { width: ageW });
      }
    }
    if (cursor.y < photoBottom) cursor.y = photoBottom + 4;

    const rest = form.fields.filter((f) => !headerFields.includes(f));

    for (const f of rest) {
      if (f.type === "section") continue;
      if (isRolesField(f) && !hasEmploymentExperience(form.fields, submission.answers)) continue;
      if (f.type === "file") {
        if (isResumeField(f)) {
          kvRow(f.label, submission.resumeName || " ");
        } else if (isCertificateField(f)) {
          const names = (submission.extraDocs || []).map((d) => d.name).join("\n");
          kvRow(f.label, names || " ", { alignTop: true });
        }
        continue;
      }
      if (f.type === "repeater") {
        const cols = f.repeaterFields || [];
        const body = padRepeaterRows(f, submission.answers[f.id]);
        sectionTitle(f.label);
        drawGrid(doc, cursor, ensure, f.label, cols, body.length ? body : [{}]);
        continue;
      }
      if (f.type === "yesno" && f.followUpWhen) {
        const raw = submission.answers[f.id];
        kvRow(f.label, yesNoChoice(raw) || " ");
        const details =
          raw && typeof raw === "object" && !Array.isArray(raw)
            ? String((raw as { details?: string }).details ?? "").trim()
            : "";
        kvRow(followUpHeading(f), details || " ");
        continue;
      }
      kvRow(
        f.label,
        f.type === "textarea" ? String(submission.answers[f.id] ?? "") || " " : display(submission.answers[f.id]) || " ",
        {
          minHeight: f.type === "textarea" ? TEXTAREA_MIN_H : ROW_H_MIN,
          alignTop: f.type === "textarea",
        }
      );
      if (isDobField(f)) {
        kvRow("Age", ageLabel(submission.answers[f.id], submission.createdAt) || " ");
      }
    }

    const review = submission.hrReview || emptyHrReview();
    drawHrdUseOnly(doc, cursor, ensure);
    drawCandidateDetailsSummary(doc, cursor, ensure, form, submission);

    sectionTitle("HR department");
    drawRatings(doc, cursor, ensure, review.hrRatings);
    remarksSignature("HR's Signature", "", review.hrSignature);

    sectionTitle("Functional Head");
    drawRatings(doc, cursor, ensure, review.hodRatings);
    remarksSignature("HOD's Signature", "", review.hodSignature);

    sectionTitle("Management remarks");
    kvRow("Remarks", review.managementRemarks || " ", { minHeight: 88, alignTop: true });

    sectionTitle("To be completed by HR following candidate selection");
    drawPairGrid(doc, cursor, ensure, [
      ["Designation", review.designation],
      ["Location", review.location],
      ["Date Of Joining", review.dateOfJoining],
      ["Salary", review.salary],
      ["Probation Period", review.probationPeriod],
      ["Review Date", review.reviewDate],
    ]);

    remarksSignature("Management Approval", "", review.managementApproval);

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

function ribbonTitle(
  doc: PDFKit.PDFDocument,
  cursor: { y: number },
  ensure: (n: number) => void,
  title: string
) {
  ensure(36);
  cursor.y += 8;
  doc.font("Helvetica-Bold").fontSize(FONT_SECTION).fillColor(INK).text(title, MARGIN, cursor.y, {
    width: CONTENT_W,
    align: "center",
  });
  cursor.y += 18;
}

function drawHrdUseOnly(
  doc: PDFKit.PDFDocument,
  cursor: { y: number },
  ensure: (n: number) => void
) {
  ribbonTitle(doc, cursor, ensure, "For HRD use only");
  const h = 28;
  const lw = LABEL_W;
  ensure(h * 2 + 6);
  doc.lineWidth(0.8).strokeColor("#000000");
  for (const label of ["Called for interview on:", "Final selection on:"]) {
    const y = cursor.y;
    doc.rect(MARGIN, y, lw, h).fillAndStroke(LABEL_BG, "#000000");
    doc.rect(MARGIN + lw, y, CONTENT_W - lw, h).fillAndStroke("#ffffff", "#000000");
    doc.font("Helvetica-Bold").fontSize(FONT_LABEL).fillColor(INK).text(label, MARGIN + 6, y + 8, {
      width: lw - 12,
      lineBreak: false,
    });
    cursor.y += h;
  }
  cursor.y += 4;
}

function parseLooseDate(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}-01T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : new Date(t);
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function formatDuration(months: number): string {
  if (months <= 0) return "";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const yPart = y ? `${y} year${y === 1 ? "" : "s"}` : "";
  const mPart = m ? `${m} month${m === 1 ? "" : "s"}` : "";
  return [yPart, mPart].filter(Boolean).join(" ");
}

function lastEmploymentSummary(form: AssessmentForm, answers: Record<string, unknown>, asOf = new Date()) {
  const field = form.fields.find((f) => f.type === "repeater" && /employment/i.test(f.label));
  if (!field) return { years: "", gap: "", post: "", org: "", salary: "" };
  const cols = field.repeaterFields || [];
  const rows = Array.isArray(answers[field.id]) ? (answers[field.id] as Record<string, unknown>[]) : [];
  const col = (re: RegExp) => cols.find((c) => re.test(c.label));
  const filled = rows.filter((row) => cols.some((c) => String(row[c.id] ?? "").trim()));
  if (!filled.length) return { years: "Fresher", gap: "Not applicable", post: "", org: "", salary: "" };

  const startC = col(/start date/i);
  const endC = col(/end date/i);
  const periods: { start: Date; end: Date; open: boolean; row: Record<string, unknown> }[] = [];
  let workMonths = 0;
  for (const row of filled) {
    const start = startC ? parseLooseDate(row[startC.id]) : null;
    if (!start) continue;
    const endRaw = endC ? parseLooseDate(row[endC.id]) : null;
    const open = !endRaw;
    const end = endRaw && endRaw >= start ? endRaw : asOf;
    workMonths += Math.max(0, monthsBetween(start, end));
    periods.push({ start, end, open, row });
  }

  periods.sort((a, b) => a.start.getTime() - b.start.getTime());
  let gapMonths = 0;
  for (let i = 1; i < periods.length; i++) {
    const g = monthsBetween(periods[i - 1].end, periods[i].start);
    if (g > 1) gapMonths += g;
  }
  if (periods.length && !periods.some((p) => p.open)) {
    const lastEnd = periods.reduce((max, p) => (p.end > max ? p.end : max), periods[0].end);
    const after = monthsBetween(lastEnd, asOf);
    if (after > 1) gapMonths += after;
  }

  const last = [...periods].sort((a, b) => b.end.getTime() - a.end.getTime())[0]?.row || filled[filled.length - 1];
  const val = (re: RegExp) => {
    const c = col(re);
    return c ? display(last[c.id]) : "";
  };
  return {
    years: formatDuration(workMonths) || "",
    gap: gapMonths > 0 ? formatDuration(gapMonths) : "Nil",
    post: val(/designation/i),
    org: val(/organisation|organization/i),
    salary: val(/salary/i),
  };
}

function drawCandidateDetailsSummary(
  doc: PDFKit.PDFDocument,
  cursor: { y: number },
  ensure: (n: number) => void,
  form: AssessmentForm,
  submission: Submission
) {
  ribbonTitle(doc, cursor, ensure, "Candidate details");
  const dob = form.fields.find(isDobField);
  const emp = lastEmploymentSummary(form, submission.answers, new Date(submission.createdAt));
  const byLabel = (re: RegExp) => {
    const f = form.fields.find((x) => re.test(x.label) && x.type !== "repeater");
    return f ? display(submission.answers[f.id]) : "";
  };
  drawPairGrid(doc, cursor, ensure, [
    ["Age", dob ? ageLabel(submission.answers[dob.id], submission.createdAt) : ""],
    ["Total years of experience", emp.years],
    ["Career gap if any", emp.gap],
    ["Last post held", emp.post],
    ["Last / Present organization", emp.org],
    ["Last drawn salary (in hand)", emp.salary],
    ["Present location", byLabel(/submitters location/i)],
    ["Resident city", ""],
  ], { labelW: 122 });
}

function drawPhoto(doc: PDFKit.PDFDocument, src: string, x: number, y: number, w: number, h: number) {
  doc.lineWidth(0.8).strokeColor("#666666").rect(x, y, w, h).stroke();
  const exists = Boolean(src) && src !== "missing" && fs.existsSync(src);
  if (exists) {
    try {
      doc.save();
      doc.rect(x + 1, y + 1, w - 2, h - 2).clip();
      doc.image(src, x + 1, y + 1, { fit: [w - 2, h - 2], align: "center", valign: "center" });
      doc.restore();
      return;
    } catch {
      /* placeholder */
    }
  }
  doc.font("Helvetica").fontSize(FONT_LABEL).fillColor("#888888").text("PHOTO", x, y + h / 2 - 6, {
    width: w,
    align: "center",
  });
}

function colWidths(cols: FormField[], total: number, numbered: boolean): number[] {
  const n = cols.length + (numbered ? 1 : 0);
  const weights = cols.map((c) => {
    const l = c.label.toLowerCase();
    if (/school|college|organisation|organization|address|reason|location|occupation/.test(l)) return 2.2;
    if (/examination|degree|designation|course|board|name/.test(l)) return 1.6;
    if (/marks|salary|age|mm\/yy|contact|relation/.test(l)) return 1.1;
    if (/start|end|date/.test(l)) return 1.15;
    return 1.2;
  });
  const all = numbered ? [0.45, ...weights] : weights;
  const sum = all.reduce((a, b) => a + b, 0);
  return all.map((w) => (w / sum) * total);
}

function drawGrid(
  doc: PDFKit.PDFDocument,
  cursor: { y: number },
  ensure: (n: number) => void,
  title: string,
  cols: FormField[],
  rows: Record<string, unknown>[]
) {
  const numbered = !/family/i.test(title);
  const widths = colWidths(cols, CONTENT_W, numbered);
  const pad = 5;
  const headers = numbered ? ["#", ...cols.map((c) => c.label)] : cols.map((c) => c.label);

  const headerH = (() => {
    let max = 22;
    headers.forEach((h, i) => {
      const lines = wrap(doc, h, widths[i] - pad * 2, "Helvetica-Bold", FONT_TABLE_HEAD);
      max = Math.max(max, lines.length * LINE_TABLE + 10);
    });
    return max;
  })();

  const drawHeader = (y: number) => {
    let x = MARGIN;
    headers.forEach((h, i) => {
      doc.rect(x, y, widths[i], headerH).fillAndStroke(HEAD_BG, LINE);
      const lines = wrap(doc, h, widths[i] - pad * 2, "Helvetica-Bold", FONT_TABLE_HEAD);
      let ty = y + (headerH - lines.length * LINE_TABLE) / 2;
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(FONT_TABLE_HEAD);
      for (const ln of lines) {
        doc.text(ln, x + pad, ty, { width: widths[i] - pad * 2, align: "center", lineBreak: false });
        ty += LINE_TABLE;
      }
      x += widths[i];
    });
    return y + headerH;
  };

  ensure(headerH + 28);
  cursor.y = drawHeader(cursor.y);

  rows.forEach((row, idx) => {
    const cells = numbered
      ? [
          String(idx + 1),
          ...cols.map((c) => {
            const raw = row[c.id];
            if (/education/i.test(title) && /examination|degree/i.test(c.label)) {
              const text = String(raw ?? "").trim();
              if (idx === 0) return text || "SSLC";
              if (idx === 1) return text || "HSC";
              if (idx === 2) return text ? (/^ug\b/i.test(text) ? text : `UG: ${text}`) : "UG";
              if (idx === 3) return text ? (/^pg\b/i.test(text) ? text : `PG: ${text}`) : "PG";
              return text;
            }
            return display(raw);
          }),
        ]
      : cols.map((c) => display(row[c.id]));
    let rowH = GRID_ROW_H;
    const wrapped = cells.map((cell, i) => {
      const font = i === 0 && numbered ? "Helvetica-Bold" : "Helvetica";
      const lines = wrap(doc, cell || " ", widths[i] - pad * 2, font, FONT_TABLE);
      rowH = Math.max(rowH, lines.length * LINE_TABLE + 12);
      return lines;
    });
    if (cursor.y + rowH > PAGE_H - MARGIN) {
      doc.addPage();
      cursor.y = MARGIN;
      doc.font("Helvetica-Bold").fontSize(FONT_SECTION).fillColor(INK).text(title, MARGIN, cursor.y, {
        width: CONTENT_W,
        align: "center",
      });
      cursor.y += 18;
      cursor.y = drawHeader(cursor.y);
    }
    let x = MARGIN;
    wrapped.forEach((lines, i) => {
      const bg = i === 0 ? LABEL_BG : "#ffffff";
      doc.rect(x, cursor.y, widths[i], rowH).fillAndStroke(bg, LINE);
      let ty = cursor.y + (rowH - lines.length * LINE_TABLE) / 2;
      const font = i === 0 ? "Helvetica-Bold" : "Helvetica";
      const align = i === 0 || /age|marks|salary|date|mm/i.test(headers[i]) ? "center" : "left";
      doc.font(font).fontSize(FONT_TABLE).fillColor(MUTED);
      for (const ln of lines) {
        doc.text(ln, x + pad, ty, { width: widths[i] - pad * 2, align, lineBreak: false });
        ty += LINE_TABLE;
      }
      x += widths[i];
    });
    cursor.y += rowH;
  });
  cursor.y += SECTION_GAP;
}

function drawRatings(
  doc: PDFKit.PDFDocument,
  cursor: { y: number },
  ensure: (n: number) => void,
  rows: HrReview["hrRatings"]
) {
  const heads = ["", "Excellent", "Very good", "Good", "Fair", "Poor", "Remarks"];
  const widths = [132, 62, 68, 50, 46, 46, CONTENT_W - 132 - 62 - 68 - 50 - 46 - 46];
  const h = 28;
  ensure(h * (rows.length + 2));
  let y = cursor.y;
  let x = MARGIN;
  heads.forEach((head, i) => {
    doc.rect(x, y, widths[i], h).fillAndStroke(HEAD_BG, LINE);
    doc.font("Helvetica-Bold").fontSize(FONT_TABLE_HEAD).fillColor(INK).text(head, x + 2, y + 7, {
      width: widths[i] - 4,
      align: "center",
      lineBreak: false,
    });
    x += widths[i];
  });
  y += h;
  for (const row of rows) {
    const vals = [
      row.criterion,
      row.rating === "Excellent" ? "✓" : "",
      row.rating === "Very good" ? "✓" : "",
      row.rating === "Good" ? "✓" : "",
      row.rating === "Fair" ? "✓" : "",
      row.rating === "Poor" ? "✓" : "",
      row.remarks || "",
    ];
    x = MARGIN;
    vals.forEach((v, i) => {
      const bg = i === 0 ? LABEL_BG : "#ffffff";
      doc.rect(x, y, widths[i], h).fillAndStroke(bg, LINE);
      doc.font(i === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(FONT_TABLE).fillColor(INK).text(v, x + 3, y + 7, {
        width: widths[i] - 6,
        align: i === 0 || i === 6 ? "left" : "center",
        lineBreak: false,
      });
      x += widths[i];
    });
    y += h;
  }
  cursor.y = y + 8;
}

function drawPairGrid(
  doc: PDFKit.PDFDocument,
  cursor: { y: number },
  ensure: (n: number) => void,
  pairs: [string, string][],
  opts?: { labelW?: number; rowH?: number }
) {
  const col = CONTENT_W / 2;
  const lw = opts?.labelW ?? 128;
  const vw = col - lw;
  const pad = 8;
  const labelInner = Math.max(24, lw - pad * 2);
  const valueInner = Math.max(24, vw - pad * 2);

  const measure = (label: string, value: string) => {
    const labelLines = wrap(doc, label, labelInner, "Helvetica-Bold", FONT_LABEL);
    const valueLines = wrap(doc, value || " ", valueInner, "Helvetica", FONT_BODY);
    const contentH = Math.max(labelLines.length * LINE_LABEL, valueLines.length * LINE_BODY, LINE_BODY);
    return { labelLines, valueLines, h: contentH + pad * 2 };
  };

  const drawCell = (offset: number, y: number, rowH: number, cell: ReturnType<typeof measure>) => {
    const x = MARGIN + offset;
    doc.rect(x, y, lw, rowH).fillAndStroke(LABEL_BG, LINE);
    doc.rect(x + lw, y, vw, rowH).fillAndStroke("#ffffff", LINE);
    const labelBlock = cell.labelLines.length * LINE_LABEL;
    const valueBlock = cell.valueLines.length * LINE_BODY;
    let ly = y + Math.max(pad, (rowH - labelBlock) / 2);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(FONT_LABEL);
    for (const ln of cell.labelLines) {
      doc.text(ln, x + pad, ly, { width: labelInner, lineBreak: false });
      ly += LINE_LABEL;
    }
    let vy = y + Math.max(pad, (rowH - valueBlock) / 2);
    doc.fillColor(MUTED).font("Helvetica").fontSize(FONT_BODY);
    for (const ln of cell.valueLines) {
      if (ln) {
        doc.text(ln, x + lw + pad, vy, { width: valueInner, lineBreak: false });
      }
      vy += LINE_BODY;
    }
  };

  for (let i = 0; i < pairs.length; i += 2) {
    const left = measure(pairs[i][0], pairs[i][1] || "");
    const right = pairs[i + 1] ? measure(pairs[i + 1][0], pairs[i + 1][1] || "") : null;
    const rowH = Math.max(opts?.rowH ?? ROW_H_MIN, left.h, right?.h ?? 0);
    ensure(rowH + 4);
    const y = cursor.y;
    drawCell(0, y, rowH, left);
    if (right) drawCell(col, y, rowH, right);
    cursor.y += rowH;
  }
  cursor.y += SECTION_GAP;
}
