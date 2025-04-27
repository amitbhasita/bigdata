import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import PickupMap from './components/PickupMap';
import FareBoxplot from './components/FareBoxplot';
import TipHistogram from './components/TipHistogram';
import VendorPaymentChart from './components/VendorPaymentChart';
import DistanceFareScatter from './components/DistanceFareScatter';
import DemandHeatmap from './components/DemandHeatmap';
import AreaChart from './components/AreaChart';
import CorrelationHeatmap from './components/CorrelationHeatmap';
import FareEfficiencyComponent from './components/FareEfficiencyComponent';
import AirportTripAnalysis from './components/AirportTripAnalysis';
import DynamicFareAnimation from './components/DynamicFareAnimation';
import TripDemandForecast from './components/TripDemandForecast';
import SurgeAnomalyTimeline from './components/SurgeAnomalyTimeline';

import NYCMap from './components/NYCMap'; // Assuming your NYCMap is for the "/map" route

import { DataProvider } from './context/DataContext';
import { FilterProvider } from './context/FilterContext';

import './index.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className={`sidebar-container ${sidebarOpen ? 'open' : 'collapsed'} bg-light border-end`}>
        <div className="p-3">
          <button
            className="btn btn-sm btn-outline-secondary w-100 mb-3"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          {sidebarOpen && <Sidebar />}
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-4 content-area">
        <div style={{ marginBottom: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            className="btn btn-primary"
            style={{
              fontSize: '1rem',
              padding: '8px 22px 8px 14px',
              borderRadius: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontWeight: 600,
              letterSpacing: '0.4px',
            }}
            onClick={() => navigate('/map')}
          >
            <span style={{ fontSize: '1.15em', display: 'flex', alignItems: 'center' }}>🗺️</span>
            NYC Map
          </button>
          <a
            href="http://127.0.0.1:8050/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success"
            style={{
              fontSize: '1rem',
              padding: '8px 22px 8px 14px',
              borderRadius: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              textDecoration: 'none',
            }}
          >
            Choropleth
          </a>
        </div>
        <div className="charts-grid">
          <PickupMap />
          <FareBoxplot />
          <TipHistogram />
          <VendorPaymentChart />
          <DistanceFareScatter />
          <FareEfficiencyComponent />
          <DemandHeatmap />
          <CorrelationHeatmap />
          <AreaChart />
          <AirportTripAnalysis />
          <DynamicFareAnimation />
          <TripDemandForecast />
          <SurgeAnomalyTimeline />
        </div>
        
        {/* Link to Taxi Fare Chart Visualization */}
        <div style={{ marginTop: '30px', textAlign: 'center', zIndex: '10', position: 'relative' }}>
	  <a
	    href="http://172.23.58.128:3000/"
	    target="_blank"
	    rel="noopener noreferrer"
	    className="btn btn-danger"
	    style={{
	      fontSize: '1.2rem',
	      padding: '12px 24px',
	      borderRadius: '30px',
	      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
	      fontWeight: 'bold',
	      letterSpacing: '0.5px',
	      color: '#fff',
	      backgroundColor: '#e63946',
	      textDecoration: 'none',
	      display: 'inline-block',  // Ensure it is an inline-block element
	      cursor: 'pointer',       // Ensure it shows a pointer cursor on hover
	    }}
	  >
	    🚖 Taxi Fare Chart Visualization
	  </a>
	 </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <FilterProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<NYCMap />} />
          </Routes>
        </Router>
      </FilterProvider>
    </DataProvider>
  );
}

export default App;
