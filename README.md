# Assign Person ID Report

Standalone web application for generating **Assign Person ID** reports with two views:
- **Top Sheet**: Plaza-wise summary grouped by Assign Person ID
- **All Account**: Complete account list with all details

## Features

- Two-step file upload (main collection report + optional overdue details)
- Overdue Amount column (appears when overdue file is uploaded)
- Excel export (2 sheets: Person ID Top Sheet + All Account)
- Image export (shareable PNG)
- Sequential upload flow with skip option

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Runs on **http://localhost:5174**

## Build

```bash
npm run build
```

## File Structure

- **Step 1**: Upload Account Wise Actual Card Collection Report (main file)
- **Step 2**: Upload OverdueAccountsDetails (optional — adds Overdue Amount column)

## Column Mappings

### Main File (Collection Report)
- **Parser is now header-driven** — columns are matched by header text (case-insensitive), so blank columns or reordering won't break it.
- Header row: auto-detected (looks for a row containing both "Plaza" and "Account No.")
- Data starts: row immediately below the detected header
- Matching key: **Invoice No.** (header contains "Invoice No.")

**Expected logical columns (blank columns interleaved are ignored):**
| Logical Column | Header Keyword(s) | Notes |
|----------------|-------------------|-------|
| Division | "division" | |
| Area | "area" | |
| Plaza | "plaza" | Required — used for grouping |
| Account No. | "account no" | |
| Customer Name | "customer name" | |
| Product Category | "product category" | |
| Assign Person ID | "assign person" | |
| Invoice No. | "invoice no" | Matching key with overdue file |
| Invoice Date | "invoice date" | |
| Matured Date | "matured" | |
| Per Month Schedule | "per month" | |
| Collection Target | "collection target" | |
| Collection Achieve | "collection achieve" | Parsed to number |
| Collection Advance | "collection advance" | Parsed to number |
| Total Collection | "total collection" | Falls back to Achieve + Advance |

### Overdue File
- Header rows: 1-6, Data starts: Row 7 (index 6)
- Sale Invoice: Column H (index 7) — matching key
- Overdue Amount: Column AD (index 29)

## Developer

Developed by: **Md. Rezaul Karim RCM**
