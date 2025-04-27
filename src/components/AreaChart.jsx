import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";

const AreaChart = ({ csvPath = "/sampled_every_100th_row.csv" }) => {
  const [dataRows, setDataRows] = useState([]);
  const [metric, setMetric] = useState("trip_count");
  const [xAxisMode, setXAxisMode] = useState("month"); // month, day, weekday, hour

  useEffect(() => {
    Papa.parse(csvPath, {
      download: true,
      header: true,
      complete: (result) => {
        const filtered = result.data.filter(row =>
          row["tpep_pickup_datetime"] &&
          !isNaN(new Date(row["tpep_pickup_datetime"])) &&
          !isNaN(parseFloat(row["fare_amount"])) &&
          !isNaN(parseFloat(row["total_amount"])) &&
          !isNaN(parseFloat(row["tip_amount"])) &&
          !isNaN(parseFloat(row["trip_distance"]))
        );
        setDataRows(filtered);
      }
    });
  }, [csvPath]);

  const computeMetric = () => {
    const size =
      xAxisMode === "month"
        ? 12
        : xAxisMode === "day"
        ? 31
        : xAxisMode === "weekday"
        ? 7
        : 24; // hour

    const grouped = Array(size).fill(0);
    const counts = Array(size).fill(0);

    dataRows.forEach(row => {
      const date = new Date(row["tpep_pickup_datetime"]);

      let index;
      if (xAxisMode === "month") index = date.getMonth();         // 0–11
      else if (xAxisMode === "day") index = date.getDate() - 1;    // 0–30
      else if (xAxisMode === "weekday") index = (date.getDay() + 6) % 7; // 0=Mon
      else if (xAxisMode === "hour") index = date.getHours();      // 0–23

      const fare = parseFloat(row["fare_amount"]);
      const total = parseFloat(row["total_amount"]);
      const tip = parseFloat(row["tip_amount"]);
      const dist = parseFloat(row["trip_distance"]);

      switch (metric) {
        case "trip_count":
          grouped[index]++;
          break;
        case "avg_fare":
          grouped[index] += fare;
          counts[index]++;
          break;
        case "total_revenue":
          grouped[index] += total;
          break;
        case "avg_tip":
          grouped[index] += tip;
          counts[index]++;
          break;
        case "total_tip":
          grouped[index] += tip;
          break;
        case "avg_distance":
          grouped[index] += dist;
          counts[index]++;
          break;
        case "total_distance":
          grouped[index] += dist;
          break;
        default:
          break;
      }
    });

    if (["avg_fare", "avg_tip", "avg_distance"].includes(metric)) {
      return grouped.map((sum, i) => (counts[i] ? (sum / counts[i]).toFixed(2) : 0));
    } else {
      return grouped.map(val => val.toFixed(2));
    }
  };

  const yValues = computeMetric();

  const xValues =
    xAxisMode === "weekday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : Array.from(
          { length: xAxisMode === "month" ? 12 : xAxisMode === "day" ? 31 : 24 },
          (_, i) => i + (xAxisMode === "hour" ? 0 : 1)
        );

  const minY = Math.min(...yValues.map(Number));
  const maxY = Math.max(...yValues.map(Number));
  const minIndex = yValues.findIndex(y => Number(y) === minY);
  const maxIndex = yValues.findIndex(y => Number(y) === maxY);
  const minX = xValues[minIndex];
  const maxX = xValues[maxIndex];

  return (
    <div className="area-chart-component">
      <h2>NYC Taxi Trips - {metric.replace("_", " ").toUpperCase()} by {xAxisMode}</h2>

      <div style={{ margin: "10px 0", fontWeight: "bold" }}>
        Min: {minY} on {xAxisMode} = {minX} &nbsp; | &nbsp;
        Max: {maxY} on {xAxisMode} = {maxX}
      </div>

      <div className="controls" style={{ marginBottom: "20px" }}>
        <label>
          Select Metric:{" "}
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="trip_count">Trip Count</option>
            <option value="avg_fare">Average Fare</option>
            <option value="total_revenue">Total Revenue</option>
            <option value="avg_tip">Average Tip</option>
            <option value="total_tip">Total Tip</option>
            <option value="avg_distance">Average Distance</option>
            <option value="total_distance">Total Distance</option>
          </select>
        </label>

        <label style={{ marginLeft: "20px" }}>
          X-Axis:{" "}
          <select value={xAxisMode} onChange={(e) => setXAxisMode(e.target.value)}>
            <option value="month">Month (1–12)</option>
            <option value="day">Day of Month (1–31)</option>
            <option value="weekday">Day of Week (Mon–Sun)</option>
            <option value="hour">Hour of Day (0–23)</option>
          </select>
        </label>
      </div>

      <Plot
        data={[
          {
            x: xValues,
            y: yValues,
            type: "scatter",
            mode: "none", // No line, no markers
            fill: "tozeroy", // Area to x-axis
            line: { shape: "spline", color: "blue" } // Smooth curved line (spline)
          }
        ]}
        layout={{
          title: `${metric.replace("_", " ").toUpperCase()} by ${xAxisMode}`,
          xaxis: {
            title:
              xAxisMode === "month"
                ? "Month"
                : xAxisMode === "day"
                ? "Day of Month"
                : xAxisMode === "weekday"
                ? "Day of Week"
                : "Hour of Day",
            tickmode: "array",
            tickvals: xValues,
            ticktext: xValues
          },
          yaxis: { title: metric.replace("_", " ") }
        }}
        style={{ width: "100%", maxWidth: "800px", margin: "auto" }}
      />
    </div>
  );
};

export default AreaChart; 