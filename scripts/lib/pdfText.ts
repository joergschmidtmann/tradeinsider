import { PDFParse } from "pdf-parse";

/** Extracts plain text from a PDF buffer. Shared by any ingestion pipeline
 * that sources data from PDF-only regulatory filings (currently CNMV/Spain;
 * AMF/France uses the same MAR Annex I form and can reuse this once built). */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}
