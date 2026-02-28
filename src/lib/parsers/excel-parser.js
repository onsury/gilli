// src/lib/parsers/excel-parser.js
// Parses product catalog files from billing software (CSV, Excel)
// Downloads from Meta, parses columns, maps product codes

import { downloadMedia } from "../whatsapp.js";

// Known column header patterns for different billing software
const COLUMN_PATTERNS = {
  name: /^(item|product|name|description|particulars|item.?name|product.?name|goods)/i,
  code: /^(code|item.?code|product.?code|sku|barcode|hsn|part.?no|article)/i,
  price: /^(price|rate|mrp|selling|amount|sp|sell.?price|unit.?price)/i,
  unit: /^(unit|uom|qty.?unit|measure)/i,
  stock: /^(stock|qty|quantity|balance|available|closing|current)/i,
  hsn: /^(hsn|hsn.?code|sac)/i,
  gst: /^(gst|tax|tax.?rate|gst.?rate|igst|cgst|sgst)/i,
};

// Parse a CSV string into product array
export function parseCSV(csvText, billingSoftware = "unknown") {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return { products: [], error: "File too short" };

  // Find header row (might not be first row — some exports have title rows)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const cols = parseCSVLine(lines[i]);
    const matches = cols.filter(c => Object.values(COLUMN_PATTERNS).some(p => p.test(c.trim())));
    if (matches.length >= 2) {
      headerIdx = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerIdx]);
  const columnMap = mapColumns(headers);

  if (!columnMap.name) {
    return { products: [], error: "Could not find product name column" };
  }

  const products = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const name = cols[columnMap.name]?.trim();
    if (!name || name.length < 2) continue;

    const product = {
      name,
      code: columnMap.code !== undefined ? (cols[columnMap.code]?.trim() || "") : "",
      price: columnMap.price !== undefined ? parseFloat(cols[columnMap.price]) || 0 : 0,
      unit: columnMap.unit !== undefined ? (cols[columnMap.unit]?.trim() || "") : "",
      stock: columnMap.stock !== undefined ? parseInt(cols[columnMap.stock]) || 0 : 0,
      hsn: columnMap.hsn !== undefined ? (cols[columnMap.hsn]?.trim() || "") : "",
      gst: columnMap.gst !== undefined ? parseFloat(cols[columnMap.gst]) || 0 : 0,
      available: true,
      source: billingSoftware,
    };

    // Skip if price is unreasonable (likely a header or total row)
    if (product.price > 100000) continue;

    products.push(product);
  }

  return {
    products,
    columnsFound: Object.keys(columnMap),
    totalRows: lines.length - headerIdx - 1,
  };
}

// Map column headers to our fields
function mapColumns(headers) {
  const map = {};

  headers.forEach((header, idx) => {
    const h = header.trim();
    for (const [field, pattern] of Object.entries(COLUMN_PATTERNS)) {
      if (pattern.test(h) && map[field] === undefined) {
        map[field] = idx;
        break;
      }
    }
  });

  return map;
}

// Parse a single CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Download and parse a file from WhatsApp
export async function parseUploadedFile(mediaId, fileName, mimeType, billingSoftware) {
  try {
    const buffer = await downloadMedia(mediaId);
    if (!buffer) return { products: [], error: "Could not download file" };

    // Handle CSV
    if (mimeType.includes("csv") || fileName.endsWith(".csv")) {
      const text = buffer.toString("utf-8");
      return parseCSV(text, billingSoftware);
    }

    // Handle TSV
    if (mimeType.includes("tab") || fileName.endsWith(".tsv")) {
      const text = buffer.toString("utf-8").replace(/\t/g, ",");
      return parseCSV(text, billingSoftware);
    }

    // Handle Excel (.xlsx, .xls) — needs xlsx library
    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls")
    ) {
      // Dynamic import to avoid loading xlsx when not needed
      try {
        const XLSX = (await import("xlsx")).default;
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(firstSheet);
        return parseCSV(csv, billingSoftware);
      } catch (xlsxErr) {
        console.error("xlsx parse error:", xlsxErr.message);
        return { products: [], error: "Excel parsing failed. Try exporting as CSV." };
      }
    }

    // Handle plain text (some shops might send .txt files)
    if (mimeType.includes("text") || fileName.endsWith(".txt")) {
      const text = buffer.toString("utf-8");
      return parseCSV(text, billingSoftware);
    }

    return { products: [], error: `Unsupported file type: ${mimeType}` };
  } catch (err) {
    console.error("File parse error:", err);
    return { products: [], error: err.message };
  }
}

// Build searchable catalog text from parsed products
export function buildCatalogText(products) {
  return products
    .map(p => {
      let text = p.name;
      if (p.code) text += ` (${p.code})`;
      if (p.price) text += ` ₹${p.price}`;
      if (p.unit) text += ` per ${p.unit}`;
      return text;
    })
    .join(", ");
}