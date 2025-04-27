import { createContext, useContext, useEffect, useState } from 'react';

const DataContext = createContext();

const MONTHS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
];

export const DataProvider = ({ children }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fileNames = MONTHS.map(
      (m) => `/yellow_tripdata_2022-${m}_sample.json`
    );
    Promise.all(fileNames.map((file) => fetch(file).then(res => res.json())))
      .then((allData) => setData(allData.flat()))
      .catch((error) => console.error('Error loading monthly data:', error));
  }, []);

  return (
    <DataContext.Provider value={{ data }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
