import React, { useEffect, useState, useRef } from 'react';
import Plot from 'react-plotly.js';
import { useFilter } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { format, parseISO, addDays, isBefore, isSameMonth } from 'date-fns';

const DynamicFareAnimation = () => {
  const { filters } = useFilter();
  const { data } = useData();
  const [currentDate, setCurrentDate] = useState(filters.date || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);
  const [dateList, setDateList] = useState([]);
  const [currentData, setCurrentData] = useState(null);

  // Build the list of dates for the animation (from selected date to one month later, same month only)
  useEffect(() => {
    if (!filters.date) {
      setDateList([]);
      setCurrentDate(null);
      return;
    }
    const start = parseISO(filters.date);
    let dates = [];
    let d = start;
    for (let i = 0; i < 31; i++) {
      if (!isSameMonth(d, start)) break;
      dates.push(format(d, 'yyyy-MM-dd'));
      d = addDays(d, 1);
    }
    setDateList(dates);
    setCurrentDate(format(start, 'yyyy-MM-dd'));
  }, [filters.date]);

  // Animation effect
  useEffect(() => {
    if (isPlaying && dateList.length > 0) {
      let idx = dateList.indexOf(currentDate);
      animationRef.current = setInterval(() => {
        idx = (idx + 1) % dateList.length;
        setCurrentDate(dateList[idx]);
      }, 1000);
      return () => clearInterval(animationRef.current);
    } else {
      clearInterval(animationRef.current);
    }
  }, [isPlaying, currentDate, dateList]);

  // Update currentData for the currentDate
  useEffect(() => {
    if (!currentDate || !data || data.length === 0) {
      setCurrentData(null);
      return;
    }
    const fares = [];
    let tripCount = 0;
    data.forEach(trip => {
      if (!trip.tpep_pickup_datetime || trip.fare_amount == null) return;
      let tripDateObj;
      const raw = trip.tpep_pickup_datetime;
      if (typeof raw === 'number') {
        tripDateObj = new Date(raw * 1000);
      } else if (typeof raw === 'string') {
        const fixed = raw.includes('T') ? raw : raw.replace(' ', 'T');
        tripDateObj = parseISO(fixed);
      } else {
        return;
      }
      const tripDateStr = tripDateObj.toISOString().slice(0, 10);
      if (tripDateStr !== currentDate) return;
      fares.push(trip.fare_amount);
      tripCount++;
    });
    setCurrentData({ date: currentDate, fares, count: tripCount });
  }, [data, currentDate]);

  const handlePlay = () => {
    setIsPlaying(true);
  };
  const handlePause = () => {
    setIsPlaying(false);
  };
  const handleReset = () => {
    if (dateList.length > 0) setCurrentDate(dateList[0]);
    setIsPlaying(false);
  };

  if (!currentData) return <div>Loading...</div>;

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title text-center mb-4">Dynamic Fare Distribution</h2>
        <div className="d-flex justify-content-center mb-3">
          <button className="btn btn-primary me-2" onClick={handlePlay} disabled={isPlaying}>
            Play
          </button>
          <button className="btn btn-warning me-2" onClick={handlePause} disabled={!isPlaying}>
            Pause
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>
        <div className="text-center mb-3">
          <h4>{format(parseISO(currentData.date), 'MMMM d, yyyy')}</h4>
          <p>Total Trips: {currentData.count}</p>
        </div>
        <Plot
          data={[
            {
              x: currentData.fares,
              type: 'histogram',
              nbinsx: 30,
              name: 'Fare Distribution',
              marker: {
                color: 'rgba(55, 128, 191, 0.7)',
                line: {
                  color: 'rgba(55, 128, 191, 1)',
                  width: 1
                }
              }
            }
          ]}
          layout={{
            title: {
              text: 'Fare Distribution for Selected Date',
              font: { size: 16 }
            },
            xaxis: {
              title: {
                text: 'Fare Amount (USD)',
                font: { size: 14 }
              },
              range: [0, 100],
              tickprefix: '$',
              ticksuffix: '',
              showgrid: true,
              gridcolor: '#f0f0f0'
            },
            yaxis: {
              title: {
                text: 'Number of Trips (count)',
                font: { size: 14 }
              },
              showgrid: true,
              gridcolor: '#f0f0f0'
            },
            height: 400,
            margin: { t: 30, r: 30, b: 50, l: 50 },
            showlegend: false,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white'
          }}
          config={{ responsive: true }}
        />
        <div className="mt-3 text-center text-muted">
          <small>
            X-axis: Shows fare amounts in US Dollars (USD), ranging from $0 to $100<br />
            Y-axis: Shows the count of trips for each fare amount range
          </small>
        </div>
      </div>
    </div>
  );
};

export default DynamicFareAnimation; 