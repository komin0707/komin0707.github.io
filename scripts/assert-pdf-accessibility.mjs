import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';

const pdfPaths = ['docs/manuals/user-manual.pdf', 'docs/manuals/developer-guide.pdf'];
const requiredMarkers = ['/StructTreeRoot', '/MarkInfo', '/Marked true', '/Lang ('];

for (const pdfPath of pdfPaths) {
  const pdf = readFileSync(pdfPath);
  const missingMarkers = requiredMarkers.filter((marker) => !pdf.includes(Buffer.from(marker)));

  if (missingMarkers.length > 0) {
    throw new Error(`${pdfPath} is missing accessible PDF markers: ${missingMarkers.join(', ')}`);
  }
}
