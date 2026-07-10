import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { decryptJson } from "@/lib/crypto";
import { uploadObject } from "@/lib/storage";
import { displayValue, type Answers, type FieldDef } from "@/lib/doc-fields";
import { bakuDateIso } from "@/lib/slots";

const FONT_REGULAR = path.join(process.cwd(), "assets/fonts/DejaVuSans.ttf");
const FONT_BOLD = path.join(process.cwd(), "assets/fonts/DejaVuSans-Bold.ttf");

const UID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newDocUid(): string {
  const pick = () =>
    Array.from(randomBytes(4))
      .map((b) => UID_ALPHABET[b % UID_ALPHABET.length])
      .join("");
  return `VKL-${pick()}-${pick()}`;
}

export function fontsAvailable(): boolean {
  return fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD);
}

function renderBody(bodyText: string, fields: FieldDef[], answers: Answers, docUid: string): string {
  const today = bakuDateIso(new Date()).split("-").reverse().join(".");
  let out = bodyText.replaceAll("{{TODAY}}", today).replaceAll("{{DOC_UID}}", docUid);
  for (const f of fields) {
    out = out.replaceAll(`{{${f.key}}}`, displayValue(f, answers[f.key] ?? ""));
  }
  return out;
}

function buildPdf(opts: {
  title: string;
  body: string;
  docUid: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 64, bottom: 72, left: 60, right: 60 },
      font: FONT_REGULAR,
      pdfVersion: "1.7",
      info: { Title: opts.title, Creator: "Vakilim.az" },
      ownerPassword: randomBytes(16).toString("hex"),
      permissions: {
        printing: "highResolution",
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const stamp = () => {
      const { width, height } = doc.page;
      doc.save();
      doc.rotate(-35, { origin: [width / 2, height / 2] });
      doc
        .font(FONT_REGULAR)
        .fontSize(26)
        .fillColor("#0f2c59")
        .fillOpacity(0.08)
        .text(
          `Vakilim.az · ${opts.docUid} · yalnız bu iş üçün`,
          0,
          height / 2 - 20,
          { width, align: "center" }
        );
      doc.restore();
      doc.fillOpacity(1).fillColor("#1a1a1a");
    };

    stamp();
    doc.on("pageAdded", stamp);

    doc
      .font(FONT_BOLD)
      .fontSize(15)
      .fillColor("#0f2c59")
      .text(opts.title, { align: "center" });
    doc
      .font(FONT_REGULAR)
      .fontSize(8.5)
      .fillColor("#4a5568")
      .moveDown(0.4)
      .text(`Sənəd № ${opts.docUid} · vakilim.az/verify`, { align: "center" });
    doc.moveDown(1.2).fillColor("#1a1a1a");

    for (const rawLine of opts.body.split("\n")) {
      const line = rawLine.trimEnd();
      if (!line) {
        doc.moveDown(0.6);
        continue;
      }
      if (line.startsWith("# ")) {
        doc.moveDown(0.4).font(FONT_BOLD).fontSize(11.5).text(line.slice(2));
        doc.font(FONT_REGULAR).fontSize(10.5);
      } else {
        doc.fontSize(10.5).text(line, { align: "justify", lineGap: 2 });
      }
    }

    doc
      .moveDown(2)
      .fontSize(8)
      .fillColor("#4a5568")
      .text(
        `Bu sənəd Vakilim.az platformasında yaradılıb və yalnız göstərilən iş üçün nəzərdə tutulub. Orijinallığı yoxlamaq üçün: vakilim.az/verify — kod: ${opts.docUid}`,
        { align: "center" }
      );

    doc.end();
  });
}

/**
 * Idempotent: renders the PDF from stored (encrypted) answers and uploads it.
 * Safe to call again if a previous attempt failed — same inputs, same output.
 */
export async function generateAndStore(orderId: string): Promise<string> {
  if (!fontsAvailable()) throw new Error("FONTS_MISSING");

  const order = await prisma.docOrder.findUnique({
    where: { id: orderId },
    include: { templateVersion: { include: { template: true } } },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const fields = order.templateVersion.fields as unknown as FieldDef[];
  const answers = decryptJson<Answers>(order.answersEncrypted);
  const body = renderBody(
    order.templateVersion.bodyText,
    fields,
    answers,
    order.docUid
  );

  const pdf = await buildPdf({
    title: order.templateVersion.template.title,
    body,
    docUid: order.docUid,
  });

  const pdfKey = `documents/${order.id}.pdf`;
  const uploaded = await uploadObject(pdfKey, pdf, "application/pdf");
  if (!uploaded) throw new Error("STORAGE_NOT_CONFIGURED");

  await prisma.docOrder.update({
    where: { id: order.id },
    data: { pdfKey },
  });

  return pdfKey;
}
