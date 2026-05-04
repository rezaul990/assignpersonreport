import { useState } from 'react'
import { useReportData } from './hooks/useReportData'
import UploadView from './components/Upload/UploadView'
import ReportView from './components/Report/ReportView'
import './App.css'

function App() {
  const {
    reportData,
    overdueData,
    showReport,
    uploadStep,
    error,
    overdueError,
    mainFileName,
    handleFileUpload,
    handleOverdueFileUpload,
    handleSkipOverdue,
    handleReset,
  } = useReportData()

  const [activeTab, setActiveTab] = useState('personidtopsheet')

  return (
    <div className="app">
      <div className="developer-credit-top">
        <span>Developed by: Md. Rezaul Karim RCM</span>
      </div>

      {!showReport ? (
        <UploadView
          uploadStep={uploadStep}
          onFileUpload={handleFileUpload}
          onOverdueFileUpload={handleOverdueFileUpload}
          onSkipOverdue={handleSkipOverdue}
          error={error}
          overdueError={overdueError}
          mainFileName={mainFileName}
        />
      ) : (
        <ReportView
          data={reportData}
          overdueData={overdueData}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onReset={handleReset}
        />
      )}

      <div className="developer-credit-bottom">
        <span>© Developed by: Md. Rezaul Karim RCM</span>
      </div>
    </div>
  )
}

export default App
