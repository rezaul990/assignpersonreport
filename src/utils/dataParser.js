/**
 * Parse the OverdueAccountsDetails XLS file.
 * Returns a Map: invoiceNo (string) -> overdueAmount (number)
 * - Header rows 1-6 (data starts row 7, index 6)
 * - Column H (index 7): Sale Invoice (Invoice No.) - matching key
 * - Column AD (index 29): Overdue amount
 */
export function parseOverdueData(rows) {
  const overdueMap = new Map()

  for (let i = 6; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const rowText = row.join(' ').toLowerCase()
    if (
      rowText.includes('designed and developed') ||
      rowText.includes('s/l no') ||
      rowText.includes('sl no') ||
      rowText.includes('sale invoice') ||
      rowText.includes('overdue')
    ) continue

    const invoiceNo = row[7]   // Column H - Sale Invoice
    const overdueRaw = row[29] // Column AD - Overdue Amount

    if (!invoiceNo || invoiceNo === '' || invoiceNo === null) continue

    const invoiceKey = String(invoiceNo).trim()
    if (!invoiceKey) continue

    let overdue = 0
    if (overdueRaw != null && overdueRaw !== '') {
      const cleaned = String(overdueRaw).replace(/[,\s]/g, '').trim()
      overdue = parseFloat(cleaned) || 0
    }

    overdueMap.set(invoiceKey, (overdueMap.get(invoiceKey) || 0) + overdue)
  }

  return overdueMap
}

/**
 * Parse the Account Wise Actual Card Collection Report
 * (e.g. HireTargetAccounts.xls).
 *
 * The report ships with several title rows above the real column header and
 * contains *blank columns* interleaved between the data columns. To stay
 * robust against that (and against future column reordering) every column is
 * resolved by matching its header text rather than by a fixed index.
 *
 * Logical column layout:
 *   S/N            -> column B (index 1)            [row counter, not parsed]
 *   Division       -> column C / index 2
 *   Area           -> column D / index 3
 *   Plaza          -> column E / index 4
 *   (blank)        -> column F / index 5
 *   Account No.    -> column G / index 6
 *   Customer Name  -> column H / index 7
 *   Product Cat.   -> column I / index 8
 *   (blank)        -> column J / index 9
 *   Assign Person  -> column K / index 10
 *   (blank/blank)  -> columns L, M (index 11, 12)
 *   Invoice No.    -> column N / index 13  (matching key with overdue file)
 *   Invoice Date   -> column O / index 14
 *   Matured Date   -> column P / index 15
 *   Per Month Sch. -> column Q / index 16
 *   (blank)        -> column R / index 17
 *   Collection Tgt-> column S / index 18
 *   (blank)        -> column T / index 19
 *   Coll. Achieve -> column U / index 20
 *   (blank)        -> column V / index 21
 *   Coll. Advance -> column W / index 22
 *   Total Coll.   -> column X / index 23
 */

/**
 * Return the index of the first column whose header contains `keyword`
 * (case-insensitive), or `undefined` when not found.
 */
function findCol(headers, keyword) {
  const idx = headers.findIndex(h => h != null && String(h).toLowerCase().includes(keyword))
  return idx === -1 ? undefined : idx
}

/** Coerce an Excel cell into a number (strips thousands separators/spaces). */
function toNumber(raw) {
  if (raw == null || raw === '') return 0
  const cleaned = String(raw).replace(/[,\s]/g, '').trim()
  return parseFloat(cleaned) || 0
}

/**
 * Extract the calendar year from an Invoice Date cell.
 * Handles Excel serial numbers, "DD-MMM-YY" / "DD-MMM-YYYY" strings, and
 * generic date strings. Returns null when the year cannot be determined.
 */
function getInvoiceYear(val) {
  if (val == null || val === '') return null
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000)
    if (isNaN(d.getTime())) return null
    return d.getFullYear()
  }
  const s = String(val).trim()
  const m = s.match(/(\d{1,4})$/)
  if (m) {
    let y = parseInt(m[1], 10)
    if (!isNaN(y)) {
      if (y < 100) y += 2000
      return y
    }
  }
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.getFullYear()
  return null
}

