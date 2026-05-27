import useDocumentTitle from '../hooks/useDocumentTitle';
import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useListings, listingKeys } from '../hooks/useListings';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import SvgSparkline from '../components/SvgSparkline';
import SafeImage from '../components/SafeImage';

export default function AnalyticsDashboard() {
  useDocumentTitle('Analytics Dashboard');

  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 1. Fetch user listings
  const { 
    data: listingsData, 
    isLoading: isListingsLoading 
  } = useListings({ mine: true, limit: 100 });
  const listings = useMemo(() => listingsData?.data || [], [listingsData?.data]);

  

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
    enabled: !!user?.id,
    staleTime: 0
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('analytics-listings-' + user.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings' },
        (payload) => {
          if (payload.new && (payload.new.seller_id === user.id || payload.new.user_id === user.id)) {
            queryClient.invalidateQueries({ queryKey: listingKeys.list({ mine: true, limit: 100 }), exact: false });
            queryClient.invalidateQueries({ queryKey: ['seller-daily-views', user.id], exact: false });
          }
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

    let soldCount = 0;
    listings.forEach(listing => {
      if (listing.is_sold) {
        soldCount += 1;
      }
    });

    return { totalViews, totalContacts, activeListings, soldCount };
  }, [listings]);

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

  const isLoading = isListingsLoading || isSparklineLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-[#F5EFE8] rounded-xl w-1/4 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[#F5EFE8] rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-[#F5EFE8] rounded-xl mb-8"></div>
        <div className="h-64 bg-[#F5EFE8] rounded-xl"></div>
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
          title="Sold Listings" 
          value={stats.soldCount} 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <table className="min-w-full">
              <thead className="bg-[#FAFAF8] border-b border-[#F0EDE8]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs uppercase tracking-wide text-[#6B6B6B] font-medium">Listing</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs uppercase tracking-wide text-[#6B6B6B] font-medium">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-wide text-[#6B6B6B] font-medium cursor-pointer hover:bg-[#F5EFE8]" onClick={() => requestSort('views')}>
                    Views {sortConfig.key === 'views' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-wide text-[#6B6B6B] font-medium cursor-pointer hover:bg-[#F5EFE8]" onClick={() => requestSort('contacts')}>
                    Contacts {sortConfig.key === 'contacts' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs uppercase tracking-wide text-[#6B6B6B] font-medium cursor-pointer hover:bg-[#F5EFE8]" onClick={() => requestSort('date')}>
                    Date Created {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EDE8] last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-[#F5EFE8] rounded-lg overflow-hidden">
                          <SafeImage
                            src={listing.image_url}
                            alt=""
                            className="h-10 w-10 object-cover"
                            iconClassName="h-6 w-6"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#1A1A1A] truncate max-w-[200px]">
                            {listing.title}
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
                      {listing.view_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#6B6B6B] font-medium">
                      {listing.contact_count || 0}
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
