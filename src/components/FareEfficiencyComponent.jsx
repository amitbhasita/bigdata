import React, { useState, useEffect } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import { useData } from '../context/DataContext';
import { useFilter } from '../context/FilterContext';
import { format, parseISO } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function FareEfficiencyComponent() {
  const { data } = useData();
  const { filters } = useFilter();
  const [fareEfficiencyByLocation, setFareEfficiencyByLocation] = useState([]);
  const [fareEfficiencyByTime, setFareEfficiencyByTime] = useState([]);
  const [scatterData, setScatterData] = useState(null);

  useEffect(() => {
    if (!data || data.length === 0 || !filters || !filters.date || !filters.hourRange) return;

    // Filter trips by selected date and hour range
    const [startHour, endHour] = filters.hourRange;
    const validTrips = data.filter(trip => {
      if (
        trip.trip_distance <= 0 ||
        trip.fare_amount <= 0 ||
        trip.trip_distance >= 50 ||
        trip.fare_amount >= 100 ||
        !trip.tpep_pickup_datetime
      ) {
        return false;
      }
      let tripDate;
      const raw = trip.tpep_pickup_datetime;
      if (typeof raw === 'number') {
        tripDate = new Date(raw * 1000);
      } else if (typeof raw === 'string') {
        const datetimeFixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
        tripDate = parseISO(datetimeFixed);
      } else {
        return false;
      }
      const tripDateStr = tripDate.toISOString().slice(0, 10);
      if (tripDateStr !== filters.date) return false;
      const hour = tripDate.getHours();
      if (hour < startHour || hour > endHour) return false;
      return true;
    });

    // Calculate fare efficiency ($ per mile) for each trip
    const tripsWithEfficiency = validTrips.map(trip => ({
      ...trip,
      farePerMile: trip.fare_amount / trip.trip_distance
    }));

    // Group by pickup location
    const locationEfficiency = {};
    tripsWithEfficiency.forEach(trip => {
      if (!locationEfficiency[trip.PULocationID]) {
        locationEfficiency[trip.PULocationID] = {
          totalFare: 0,
          totalDistance: 0,
          count: 0
        };
      }
      locationEfficiency[trip.PULocationID].totalFare += trip.fare_amount;
      locationEfficiency[trip.PULocationID].totalDistance += trip.trip_distance;
      locationEfficiency[trip.PULocationID].count += 1;
    });

    // Calculate average efficiency by location
    const locationEfficiencyArray = Object.entries(locationEfficiency)
      .map(([locationId, data]) => ({
        locationId: parseInt(locationId),
        efficiency: data.totalFare / data.totalDistance,
        tripCount: data.count
      }))
      .filter(item => item.tripCount > 5) // Only include locations with enough data
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 15); // Top 15 locations

    setFareEfficiencyByLocation(locationEfficiencyArray);

    // Group by hour of day
    const hourlyEfficiency = {};
    tripsWithEfficiency.forEach(trip => {
      let tripDate;
      const raw = trip.tpep_pickup_datetime;
      
      if (typeof raw === 'number') {
        tripDate = new Date(raw * 1000);
      } else if (typeof raw === 'string') {
        const datetimeFixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
        tripDate = parseISO(datetimeFixed);
      } else {
        return;
      }
      
      const hour = tripDate.getHours();
      
      if (!hourlyEfficiency[hour]) {
        hourlyEfficiency[hour] = {
          totalFare: 0,
          totalDistance: 0,
          count: 0
        };
      }
      hourlyEfficiency[hour].totalFare += trip.fare_amount;
      hourlyEfficiency[hour].totalDistance += trip.trip_distance;
      hourlyEfficiency[hour].count += 1;
    });

    // Calculate average efficiency by hour
    const hourlyEfficiencyArray = Object.entries(hourlyEfficiency)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        efficiency: data.totalFare / data.totalDistance,
        tripCount: data.count
      }))
      .sort((a, b) => a.hour - b.hour);

    setFareEfficiencyByTime(hourlyEfficiencyArray);

    // Create scatter plot data
    setScatterData({
      datasets: [{
        label: 'Fare Efficiency vs Distance',
        data: tripsWithEfficiency.slice(0, 1000).map(trip => ({
          x: trip.trip_distance,
          y: trip.farePerMile
        })),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    });
  }, [data, filters]);

  const locationChartData = {
    labels: fareEfficiencyByLocation.map(item => `Location ${item.locationId}`),
    datasets: [{
      label: 'Fare Efficiency ($ per mile)',
      data: fareEfficiencyByLocation.map(item => item.efficiency.toFixed(2)),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  const timeChartData = {
    labels: fareEfficiencyByTime.map(item => `${item.hour}:00`),
    datasets: [{
      label: 'Fare Efficiency by Hour ($ per mile)',
      data: fareEfficiencyByTime.map(item => item.efficiency.toFixed(2)),
      backgroundColor: 'rgba(255, 99, 132, 0.6)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
      fill: false
    }]
  };

  const scatterOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Trip Distance (miles)'
        },
        min: 0,
        max: 15
      },
      y: {
        title: {
          display: true,
          text: 'Fare per Mile ($)'
        },
        min: 0,
        max: 20
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toFixed(2)}/mile at ${context.parsed.x.toFixed(1)} miles`;
          }
        }
      }
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5>💰 Taxi Fare Efficiency Analysis</h5>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <h6>Fare Efficiency by Location (Top 15)</h6>
          <Bar data={locationChartData} />
          <p className="text-muted small">Higher values indicate more expensive fares per mile</p>
        </div>
        
        <div className="mb-4">
          <h6>Fare Efficiency by Hour of Day</h6>
          <Bar data={timeChartData} />
          <p className="text-muted small">Shows how fare efficiency varies throughout the day</p>
        </div>
        
        {scatterData && (
          <div>
            <h6>Fare Efficiency vs Trip Distance</h6>
            <Scatter data={scatterData} options={scatterOptions} />
            <p className="text-muted small">Shows how fare efficiency changes with trip distance</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FareEfficiencyComponent; 