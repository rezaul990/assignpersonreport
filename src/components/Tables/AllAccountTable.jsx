import './Table.css'

const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function AllAccountTable({ data, overdueData }) {
  if (!data || !data.accountDetails || data.accountDetails.length === 0) {
    return <div className="no-data">No data available</div>
  }

  const accounts = data.accountDetails
  const hasOverdue = overdueData && overdueData.size > 0

  const formatDate = (val) => {
    if (!val) return '-'
    if (typeof val === 'number') {
      const d = new Date((val - 25569) * 86400 * 1000)
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB')
    }
    return String(val)
  }

  const parseAmt = (val) => {
    if (val == null || val === '') return 0
    return parseFloat(String(val).replace(/[,\s]/g, '')) || 0
  }

  let totalTarget = 0, totalAchieve = 0, totalOverdue = 0
  accounts.forEach(acc => {
    totalTarget += parseAmt(acc.collectionTarget)
    totalAchieve += parseAmt(acc.collectionAchieve)
    if (hasOverdue && acc.invoiceNo) totalOverdue += overdueData.get(String(acc.invoiceNo).trim()) || 0
  })

  return (
    <div className="table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>S/N</th>
            <th>Division</th>
            <th>Area</th>
            <th>Plaza</th>
            <th>Account No.</th>
            <th>Customer Name</th>
            <th>Product Category</th>
            <th>Assign Person ID</th>
            <th>Invoice No.</th>
            <th>Invoice Date</th>
            <th>Matured Date</th>
            <th style={{ textAlign: 'right' }}>Per Month Schedule</th>
            <th style={{ textAlign: 'right' }}>Collection Target</th>
            <th style={{ textAlign: 'right' }}>Collection Achieve</th>
            {hasOverdue && <th style={{ textAlign: 'right' }}>Overdue Amount</th>}
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc, idx) => {
            const overdue = hasOverdue && acc.invoiceNo ? (overdueData.get(String(acc.invoiceNo).trim()) || 0) : null
            const achieve = parseAmt(acc.collectionAchieve)
            return (
              <tr key={idx}>
                <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                <td>{acc.division || '-'}</td>
                <td>{acc.area || '-'}</td>
                <td style={{ fontWeight: 700, color: '#1e40af' }}>{acc.plaza || '-'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{acc.accountNo || '-'}</td>
                <td style={{ fontWeight: 600 }}>{acc.customerName || '-'}</td>
                <td>{acc.productCategory || '-'}</td>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{acc.assignPersonId || '-'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{acc.invoiceNo || '-'}</td>
                <td style={{ color: '#475569' }}>{formatDate(acc.invoiceDate)}</td>
                <td style={{ color: '#475569' }}>{formatDate(acc.maturedDate)}</td>
                <td className="amt-cell" style={{ textAlign: 'right' }}>{fmt(parseAmt(acc.perMonthSchedule))}</td>
                <td className="amt-cell" style={{ textAlign: 'right' }}>{fmt(parseAmt(acc.collectionTarget))}</td>
                <td className="amt-cell" style={{ textAlign: 'right', color: achieve > 0 ? '#059669' : '#94a3b8', fontWeight: achieve > 0 ? 700 : 500 }}>
                  {fmt(achieve)}
                </td>
                {hasOverdue && (
                  <td className="amt-cell" style={{ textAlign: 'right', color: overdue > 0 ? '#b91c1c' : '#94a3b8', fontWeight: overdue > 0 ? 700 : 500 }}>
                    {overdue > 0 ? fmt(overdue) : '-'}
                  </td>
                )}
              </tr>
            )
          })}
          <tr className="total-row">
            <td colSpan={12} style={{ textAlign: 'right' }}>
              Total &nbsp;·&nbsp; {accounts.length} accounts
            </td>
            <td className="amt-cell" style={{ textAlign: 'right' }}>{fmt(totalTarget)}</td>
            <td className="amt-cell" style={{ textAlign: 'right' }}>{fmt(totalAchieve)}</td>
            {hasOverdue && <td className="amt-cell" style={{ textAlign: 'right' }}>{fmt(totalOverdue)}</td>}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default AllAccountTable
