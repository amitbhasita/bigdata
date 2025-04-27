import { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
const [filters, setFilters] = useState({
  date: null,
  hourRange: [0, 23],
  paymentType: 'All',
  vendor: 'All',
  selectedZone: null,
  selectedVendor: null,
  selectedPayment: null,
  focusedChart: null, // 👈 NEW FIELD
});



  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
