import { useFilter } from '../context/FilterContext';

function Sidebar({ onToggle, isCollapsed }) {
  const { filters, setFilters } = useFilter();

  return (
    <div className="sidebar-content">
      <button 
        className="toggle-button"
        onClick={onToggle}
      >
        {isCollapsed ? '→' : '←'}
      </button>
      {!isCollapsed && (
        <div className="sidebar-filters">
          <h5 className="mb-3">Filters</h5>
          
          {/* Date Filter */}
          <div className="mb-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.date || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          {/* Hour Range Filter */}
          <div className="mb-3">
            <label className="form-label">Hour Range</label>
            <div className="d-flex flex-column align-items-start gap-2">
              <input
                type="range"
                className="form-range"
                min="0"
                max="23"
                value={filters.hourRange[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  hourRange: [parseInt(e.target.value), prev.hourRange[1]]
                }))}
              />
              <span>{filters.hourRange[0]}:00</span>
              <input
                type="range"
                className="form-range"
                min="0"
                max="23"
                value={filters.hourRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  hourRange: [prev.hourRange[0], parseInt(e.target.value)]
                }))}
              />
              <span>{filters.hourRange[1]}:00</span>
            </div>
          </div>

          {/* Vendor Filter */}
          <div className="mb-3">
            <label className="form-label">Vendor</label>
            <select
              className="form-select"
              value={filters.selectedVendor || 'All'}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                selectedVendor: e.target.value === 'All' ? null : e.target.value
              }))}
            >
              <option>All</option>
              <option>Vendor A</option>
              <option>Vendor B</option>
            </select>
          </div>

          {/* Payment Type Filter */}
          <div className="mb-3">
            <label className="form-label">Payment Type</label>
            <select
              className="form-select"
              value={filters.selectedPayment || 'All'}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                selectedPayment: e.target.value === 'All' ? null : e.target.value
              }))}
            >
              <option>All</option>
              <option>Card</option>
              <option>Cash</option>
              <option>Other</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            className="btn btn-outline-danger w-100"
            onClick={() => setFilters(prev => ({
              ...prev,
              date: null,
              hourRange: [0, 23],
              selectedVendor: null,
              selectedPayment: null,
              selectedZone: null
            }))}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
