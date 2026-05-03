import { mdToPdf } from "md-to-pdf";
import { readFile } from "fs/promises";
import path from "path";

const files = [
  {
    input: "1-system-overview-and-stack.md",
    output: "1-System-Overview-and-Stack.pdf",
  },
  {
    input: "2-frontend-architecture.md",
    output: "2-Frontend-Architecture.pdf",
  },
  {
    input: "3-backend-logic-and-apis.md",
    output: "3-Backend-Logic-and-APIs.pdf",
  },
  {
    input: "4-database-and-data-lifecycle.md",
    output: "4-Database-and-Data-Lifecycle.pdf",
  },
];

const css = `
/* ── Base ───────────────────────────────────────── */
body {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.65;
  color: #1a1a2e;
  max-width: 100%;
  padding: 0;
}

/* ── Headings ──────────────────────────────────── */
h1 {
  font-size: 26pt;
  font-weight: 700;
  color: #0f0f3d;
  border-bottom: 3px solid #4361ee;
  padding-bottom: 10px;
  margin-top: 0;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}

h2 {
  font-size: 17pt;
  font-weight: 600;
  color: #1b2cc1;
  margin-top: 32px;
  margin-bottom: 14px;
  border-left: 4px solid #4361ee;
  padding-left: 12px;
}

h3 {
  font-size: 13pt;
  font-weight: 600;
  color: #2d3a8c;
  margin-top: 24px;
  margin-bottom: 10px;
}

h4 {
  font-size: 11.5pt;
  font-weight: 600;
  color: #3d4eb8;
  margin-top: 18px;
  margin-bottom: 8px;
}

/* ── Horizontal rules ─────────────────────────── */
hr {
  border: none;
  border-top: 2px solid #e0e0ef;
  margin: 28px 0;
}

/* ── Tables ────────────────────────────────────── */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0 20px;
  font-size: 9.5pt;
  page-break-inside: auto;
}

thead {
  background: #4361ee;
  color: #ffffff;
}

th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 9.5pt;
  letter-spacing: 0.3px;
}

td {
  padding: 9px 12px;
  border-bottom: 1px solid #e0e0ef;
  vertical-align: top;
}

tr:nth-child(even) {
  background-color: #f4f5fc;
}

tr {
  page-break-inside: avoid;
}

/* ── Code blocks ───────────────────────────────── */
pre {
  background: #f0f2fa !important;
  color: #1a1a3e !important;
  padding: 16px 20px;
  border-radius: 8px;
  font-size: 8.5pt;
  line-height: 1.6;
  overflow-x: auto;
  margin: 14px 0 18px;
  page-break-inside: avoid;
  border-left: 4px solid #4361ee;
  border: 1px solid #c7cbe6;
  border-left: 4px solid #4361ee;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

pre code {
  color: #1a1a3e !important;
  background: transparent !important;
}

code {
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  font-size: 8.5pt;
  color: #1a1a3e;
}

:not(pre) > code {
  background: #eef0fb;
  color: #3730a3;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9pt;
}

/* ── Blockquotes ───────────────────────────────── */
blockquote {
  border-left: 4px solid #7c83db;
  background: #f0f1fa;
  margin: 16px 0;
  padding: 14px 18px;
  border-radius: 0 8px 8px 0;
  color: #2d3561;
  font-style: normal;
}

blockquote p {
  margin: 4px 0;
}

/* ── Lists ─────────────────────────────────────── */
ul, ol {
  margin: 8px 0 14px 20px;
  padding-left: 8px;
}

li {
  margin-bottom: 4px;
}

li > ul, li > ol {
  margin-top: 4px;
  margin-bottom: 4px;
}

/* ── Strong / Bold ─────────────────────────────── */
strong {
  color: #1a1a3e;
  font-weight: 700;
}

/* ── Links ─────────────────────────────────────── */
a {
  color: #4361ee;
  text-decoration: none;
}

/* ── Paragraphs ────────────────────────────────── */
p {
  margin: 8px 0;
}

/* ── Page break helpers ────────────────────────── */
.page-break {
  page-break-after: always;
}
`;

const pdfOptions = {
  format: "A4",
  margin: {
    top: "25mm",
    bottom: "25mm",
    left: "22mm",
    right: "22mm",
  },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="font-size:8pt; color:#999; width:100%; text-align:center; padding:0 22mm;">
      <span style="font-family: 'Segoe UI', sans-serif; letter-spacing:1px; text-transform:uppercase;">
        UniVerse Connect — Technical Architecture Documentation
      </span>
    </div>`,
  footerTemplate: `
    <div style="font-size:8pt; color:#999; width:100%; display:flex; justify-content:space-between; padding:0 22mm; font-family: 'Segoe UI', sans-serif;">
      <span>Major Project Defense</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
};

console.log("\n📄 Generating 4 polished PDFs...\n");

for (const file of files) {
  const inputPath = path.resolve(file.input);
  const outputPath = path.resolve(file.output);

  try {
    const markdown = await readFile(inputPath, "utf-8");

    const pdf = await mdToPdf(
      { content: markdown },
      {
        dest: outputPath,
        css,
        pdf_options: pdfOptions,
        launch_options: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        body_class: [],
      }
    );

    if (pdf) {
      console.log(`  ✅  ${file.output}`);
    }
  } catch (err) {
    console.error(`  ❌  ${file.output}: ${err.message}`);
  }
}

console.log("\n🎉 Done! PDFs saved in project root.\n");
