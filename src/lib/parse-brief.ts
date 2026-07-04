// Client-side brief file parsing. Supports .txt, .md, .docx, .pdf.
// Uses lazy dynamic imports so the parsers only load when the user picks a file.

export type ParsedBrief = { text: string; fileName: string };

const MAX_CHARS = 20000;

function trim(text: string) {
  const t = text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
  return t.length > MAX_CHARS ? `${t.slice(0, MAX_CHARS)}\n\n[…truncated]` : t;
}

export async function parseBriefFile(file: File): Promise<ParsedBrief> {
  const name = file.name;
  const lower = name.toLowerCase();
  const type = file.type || "";

  if (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.endsWith(".json") ||
    type.startsWith("text/")
  ) {
    return { text: trim(await file.text()), fileName: name };
  }

  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: trim(result.value ?? ""), fileName: name };
  }

  if (lower.endsWith(".pdf") || type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // Disable worker for simplicity — fine for short briefs.
    (pdfjs as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = "";
    const buffer = await file.arrayBuffer();
    const doc = await (
      pdfjs as unknown as {
        getDocument: (opts: { data: ArrayBuffer; disableWorker: boolean }) => {
          promise: Promise<{
            numPages: number;
            getPage: (n: number) => Promise<{
              getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
            }>;
          }>;
        };
      }
    )
      .getDocument({ data: buffer, disableWorker: true })
      .promise;
    let out = "";
    const pages = Math.min(doc.numPages, 50);
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it) => it.str ?? "").join(" ") + "\n\n";
    }
    return { text: trim(out), fileName: name };
  }

  throw new Error("Unsupported file. Upload .txt, .md, .pdf, or .docx");
}
