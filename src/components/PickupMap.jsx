import Plot from 'react-plotly.js';
import { useFilter } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { useEffect, useState } from 'react';
import { parseISO } from 'date-fns';
import DatePicker from 'react-datepicker'; // Import the DatePicker component
import 'react-datepicker/dist/react-datepicker.css'; // Import the date picker styles

function PickupMap() {
  const { filters, setFilters } = useFilter();
  const { data } = useData();
  const [zoneData, setZoneData] = useState([]);
  const [maxZoneCount, setMaxZoneCount] = useState(10); // Added control for top N zones

  useEffect(() => {
    if (!filters.date || data.length === 0) return;

    const [startHour, endHour] = filters.hourRange;

    let targetDate;
    if (typeof filters.date === 'string') {
      targetDate = parseISO(filters.date);
    } else {
      targetDate = filters.date;
    }

    // Filter trips based on date and hour range
    const tripsFiltered = data.filter((trip) => {
      if (!trip.tpep_pickup_datetime || trip.PULocationID == null) return false;

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

      // Date Match
      const tripDateStr = tripDateObj.toISOString().slice(0, 10);
      if (tripDateStr !== filters.date) return false;

      // Hour Match
      const tripHour = tripDateObj.getHours();
      if (tripHour < startHour || tripHour > endHour) return false;

      return true;
    });

    console.log("✅ Filtered Trips for Pickup Map:", tripsFiltered.length);

    // Aggregate trips per pickup zone
    const zoneCounts = {};

    tripsFiltered.forEach((trip) => {
      const zoneId = trip.PULocationID;
      const zoneName = `Zone ${zoneId}`;

      if (!zoneCounts[zoneName]) {
        zoneCounts[zoneName] = 0;
      }
      zoneCounts[zoneName]++;
    });

    // Convert to array, sort, and slice based on maxZoneCount
    const sortedZones = Object.keys(zoneCounts)
      .map(zone => ({
        zone,
        count: zoneCounts[zone],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, maxZoneCount); // Dynamically control the number of zones displayed

    setZoneData(sortedZones);
  }, [filters.date, filters.hourRange, data, maxZoneCount]);

  // Handle date change
  const handleDateChange = (date) => {
    setFilters(prev => ({ ...prev, date: date.toISOString().slice(0, 10) }));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>
          🗺️ Top {maxZoneCount} Pickup Zones for {filters.date || '...'}
          {filters.selectedZone && (
            <span className="ms-2 text-primary">(Selected: {filters.selectedZone})</span>
          )}
        </h5>
        {filters.selectedZone && (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => setFilters(prev => ({ ...prev, selectedZone: null }))}
          >
            Clear Zone Filter
          </button>
        )}
      </div>

      {/* Date Picker for selecting date */}
      <div className="mb-3">
        <label htmlFor="datePicker" className="form-label">Select Date:</label>
        <DatePicker
          id="datePicker"
          selected={filters.date ? new Date(filters.date) : null} // Make sure it's a valid date object
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          className="form-control"
          placeholderText="Click to select a date"
        />
      </div>

      {/* Control the number of zones */}
      <div className="mb-3">
        <label htmlFor="zoneCount" className="form-label">Select Top Zones:</label>
        <input
          type="number"
          id="zoneCount"
          className="form-control"
          min="1"
          max="20"
          value={maxZoneCount}
          onChange={(e) => setMaxZoneCount(Number(e.target.value))}
        />
      </div>

      <Plot
        data={[{
          type: 'bar',
          x: zoneData.map(z => z.count),
          y: zoneData.map(z => z.zone),
          orientation: 'h',
          hoverinfo: 'x+y',  // Show count and zone name in hover tooltip
          marker: {
            color: zoneData.map(z => z.count), // Dynamic color based on count
            colorscale: 'Viridis', // Color scale for better visualization
            showscale: true,  // Add a color scale legend
          },
        }]}
        layout={{
          width: 1150,
          height: 400,
          margin: { t: 40, l: 100, r: 30, b: 50 },
          xaxis: { title: 'Ride Count' },
          yaxis: { title: 'Pickup Zone' },
          showlegend: false,
          hoverlabel: {
            bgcolor: 'white',
            font: { family: 'Arial, sans-serif', size: 14, color: 'black' }
          },
        }}
        onClick={(data) => {
          const clickedZone = data.points[0].y;
          setFilters(prev => ({ ...prev, selectedZone: clickedZone, focusedChart: 'PickupMap' }));
          console.log("📍 Selected Zone:", clickedZone);
        }}
      />
    </div>
  );
}

export default PickupMap;
