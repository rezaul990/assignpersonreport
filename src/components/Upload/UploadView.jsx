import { useRef } from 'react'
import './UploadView.css'

function UploadView({ uploadStep, onFileUpload, onOverdueFileUpload, onSkipOverdue, error, overdueError, mainFileName }) {
  const fileInputRef = useRef(null)
  const overdueFileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  const overdueDropZoneRef = useRef(null)

  const handleDragOver = (e) => { e.preventDefault(); dropZoneRef.current?.classList.add('dragover') }
  const handleDragLeave = () => { dropZoneRef.current?.classList.remove('dragover') }
  const handleDrop = (e) => {
    e.preventDefault(); dropZoneRef.current?.classList.remove('dragover')
    const file = e.dataTransfer.files[0]; if (file) onFileUpload(file)
  }
  const handleFileSelect = (e) => { const file = e.target.files[0]; if (file) onFileUpload(file) }

  const handleOverdueDragOver = (e) => { e.preventDefault(); overdueDropZoneRef.current?.classList.add('dragover') }
  const handleOverdueDragLeave = () => { overdueDropZoneRef.current?.classList.remove('dragover') }
  const handleOverdueDrop = (e) => {
    e.preventDefault(); overdueDropZoneRef.current?.classList.remove('dragover')
    const file = e.dataTransfer.files[0]; if (file) onOverdueFileUpload(file)
  }
  const handleOverdueFileSelect = (e) => { const file = e.target.files[0]; if (file) onOverdueFileUpload(file) }

  if (uploadStep === 'main') {
    return (
      <div className="upload-page">
        <div className="upload-step-indicator">
          <div className="step active">
            <span className="step-num">1</span>
            <span className="step-label">Collection Report</span>
          </div>
          <div className="step-divider" />
          <div className="step">
            <span className="step-num">2</span>
            <span className="step-label">Overdue Details</span>
          </div>
        </div>

        <div ref={dropZoneRef} className="drop-zone" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="drop-zone-content">
            <div className="drop-zone-box" onClick={() => fileInputRef.current?.click()}>
              <div className="drop-icon">📁</div>
              <h1>Account Wise Actual Card Collection Report</h1>
              <p>Drag & Drop Excel file here</p>
              <p className="sub-text">or click to browse</p>
              <input ref={fileInputRef} type="file" accept=".xls,.xlsx" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    )
  }

  if (uploadStep === 'overdue') {
    return (
      <div className="upload-page">
        <div className="upload-step-indicator">
          <div className="step done">
            <span className="step-num">✓</span>
            <span className="step-label">Collection Report</span>
          </div>
          <div className="step-divider active" />
          <div className="step active">
            <span className="step-num">2</span>
            <span className="step-label">Overdue Details</span>
          </div>
        </div>

        <div className="step2-success-note">
          <span className="check-icon">✅</span>
          <span><strong>{mainFileName}</strong> loaded successfully</span>
        </div>

        <div ref={overdueDropZoneRef} className="drop-zone" onDragOver={handleOverdueDragOver} onDragLeave={handleOverdueDragLeave} onDrop={handleOverdueDrop}>
          <div className="drop-zone-content">
            <div className="drop-zone-box" onClick={() => overdueFileInputRef.current?.click()}>
              <div className="drop-icon">📋</div>
              <h1>Overdue Accounts Details</h1>
              <p>Upload the OverdueAccountsDetails file</p>
              <p>Overdue Amount will appear in the Person ID Report</p>
              <p className="sub-text">Drag & Drop or click to browse</p>
              <input ref={overdueFileInputRef} type="file" accept=".xls,.xlsx" onChange={handleOverdueFileSelect} style={{ display: 'none' }} />
            </div>
            {overdueError && <div className="error-message">{overdueError}</div>}
          </div>
        </div>

        <button className="skip-btn" onClick={onSkipOverdue}>
          Skip — View Report Without Overdue Data
        </button>
      </div>
    )
  }

  return null
}

export default UploadView
