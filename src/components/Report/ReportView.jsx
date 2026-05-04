import { useRef, useState, useEffect, useMemo } from 'react'
import PersonIdTopSheetTable from '../Tables/PersonIdTopSheetTable'
import AllAccountTable from '../Tables/AllAccountTable'
import BelowHundredTable from '../Tables/BelowHundredTable'
import ActionButtons from '../Buttons/ActionButtons'
import './ReportView.css'

const TABS = [
  { id: 'personidtopsheet', label: 'Top Sheet' },
  { id: 'allaccount', label: 'All Account' },
  { id: 'belowhundred', label: 'Below 100 Collection' },
]

function ReportView({ data, overdueData, activeTab, onTabChange, onReset }) {
  const containerRef = useRef(null)
  const [dateTime, setDateTime] = useState('')
  const [selectedPlaza, setSelectedPlaza] = useState('all')

  useEffect(() => {
    const now = new Date()
    setDateTime(now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    }))
  }, [])

  const allAccountDetails = data?.allAccountDetails || []

  // Derive unique plaza list from data
  const plazaOptions = useMemo(() => {
    const set = new Set()
    allAccountDetails.forEach(acc => {
      if (acc.plaza) set.add(String(acc.plaza).trim())
    })
    return Array.from(set).sort()
  }, [allAccountDetails])

  // Filtered account details based on selected plaza
  const accountDetails = useMemo(() => {
    if (selectedPlaza === 'all') return allAccountDetails
    return allAccountDetails.filter(acc => String(acc.plaza).trim() === selectedPlaza)
  }, [allAccountDetails, selectedPlaza])

  const renderTable = () => {
    if (activeTab === 'personidtopsheet') {
      return <PersonIdTopSheetTable data={{ accountDetails }} overdueData={overdueData} />
    }
    if (activeTab === 'allaccount') {
      return <AllAccountTable data={{ accountDetails }} overdueData={overdueData} />
    }
    if (activeTab === 'belowhundred') {
      return <BelowHundredTable data={{ accountDetails }} overdueData={overdueData} />
    }
    return null
  }

  const activeLabel = TABS.find(t => t.id === activeTab)?.label || ''

  return (
    <div className="container">
      <div ref={containerRef}>
        {/* Header */}
        <div className="report-header">
          <h1>ASSIGN PERSON ID REPORT</h1>
          <p className="datetime">{dateTime}</p>
        </div>

        {/* Buttons at top */}
        <ActionButtons
          data={data}
          overdueData={overdueData}
          onReset={onReset}
          containerRef={containerRef}
        />

        {/* Tabs + Plaza Filter */}
        <div className="tab-section">
          <h3 className="section-title">Assign Person ID Report</h3>
          <div className="tab-filter-row">
            <nav className="tab-nav">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Plaza Filter */}
            <div className="plaza-filter">
              <span className="plaza-filter-icon">🏬</span>
              <label htmlFor="plaza-select" className="plaza-filter-label">Plaza</label>
              <select
                id="plaza-select"
                className="plaza-select"
                value={selectedPlaza}
                onChange={e => setSelectedPlaza(e.target.value)}
              >
                <option value="all">All Plazas ({plazaOptions.length})</option>
                {plazaOptions.map(plaza => (
                  <option key={plaza} value={plaza}>{plaza}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active tab title + filter indicator */}
        <div className="month-header">
          <span>{activeLabel}</span>
          {selectedPlaza !== 'all' && (
            <span className="plaza-badge">📍 {selectedPlaza}</span>
          )}
        </div>

        {/* Table */}
        {renderTable()}
      </div>
    </div>
  )
}

export default ReportView
