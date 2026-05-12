import { mkdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const manualDir = 'docs/manuals';
const manuals = ['user-manual.md', 'developer-guide.md'];

const escapeHtml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inCode = false;
  let codeLines = [];

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  const closeCode = () => {
    if (inCode) {
      html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      codeLines = [];
      inCode = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        closeCode();
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      closeList();
      html.push(`<p>${escapeHtml(line)}</p>`);
    } else if (line.trim()) {
      closeList();
      html.push(`<p>${escapeHtml(line)}</p>`);
    } else {
      closeList();
    }
  }

  closeCode();
  closeList();
  return html.join('\n');
}

function buildDocument(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      color: #17202a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.55;
      margin: 0;
      padding: 40px;
    }
    h1 {
      border-bottom: 2px solid #1f5d8c;
      color: #10384f;
      font-size: 26px;
      margin: 0 0 24px;
      padding-bottom: 10px;
    }
    h2 {
      color: #1f5d8c;
      font-size: 17px;
      margin: 24px 0 8px;
    }
    p,
    li {
      margin: 0 0 8px;
    }
    ul {
      margin: 0 0 12px 18px;
      padding: 0;
    }
    code,
    pre {
      background: #eef4f8;
      border-radius: 4px;
      font-family: "SFMono-Regular", Consolas, monospace;
    }
    code {
      padding: 1px 3px;
    }
    pre {
      padding: 10px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

await mkdir(manualDir, { recursive: true });
const browser = await chromium.launch(chromiumLaunchOptions());

try {
  for (const manual of manuals) {
    const sourcePath = join(manualDir, manual);
    const markdown = await readFile(sourcePath, 'utf8');
    const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? basename(manual, '.md');
    const page = await browser.newPage();
    await page.setContent(buildDocument(title, renderMarkdown(markdown)), { waitUntil: 'networkidle' });
    await page.pdf({
      format: 'A4',
      margin: { bottom: '16mm', left: '14mm', right: '14mm', top: '16mm' },
      outline: true,
      path: join(manualDir, `${basename(manual, '.md')}.pdf`),
      printBackground: true,
      tagged: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

function chromiumLaunchOptions() {
  return { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL ?? 'chrome' };
}
