import Plot from 'react-plotly.js';
import { useEffect, useMemo, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { parseISO } from 'date-fns';

function FareBoxplot() {
  const { filters, setFilters } = useFilter();
  const { data } = useData();
  const zone = filters.selectedZone || 'Any';

  const parseTripDate = (rawDate) => {
    if (typeof rawDate === 'number') {
      return new Date(rawDate * 1000);
    } else if (typeof rawDate === 'string') {
      const fixed = rawDate.includes('T') ? rawDate : rawDate.replace(' ', 'T');
      return parseISO(fixed);
    }
    return null;
  };

  const getDistanceBucket = (dist) => {
    if (dist <= 1) return '0-1 km';
    if (dist <= 2) return '1-2 km';
    if (dist <= 3) return '2-3 km';
    if (dist <= 5) return '3-5 km';
    return '5+ km';
  };
 
  const tripsFiltered = useMemo(() => {
    if (!filters.date || data.length === 0) return [];

    const [startHour, endHour] = filters.hourRange;

    return data.filter((trip) => {
      if (!trip.tpep_pickup_datetime || trip.trip_distance == null || trip.total_amount == null) {
        return false;
      }

      const tripDateObj = parseTripDate(trip.tpep_pickup_datetime);
      if (!tripDateObj) return false;

      const tripDateStr = tripDateObj.toISOString().slice(0, 10);
      if (tripDateStr !== filters.date) return false;

      const tripHour = tripDateObj.getHours();
      if (tripHour < startHour || tripHour > endHour) return false;

      if (filters.selectedZone && trip.PULocationID !== parseInt(filters.selectedZone.replace('Zone ', ''))) {
        return false;
      }

      if (filters.selectedVendor) {
        const vendorMap = { 'Vendor A': 1, 'Vendor B': 2 };
        if (trip.VendorID !== vendorMap[filters.selectedVendor]) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  const boxData = useMemo(() => {
    const buckets = {
      '0-1 km': [],
      '1-2 km': [],
      '2-3 km': [],
      '3-5 km': [],
      '5+ km': []
    };

    tripsFiltered.forEach((trip) => {
      const bucket = getDistanceBucket(trip.trip_distance);
      buckets[bucket].push(trip.total_amount);
    });

    return Object.keys(buckets).map(bucket => ({
      x: Array(buckets[bucket].length).fill(bucket),
      y: buckets[bucket],
      type: 'box',
      name: bucket,
      boxpoints: 'outliers',
      marker: {
        color: '#1f77b4',          // main box color (blue)
        outliercolor: 'red',       // 🔴 outliers shown in red
        size: 6,                   // marker size
        line: { outliercolor: 'red', outlierwidth: 2 }
      },
      line: { width: 1 },
      boxmean: 'sd',               // show mean + SD line inside box
      hovertemplate: `
        <b>Zone:</b> ${zone}<br>
        <b>Fare:</b> %{y}$<br>
        <b>Distance Range:</b> %{x}<br>
        <extra></extra>
      `
    }));
  }, [tripsFiltered, zone]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-2">
        <h5 className="mb-2">
          📦 Fare Distribution for{' '}
          <span className="text-primary">{zone}</span>{' '}
          {filters.selectedVendor && (
            <>via <strong>{filters.selectedVendor}</strong></>
          )}{' '}
          on {filters.date || '...'}
        </h5>

        {(filters.selectedZone || filters.selectedVendor) && (
          <button
            className="btn btn-sm btn-outline-danger mb-2"
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

      {boxData.length === 0 ? (
        <div className="text-muted text-center p-4">
          No trips matching the selected filters. Try adjusting the date, hour range, zone, or vendor.
        </div>
      ) : (
        <Plot
          data={boxData}
          layout={{
            autosize: true,
            margin: { t: 50, r: 30, l: 70, b: 70 },
            yaxis: {
              title: 'Fare Amount ($)',
              zeroline: false,
              gridcolor: '#e5e5e5',
              tickprefix: '$',
              tickfont: { size: 14 },
              titlefont: { size: 16 }
            },
            xaxis: {
              title: 'Trip Distance (km)',
              gridcolor: '#f0f0f0',
              tickfont: { size: 14 },
              titlefont: { size: 16 }
            },
            boxmode: 'group',
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            title: {
              text: 'Fare Distribution vs Trip Distance',
              font: { size: 22 },
              xref: 'paper',
              x: 0.5,
            },
            legend: {
              orientation: 'h',
              y: -0.2,
              font: { size: 13 }
            },
            height: 400,
          }}
          useResizeHandler={true}
          style={{ width: '100%', minHeight: 400 }}
          config={{
            displayModeBar: false,
            responsive: true
          }}
          onClick={() => setFilters(prev => ({ ...prev, focusedChart: 'FareBoxplot' }))}
        />
      )}
    </div>
  );
}

export default FareBoxplot;
