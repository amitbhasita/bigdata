import { useFilter } from '../context/FilterContext';
import PickupMap from './PickupMap';
import FareBoxplot from './FareBoxplot';
import TipHistogram from './TipHistogram';
import VendorPaymentChart from './VendorPaymentChart';
import DistanceFareScatter from './DistanceFareScatter';
import FinancialMetrics from './FinancialMetrics';
import DemandHeatmap from './DemandHeatmap';

function FocusChartPanel() {
  const { filters, setFilters } = useFilter();
  const chart = filters.focusedChart;

  const clear = () => setFilters(prev => ({ ...prev, focusedChart: null }));

  if (!chart) return null;

  return (
    <div className="mt-4 p-4 bg-white border shadow rounded">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0">🔎 Focused View: {chart}</h5>
        <button className="btn btn-sm btn-outline-dark" onClick={clear}>Close</button>
      </div>
      {chart === 'PickupMap' && <PickupMap />}
      {chart === 'FareBoxplot' && <FareBoxplot />}
      {chart === 'TipHistogram' && <TipHistogram />}
      {chart === 'VendorPaymentChart' && <VendorPaymentChart />}
      {chart === 'DistanceFareScatter' && <DistanceFareScatter />}
      {chart === 'FinancialMetrics' && <FinancialMetrics />}
      {chart === 'DemandHeatmap' && <DemandHeatmap />}
    </div>
  );
}

export default FocusChartPanel;
