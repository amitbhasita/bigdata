import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useFilter } from '../context/FilterContext';
import { useData } from '../context/DataContext';

const AirportTripAnalysis = () => {
  const [hourlyData, setHourlyData] = useState({ airport: [], nonAirport: [] });
  const [error, setError] = useState(null);
  const { filters } = useFilter();
  const { data } = useData();

  // Airport location IDs (JFK: 132, LGA: 138)
  const airportLocations = [132, 138];

  useEffect(() => {
    if (!data || data.length === 0 || !filters || !filters.date) {
      setHourlyData({ airport: [], nonAirport: [] });
      return;
    }
    // Initialize hourly counts for both types of trips
    const hourlyCounts = {
      airport: new Array(24).fill(0),
      nonAirport: new Array(24).fill(0)
    };

    data.forEach(trip => {
      try {
        let pickup;
        const raw = trip["tpep_pickup_datetime"];
        if (typeof raw === 'number') {
          pickup = new Date(raw * 1000);
        } else if (typeof raw === 'string') {
          const fixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
          pickup = new Date(fixed);
        } else {
          return;
        }
        // Check if trip is within the selected date
        const tripDateStr = pickup.toISOString().slice(0, 10);
        if (tripDateStr !== filters.date) {
          return;
        }
        // Check if trip is within the selected hour range
        const pickupHour = pickup.getHours();
        const [startHour, endHour] = filters.hourRange;
        if (pickupHour < startHour || pickupHour > endHour) {
          return;
        }
        // Check if trip matches selected vendor
        if (filters.selectedVendor && trip.VendorID !== parseInt(filters.selectedVendor)) {
          return;
        }
        // Check if trip matches selected payment type
        if (filters.selectedPayment && trip.payment_type !== filters.selectedPayment) {
          return;
        }
        // Determine if this is an airport trip
        const isAirportTrip = 
          airportLocations.includes(trip.PULocationID) || 
          airportLocations.includes(trip.DOLocationID);
        // Increment the appropriate counter
        if (isAirportTrip) {
          hourlyCounts.airport[pickupHour]++;
        } else {
          hourlyCounts.nonAirport[pickupHour]++;
        }
      } catch (err) {
        // Ignore trip if error
      }
    });
    setHourlyData({
      airport: hourlyCounts.airport,
      nonAirport: hourlyCounts.nonAirport
    });
  }, [data, filters]);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <h2 style={{ textAlign: "center" }}>
        Airport vs Non-Airport Trip Analysis
        {filters.date && ` - ${filters.date}`}
      </h2>
      <Plot
        data={[
          {
            x: Array.from({length: 24}, (_, i) => i),
            y: hourlyData.airport,
            name: 'Airport Trips',
            type: 'scatter',
            mode: 'lines+markers',
            line: {
              color: 'rgb(255, 127, 14)',
              width: 2
            },
            marker: {
              size: 8
            }
          },
          {
            x: Array.from({length: 24}, (_, i) => i),
            y: hourlyData.nonAirport,
            name: 'Non-Airport Trips',
            type: 'scatter',
            mode: 'lines+markers',
            line: {
              color: 'rgb(31, 119, 180)',
              width: 2
            },
            marker: {
              size: 8
            }
          }
        ]}
        layout={{
          title: {
            text: "Hourly Trip Distribution",
            font: {
              size: 18,
              family: 'Arial, sans-serif'
            }
          },
          xaxis: {
            title: {
              text: "Hour of Day",
              font: {
                size: 14,
                family: 'Arial, sans-serif'
              }
            },
            range: [0, 23],
            tickmode: 'linear',
            tick0: 0,
            dtick: 1,
            showgrid: true,
            gridcolor: '#f0f0f0',
            zeroline: true,
            zerolinecolor: '#666',
            zerolinewidth: 2
          },
          yaxis: {
            title: {
              text: "Number of Trips (count)",
              font: {
                size: 14,
                family: 'Arial, sans-serif'
              }
            },
            showgrid: true,
            gridcolor: '#f0f0f0',
            zeroline: true,
            zerolinecolor: '#666',
            zerolinewidth: 2
          },
          height: 600,
          width: 1150,
          plot_bgcolor: 'white',
          paper_bgcolor: 'white',
          margin: {
            l: 60,
            r: 30,
            t: 50,
            b: 50
          },
          legend: {
            x: 0.5,
            y: 1.1,
            orientation: 'h'
          }
        }}
      />
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          X-axis: Hour of Day (0-23) - Shows the time when trips started<br />
          Y-axis: Number of Trips (count) - Shows how many trips occurred in each hour<br />
          Airport trips include pickups or dropoffs at JFK (ID: 132) or LGA (ID: 138)
        </p>
      </div>
    </div>
  );
};

export default AirportTripAnalysis; 