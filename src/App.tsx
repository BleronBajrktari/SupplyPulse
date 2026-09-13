import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import UploadScan from './pages/UploadScan'
import ScanResults from './pages/ScanResults'
import CatalogViewer from './pages/CatalogViewer'
import SalesVelocity from './pages/SalesVelocity'
import HealthBoard from './pages/HealthBoard'
import AlertLog from './pages/AlertLog'

function App() {
  return (
    <Routes>
      <Route element={<AppShell connectionState="connected" syncState="healthy" />}>
        <Route path="/" element={<UploadScan />} />
        <Route path="/scan" element={<UploadScan />} />
        <Route path="/dashboard" element={<ScanResults />} />
        <Route path="/catalog" element={<CatalogViewer />} />
        <Route path="/velocity" element={<SalesVelocity />} />
        <Route path="/health" element={<HealthBoard />} />
        <Route path="/history" element={<AlertLog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
