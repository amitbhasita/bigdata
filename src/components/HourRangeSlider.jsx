import { useFilter } from '../context/FilterContext';

function HourRangeSlider() {
  const { filters, setFilters } = useFilter();
  const [start, end] = filters.hourRange;

  return (
    <div className="mb-3">
      <label className="form-label fw-bold">🕒 Hour Range</label>
      <div className="d-flex align-items-center gap-3">
        <input
          type="range"
          min="0"
          max="23"
          value={start}
          onChange={(e) =>
            setFilters(prev => ({
              ...prev,
              hourRange: [parseInt(e.target.value), prev.hourRange[1]],
            }))
          }
        />
        <span>{start}:00</span>
        <input
          type="range"
          min="0"
          max="23"
          value={end}
          onChange={(e) =>
            setFilters(prev => ({
              ...prev,
              hourRange: [prev.hourRange[0], parseInt(e.target.value)],
            }))
          }
        />
        <span>{end}:00</span>
      </div>
    </div>
  );
}

export default HourRangeSlider;
