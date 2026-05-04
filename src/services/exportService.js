import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'

export async function exportAsImage(containerRef) {
  if (!containerRef.current) return

  const btnContainer = containerRef.current.querySelector('.btn-container')
  const tabs = containerRef.current.querySelectorAll('.report-tabs, .tab-section')
  const monthHeader = containerRef.current.querySelector('.month-header')
  const devCredits = containerRef.current.querySelectorAll('.developer-credit-top, .developer-credit-bottom')
  const originalContainer = containerRef.current

  if (btnContainer) btnContainer.style.display = 'none'
  tabs.forEach(tab => tab.style.display = 'none')

  const originalStyles = {
    fontSize: originalContainer.style.fontSize,
    padding: originalContainer.style.padding,
    width: originalContainer.style.width,
    maxWidth: originalContainer.style.maxWidth,
  }

  try {
    originalContainer.style.fontSize = '10px'
    originalContainer.style.padding = '10px'
    originalContainer.style.width = '1400px'
    originalContainer.style.maxWidth = '1400px'

    const headers = originalContainer.querySelectorAll('.report-table th')
    const cells = originalContainer.querySelectorAll('.report-table td')
    const subtotalRows = originalContainer.querySelectorAll('.subtotal-row')

    const origHeaderStyles = []
    headers.forEach(h => {
      origHeaderStyles.push({ fontSize: h.style.fontSize, padding: h.style.padding })
      h.style.fontSize = '12px'
      h.style.padding = '7px 5px'
      h.style.whiteSpace = 'nowrap'
    })

    const origCellStyles = []
    cells.forEach(c => {
      origCellStyles.push({ fontSize: c.style.fontSize, padding: c.style.padding })
      c.style.fontSize = '11px'
      c.style.padding = '6px 5px'
    })

    const origSubtotalStyles = []
    subtotalRows.forEach(row => {
      const rowCells = row.querySelectorAll('td')
      const cs = []
      rowCells.forEach(cell => {
        cs.push({ backgroundColor: cell.style.backgroundColor, color: cell.style.color })
        cell.style.backgroundColor = '#1e40af'
        cell.style.color = '#ffffff'
        cell.style.fontWeight = '800'
      })
      origSubtotalStyles.push(cs)
    })

    let origTitleStyles = {}
    if (monthHeader) {
      origTitleStyles = { fontSize: monthHeader.style.fontSize, padding: monthHeader.style.padding }
      monthHeader.style.fontSize = '16px'
      monthHeader.style.padding = '8px'
    }

    const canvas = await html2canvas(originalContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      width: 1400,
      scrollY: -window.scrollY,
      scrollX: -window.scrollX,
      windowWidth: 1400,
    })

    // Restore
    originalContainer.style.fontSize = originalStyles.fontSize
    originalContainer.style.padding = originalStyles.padding
    originalContainer.style.width = originalStyles.width
    originalContainer.style.maxWidth = originalStyles.maxWidth

    headers.forEach((h, i) => {
      h.style.fontSize = origHeaderStyles[i].fontSize
      h.style.padding = origHeaderStyles[i].padding
      h.style.whiteSpace = ''
    })
    cells.forEach((c, i) => {
      c.style.fontSize = origCellStyles[i].fontSize
      c.style.padding = origCellStyles[i].padding
    })
    subtotalRows.forEach((row, i) => {
      const rowCells = row.querySelectorAll('td')
      rowCells.forEach((cell, j) => {
        if (origSubtotalStyles[i]?.[j]) {
          cell.style.backgroundColor = origSubtotalStyles[i][j].backgroundColor
          cell.style.color = origSubtotalStyles[i][j].color
          cell.style.fontWeight = ''
        }
      })
    })
    if (monthHeader) {
      monthHeader.style.fontSize = origTitleStyles.fontSize
      monthHeader.style.padding = origTitleStyles.padding
    }

    const link = document.createElement('a')
    link.download = `Person_ID_Report_${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  } finally {
    if (btnContainer) btnContainer.style.display = 'flex'
    tabs.forEach(tab => tab.style.display = '')
  }
}

export function exportAsExcel(data, overdueData) {
  const wb = XLSX.utils.book_new()

  if (data.allAccountDetails && data.allAccountDetails.length > 0) {
    addPersonIdTopSheet(wb, data.allAccountDetails, 'Person ID Top Sheet', overdueData)
    addAllAccountSheet(wb, data.allAccountDetails, 'All Account', overdueData)
  }

  XLSX.writeFile(wb, `Assign_Person_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function addPersonIdTopSheet(wb, accountDetails, sheetName, overdueData) {
  if (!accountDetails || accountDetails.length === 0) return

  const hasOverdue = overdueData && overdueData.size > 0
  const personGroups = {}

  accountDetails.forEach(account => {
    const plaza = account.plaza || 'Unknown'
    const personId = account.assignPersonId || 'Unknown'
    const key = `${plaza}|||${personId}`

    if (!personGroups[key]) {
      personGroups[key] = { plaza, personId, totalQty: 0, collectedQty: 0, targetAmount: 0, achieveAmount: 0, overdueAmount: 0 }
    }

    personGroups[key].totalQty++

    let target = 0
    if (account.collectionTarget != null && account.collectionTarget !== '') {
      target = parseFloat(String(account.collectionTarget).replace(/[,\s]/g, '')) || 0
    }
    let achieve = 0
    if (account.collectionAchieve != null && account.collectionAchieve !== '') {
      achieve = parseFloat(String(account.collectionAchieve).replace(/[,\s]/g, '')) || 0
    }

    personGroups[key].targetAmount += target
    personGroups[key].achieveAmount += achieve
    if (achieve > 0) personGroups[key].collectedQty++

    if (hasOverdue && account.invoiceNo) {
      personGroups[key].overdueAmount += overdueData.get(String(account.invoiceNo).trim()) || 0
    }
  })

  const sortedPersons = Object.values(personGroups)
    .map(v => ({
      ...v,
      notCollectedQty: v.totalQty - v.collectedQty,
      percentage: ((v.collectedQty / v.totalQty) * 100).toFixed(2),
      amountPercentage: v.targetAmount > 0 ? ((v.achieveAmount / v.targetAmount) * 100).toFixed(2) : '0.00',
    }))
    .sort((a, b) => a.plaza !== b.plaza ? a.plaza.localeCompare(b.plaza) : a.personId.localeCompare(b.personId))

  const plazaGroups = {}
  sortedPersons.forEach(p => {
    if (!plazaGroups[p.plaza]) plazaGroups[p.plaza] = []
    plazaGroups[p.plaza].push(p)
  })

  const wsData = []
  Object.entries(plazaGroups).forEach(([plaza, persons]) => {
    persons.forEach(person => {
      const row = {
        'Plaza Name': person.plaza,
        'Assign Person ID': person.personId,
        'AC Qty': person.totalQty,
        'Collection Achieve Qty (> 0)': person.collectedQty,
        'Not Collected Qty': person.notCollectedQty,
        'Coll %': person.percentage + '%',
        'Collection Target Amount': parseFloat(person.targetAmount.toFixed(2)),
        'Collection Achieve Amount': parseFloat(person.achieveAmount.toFixed(2)),
        'Coll Amount %': person.amountPercentage + '%',
      }
      if (hasOverdue) row['Overdue Amount'] = parseFloat(person.overdueAmount.toFixed(2))
      wsData.push(row)
    })

    const sub = persons.reduce((acc, p) => ({
      totalQty: acc.totalQty + p.totalQty,
      collectedQty: acc.collectedQty + p.collectedQty,
      notCollectedQty: acc.notCollectedQty + p.notCollectedQty,
      targetAmount: acc.targetAmount + p.targetAmount,
      achieveAmount: acc.achieveAmount + p.achieveAmount,
      overdueAmount: acc.overdueAmount + p.overdueAmount,
    }), { totalQty: 0, collectedQty: 0, notCollectedQty: 0, targetAmount: 0, achieveAmount: 0, overdueAmount: 0 })

    const subRow = {
      'Plaza Name': `${plaza} Subtotal`,
      'Assign Person ID': '',
      'AC Qty': sub.totalQty,
      'Collection Achieve Qty (> 0)': sub.collectedQty,
      'Not Collected Qty': sub.notCollectedQty,
      'Coll %': (sub.totalQty > 0 ? ((sub.collectedQty / sub.totalQty) * 100).toFixed(2) : '0.00') + '%',
      'Collection Target Amount': parseFloat(sub.targetAmount.toFixed(2)),
      'Collection Achieve Amount': parseFloat(sub.achieveAmount.toFixed(2)),
      'Coll Amount %': (sub.targetAmount > 0 ? ((sub.achieveAmount / sub.targetAmount) * 100).toFixed(2) : '0.00') + '%',
    }
    if (hasOverdue) subRow['Overdue Amount'] = parseFloat(sub.overdueAmount.toFixed(2))
    wsData.push(subRow)
  })

  const grand = sortedPersons.reduce((acc, p) => ({
    totalQty: acc.totalQty + p.totalQty,
    collectedQty: acc.collectedQty + p.collectedQty,
    notCollectedQty: acc.notCollectedQty + p.notCollectedQty,
    targetAmount: acc.targetAmount + p.targetAmount,
    achieveAmount: acc.achieveAmount + p.achieveAmount,
    overdueAmount: acc.overdueAmount + p.overdueAmount,
  }), { totalQty: 0, collectedQty: 0, notCollectedQty: 0, targetAmount: 0, achieveAmount: 0, overdueAmount: 0 })

  const grandRow = {
    'Plaza Name': 'Grand Total',
    'Assign Person ID': '',
    'AC Qty': grand.totalQty,
    'Collection Achieve Qty (> 0)': grand.collectedQty,
    'Not Collected Qty': grand.notCollectedQty,
    'Coll %': (grand.totalQty > 0 ? ((grand.collectedQty / grand.totalQty) * 100).toFixed(2) : '0.00') + '%',
    'Collection Target Amount': parseFloat(grand.targetAmount.toFixed(2)),
    'Collection Achieve Amount': parseFloat(grand.achieveAmount.toFixed(2)),
    'Coll Amount %': (grand.targetAmount > 0 ? ((grand.achieveAmount / grand.targetAmount) * 100).toFixed(2) : '0.00') + '%',
  }
  if (hasOverdue) grandRow['Overdue Amount'] = parseFloat(grand.overdueAmount.toFixed(2))
  wsData.push(grandRow)

  const ws = XLSX.utils.json_to_sheet(wsData)
  ws['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 18 },
    { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 15 },
    ...(hasOverdue ? [{ wch: 18 }] : []),
  ]
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
}

function addAllAccountSheet(wb, accountDetails, sheetName, overdueData) {
  if (!accountDetails || accountDetails.length === 0) return

  const hasOverdue = overdueData && overdueData.size > 0

  const parseAmt = (val) => {
    if (val == null || val === '') return 0
    return parseFloat(String(val).replace(/[,\s]/g, '')) || 0
  }

  const formatDate = (val) => {
    if (!val) return '-'
    if (typeof val === 'number') {
      const d = new Date((val - 25569) * 86400 * 1000)
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB')
    }
    return String(val)
  }

  const wsData = accountDetails.map((acc, idx) => {
    const row = {
      'S/N': idx + 1,
      'Division': acc.division || '-',
      'Area': acc.area || '-',
      'Plaza': acc.plaza || '-',
      'Account No.': acc.accountNo || '-',
      'Customer Name': acc.customerName || '-',
      'Product Category': acc.productCategory || '-',
      'Assign Person ID': acc.assignPersonId || '-',
      'Invoice No.': acc.invoiceNo || '-',
      'Invoice Date': formatDate(acc.invoiceDate),
      'Matured Date': formatDate(acc.maturedDate),
      'Per Month Schedule': parseFloat(parseAmt(acc.perMonthSchedule).toFixed(2)),
      'Collection Target': parseFloat(parseAmt(acc.collectionTarget).toFixed(2)),
      'Collection Achieve': parseFloat(parseAmt(acc.collectionAchieve).toFixed(2)),
    }
    if (hasOverdue) {
      const key = acc.invoiceNo ? String(acc.invoiceNo).trim() : ''
      row['Overdue Amount'] = parseFloat((overdueData.get(key) || 0).toFixed(2))
    }
    return row
  })

  let totalTarget = 0, totalAchieve = 0, totalOverdue = 0
  accountDetails.forEach(acc => {
    totalTarget += parseAmt(acc.collectionTarget)
    totalAchieve += parseAmt(acc.collectionAchieve)
    if (hasOverdue && acc.invoiceNo) totalOverdue += overdueData.get(String(acc.invoiceNo).trim()) || 0
  })

  const totalRow = {
    'S/N': '', 'Division': '', 'Area': '', 'Plaza': '', 'Account No.': '',
    'Customer Name': '', 'Product Category': '', 'Assign Person ID': '',
    'Invoice No.': '', 'Invoice Date': '',
    'Matured Date': `Total (${accountDetails.length} accounts)`,
    'Per Month Schedule': '',
    'Collection Target': parseFloat(totalTarget.toFixed(2)),
    'Collection Achieve': parseFloat(totalAchieve.toFixed(2)),
  }
  if (hasOverdue) totalRow['Overdue Amount'] = parseFloat(totalOverdue.toFixed(2))
  wsData.push(totalRow)

  const ws = XLSX.utils.json_to_sheet(wsData)
  ws['!cols'] = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 16 },
    { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 12 },
    { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    ...(hasOverdue ? [{ wch: 16 }] : []),
  ]
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
}
