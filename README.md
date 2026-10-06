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
- Header: Row 6 (index 5), Data starts: Row 7
- Invoice No.: Column N (index 13) — matching key

### Overdue File
- Header rows: 1-6, Data starts: Row 7 (index 6)
- Sale Invoice: Column H (index 7) — matching key
- Overdue Amount: Column AD (index 29)

## Developer

Developed by: **Md. Rezaul Karim RCM**
