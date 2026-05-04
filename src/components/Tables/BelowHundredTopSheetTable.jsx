import React from 'react'
import './Table.css'

const fmt = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const parseAmt = (val) => {
  if (val == null || val === '') return 0
  return parseFloat(String(val).replace(/[,\s]/g, '')) || 0
}

function BelowHundredTopSheetTable({ accounts, overdueData }) {
  if (!accounts || accounts.length === 0) {
    return <div className="no-data">No data available for this range.</div>
  }

  const hasOverdue = overdueData && overdueData.size > 0

  // Group by plaza + assignPersonId
  const personGroups = {}
  accounts.forEach((acc) => {
    const plaza = acc.plaza || 'Unknown'
    const personId = acc.assignPersonId || 'Unknown'
    const key = `${plaza}|||${personId}`

    if (!personGroups[key]) {
      personGroups[key] = {
        plaza,
        personId,
        totalQty: 0,
        targetAmount: 0,
        achieveAmount: 0,
        overdueAmount: 0,
      }
    }

    personGroups[key].totalQty++
    personGroups[key].targetAmount += parseAmt(acc.collectionTarget)
    personGroups[key].achieveAmount += parseAmt(acc.collectionAchieve)

    if (hasOverdue && acc.invoiceNo) {
      personGroups[key].overdueAmount +=
        overdueData.get(String(acc.invoiceNo).trim()) || 0
    }
  })

  const sortedPersons = Object.values(personGroups).sort((a, b) =>
    a.plaza !== b.plaza
      ? a.plaza.localeCompare(b.plaza)
      : a.personId.localeCompare(b.personId)
  )

  // Group by plaza for subtotals
  const plazaGroups = {}
  sortedPersons.forEach((p) => {
    if (!plazaGroups[p.plaza]) plazaGroups[p.plaza] = []
    plazaGroups[p.plaza].push(p)
  })

  // Grand totals
  const grand = sortedPersons.reduce(
    (acc, p) => ({
      totalQty: acc.totalQty + p.totalQty,
      targetAmount: acc.targetAmount + p.targetAmount,
      achieveAmount: acc.achieveAmount + p.achieveAmount,
      overdueAmount: acc.overdueAmount + p.overdueAmount,
    }),
    { totalQty: 0, targetAmount: 0, achieveAmount: 0, overdueAmount: 0 }
  )

  return (
    <div className="table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Plaza Name</th>
            <th>Assign Person ID</th>
            <th style={{ textAlign: 'center' }}>AC Qty (in range)</th>
            <th style={{ textAlign: 'right' }}>Target Amount</th>
            <th style={{ textAlign: 'right' }}>Achieve Amount</th>
            {hasOverdue && <th style={{ textAlign: 'right' }}>Overdue Amount</th>}
          </tr>
        </thead>
        <tbody>
          {Object.entries(plazaGroups).map(([plaza, persons]) => {
            const sub = persons.reduce(
              (acc, p) => ({
                totalQty: acc.totalQty + p.totalQty,
                targetAmount: acc.targetAmount + p.targetAmount,
                achieveAmount: acc.achieveAmount + p.achieveAmount,
                overdueAmount: acc.overdueAmount + p.overdueAmount,
              }),
              { totalQty: 0, targetAmount: 0, achieveAmount: 0, overdueAmount: 0 }
            )

            return (
              <React.Fragment key={plaza}>
                {persons.map((person, idx) => (
                  <tr key={`${person.plaza}-${person.personId}-${idx}`}>
                    <td>{person.plaza}</td>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>
                      {person.personId}
                    </td>
                    <td style={{ textAlign: 'center', color: '#b91c1c', fontWeight: 700 }}>
                      {person.totalQty}
                    </td>
                    <td className="amt-cell" style={{ textAlign: 'right' }}>
                      {fmt(person.targetAmount)}
                    </td>
                    <td
                      className="amt-cell"
                      style={{ textAlign: 'right', color: '#d97706', fontWeight: 700 }}
                    >
                      {fmt(person.achieveAmount)}
                    </td>
                    {hasOverdue && (
                      <td
                        className="amt-cell"
                        style={{ textAlign: 'right', color: '#b91c1c', fontWeight: 700 }}
                      >
                        {person.overdueAmount > 0 ? fmt(person.overdueAmount) : '-'}
                      </td>
                    )}
                  </tr>
                ))}

                {/* Plaza subtotal */}
                <tr className="subtotal-row">
                  <td>{plaza} — Subtotal</td>
                  <td></td>
                  <td style={{ textAlign: 'center' }}>{sub.totalQty}</td>
                  <td className="amt-cell" style={{ textAlign: 'right' }}>
                    {fmt(sub.targetAmount)}
                  </td>
                  <td className="amt-cell" style={{ textAlign: 'right' }}>
                    {fmt(sub.achieveAmount)}
                  </td>
                  {hasOverdue && (
                    <td className="amt-cell" style={{ textAlign: 'right' }}>
                      {fmt(sub.overdueAmount)}
                    </td>
                  )}
                </tr>
              </React.Fragment>
            )
          })}

          {/* Grand total */}
          <tr className="total-row">
            <td colSpan={2}>Grand Total</td>
            <td style={{ textAlign: 'center' }}>{grand.totalQty}</td>
            <td className="amt-cell" style={{ textAlign: 'right' }}>
              {fmt(grand.targetAmount)}
            </td>
            <td className="amt-cell" style={{ textAlign: 'right' }}>
              {fmt(grand.achieveAmount)}
            </td>
            {hasOverdue && (
              <td className="amt-cell" style={{ textAlign: 'right' }}>
                {fmt(grand.overdueAmount)}
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default BelowHundredTopSheetTable
