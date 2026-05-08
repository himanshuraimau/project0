import Papa from "papaparse";
import { SourceError } from "../errors";
import type { ParseResult } from "../types";

const MAX_ROWS_FOR_TABLE = 1000;

export async function parseCsvFromUrl(url: string): Promise<ParseResult> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new SourceError(
      "FETCH_FAILED",
      err instanceof Error ? err.message : "Failed to fetch CSV."
    );
  }
  if (!res.ok) {
    throw new SourceError(
      "FETCH_FAILED",
      `CSV download failed: HTTP ${res.status}`
    );
  }

  const raw = await res.text();
  const parsed = Papa.parse<string[]>(raw, {
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && !parsed.data.length) {
    throw new SourceError(
      "UNSUPPORTED_FORMAT",
      `CSV parse failed: ${parsed.errors[0].message}`
    );
  }

  const rows = parsed.data as string[][];
  if (rows.length === 0) {
    throw new SourceError("NO_CONTENT", "CSV is empty.");
  }

  const [header, ...body] = rows;
  const tableRows = body.slice(0, MAX_ROWS_FOR_TABLE);

  const cleanCell = (c: string) =>
    (c ?? "").toString().replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

  const headerLine = `| ${header.map(cleanCell).join(" | ")} |`;
  const sepLine = `| ${header.map(() => "---").join(" | ")} |`;
  const bodyLines = tableRows.map(
    (r) => `| ${r.map(cleanCell).join(" | ")} |`
  );

  const truncatedNote =
    body.length > MAX_ROWS_FOR_TABLE
      ? `\n\n(${body.length - MAX_ROWS_FOR_TABLE} additional rows omitted)`
      : "";

  const text = `${headerLine}\n${sepLine}\n${bodyLines.join("\n")}${truncatedNote}`;

  return {
    text,
    metadata: {
      totalRows: body.length,
      columns: header.length,
      includedRows: tableRows.length,
    },
  };
}
