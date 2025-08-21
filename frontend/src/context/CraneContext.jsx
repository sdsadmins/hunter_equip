import React, { createContext, useState, useContext } from "react";

const CraneContext = createContext();

export const CraneProvider = ({ children }) => {
  const [cranes, setCranes] = useState([]);

  return (
    <CraneContext.Provider value={{ cranes, setCranes }}>
      {children}
    </CraneContext.Provider>
  );
};

export const useCranes = () => useContext(CraneContext);
