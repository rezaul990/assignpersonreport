import { useState } from 'react'
import * as XLSX from 'xlsx'
import { parseExcelData, parseOverdueData } from '../utils/dataParser'

// Upload steps: 'main' | 'overdue' | 'done'
export function useReportData() {
  const [reportData, setReportData] = useState(null)
  const [overdueData, setOverdueData] = useState(null)
  const [uploadStep, setUploadStep] = useState('main')
  const [error, setError] = useState(null)
  const [overdueError, setOverdueError] = useState(null)
  const [mainFileName, setMainFileName] = useState(null)

  const handleFileUpload = (file) => {
    try {
      setError(null)
      const reader = new FileReader()
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        const parsedData = parseExcelData(rows)
        setReportData(parsedData)
        setMainFileName(file.name)
        setUploadStep('overdue')
      }
      reader.readAsArrayBuffer(file)
    } catch (err) {
      setError(err.message)
      console.error('Error processing file:', err)
    }
  }

  const handleOverdueFileUpload = (file) => {
    try {
      setOverdueError(null)
      const reader = new FileReader()
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        const parsedOverdue = parseOverdueData(rows)
        setOverdueData(parsedOverdue)
        setUploadStep('done')
      }
      reader.readAsArrayBuffer(file)
    } catch (err) {
      setOverdueError(err.message)
      console.error('Error processing overdue file:', err)
    }
  }

  const handleSkipOverdue = () => {
    setOverdueData(null)
    setUploadStep('done')
  }

  const handleReset = () => {
    setReportData(null)
    setOverdueData(null)
    setUploadStep('main')
    setError(null)
    setOverdueError(null)
    setMainFileName(null)
  }

  return {
    reportData,
    overdueData,
    showReport: uploadStep === 'done',
    uploadStep,
    error,
    overdueError,
    mainFileName,
    handleFileUpload,
    handleOverdueFileUpload,
    handleSkipOverdue,
    handleReset,
  }
}
