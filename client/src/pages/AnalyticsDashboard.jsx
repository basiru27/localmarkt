import useDocumentTitle from '../hooks/useDocumentTitle';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../hooks/useListings';
import { formatPrice } from '../lib/utils';
import StatsCard from '../components/StatsCard';
import SafeImage from '../components/SafeImage';

function SimpleAreaChart({ data, range }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
        No view data for this period
      </div>
    );
  }

  const width = 800;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxViews = Math.max(...data.map(d => d.views), 1);
  const minViews = 0;

  const getX = (i) => paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;
  const getY = (v) => paddingTop + chartHeight - ((v - minViews) / (maxViews - minViews)) * chartHeight;

  const points = data.map((d, i) => `${getX(i)},${getY(d.views)}`).join(' ');
  const areaPoints = [
    `${paddingLeft},${paddingTop + chartHeight}`,
    ...data.map((d, i) => `${getX(i)},${getY(d.views)}`),
    `${getX(data.length - 1)},${paddingTop + chartHeight}`,
  ].join(' ');

  const formatLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (range === '7') return d.toLocaleDateString('en-GB', { weekday: 'short' });
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  const formatTooltipDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long', month: 'short', day: 'numeric',
    });
  };

  const labelStep = Math.max(1, Math.floor(data.length / 7));
  const yTicks = [0, Math.round(maxViews / 2), maxViews];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const relX = (mouseX / rect.width) * width;

    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(getX(i) - relX);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    setHoveredIndex(closest);
    setTooltipPos({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const tooltipItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="h-64 w-full overflow-hidden relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8622A" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C8622A" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={paddingLeft}
              y1={getY(tick)}
              x2={width - paddingRight}
              y2={getY(tick)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
            <text
              x={paddingLeft - 6}
              y={getY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              fill="#9CA3AF"
            >
              {tick}
            </text>
          </g>
        ))}

        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={paddingTop}
            x2={getX(hoveredIndex)}
            y2={paddingTop + chartHeight}
            stroke="#C8622A"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {data.length > 1 && (
          <polygon points={areaPoints} fill="url(#areaGradient)" />
        )}

        {data.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#C8622A"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {data.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.views)}
            r={hoveredIndex === i ? 5 : 3}
            fill={hoveredIndex === i ? '#C8622A' : '#C8622A'}
            stroke="white"
            strokeWidth="1.5"
            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
          />
        ))}

        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#9CA3AF"
            >
              {formatLabel(d.date)}
            </text>
          );
        })}
      </svg>

      {tooltipItem && (
        <div
          className="absolute pointer-events-none bg-white rounded-lg shadow-lg border border-gray-100 px-3 py-2 z-10"
          style={{
            left: Math.min(tooltipPos.x + 12, window.innerWidth - 200),
            top: Math.max(tooltipPos.y - 80, 8),
          }}
        >
          <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">
            {formatTooltipDate(tooltipItem.date)}
          </p>
          <p className="text-sm font-bold text-gray-900">
            {tooltipItem.views} {tooltipItem.views === 1 ? 'view' : 'views'}
          </p>
        </div>
      )}
    </div>
  );
}

const RANGES = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'All time', value: 'all' },
];

const SortIndicator = ({ active, direction }) => {
  if (!active) return null;
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
};

export default function AnalyticsDashboard() {
  useDocumentTitle('Analytics Dashboard');

  const [range, setRange] = useState('7');
  const { data, isLoading, isError, error } = useAnalytics(range);
  if (isError && import.meta.env.DEV) console.error('Analytics error:', error);

  const [sortBy, setSortBy] = useState('views');
  const [sortDir, setSortDir] = useState('desc');

  const summary = data?.summary || {};
  const viewsOverTime = data?.views_over_time || [];
  const listingPerformance = data?.listing_performance || [];

  const sorted = [...listingPerformance].sort((a, b) => {
    const mult = sortDir === 'desc' ? -1 : 1;
    if (typeof a[sortBy] === 'number') return mult * (a[sortBy] - b[sortBy]);
    return mult * String(a[sortBy]).localeCompare(String(b[sortBy]));
  });

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-gray-200 rounded-xl mb-8"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  // Race condition guard: auth:expired fired before TanStack Query could
  // set isError. isLoading=false, isError=false, data=undefined — the auth
  // redirect will fire in the next frame. Render nothing.
  if (!data && !isError) return null;

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Failed to load analytics</p>
          <p className="text-red-600 text-sm mb-4">
            {error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            to="/my-listings"
            className="border-transparent text-text-secondary hover:border-border hover:text-text whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            My Listings
          </Link>
          <Link
            to="/my-listings/analytics"
            className="border-primary text-primary whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
            aria-current="page"
          >
            Analytics
          </Link>
        </nav>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>

        <div className="flex gap-2 flex-wrap">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                range === r.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="Total Views"
          value={summary.total_views}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Contacts"
          value={summary.total_contacts}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Saves"
          value={summary.total_saves}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Listings"
          value={summary.active_listings}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        <StatsCard
          title="Sold Listings"
          value={summary.sold_listings}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Views Over Time</h2>
        <SimpleAreaChart data={viewsOverTime} range={range} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Listing Performance</h2>
        </div>

        {sorted.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No listings yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#FAFAF8] border-b border-[#F0EDE8]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs uppercase tracking-wide text-[#6B6B6B] font-medium">Listing</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs uppercase tracking-wide text-[#6B6B6B] font-medium">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-wide text-[#6B6B6B] font-medium cursor-pointer hover:bg-[#F5EFE8]" onClick={() => handleSort('views')}>
                    Views<SortIndicator column="views" active={sortBy === 'views'} direction={sortDir} />
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-wide text-[#6B6B6B] font-medium cursor-pointer hover:bg-[#F5EFE8]" onClick={() => handleSort('contacts')}>
                    Contacts<SortIndicator column="contacts" active={sortBy === 'contacts'} direction={sortDir} />
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-wide text-[#6B6B6B] font-medium cursor-pointer hover:bg-[#F5EFE8]" onClick={() => handleSort('saves')}>
                    Saves<SortIndicator column="saves" active={sortBy === 'saves'} direction={sortDir} />
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-wide text-[#6B6B6B] font-medium cursor-pointer hover:bg-[#F5EFE8]" onClick={() => handleSort('created_at')}>
                    Date Posted<SortIndicator column="created_at" active={sortBy === 'created_at'} direction={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sorted.map((listing) => (
                  <tr key={listing.id} className="hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EDE8] last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-[#F5EFE8] rounded-lg overflow-hidden">
                          <SafeImage
                            src={listing.image}
                            alt=""
                            className="h-10 w-10 object-cover"
                            iconClassName="h-6 w-6"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#1A1A1A] truncate max-w-[200px]">
                            {listing.title.length > 28 ? listing.title.substring(0, 28) + '...' : listing.title}
                          </div>
                          <div className="text-sm text-[#6B6B6B]">
                            {formatPrice(listing.price)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        listing.is_sold
                          ? 'bg-[#1A1A1A] text-white'
                          : listing.moderation_status === 'approved'
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : listing.moderation_status === 'rejected'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {listing.is_sold ? 'sold' : listing.moderation_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#6B6B6B] font-medium">
                      {listing.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#6B6B6B] font-medium">
                      {listing.contacts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#6B6B6B] font-medium">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {listing.saves}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#6B6B6B]">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
