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

export function parseExcelData(rows) {
  const HEADER_ROW_INDEX = 5
  const collectionCol = 20 // Column U - Collection Achieve
  const collectionAdvanceCol = 22 // Column W - Collection Advance
  const totalCollectionCol = 23 // Column X - Total Collection
  const invoiceDateCol = 14 // Column O

  if (!rows[HEADER_ROW_INDEX] || rows[HEADER_ROW_INDEX].length === 0) {
    throw new Error('Header row (row 6) not found.')
  }

  const headerRow = rows[HEADER_ROW_INDEX]
  const headers = headerRow.map(cell => cell != null ? String(cell).toLowerCase().trim() : '')
  const plazaCol = headers.findIndex(h => h && h.includes('plaza'))

  if (plazaCol === -1) throw new Error('Plaza column not found.')

  const allAccountDetails = []

  for (let i = HEADER_ROW_INDEX + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const plaza = row[plazaCol]
    const rawCollection = row[collectionCol]
    const rawAdvance = row[collectionAdvanceCol]
    const invoiceDate = invoiceDateCol !== -1 ? row[invoiceDateCol] : null

    let collection = 0
    if (rawCollection != null && rawCollection !== '') {
      const cleaned = String(rawCollection).replace(/[,\s]/g, '').trim()
      collection = parseFloat(cleaned) || 0
    }

    let advance = 0
    if (rawAdvance != null && rawAdvance !== '') {
      const cleaned = String(rawAdvance).replace(/[,\s]/g, '').trim()
      advance = parseFloat(cleaned) || 0
    }

    if (!plaza || String(plaza).toLowerCase().trim() === 'plaza') continue

    allAccountDetails.push({
      division: row[2] || '',           // Column C
      area: row[3] || '',              // Column D
      plaza: plaza,                    // Column E (by header lookup)
      accountNo: row[5] || '',         // Column F
      customerName: row[6] || '',      // Column G
      productCategory: row[7] || '',   // Column H
      assignPersonId: row[8] || '',    // Column I
      invoiceNo: row[13] || '',        // Column N
      invoiceDate: invoiceDate,        // Column O
      maturedDate: row[15] || '',      // Column P
      perMonthSchedule: row[16] || '', // Column Q
      collectionTarget: row[18] || '', // Column S
      collectionAchieve: collection,   // Column U
      collectionAdvance: advance,     // Column W
      totalCollection: row[totalCollectionCol] != null ? row[totalCollectionCol] : (collection + advance), // Column X
    })
  }

  return { allAccountDetails }
}
