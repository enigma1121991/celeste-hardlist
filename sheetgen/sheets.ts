import { google } from 'googleapis';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

interface SheetCell {
  value: string;
  hyperlinks: string[]; // Changed to array to support multiple links per cell
}

/**
 * Extract Google Sheets ID from a URL or return as-is if already an ID
 */
export function extractSheetId(urlOrId: string): string {
  // Check if it's already just an ID (no slashes or special chars)
  if (!/[\/\?]/.test(urlOrId)) {
    return urlOrId;
  }

  // Extract from various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error(`Could not extract Google Sheets ID from: ${urlOrId}`);
}

/**
 * Get Google Sheets authentication
 * Supports both API key (simpler) and OAuth2 (more secure)
 */
async function getAuth() {
  // Option 1: API Key (simpler, read-only access to public sheets)
  if (process.env.GOOGLE_SHEETS_API_KEY) {
    return process.env.GOOGLE_SHEETS_API_KEY;
  }

  // Option 2: Service Account (for private sheets)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (!existsSync(keyPath)) {
      throw new Error(`Service account key file not found: ${keyPath}`);
    }

    const keyFile = JSON.parse(await readFile(keyPath, 'utf-8'));
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return auth;
  }

  throw new Error(
    'No authentication configured. Set GOOGLE_SHEETS_API_KEY or GOOGLE_SERVICE_ACCOUNT_PATH in .env'
  );
}

/**
 * Fetch data from Google Sheets with hyperlinks preserved
 */
export async function fetchGoogleSheet(
  spreadsheetId: string,
  sheetName?: string
): Promise<SheetCell[][]> {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Get sheet names if not specified
  let rangeName = sheetName || 'Sheet1';

  try {
    // Fetch the spreadsheet metadata to find the sheet
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheet = metadata.data.sheets?.[0];
    if (!sheet?.properties?.title) {
      throw new Error('No sheets found in spreadsheet');
    }

    // Use the first sheet if no name specified
    if (!sheetName) {
      rangeName = sheet.properties.title;
      console.log(`Using sheet: "${rangeName}"`);
    }

    // Fetch with formatting to get hyperlinks and text format runs
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [rangeName],
      fields: 'sheets(data(rowData(values(hyperlink,formattedValue,effectiveValue,textFormatRuns))))',
    });

    const sheetData = response.data.sheets?.[0]?.data?.[0]?.rowData;
    if (!sheetData) {
      throw new Error('No data found in sheet');
    }

    // Convert to our format
    const rows: SheetCell[][] = [];

    for (const row of sheetData) {
      const cells: SheetCell[] = [];
      
      if (row.values) {
        for (const cell of row.values) {
          const value = 
            cell.formattedValue || 
            cell.effectiveValue?.stringValue || 
            cell.effectiveValue?.numberValue?.toString() || 
            '';
          
          const hyperlinks: string[] = [];
          
          // Check for textFormatRuns (multiple links in rich text)
          if (cell.textFormatRuns && cell.textFormatRuns.length > 0) {
            for (const run of cell.textFormatRuns) {
              if (run.format?.link?.uri) {
                hyperlinks.push(run.format.link.uri);
              }
            }
          }
          
          // Fallback to single hyperlink if no textFormatRuns
          if (hyperlinks.length === 0 && cell.hyperlink) {
            hyperlinks.push(cell.hyperlink);
          }
          
          cells.push({
            value,
            hyperlinks,
          });
        }
      }
      
      rows.push(cells);
    }

    return rows;
  } catch (error: any) {
    if (error.code === 404) {
      throw new Error(
        `Spreadsheet not found. Make sure the sheet is public or you have access. ID: ${spreadsheetId}`
      );
    }
    throw error;
  }
}

/**
 * Convert SheetCell[][] to CSV-like string[][] format
 * Appends ALL hyperlinks to cell values when present (but not on header row or metadata columns)
 */
export function sheetDataToCsvFormat(data: SheetCell[][]): string[][] {
  return data.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      // Don't append URLs to the first row (headers) or first 4 columns (metadata)
      // Only append URLs to player data cells
      const isHeaderRow = rowIndex === 0;
      const isMetadataColumn = colIndex < 4; // Map, Clears, FCs, Video columns
      
      if (cell.hyperlinks.length > 0 && !isHeaderRow && !isMetadataColumn) {
        // Append ALL hyperlinks to cell value for player run cells
        const links = cell.hyperlinks.join(' ');
        return cell.value ? `${cell.value} ${links}` : links;
      }
      
      // For metadata columns (especially column 3, the video column), include the hyperlink
      if (cell.hyperlinks.length > 0 && isMetadataColumn && colIndex === 3) {
        const links = cell.hyperlinks.join(' ');
        return cell.value ? `${cell.value} ${links}` : links;
      }
      
      return cell.value;
    })
  );
}