export function parseExcelData(rows) {
  // --- Locate the header row ------------------------------------------------
  // The file has 5 title rows above the real column header, so instead of a
  // hard-coded index we detect the row that actually contains the column
  // titles ("Plaza" + "Account No.").
  let headerIdx = -1
  for (let i = 0; i < rows.length; i++) {
    const h = (rows[i] || []).map(cell =>
      cell != null ? String(cell).toLowerCase().trim() : ''
    )
    if (h.includes('plaza') && h.includes('account no.')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) {
    throw new Error('Header row with "Plaza" and "Account No." columns not found.')
  }

  const headerRow = rows[headerIdx].map(cell =>
    cell != null ? String(cell).toLowerCase().trim() : ''
  )

  const col = {
    division:        findCol(headerRow, 'division'),
    area:            findCol(headerRow, 'area'),
    plaza:           findCol(headerRow, 'plaza'),
    accountNo:       findCol(headerRow, 'account no'),
    customerName:    findCol(headerRow, 'customer name'),
    productCategory: findCol(headerRow, 'product category'),
    assignPersonId:  findCol(headerRow, 'assign person'),
    invoiceNo:       findCol(headerRow, 'invoice no'),
    invoiceDate:     findCol(headerRow, 'invoice date'),
    maturedDate:     findCol(headerRow, 'matured'),
    perMonthSchedule: findCol(headerRow, 'per month'),
    collectionTarget:  findCol(headerRow, 'collection target'),
    collectionAchieve: findCol(headerRow, 'collection achieve'),
    collectionAdvance: findCol(headerRow, 'collection advance'),
    totalCollection:   findCol(headerRow, 'total collection'),
  }

  if (col.plaza === undefined) {
    throw new Error('Plaza column not found.')
  }

  const allAccountDetails = []

  // --- Read data rows (everything below the header) -------------------------
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const rowText = row.join(' ').toLowerCase()

    // Skip footer / designer-credit rows printed at the end of the report and
    // any repeated header rows.
    if (
      rowText.includes('designed and developed') ||
      rowText.includes('downloaded time') ||
      (rowText.includes('page ') && rowText.includes('of')) ||
      rowText.includes('s / n') ||
      rowText.includes('sale invoice') ||
      rowText.includes('overdue')
    ) {
      continue
    }

    const plaza = col.plaza !== undefined ? row[col.plaza] : null
    if (!plaza || String(plaza).toLowerCase().trim() === 'plaza') continue

    const collection = toNumber(
      col.collectionAchieve !== undefined ? row[col.collectionAchieve] : ''
    )
    const advance = toNumber(
      col.collectionAdvance !== undefined ? row[col.collectionAdvance] : ''
    )
    const totalRaw = col.totalCollection !== undefined ? row[col.totalCollection] : null

    allAccountDetails.push({
      division:          row[col.division] ?? '',
      area:              row[col.area] ?? '',
      plaza:             plaza,
      accountNo:         row[col.accountNo] ?? '',
      customerName:      row[col.customerName] ?? '',
      productCategory:   row[col.productCategory] ?? '',
      assignPersonId:    row[col.assignPersonId] ?? '',
      invoiceNo:         row[col.invoiceNo] ?? '',
      invoiceDate:       col.invoiceDate !== undefined ? row[col.invoiceDate] : null,
      invoiceYear:       getInvoiceYear(col.invoiceDate !== undefined ? row[col.invoiceDate] : null),
      maturedDate:       row[col.maturedDate] ?? '',
      perMonthSchedule:  row[col.perMonthSchedule] ?? '',
      collectionTarget:  row[col.collectionTarget] ?? '',
      collectionAchieve: collection,
      collectionAdvance: advance,
      // Prefer the file's own Total Collection value; fall back to Achieve+Advance.
      totalCollection:
        totalRaw != null && totalRaw !== '' ? toNumber(totalRaw) : (collection + advance),
    })
  }

  return { allAccountDetails }
}
