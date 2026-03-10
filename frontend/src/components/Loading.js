import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`}></div>
  );
};

export const LoadingSkeleton = ({ className = '', height = 'h-4', width = 'w-full' }) => {
  return (
    <div className={`loading-skeleton rounded ${height} ${width} ${className}`}></div>
  );
};

export const LoadingCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="space-y-4">
        <LoadingSkeleton height="h-6" width="w-3/4" />
        <LoadingSkeleton height="h-4" width="w-full" />
        <LoadingSkeleton height="h-4" width="w-5/6" />
        <div className="flex space-x-2">
          <LoadingSkeleton height="h-8" width="w-20" />
          <LoadingSkeleton height="h-8" width="w-20" />
        </div>
      </div>
    </div>
  );
};

export const LoadingTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-12"></div>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton
                key={colIndex}
                height="h-4"
                width={colIndex === 0 ? "w-32" : "w-24"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PageLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
};