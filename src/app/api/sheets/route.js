import { NextResponse } from "next/server";
import Papa from "papaparse";

export const revalidate = 0;

export async function GET() {
  const sheetId =
    process.env.SHEET_ID || "19rIbYezEOrgvfKkW_tz63yCc4AGjWbXSFj46l25Hens";

  const sheetName = encodeURIComponent("📊 Dashboard");
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Sheets returned ${res.status}. Share the sheet publicly (Anyone with link → Viewer).` },
        { status: 400 }
      );
    }

    const csv = await res.text();
    const result = Papa.parse(csv, { skipEmptyLines: "greedy" });
    const rows = result.data;

    // Auto-detect header row (the one containing "City")
    let headerRowIndex = 7; // fallback: row 8 (0-indexed)
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      if (rows[i].some((cell) => cell?.toString().toLowerCase().trim() === "city")) {
        headerRowIndex = i;
        break;
      }
    }

    if (rows.length <= headerRowIndex) {
      return NextResponse.json({ error: "Header row not found" }, { status: 400 });
    }

    const headers = rows[headerRowIndex].map((h) => h.toString().trim());
    const dataRows = rows.slice(headerRowIndex + 1);

    const data = dataRows
      .filter((row) => row.some((cell) => cell?.toString().trim()))
      .map((row) => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (row[i] || "").toString().trim(); });
        return obj;
      })
      .filter((row) => row["City"]?.trim());

    return NextResponse.json({
      data,
      headers,
      count: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
