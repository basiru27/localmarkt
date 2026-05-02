import React from 'react';

export default function StatsCard({ title, value, icon, trend, isLoading }) {
  if (isLoading) {
    return (
      <div className="card-static p-5 flex flex-col justify-between" aria-busy="true">
        <div className="flex justify-between items-start mb-4">
          <div className="skeleton h-4 w-24 rounded"></div>
          <div className="skeleton h-10 w-10 rounded-xl"></div>
        </div>
        <div className="skeleton h-8 w-20 rounded mt-2"></div>
      </div>
    );
  }

  return (
    <div className="card-static p-5 flex flex-col justify-between transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {icon && (
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-3">
        <span className="text-2xl sm:text-3xl font-bold text-text">{value}</span>
        
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 mb-1 ${
              trend.isPositive
                ? 'text-green-700 bg-green-50'
                : trend.isPositive === false
                ? 'text-error bg-red-50'
                : 'text-text-muted bg-gray-100'
            }`}
          >
            {trend.isPositive ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : trend.isPositive === false ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            ) : null}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
