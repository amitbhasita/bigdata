import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useData } from '../context/DataContext';
import { useFilter } from '../context/FilterContext';
import { parseISO } from 'date-fns';

function TripDemandForecast() {
  const { data } = useData();
  const { filters } = useFilter();
  const [hourlyCounts, setHourlyCounts] = useState([]);
  const [predictedCounts, setPredictedCounts] = useState([]);
  const [lowerBound, setLowerBound] = useState([]);
  const [upperBound, setUpperBound] = useState([]);
  const [modelInfo, setModelInfo] = useState('');

  useEffect(() => {
    if (!filters.date || data.length === 0 || !filters.hourRange) return;

    const [startHour, endHour] = filters.hourRange;

    // Calculate hourly counts
    const counts = Array(24).fill(0);
    data.forEach((trip) => {
      const rawPickup = trip.tpep_pickup_datetime;
      let pickupDate;
      if (typeof rawPickup === 'number') {
        pickupDate = new Date(rawPickup * 1000);
      } else if (typeof rawPickup === 'string') {
        const fixedPickup = rawPickup.includes('T') ? rawPickup : rawPickup.replace(' ', 'T');
        pickupDate = parseISO(fixedPickup);
      } else {
        return;
      }

      const tripDateStr = pickupDate.toISOString().slice(0, 10);
      if (tripDateStr !== filters.date) return;

      const hour = pickupDate.getHours();
      if (hour >= startHour && hour <= endHour) {
        counts[hour]++;
      }
    });

    setHourlyCounts(counts);

    // Enhanced forecasting model
    const forecast = predictWithEnsemble(counts);
    setPredictedCounts(forecast);

    // Calculate confidence intervals using prediction errors
    const { lower, upper } = calculateConfidenceIntervals(counts, forecast);
    setLowerBound(lower);
    setUpperBound(upper);

  }, [filters.date, filters.hourRange, data]);

  // Ensemble of forecasting methods
  const predictWithEnsemble = (counts) => {
    // 1. Exponential Smoothing
    const expSmoothing = exponentialSmoothing(counts, 0.3);
    
    // 2. Weighted Moving Average (recent hours have more weight)
    const weightedMA = weightedMovingAverage(counts, 3, [0.5, 0.3, 0.2]);
    
    // 3. Simple Moving Average (original approach)
    const simpleMA = simpleMovingAverage(counts, 3);
    
    // 4. Time Series Regression (linear trend + periodic component)
    const regression = timeSeriesRegression(counts);
    
    // Combine predictions with weights
    const combined = counts.map((_, i) => {
      return Math.round(
        0.4 * expSmoothing[i] + 
        0.3 * weightedMA[i] + 
        0.2 * simpleMA[i] + 
        0.1 * regression[i]
      );
    });

    setModelInfo('Ensemble Model');
    return combined;
  };

  // Exponential Smoothing
  const exponentialSmoothing = (data, alpha) => {
    let smoothed = [data[0]];
    for (let i = 1; i < data.length; i++) {
      smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
    }
    return smoothed.map(x => Math.round(x));
  };

  // Weighted Moving Average
  const weightedMovingAverage = (data, windowSize, weights) => {
    return data.map((_, i) => {
      if (i < windowSize) return data[i];
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += data[i - j - 1] * weights[j];
      }
      return Math.round(sum);
    });
  };

  // Simple Moving Average (original)
  const simpleMovingAverage = (data, windowSize) => {
    return data.map((_, i) => {
      if (i < windowSize) {
        const earlyAvg = data.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1);
        return Math.round(earlyAvg);
      }
      const avg = data.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
      return Math.round(avg);
    });
  };

  // Time Series Regression (linear + periodic components)
  const timeSeriesRegression = (data) => {
    // Calculate linear trend
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, _, i) => a + x[i] * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate periodic component (daily pattern)
    const periodicComponent = calculatePeriodicPattern(data);
    
    // Combine linear trend + periodic component
    return x.map((xi, i) => {
      const trend = intercept + slope * xi;
      const periodic = periodicComponent[i % 24]; // Assuming daily pattern
      return Math.round(trend + periodic);
    });
  };

  // Calculate periodic patterns (daily seasonality)
  const calculatePeriodicPattern = (data) => {
    // For simplicity, we'll use the average pattern from the input data
    // In a real implementation, you might use historical patterns
    return data;
  };

  // Improved confidence interval calculation
  const calculateConfidenceIntervals = (actual, predicted) => {
    // Calculate prediction errors
    const errors = actual.map((a, i) => a - predicted[i]).filter(e => !isNaN(e));
    const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
    const stdDev = Math.sqrt(errors.reduce((a, b) => a + Math.pow(b - meanError, 2), 0) / errors.length);
    
    // Calculate intervals (95% confidence)
    const zScore = 1.96; // for 95% CI
    const lower = predicted.map(p => Math.max(0, Math.round(p - zScore * stdDev)));
    const upper = predicted.map(p => Math.round(p + zScore * stdDev));
    
    return { lower, upper };
  };

  const x = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));

  return (
    <div>
      <h5>Trip Demand Forecast for {filters.date}</h5>
      <p><small>{modelInfo}</small></p>
      <Plot
        data={[
          // Confidence Band (Shaded Area)
          {
            x: [...x, ...x.slice().reverse()],
            y: [...upperBound, ...lowerBound.slice().reverse()],
            fill: 'toself',
            fillcolor: 'rgba(255,165,0,0.2)',
            line: { color: 'transparent' },
            type: 'scatter',
            mode: 'none',
            name: 'Confidence Interval',
            hoverinfo: 'skip',
          },
          // Actual trips
          {
            x,
            y: hourlyCounts,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Actual Trips',
            marker: { color: '#1f77b4', size: 8 },
            line: { shape: 'spline', width: 2 },
            hovertemplate: 'Hour: %{x}<br>Actual Trips: %{y}<extra></extra>',
          },
          // Predicted trips
          {
            x,
            y: predictedCounts,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Predicted Trips',
            marker: { color: 'orange', size: 6 },
            line: { dash: 'dash', shape: 'spline', width: 2 },
            hovertemplate: 'Hour: %{x}<br>Predicted Trips: %{y}<extra></extra>',
          },
          // Peak hour point
          {
            x: [x[peakHour]],
            y: [hourlyCounts[peakHour]],
            type: 'scatter',
            mode: 'markers+text',
            marker: { color: 'red', size: 14, symbol: 'star' },
            text: [''],
            textposition: 'top left',
            name: 'Peak Hour',
            hoverinfo: 'skip',
          },
        ]}
        layout={{
          width: 1150,
          height: 480,
          margin: { t: 50, r: 30, l: 60, b: 60 },
          yaxis: { title: 'Number of Trips' },
          xaxis: {
            title: 'Hour of Day',
            tickmode: 'array',
            tickvals: x,
            ticktext: x,
          },
          title: 'Trip Demand Forecast',
          showlegend: true,
        }}
      />
    </div>
  );
}

export default TripDemandForecast;
