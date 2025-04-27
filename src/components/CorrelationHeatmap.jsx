import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";

// ✨ Mention your custom attributes here
const selectedAttributes = [
  "passenger_count",
  "trip_distance",
  "fare_amount",
  "mta_tax",
  "tip_amount",
  "tolls_amount",
  "improvement_surcharge",
  "total_amount",
  "congestion_surcharge",
  "airport_fee",
];

const computeCorrelationMatrix = (data, selectedKeys) => {
  const matrix = selectedKeys.map(() => Array(selectedKeys.length).fill(0));
  const means = selectedKeys.map(
    (k) =>
      data.reduce((sum, row) => sum + parseFloat(row[k] || 0), 0) / data.length,
  );

  selectedKeys.forEach((keyX, i) => {
    selectedKeys.forEach((keyY, j) => {
      const covXY = data.reduce(
        (sum, row) =>
          sum +
          (parseFloat(row[keyX] || 0) - means[i]) *
            (parseFloat(row[keyY] || 0) - means[j]),
        0,
      );
      const stdX = Math.sqrt(
        data.reduce(
          (sum, row) =>
            sum + Math.pow(parseFloat(row[keyX] || 0) - means[i], 2),
          0,
        ),
      );
      const stdY = Math.sqrt(
        data.reduce(
          (sum, row) =>
            sum + Math.pow(parseFloat(row[keyY] || 0) - means[j], 2),
          0,
        ),
      );
      matrix[i][j] = covXY / (stdX * stdY) || 0;
    });
  });

  return { matrix, keys: selectedKeys };
};

const CorrelationHeatmap = () => {
  const [corrData, setCorrData] = useState(null);

  useEffect(() => {
    Papa.parse("/sampled_every_100th_row.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        // Relaxed filter: at least 2 valid attributes
        const filtered = result.data.filter((row) =>
          selectedAttributes.filter(attr => row[attr] !== "" && row[attr] !== null && !isNaN(row[attr])).length >= 2
        );
        console.log('Filtered rows:', filtered.length);
        if (filtered.length === 0) {
          console.warn('No valid rows found for correlation heatmap.');
        }
        const { matrix, keys } = computeCorrelationMatrix(
          filtered,
          selectedAttributes,
        );
        // Check for NaN or Infinity in the matrix
        const hasNaN = matrix.flat().some(v => isNaN(v) || !isFinite(v));
        if (hasNaN) {
          console.warn('Correlation matrix contains NaN or Infinity values:', matrix);
        }
        setCorrData({ matrix, keys });
      },
    });
  }, []);

  return (
    <div>
      <h2>Correlation Heatmap of Selected Taxi Features</h2>

      {corrData && (
        <Plot
          data={[
            {
              z: corrData.matrix,
              x: corrData.keys,
              y: corrData.keys,
              type: "heatmap",
              colorscale: "YlGnBu",
              zmin: -1,
              zmax: 1,
            },
          ]}
          layout={{
            width: 800,
            height: 800,
            title: "Selected Feature Correlation Heatmap",
            xaxis: { side: "top" },
            yaxis: { autorange: "reversed" },
          }}
        />
      )}
    </div>
  );
};

export default CorrelationHeatmap; 