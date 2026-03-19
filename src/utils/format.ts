export const formatCurrency = (amount: number, currency: 'UZS' | 'USD' = 'UZS'): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " so'm";
};

export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Deal status
    DRAFT: 'bg-gray-100 text-gray-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-yellow-100 text-yellow-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
    // Payment status
    UNPAID: 'bg-red-100 text-red-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    OVERPAID: 'bg-blue-100 text-blue-800',
    // Customer status
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    BLACKLISTED: 'bg-red-100 text-red-800',
    // Delivery status
    PENDING: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
