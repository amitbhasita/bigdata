import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { FilterProvider } from './context/FilterContext';
import { DataProvider } from './context/DataContext'; // 👈 new
import 'bootstrap/dist/css/bootstrap.min.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FilterProvider>
      <DataProvider> {/* 👈 Wrap App inside DataProvider */}
        <App />
      </DataProvider>
    </FilterProvider>
  </StrictMode>,
)
