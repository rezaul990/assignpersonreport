import { useState } from 'react'
import BelowHundredTopSheetTable from './BelowHundredTopSheetTable'
import './Table.css'

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

const RANGE_OPTIONS = [
  { value: '1-99',  label: '1–99 Tk',  min: 1, max: 99  },
  { value: '1-199', label: '1–199 Tk', min: 1, max: 199 },
  { value: '1-499', label: '1–499 Tk', min: 1, max: 499 },
]

const SUB_TABS = [
  { id: 'topsheet',    label: 'Top Sheet'    },
  { id: 'accountlist', label: 'Account List' },
]

function BelowHundredTable({ data, overdueData }) {
  const [selectedRange, setSelectedRange] = useState('1-99')
  const [subTab, setSubTab] = useState('topsheet')

  if (!data || !data.accountDetails || data.accountDetails.length === 0) {
    return <div className="no-data">No data available</div>
  }

  const hasOverdue = overdueData && overdueData.size > 0
  const currentRange = RANGE_OPTIONS.find((r) => r.value === selectedRange) || RANGE_OPTIONS[0]

  // Filter accounts based on selected range
  const accounts = data.accountDetails.filter((acc) => {
    const achieve = parseAmt(acc.collectionAchieve)
    return achieve >= currentRange.min && achieve <= currentRange.max
  })

  // Totals for account list footer
  let totalTarget = 0, totalAchieve = 0, totalOverdue = 0
  accounts.forEach((acc) => {
    totalTarget += parseAmt(acc.collectionTarget)
    totalAchieve += parseAmt(acc.collectionAchieve)
    if (hasOverdue && acc.invoiceNo)
      totalOverdue += overdueData.get(String(acc.invoiceNo).trim()) || 0
  })

  return (
    <div className="table-wrapper">

      {/* ── Controls row ── */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

        {/* Sub-tab toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${subTab === t.id ? 'active' : ''}`}
              onClick={() => setSubTab(t.id)}
              style={{ fontSize: 13, padding: '4px 14px' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Range selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Range:</span>
          <select
            className="plaza-select"
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            style={{ minWidth: 120 }}
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Summary badge */}
        <span
          style={{
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '4px 14px',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ⚠️ {accounts.length} account{accounts.length !== 1 ? 's' : ''} in {currentRange.label}
        </span>
      </div>

      {/* ── Top Sheet view ── */}
      {subTab === 'topsheet' && (
        <BelowHundredTopSheetTable accounts={accounts} overdueData={overdueData} />
      )}

      {/* ── Account List view ── */}
      {subTab === 'accountlist' && (
        accounts.length === 0 ? (
          <div className="no-data">✅ No accounts with collection between {currentRange.label}.</div>
        ) : (
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
                const achieve = parseAmt(acc.collectionAchieve)
                const overdue =
                  hasOverdue && acc.invoiceNo
                    ? overdueData.get(String(acc.invoiceNo).trim()) || 0
                    : null

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
                    <td className="amt-cell" style={{ textAlign: 'right', color: '#d97706', fontWeight: 700 }}>
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
                {hasOverdue && (
                  <td className="amt-cell" style={{ textAlign: 'right' }}>{fmt(totalOverdue)}</td>
                )}
              </tr>
            </tbody>
          </table>
        )
      )}
    </div>
  )
}

export default BelowHundredTable
