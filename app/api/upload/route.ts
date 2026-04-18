import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ─── PDF parsing ─────────────────────────────────────────────────────────────
async function extractPDF(buffer: Buffer): Promise<string> {
  // pdf-parse has no default export in its types; import carefully
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text as string;
}

// ─── DOCX parsing ────────────────────────────────────────────────────────────
async function extractDOCX(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value as string;
}

// ─── TXT ─────────────────────────────────────────────────────────────────────
function extractTXT(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.fountain', '.fdx'];

    if (!allowedTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${ext}. Supported: PDF, DOCX, TXT, Fountain, FDX` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = '';

    if (ext === '.pdf') {
      text = await extractPDF(buffer);
    } else if (ext === '.docx' || ext === '.doc') {
      text = await extractDOCX(buffer);
    } else {
      // txt, fountain, fdx — all plain text
      text = extractTXT(buffer);
    }

    // Clean up extracted text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n') // collapse excessive blank lines
      .trim();

    if (!text.length) {
      return NextResponse.json(
        { error: 'Could not extract text from file. The file may be scanned or image-based.' },
        { status: 422 }
      );
    }

    // Estimate page count (screenplay: ~55 lines per page)
    const lineCount = text.split('\n').length;
    const estimatedPages = Math.round(lineCount / 55);

    // Warn if very large — Claude can handle it but user should know
    const charCount = text.length;
    const isLarge = charCount > 80_000; // ~60 pages

    return NextResponse.json({
      text,
      filename: file.name,
      charCount,
      estimatedPages,
      isLarge,
      warning: isLarge
        ? `This script is approximately ${estimatedPages} pages. Analysis will be thorough but may take up to 2 minutes.`
        : null,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Failed to parse file. Please check the file is not password-protected or corrupted.' },
      { status: 500 }
    );
  }
}
