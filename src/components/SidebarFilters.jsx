import { useFilter } from '../context/FilterContext';

function SidebarFilters() {
  const { filters, setFilters } = useFilter();

  const [startHour, endHour] = filters.hourRange;

  return (
    <div className="p-3 bg-light border-end h-100">
      <h5 className="fw-bold">🔧 Filters</h5>

      {/* Hour Range Slider */}
      <div className="mb-3">
        <label className="form-label">🕒 Hour Range</label>
        <div className="d-flex align-items-center gap-2">
          <input
            type="range"
            min="0"
            max="23"
            value={startHour}
            onChange={(e) =>
              setFilters(prev => ({
                ...prev,
                hourRange: [parseInt(e.target.value), prev.hourRange[1]],
              }))
            }
          />
          <span>{startHour}:00</span>
          <input
            type="range"
            min="0"
            max="23"
            value={endHour}
            onChange={(e) =>
              setFilters(prev => ({
                ...prev,
                hourRange: [prev.hourRange[0], parseInt(e.target.value)],
              }))
            }
          />
          <span>{endHour}:00</span>
        </div>
      </div>

      {/* Vendor Filter */}
      <div className="mb-3">
        <label className="form-label">🧾 Vendor</label>
        <select
          className="form-select"
          value={filters.selectedVendor || 'All'}
          onChange={(e) =>
            setFilters(prev => ({
              ...prev,
              selectedVendor: e.target.value === 'All' ? null : e.target.value,
            }))
          }
        >
          <option>All</option>
          <option>Vendor A</option>
          <option>Vendor B</option>
        </select>
      </div>

      {/* Payment Filter */}
      <div className="mb-3">
        <label className="form-label">💳 Payment Type</label>
        <select
          className="form-select"
          value={filters.selectedPayment || 'All'}
          onChange={(e) =>
            setFilters(prev => ({
              ...prev,
              selectedPayment: e.target.value === 'All' ? null : e.target.value,
            }))
          }
        >
          <option>All</option>
          <option>Card</option>
          <option>Cash</option>
          <option>Other</option>
        </select>
      </div>

      {/* Clear All */}
      <button
        className="btn btn-sm btn-outline-danger w-100 mt-3"
        onClick={() =>
          setFilters(prev => ({
            ...prev,
            selectedVendor: null,
            selectedPayment: null,
            selectedZone: null,
          }))
        }
      >
        Clear All Filters
      </button>
    </div>
  );
}

export default SidebarFilters;
