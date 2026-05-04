import { exportAsImage, exportAsExcel } from '../../services/exportService'
import './ActionButtons.css'

function ActionButtons({ data, overdueData, onReset, containerRef }) {
  const handleSaveImage = async () => {
    await exportAsImage(containerRef)
  }

  const handleDownloadExcel = () => {
    exportAsExcel(data, overdueData)
  }

  return (
    <div className="btn-container">
      <button className="btn btn-save" onClick={handleSaveImage}>
        📷 Share as Image
      </button>
      <button className="btn btn-excel" onClick={handleDownloadExcel}>
        📊 Download Excel
      </button>
      <button className="btn btn-reset" onClick={onReset}>
        Upload Another File
      </button>
    </div>
  )
}

export default ActionButtons
