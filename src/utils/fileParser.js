import JSZip from 'jszip';

export async function extractText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pptx')) return extractPPTX(file);
  if (name.endsWith('.xlsx')) return extractXLSX(file);
  throw new Error(`Unsupported file type: ${file.name}. Use .pptx or .xlsx files.`);
}

async function extractPPTX(file) {
  const zip = await JSZip.loadAsync(file);
  const slides = [];

  const slideFiles = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)\.xml$/)[1]);
      const nb = parseInt(b.match(/(\d+)\.xml$/)[1]);
      return na - nb;
    });

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('text');
    const text = pptxXmlToText(xml);
    if (text.trim()) slides.push(`[Slide ${i + 1}]\n${text}`);
  }

  return slides.join('\n\n') || '(no text content found in presentation)';
}

function pptxXmlToText(xml) {
  const paragraphs = xml.split(/<a:p[\s>]/);
  const lines = [];
  for (const para of paragraphs) {
    const runs = para.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) || [];
    const line = runs.map(r => r.replace(/<[^>]+>/g, '')).join('').trim();
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

async function extractXLSX(file) {
  const zip = await JSZip.loadAsync(file);

  // Parse shared strings
  const sharedStrings = [];
  if (zip.files['xl/sharedStrings.xml']) {
    const ssXml = await zip.files['xl/sharedStrings.xml'].async('text');
    const siBlocks = ssXml.match(/<si>[\s\S]*?<\/si>/g) || [];
    for (const si of siBlocks) {
      const tMatches = si.match(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g) || [];
      sharedStrings.push(tMatches.map(t => t.replace(/<[^>]+>/g, '')).join(''));
    }
  }

  // Parse sheet names from workbook
  const sheetNames = {};
  if (zip.files['xl/workbook.xml']) {
    const wbXml = await zip.files['xl/workbook.xml'].async('text');
    const sheetTags = wbXml.match(/<sheet[^/]*/g) || [];
    sheetTags.forEach(tag => {
      const nameM = tag.match(/name="([^"]+)"/);
      const ridM = tag.match(/r:id="([^"]+)"/);
      if (nameM && ridM) sheetNames[ridM[1]] = nameM[1];
    });
  }

  const sections = [];
  const wsFiles = Object.keys(zip.files)
    .filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)\.xml$/)[1]);
      const nb = parseInt(b.match(/(\d+)\.xml$/)[1]);
      return na - nb;
    });

  for (const wsFile of wsFiles) {
    const sheetNum = wsFile.match(/(\d+)\.xml$/)[1];
    const sheetName = sheetNames[`rId${sheetNum}`] || `Sheet${sheetNum}`;
    const wsXml = await zip.files[wsFile].async('text');
    const rows = wsXml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];
    const rowTexts = [];

    for (const row of rows) {
      const cells = row.match(/<c[^>]*>[\s\S]*?<\/c>/g) || [];
      const cellValues = [];

      for (const cell of cells) {
        const isShared = /\bt="s"/.test(cell);
        const isInline = /\bt="inlineStr"/.test(cell);

        if (isInline) {
          const tM = cell.match(/<t(?:\s[^>]*)?>([^<]*)<\/t>/);
          if (tM) cellValues.push(decodeXmlEntities(tM[1]));
        } else if (isShared) {
          const vM = cell.match(/<v>(\d+)<\/v>/);
          if (vM) {
            const idx = parseInt(vM[1]);
            if (sharedStrings[idx] !== undefined) {
              cellValues.push(decodeXmlEntities(sharedStrings[idx]));
            }
          }
        } else {
          const vM = cell.match(/<v>([^<]*)<\/v>/);
          if (vM && vM[1].trim()) cellValues.push(vM[1].trim());
        }
      }

      const rowText = cellValues.filter(Boolean).join(' | ');
      if (rowText.trim()) rowTexts.push(rowText);
    }

    if (rowTexts.length) {
      sections.push(`[Sheet: ${sheetName}]\n${rowTexts.join('\n')}`);
    }
  }

  return sections.join('\n\n') || '(no text content found in spreadsheet)';
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
