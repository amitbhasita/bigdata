import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { useFilter } from '../context/FilterContext';
import { useData } from '../context/DataContext';
import { parseISO } from 'date-fns';

function VendorPaymentChart() {
  const { filters, setFilters } = useFilter();
  const { data } = useData();
  const [mode, setMode] = useState('vendor');
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('bar'); // Default chart type

  useEffect(() => {
    if (!filters.date || data.length === 0) return;

    let targetDate;
    if (typeof filters.date === 'string') {
      targetDate = parseISO(filters.date);
    } else {
      targetDate = filters.date;
    }

    const [startHour, endHour] = filters.hourRange;

    const tripsFiltered = data.filter((trip) => {
      if (!trip.tpep_pickup_datetime || trip.total_amount == null) return false;

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

      const tripDateStr = tripDateObj.toISOString().slice(0, 10);
      if (tripDateStr !== filters.date) return false;

      const tripHour = tripDateObj.getHours();
      if (tripHour < startHour || tripHour > endHour) return false;

      return true;
    });

    if (mode === 'vendor') {
      const vendorTotals = { 'Vendor A': [], 'Vendor B': [] };

      tripsFiltered.forEach((trip) => {
        if (trip.VendorID === 1) vendorTotals['Vendor A'].push(trip.total_amount);
        else if (trip.VendorID === 2) vendorTotals['Vendor B'].push(trip.total_amount);
      });

      const vendors = ['Vendor A', 'Vendor B'];
      const avgFares = vendors.map(vendor => {
        const fares = vendorTotals[vendor];
        if (fares.length === 0) return 0;
        const avg = fares.reduce((sum, val) => sum + val, 0) / fares.length;
        return parseFloat(avg.toFixed(2));
      });

      generateChartData(vendors, avgFares);

    } else if (mode === 'payment') {
      const paymentCounts = { Card: 0, Cash: 0, Other: 0 };

      tripsFiltered.forEach((trip) => {
        if (trip.payment_type === 1) paymentCounts['Card']++;
        else if (trip.payment_type === 2) paymentCounts['Cash']++;
        else paymentCounts['Other']++;
      });

      const methods = ['Card', 'Cash', 'Other'];
      const counts = methods.map(method => paymentCounts[method]);

      generateChartData(methods, counts);
    }

  }, [filters.date, filters.hourRange, mode, chartType, data]);

  const generateChartData = (labels, values) => {
    if (chartType === 'bar') {
      setChartData([{
        x: labels,
        y: values,
        type: 'bar',
        marker: { color: 'mediumseagreen' },
        hoverinfo: 'x+y',
        text: labels.map((label, idx) => `Value: ${values[idx]}`),
      }]);
    } else if (chartType === 'pie') {
      setChartData([{
        labels,
        values,
        type: 'pie',
        hoverinfo: 'label+percent+value',
      }]);
    } else if (chartType === 'donut') {
      setChartData([{
        labels,
        values,
        type: 'pie',
        hole: 0.5,
        hoverinfo: 'label+percent+value',
      }]);
    } else if (chartType === 'treemap') {
      setChartData([{
        type: 'treemap',
        labels,
        parents: labels.map(() => ''),
        values,
        textinfo: 'label+value+percent entry',
      }]);
    } else if (chartType === 'polar') {
      setChartData([{
        type: 'barpolar',
        r: values,
        theta: labels,
        marker: { color: 'teal' },
      }]);
    }
  };

  const handleClick = (data) => {
    const clicked = data.points[0].x || data.points[0].label;
    if (mode === 'vendor') {
      setFilters(prev => ({
        ...prev,
        selectedVendor: clicked,
        focusedChart: 'VendorPaymentChart',
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        selectedPayment: clicked,
        focusedChart: 'VendorPaymentChart',
      }));
    }
  };

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      selectedVendor: null,
      selectedPayment: null,
    }));
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '10px', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h5 style={{ margin: 0 }}>
          {mode === 'vendor' ? '📌 Vendor Comparison' : '💳 Payment Type Breakdown'} for {filters.date || '...'}
        </h5>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            style={{ padding: '0.25rem', borderRadius: '5px' }}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="vendor">Vendor</option>
            <option value="payment">Payment</option>
          </select>
          <select
            style={{ padding: '0.25rem', borderRadius: '5px' }}
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
          >
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
            <option value="donut">Donut</option>
            <option value="treemap">Treemap</option>
            <option value="polar">Polar</option>
          </select>
          <button
            onClick={clearFilters}
            style={{
              background: 'none',
              border: '1px solid red',
              color: 'red',
              padding: '0.25rem 0.5rem',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <Plot
        data={chartData}
        layout={{
          width: 1150,
          height: 400,
          margin: { t: 50, r: 30, l: 50, b: 60 },
          title: `📊 ${mode === 'vendor' ? 'Vendor' : 'Payment Type'} Overview`,
        }}
        onClick={handleClick}
        config={{ displayModeBar: true }}
      />
    </div>
  );
}

export default VendorPaymentChart;
