import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { parseISO } from 'date-fns';

function TipHistogram() {
  const { filters, setFilters } = useFilter();
  const { data } = useData();
  const [tipData, setTipData] = useState([]);
  const [viewMode, setViewMode] = useState('histogram'); // 'histogram' or 'density'

  useEffect(() => {
    if (!filters.date || data.length === 0) return;

    const zone = filters.selectedZone || 'Any';
    const [startHour, endHour] = filters.hourRange;
    const activePayment = filters.selectedPayment;

    // 🔥 Filter real trips
    const tripsFiltered = data.filter((trip) => {
      if (!trip.tpep_pickup_datetime || trip.tip_amount == null || trip.payment_type == null) return false;

      let tripDateObj;
      const raw = trip.tpep_pickup_datetime;
      if (typeof raw === 'number') {
        tripDateObj = new Date(raw * 1000);
      } else if (typeof raw === 'string') {
        const fixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
        tripDateObj = parseISO(fixed);
      } else {
        return false;
      }

      // 📅 Date Match
      const tripDateStr = tripDateObj.toISOString().slice(0, 10);
      if (tripDateStr !== filters.date) return false;

      // 🕒 Hour Match
      const tripHour = tripDateObj.getHours();
      if (tripHour < startHour || tripHour > endHour) return false;

      // 📍 Zone Match
      if (filters.selectedZone && trip.PULocationID !== parseInt(filters.selectedZone.replace('Zone ', ''))) {
        return false;
      }

      // 💳 Payment Type Match
      if (filters.selectedPayment) {
        const paymentMap = { 'Card': 1, 'Cash': 2, 'Other': 3 };
        if (trip.payment_type !== paymentMap[filters.selectedPayment]) {
          return false;
        }
      }

      // 🧾 Vendor Match
      if (filters.selectedVendor) {
        const vendorMap = { 'Vendor A': 1, 'Vendor B': 2 };
        if (trip.VendorID !== vendorMap[filters.selectedVendor]) {
          return false;
        }
      }

      return true;
    });

    console.log("✅ Filtered Trips for TipHistogram:", tripsFiltered.length);

    // 🔢 Split trips into buckets based on payment type
    const paymentTypes = ['Card', 'Cash', 'Other'];
    const tipGroups = { 'Card': [], 'Cash': [], 'Other': [] };

    tripsFiltered.forEach((trip) => {
      let type = 'Other';
      if (trip.payment_type === 1) type = 'Card';
      else if (trip.payment_type === 2) type = 'Cash';

      tipGroups[type].push(trip.tip_amount);
    });

    let histData = [];

    if (viewMode === 'histogram') {
      histData = paymentTypes.map(type => {
        if (activePayment && activePayment !== type) return null;
        return {
          x: tipGroups[type],
          type: 'histogram',
          name: type,
          opacity: 0.7,
          autobinx: false,
          xbins: { start: 0, end: 20, size: 3 },
          hovertemplate: 'Tip Amount: $%{x}<br>Trips: %{y}<extra></extra>',
          marker: { color: type === 'Card' ? '#4CAF50' : type === 'Cash' ? '#FFC107' : '#2196F3' },
        };
      }).filter(Boolean);
    } else if (viewMode === 'density') {
      histData = paymentTypes.map(type => {
        if (activePayment && activePayment !== type) return null;
        return {
          x: tipGroups[type],
          type: 'scatter',
          mode: 'lines',
          name: type + ' Density',
          line: { shape: 'spline', width: 3 },
          hovertemplate: 'Tip Amount: $%{x}<br>Density: %{y}<extra></extra>',
          marker: { color: type === 'Card' ? '#4CAF50' : type === 'Cash' ? '#FFC107' : '#2196F3' },
        };
      }).filter(Boolean);
    }

    setTipData(histData);
  }, [
    filters.date,
    filters.selectedZone,
    filters.hourRange,
    filters.selectedPayment,
    filters.selectedVendor,
    data,
    viewMode, // 👈 Important: now viewMode triggers re-run too
  ]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>
          💰 Tip Distribution for{' '}
          <span className="text-primary">{filters.selectedZone || 'All Zones'}</span>{' '}
          {filters.selectedVendor && (<>via <strong>{filters.selectedVendor}</strong>{' '}</>)}
          {filters.selectedPayment ? (<>with <strong>{filters.selectedPayment}</strong> payment</>) : 'with All Payment Types'}{' '}
          on {filters.date || '...'}
        </h5>

        <div className="d-flex align-items-center">
          <button
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => setViewMode(viewMode === 'histogram' ? 'density' : 'histogram')}
          >
            Switch to {viewMode === 'histogram' ? 'Density' : 'Histogram'}
          </button>

          {(filters.selectedZone || filters.selectedPayment) && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() =>
                setFilters(prev => ({
                  ...prev,
                  selectedZone: null,
                  selectedPayment: null,
                }))
              }
            >
              Clear Zone/Payment Filters
            </button>
          )}
        </div>
      </div>

      <Plot
        data={tipData}
        layout={{
          width: 1150,
          height: 400,
          margin: { t: 40, r: 30, l: 50, b: 50 },
          hovermode: 'x unified',
          barmode: viewMode === 'histogram' ? 'stack' : undefined,
          xaxis: { title: 'Tip Amount ($)' },
          yaxis: { title: viewMode === 'histogram' ? 'Trip Count' : 'Density' },
          legend: { orientation: 'h', y: -0.2 },
        }}
        onClick={() => setFilters(prev => ({ ...prev, focusedChart: 'TipHistogram' }))}
      />
    </div>
  );
}

export default TipHistogram;
