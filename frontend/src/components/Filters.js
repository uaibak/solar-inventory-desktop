import React, { useState, useEffect } from 'react';

export const SearchBar = ({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  showClear = false,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input search-input pr-10 py-2 w-full"
      />
      {showClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const FilterSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = ''
}) => {
  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ''
}) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex-1">
        <label className="form-label">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="flex-1">
        <label className="form-label">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="form-input"
        />
      </div>
    </div>
  );
};

export const FilterBar = ({
  searchValue,
  onSearchChange,
  filters = [],
  onFilterChange,
  dateRange,
  onDateRangeChange,
  className = ''
}) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Search items..."
            value={searchValue}
            onChange={onSearchChange}
          />
        </div>

        {filters.map(filter => (
          <FilterSelect
            key={filter.key}
            label={filter.label}
            value={filter.value}
            onChange={(value) => onFilterChange(filter.key, value)}
            options={filter.options}
            placeholder={filter.placeholder}
            className="w-full md:w-48"
          />
        ))}
      </div>

      {dateRange && (
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={onDateRangeChange.startDate}
          onEndDateChange={onDateRangeChange.endDate}
        />
      )}
    </div>
  );
};

// Main Filters component that combines all functionality
const Filters = ({
  filters,
  onFilterChange,
  showDateRange = false,
  showCategory = false,
  showSupplier = false,
  showSearch = true,
  searchPlaceholder = 'Search records...',
  searchHelpText = 'Search across all visible fields'
}) => {
  const [localFilters, setLocalFilters] = useState({
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    category: filters.category || '',
    supplier: filters.supplier || '',
    search: filters.search || '',
  });

  useEffect(() => {
    setLocalFilters({
      dateFrom: filters.dateFrom || '',
      dateTo: filters.dateTo || '',
      category: filters.category || '',
      supplier: filters.supplier || '',
      search: filters.search || '',
    });
  }, [filters]);

  const handleLocalChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const categoryOptions = [
    { value: 'solar_panels', label: 'Solar Panels' },
    { value: 'inverters', label: 'Inverters' },
    { value: 'batteries', label: 'Batteries' },
    { value: 'cables', label: 'Cables' },
    { value: 'mounting', label: 'Mounting Systems' },
  ];

  const supplierOptions = [
    { value: 'supplier1', label: 'ABC Solar Supplies' },
    { value: 'supplier2', label: 'Green Energy Corp' },
    { value: 'supplier3', label: 'PowerTech Solutions' },
  ];

  return (
    <div className="glass-card p-6 space-y-4">
      {showSearch && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Search records
            </label>
            {localFilters.search && (
              <button
                type="button"
                onClick={() => handleLocalChange('search', '')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          <SearchBar
            placeholder={searchPlaceholder}
            value={localFilters.search}
            onChange={(value) => handleLocalChange('search', value)}
            onClear={() => handleLocalChange('search', '')}
            showClear={true}
          />
          <p className="text-xs text-gray-500 mt-2">{searchHelpText}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-end">

        {showCategory && (
          <FilterSelect
            label="Category"
            value={localFilters.category}
            onChange={(value) => handleLocalChange('category', value)}
            options={categoryOptions}
            placeholder="All Categories"
            className="w-full md:w-48"
          />
        )}

        {showSupplier && (
          <FilterSelect
            label="Supplier"
            value={localFilters.supplier}
            onChange={(value) => handleLocalChange('supplier', value)}
            options={supplierOptions}
            placeholder="All Suppliers"
            className="w-full md:w-48"
          />
        )}
      </div>

      {showDateRange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={localFilters.dateFrom}
              onChange={(e) => handleLocalChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={localFilters.dateTo}
              onChange={(e) => handleLocalChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
