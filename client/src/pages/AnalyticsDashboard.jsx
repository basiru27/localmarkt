import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useListings, listingKeys } from '../hooks/useListings';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import SvgSparkline from '../components/SvgSparkline';
import { ordersApi } from '../lib/api';

export default function AnalyticsDashboard() {
  const { user, getAuthHeader } = useAuth();
  const queryClient = useQueryClient();
  
  // 1. Fetch user listings
  const { 
    data: listingsData, 
    isLoading: isListingsLoading 
  } = useListings({ mine: true, limit: 100 });
  const listings = useMemo(() => listingsData?.data || [], [listingsData?.data]);

  // 1.5 Fetch sales data for revenue
  const {
    data: salesResponse,
    isLoading: isSalesLoading
  } = useQuery({
    queryKey: ['seller-sales', user?.id],
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return ordersApi.getSales(authHeader);
    },
    enabled: !!user?.id
  });
  const sales = useMemo(() => salesResponse?.data || [], [salesResponse?.data]);

  // 2. Fetch sparkline data directly via RPC
  const { 
    data: sparklineData = [], 
    isLoading: isSparklineLoading 
  } = useQuery({
    queryKey: ['seller-daily-views', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_seller_daily_views', {
        p_seller_id: user?.id,
        p_days: 7
      });
      if (error) throw error;
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const dataMap = (data || []).reduce((acc, row) => {
        acc[row.day] = row.view_count;
        return acc;
      }, {});

      return last7Days.map(day => ({
        day,
        view_count: dataMap[day] || 0
      }));
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('public:listings:analytics')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings', filter: `seller_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: listingKeys.list({ mine: true, limit: 100 }) });
          queryClient.invalidateQueries({ queryKey: ['seller-daily-views', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // 3. Calculate statistics
  const stats = useMemo(() => {
    let totalViews = 0;
    let totalContacts = 0;
    let activeListings = 0;

    listings.forEach(listing => {
      totalViews += listing.view_count || 0;
      totalContacts += listing.contact_count || 0;
      if (listing.moderation_status === 'approved' && !listing.is_sold) {
        activeListings += 1;
      }
    });

    let totalRevenue = 0;
    sales.forEach(order => {
      if (order.status === 'completed') {
        totalRevenue += Number(order.price_at_purchase) || 0;
      }
    });

    return { totalViews, totalContacts, activeListings, totalRevenue };
  }, [listings, sales]);

  // 4. Sort listings for the performance table
  const [sortConfig, setSortConfig] = useState({ key: 'views', direction: 'desc' });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedListings = useMemo(() => {
    let sortableItems = [...listings];
    sortableItems.sort((a, b) => {
      let aValue, bValue;
      if (sortConfig.key === 'views') {
        aValue = a.view_count || 0;
        bValue = b.view_count || 0;
      } else if (sortConfig.key === 'contacts') {
        aValue = a.contact_count || 0;
        bValue = b.contact_count || 0;
      } else if (sortConfig.key === 'date') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [listings, sortConfig]);

  const isLoading = isListingsLoading || isSparklineLoading || isSalesLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            to="/my-listings"
            className="border-transparent text-text-secondary hover:border-border hover:text-text whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Active Listings
          </Link>
          <Link
            to="/my-listings/sales"
            className="border-transparent text-text-secondary hover:border-border hover:text-text whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
          >
            Sales
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

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total Views" 
          value={stats.totalViews} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          } 
        />
        <StatsCard 
          title="Total Contacts" 
          value={stats.totalContacts} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } 
        />
        <StatsCard 
          title="Active Listings" 
          value={stats.activeListings} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          } 
        />
        <StatsCard 
          title="Total Revenue" 
          value={formatPrice(stats.totalRevenue)} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } 
        />
      </div>

      {/* Sparkline Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Views (Last 7 Days)</h2>
        {(sparklineData && sparklineData.length > 0) ? (
          <div className="h-48 w-full">
            <SvgSparkline data={sparklineData} height={192} />
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
            No view data available for the last 7 days.
          </div>
        )}
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Listing Performance</h2>
        </div>
        
        {sortedListings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            You don't have any listings yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('views')}>
                    Views {sortConfig.key === 'views' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('contacts')}>
                    Contacts {sortConfig.key === 'contacts' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => requestSort('date')}>
                    Date Created {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          {listing.image_url ? (
                            <img className="h-10 w-10 object-cover" src={listing.image_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-gray-400">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatPrice(listing.price)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        listing.is_sold
                          ? 'bg-gray-100 text-gray-800'
                          : listing.moderation_status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : listing.moderation_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {listing.is_sold ? 'sold' : listing.moderation_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-medium">
                      {listing.view_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-medium">
                      {listing.contact_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
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
