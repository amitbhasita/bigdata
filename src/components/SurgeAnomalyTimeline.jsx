import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Slider, Typography, Box } from "@mui/material";
import { useFilter } from "../context/FilterContext";
import { useData } from "../context/DataContext";
import { parseISO, isSameDay, getHours } from "date-fns";

function SurgeAnomalyTimeline() {
  const { filters } = useFilter();
  const { data } = useData();
  const [hourlyFares, setHourlyFares] = useState([]);
  const [threshold, setThreshold] = useState(2);  // Set default threshold to 2

  useEffect(() => {
    if (!filters.date || data.length === 0) return;

    const [startHour, endHour] = filters.hourRange;

    let targetDate;
    if (typeof filters.date === "string") {
      targetDate = parseISO(filters.date);
    } else {
      targetDate = filters.date;
    }

    // 🔥 Filter trips matching selected date
    const tripsOnSelectedDate = data.filter((trip) => {
      if (!trip.tpep_pickup_datetime) return false;

      let raw = trip.tpep_pickup_datetime;
      let tripDateObj;
      if (typeof raw === "number") {
        tripDateObj = new Date(raw * 1000);
      } else if (typeof raw === "string") {
        const fixed = raw.includes("T") ? raw : raw.replace(" ", "T");
        tripDateObj = parseISO(fixed);
      } else {
        return false;
      }

      return isSameDay(tripDateObj, targetDate);
    });

    // 🔢 Calculate median fare and count by hour
    const fareBuckets = Array(24).fill(null).map(() => []);

    tripsOnSelectedDate.forEach((trip) => {
      const rawPickup = trip.tpep_pickup_datetime;
      let pickupDate;

      if (typeof rawPickup === "number") {
        pickupDate = new Date(rawPickup * 1000);
      } else if (typeof rawPickup === "string") {
        const fixedPickup = rawPickup.includes("T") ? rawPickup : rawPickup.replace(" ", "T");
        pickupDate = parseISO(fixedPickup);
      } else {
        return;
      }

      const hour = pickupDate.getHours();
      const fare = parseFloat(trip.total_amount);

      if (fare > 0 && fare < 300) {
        fareBuckets[hour].push(fare);
      }
    });

    // Filter hourly data based on the selected hour range
    const hourlyStats = fareBuckets.map((bucket, hour) => {
      if (hour >= startHour && hour <= endHour) {
        if (bucket.length === 0) return { median: 0, count: 0 };
        const sorted = [...bucket].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        return { median, count: bucket.length };
      }
      return { median: 0, count: 0 };
    });

    setHourlyFares(hourlyStats);
  }, [filters.date, filters.hourRange, data]);

  const x = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const y = hourlyFares.map((h) => h.median);

  const mean = y.reduce((a, b) => a + b, 0) / y.length;
  const stdDev = Math.sqrt(y.reduce((sum, val) => sum + (val - mean) ** 2, 0) / y.length);

  const handleSliderChange = (event, newValue) => {
    setThreshold(newValue);
  };

  return (
    <div>
      <Typography variant="h5">Surge Detection on {filters.date}</Typography>

      {/* Slider to adjust the anomaly detection threshold */}
      <Box sx={{ marginTop: 2, marginBottom: 2 }}>
        <Typography>Set Anomaly Threshold: {threshold}</Typography>
        <Slider
          value={threshold}
          onChange={handleSliderChange}
          min={1}
          max={5}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}x`}
          sx={{
            width: "300px",  // Decrease the width of the slider
            height: "6px",   // Decrease the height of the slider
          }}
        />
      </Box>

      <Plot
        data={[
          {
            x,
            y,
            type: "scatter",
            mode: "lines+markers",
            marker: {
              color: y.map((v) => (v > mean + threshold * stdDev ? "red" : "#19d3f3")),
              size: y.map((v) => (v > mean + threshold * stdDev ? 10 : 6)),
            },
            line: { shape: "spline" },
            hovertemplate: "Hour: %{x}<br>Median Fare: $%{y:.2f}<extra></extra>",
          },
          {
            x,
            y: Array(24).fill(mean + threshold * stdDev),
            type: "scatter",
            mode: "lines",
            name: "Anomaly Threshold",
            line: { dash: "dot", color: "gray" },
            hoverinfo: "skip",
          },
        ]}
        layout={{
          width: 1150,
          height: 400,
          margin: { t: 40, r: 30, l: 60, b: 60 },
          yaxis: { title: "Median Fare ($)" },
          xaxis: { title: "Hour of Day" },
          showlegend: false,
        }}
      />
    </div>
  );
}

export default SurgeAnomalyTimeline; 