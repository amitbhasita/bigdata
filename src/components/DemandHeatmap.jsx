import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { parseISO, getDay, getHours, format } from 'date-fns';
import { useFilter } from '../context/FilterContext';

function DemandHeatmap() {
  const { data } = useData();
  const { filters } = useFilter();
  const [heatmapData, setHeatmapData] = useState([]);
  const [viewMode, setViewMode] = useState('count'); // 'count' or 'revenue'

  useEffect(() => {
    if (data.length === 0 || !filters || !filters.date) return;
    const matrix = Array(7).fill().map(() => Array(24).fill(0));
    const revenueMatrix = Array(7).fill().map(() => Array(24).fill(0));
    // Get selected month and year from filters.date
    const selectedDate = typeof filters.date === 'string' ? parseISO(filters.date) : filters.date;
    const selectedMonth = selectedDate.getMonth(); // 0-indexed
    const selectedYear = selectedDate.getFullYear();
    const [startHour, endHour] = filters.hourRange || [0, 23];
    const filteredData = data.filter(trip => {
      if (!trip.tpep_pickup_datetime) return false;
      let tripDate;
      const raw = trip.tpep_pickup_datetime;
      if (typeof raw === 'number') {
        tripDate = new Date(raw * 1000);
      } else if (typeof raw === 'string') {
        const fixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
        tripDate = parseISO(fixed);
      } else {
        return false;
      }
      // Only include trips from the selected month and year
      if (tripDate.getMonth() !== selectedMonth || tripDate.getFullYear() !== selectedYear) return false;
      // Only include trips in the selected hour range
      const hour = tripDate.getHours();
      if (hour < startHour || hour > endHour) return false;
      return true;
    });
    filteredData.forEach(trip => {
      let tripDate;
      const raw = trip.tpep_pickup_datetime;
      if (typeof raw === 'number') {
        tripDate = new Date(raw * 1000);
      } else if (typeof raw === 'string') {
        const fixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
        tripDate = parseISO(fixed);
      } else {
        return;
      }
      const day = getDay(tripDate); // 0 = Sunday, 1 = Monday, etc.
      const hour = getHours(tripDate);
      matrix[day][hour]++;
      if (trip.total_amount) {
        revenueMatrix[day][hour] += trip.total_amount;
      }
    });
    setHeatmapData({
      count: matrix,
      revenue: revenueMatrix
    });
  }, [data, filters]);

  // Calculate date range from data
  const tripDates = data
    .map(trip => {
      if (!trip.tpep_pickup_datetime) return null;
      let tripDate;
      const raw = trip.tpep_pickup_datetime;
      if (typeof raw === 'number') {
        tripDate = new Date(raw * 1000);
      } else if (typeof raw === 'string') {
        const fixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
        tripDate = parseISO(fixed);
      } else {
        return null;
      }
      return tripDate;
    })
    .filter(Boolean)
    .sort((a, b) => a - b);
  const minDate = tripDates.length > 0 ? tripDates[0] : null;
  const maxDate = tripDates.length > 0 ? tripDates[tripDates.length - 1] : null;

  // Get selected month name from filters.date
  let selectedMonthName = '';
  if (filters && filters.date) {
    const selectedDate = typeof filters.date === 'string' ? parseISO(filters.date) : filters.date;
    selectedMonthName = format(selectedDate, 'MMMM');
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({length: 24}, (_, i) => `${i}:00`);

  // Prepare annotations (text) for each cell
  const text = (viewMode === 'count' ? heatmapData.count : heatmapData.revenue)
    ? (viewMode === 'count'
        ? heatmapData.count.map(row => row.map(val => val ? Math.round(val).toString() : ''))
        : heatmapData.revenue.map(row => row.map(val => val ? `$${Math.round(val)}` : '')))
    : [];

  return (
    <div className="demand-heatmap-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>🔥 Demand Heatmap</h5>
        <select
          className="form-select form-select-sm"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <option value="count">Trip Count</option>
          <option value="revenue">Revenue</option>
        </select>
      </div>
      {selectedMonthName && (
        <div className="text-muted mb-2" style={{ fontSize: '0.95rem', textAlign: 'center' }}>
          Showing data for: <b>{selectedMonthName}</b>
        </div>
      )}
      <Plot
        data={[{
          z: viewMode === 'count' ? heatmapData.count : heatmapData.revenue,
          x: hours,
          y: days,
          type: 'heatmap',
          colorscale: [
            [0, '#440154'],
            [0.5, '#21908d'],
            [1, '#fde725']
          ],
          text: text,
          texttemplate: '%{text}',
          textfont: { color: 'white', size: 10 },
          showscale: true,
          hovertemplate: `
            <b>%{y}</b><br>
            Hour: %{x}<br>
            ${viewMode === 'count' ? 'Trips' : 'Revenue'}: %{z}<br>
            <extra></extra>
          `,
        }]}
        layout={{
          height: 500,
          margin: { t: 40, r: 30, l: 50, b: 50 },
          xaxis: {
            title: 'Hour of Day',
            tickangle: 45
          },
          yaxis: {
            title: 'Day of Week',
            autorange: 'reversed'
          },
          title: {
            text: `Trip ${viewMode === 'count' ? 'Count' : 'Revenue'} by Day and Hour`,
            font: { size: 20 }
          },
          hovermode: 'closest'
        }}
        config={{
          responsive: true,
          displayModeBar: false
        }}
      />
    </div>
  );
}

export default DemandHeatmap; 