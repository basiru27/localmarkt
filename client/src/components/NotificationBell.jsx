import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckCircle2, XCircle, ShoppingBag, DollarSign, Truck, Star, AlertCircle, ShieldAlert } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications';

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  return `${Math.floor(diffInMonths / 12)}y ago`;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'NEW_LISTING':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex-shrink-0"><BellIcon className="w-5 h-5" /></div>;
      case 'LISTING_APPROVED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-green-600 flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>;
      case 'LISTING_REJECTED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-500 flex-shrink-0"><XCircle className="w-5 h-5" /></div>;
      case 'NEW_ORDER':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FEF3E8] text-[#C8622A] flex-shrink-0"><ShoppingBag className="w-5 h-5" /></div>;
      case 'PAYMENT_RECEIVED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-green-600 flex-shrink-0"><DollarSign className="w-5 h-5" /></div>;
      case 'ORDER_DELIVERED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex-shrink-0"><Truck className="w-5 h-5" /></div>;
      case 'ORDER_COMPLETED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-green-600 flex-shrink-0"><Star className="w-5 h-5" /></div>;
      case 'NEW_DISPUTE':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-500 flex-shrink-0"><AlertCircle className="w-5 h-5" /></div>;
      case 'ACCOUNT_BANNED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-500 flex-shrink-0"><ShieldAlert className="w-5 h-5" /></div>;
      case 'ACCOUNT_UNBANNED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-green-600 flex-shrink-0"><ShieldAlert className="w-5 h-5" /></div>;
      case 'SELLER_VERIFIED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex-shrink-0"><CheckCircle2 className="w-5 h-5" /></div>;
      case 'SELLER_UNVERIFIED':
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 text-gray-400 flex-shrink-0"><XCircle className="w-5 h-5" /></div>;
      default:
        return <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 text-gray-400 flex-shrink-0"><BellIcon className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl hover:bg-[#FEF3E8] transition-colors text-[#3D3D3D] hover:text-[#C8622A]"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#F0EDE8] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EDE8]">
            <h3 className="font-semibold text-[#1A1A1A]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#C8622A] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <BellIcon className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-[#1A1A1A]">No notifications yet</p>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  You'll be notified about listings and messages
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-[#FEF3E8] ${
                      !notification.is_read ? 'bg-[#FEFAF7]' : 'bg-white'
                    }`}
                  >
                    {getIconForType(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-[#1A1A1A] ${!notification.is_read ? 'font-bold' : 'font-semibold'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#9A9A9A] mt-1">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-[#C8622A] rounded-full shrink-0 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 10 && (
            <div className="px-4 py-2 text-center text-xs text-[#9A9A9A] border-t border-[#F0EDE8] bg-gray-50">
              Showing recent notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}