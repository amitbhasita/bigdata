import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { parseISO } from 'date-fns';

function DistanceFareScatter() {
  const { filters, setFilters } = useFilter();
  const { data } = useData();
  const [dataPoints, setDataPoints] = useState([]);

  useEffect(() => {
    if (!filters.date || data.length === 0) return;

    const { selectedZone, selectedVendor, selectedPayment, hourRange } = filters;
    const [startHour, endHour] = hourRange;

    let targetDate;
    if (typeof filters.date === 'string') {
      targetDate = parseISO(filters.date);
    } else {
      targetDate = filters.date;
    }

    const filtered = data.filter((trip) => {
      if (!trip.tpep_pickup_datetime || trip.trip_distance == null || trip.total_amount == null) return false;

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

      const tripDateStr = tripDateObj.toISOString().slice(0, 10);
      if (tripDateStr !== filters.date) return false;

      const hour = tripDateObj.getHours();
      if (hour < startHour || hour > endHour) return false;

      if (selectedZone) {
        const zoneNum = parseInt(selectedZone.replace('Zone ', ''));
        if (trip.PULocationID !== zoneNum) return false;
      }

      if (selectedVendor) {
        const vendorMap = { 'Vendor A': 1, 'Vendor B': 2 };
        if (trip.VendorID !== vendorMap[selectedVendor]) return false;
      }

      if (selectedPayment) {
        const paymentMap = { 'Card': 1, 'Cash': 2, 'Other': 3 };
        if (trip.payment_type !== paymentMap[selectedPayment]) return false;
      }

      return true;
    });

    console.log("✅ Filtered Trips for Scatterplot:", filtered.length);

    const points = filtered.map(trip => ({
      distance: parseFloat(trip.trip_distance),
      fare: parseFloat(trip.total_amount),
      vendor: trip.VendorID,
      paymentType: trip.payment_type,
    }));

    setDataPoints(points);
  }, [
    filters.date,
    filters.hourRange,
    filters.selectedZone,
    filters.selectedVendor,
    filters.selectedPayment,
    data,
  ]);

  const getColor = (dist) => {
    if (dist < 2) return 'green';
    if (dist < 5) return 'orange';
    return 'red';
  };

  const getMarkerSymbol = (paymentType) => {
    // Payment types assumed mapping: 1 = Card, 2 = Cash, 3 = Other
    if (paymentType === 1) return 'circle';
    if (paymentType === 2) return 'square';
    return 'diamond';
  };

  // 🧠 Calculate Linear Regression (Trendline)
  const regression = (() => {
    if (dataPoints.length < 2) return null;

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((acc, p) => acc + p.distance, 0);
    const sumY = dataPoints.reduce((acc, p) => acc + p.fare, 0);
    const sumXY = dataPoints.reduce((acc, p) => acc + p.distance * p.fare, 0);
    const sumXX = dataPoints.reduce((acc, p) => acc + p.distance * p.distance, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...dataPoints.map(p => p.distance));
    const maxX = Math.max(...dataPoints.map(p => p.distance));

    return {
      x: [minX, maxX],
      y: [slope * minX + intercept, slope * maxX + intercept],
      slope,
      intercept,
    };
  })();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>📈 Distance vs Fare Scatter Plot</h5>
        {(filters.selectedZone || filters.selectedVendor) && (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() =>
              setFilters(prev => ({
                ...prev,
                selectedZone: null,
                selectedVendor: null,
              }))
            }
          >
            Clear Zone/Vendor Filters
          </button>
        )}
      </div>

      <Plot
        data={[
          {
            x: dataPoints.map(p => p.distance),
            y: dataPoints.map(p => p.fare),
            mode: 'markers',
            type: 'scatter',
            marker: {
              color: dataPoints.map(p => getColor(p.distance)),
              symbol: dataPoints.map(p => getMarkerSymbol(p.paymentType)),
              size: 7,
              opacity: 0.7,
              line: { width: 0.5, color: 'white' },
            },
            hovertemplate:
              'Distance: %{x:.2f} km<br>Fare: %{y:.2f} USD<extra></extra>',
            name: 'Trips',
          },
          regression && {
            x: regression.x,
            y: regression.y,
            mode: 'lines',
            type: 'scatter',
            line: { color: 'blue', width: 2, dash: 'dash' },
            hoverinfo: 'skip',
            name: `Trendline (y = ${regression.slope.toFixed(2)}x + ${regression.intercept.toFixed(2)})`,
          }
        ].filter(Boolean)}
        layout={{
          autosize: true,
          width: 1150,
          height: 500,
          margin: { t: 50, r: 30, l: 60, b: 60 },
          paper_bgcolor: '#f8f9fa',
          plot_bgcolor: '#f8f9fa',
          title: {
            text: 'Trip Distance vs Total Fare',
            font: { size: 20 },
          },
          xaxis: {
            title: 'Trip Distance (kilometers)',
            gridcolor: '#d3d3d3',
          },
          yaxis: {
            title: 'Total Fare (USD)',
            gridcolor: '#d3d3d3',
          },
          hovermode: 'closest',
          legend: { orientation: 'h', y: -0.2 },
        }}
        config={{
          responsive: true,
          scrollZoom: true,
          displayModeBar: false,
        }}
        onClick={() => setFilters(prev => ({ ...prev, focusedChart: 'DistanceFareScatter' }))}
      />
      {/* Color Legend - ensure clear separation below the graph */}
      <div style={{ display: 'flex', gap: '18px', marginTop: '32px', alignItems: 'center', fontSize: '0.98rem', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 18, height: 12, background: 'green', display: 'inline-block', borderRadius: 3, border: '1px solid #ccc' }}></span>
          Distance &lt; 2 km
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 18, height: 12, background: 'orange', display: 'inline-block', borderRadius: 3, border: '1px solid #ccc' }}></span>
          2 km ≤ Distance &lt; 5 km
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 18, height: 12, background: 'red', display: 'inline-block', borderRadius: 3, border: '1px solid #ccc' }}></span>
          Distance ≥ 5 km
        </span>
      </div>
    </div>
  );
}

export default DistanceFareScatter;
