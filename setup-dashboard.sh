#!/bin/bash

# Create folder structure
mkdir -p src/components
mkdir -p src/context

# Create FilterContext.js
cat <<EOF > src/context/FilterContext.js
import { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    date: null,
    hourRange: [0, 23],
    paymentType: 'All',
    vendor: 'All',
    selectedZone: null
  });

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
EOF

# Create App.jsx
cat <<EOF > src/App.jsx
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CalendarHeatmap from './components/CalendarHeatmap';
import { FilterProvider } from './context/FilterContext';

function App() {
  return (
    <FilterProvider>
      <div>
        <Navbar />
        <div className="d-flex">
          <Sidebar />
          <div className="flex-grow-1 p-3">
            <CalendarHeatmap />
          </div>
        </div>
      </div>
    </FilterProvider>
  );
}

export default App;
EOF

# Create index.css (if not already exists)
touch src/index.css

# Create placeholder components
for file in Navbar Sidebar CalendarHeatmap LineChart PickupMap FareBoxplot TipHistogram
do
cat <<EOF > src/components/${file}.jsx
function ${file}() {
  return (
    <div className="mb-3 p-3 border rounded bg-light">
      <h5>${file}</h5>
      <p>Placeholder content for ${file}</p>
    </div>
  );
}

export default ${file};
EOF
done

echo "✅ Dashboard scaffold generated. Now run: npm run dev"
