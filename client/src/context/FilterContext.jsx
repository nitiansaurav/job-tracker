import { createContext, useContext, useState, useCallback } from "react";

const defaultFilters = {
  query: "",
  skills: [],
  datePosted: "",
  jobType: "",
  workMode: "",
  location: "",
  matchScore: "",
};

const FilterContext = createContext(null);

export const useFilters = () => useContext(FilterContext);

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const applyAIFilters = useCallback((updates) => {
    if (updates._clear) {
      setFilters(defaultFilters);
      return;
    }

    setFilters((prev) => {
      const next = { ...prev };

      for (const [key, val] of Object.entries(updates)) {
        if (key in next && key !== "_clear") {
          next[key] = val;
        }
      }

      return next;
    });
  }, []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        clearFilters,
        applyAIFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}