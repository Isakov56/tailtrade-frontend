import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency } from '@/utils/format';
import { Plus, Search } from 'lucide-react';
import type { Customer, PaginatedResponse } from '@/types';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/customers?${params}`);
      return data;
    },
  });

  const customers = data?.data || [];
  const pagination = data?.pagination;

  const priceCategoryColors: Record<string, string> = {
    STANDARD: 'bg-gray-100 text-gray-800',
    SILVER: 'bg-slate-100 text-slate-800',
    GOLD: 'bg-amber-100 text-amber-800',
    PLATINUM: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div>
      <Header title={t('customers.title')} subtitle={t('customers.subtitle')} />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('customers.searchCustomers')}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button onClick={() => navigate('/customers/new')}>
            <Plus className="mr-2 h-4 w-4" /> {t('customers.newCustomer')}
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner className="py-20" text={t('customers.loading')} />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">{t('customers.company')}</th>
                  <th className="p-3 font-medium">{t('customers.contact')}</th>
                  <th className="p-3 font-medium">{t('customers.type')}</th>
                  <th className="p-3 font-medium">{t('customers.tier')}</th>
                  <th className="p-3 font-medium">{t('dashboard.balance')}</th>
                  <th className="p-3 font-medium">{t('customers.creditLimit')}</th>
                  <th className="p-3 font-medium">{t('common.orders')}</th>
                  <th className="p-3 font-medium">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-b hover:bg-muted/25"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{customer.companyName}</p>
                        <p className="text-xs text-muted-foreground">{customer.tinNumber || '-'}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p>{customer.contactPerson}</p>
                        <p className="text-xs text-muted-foreground">{customer.phoneNumbers[0]}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{customer.customerType}</Badge>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priceCategoryColors[customer.priceCategory]}`}>
                        {customer.priceCategory}
                        {customer.discountPercent > 0 && ` (${customer.discountPercent}%)`}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={Number(customer.currentBalance) > 0 ? 'font-medium text-red-600' : 'text-green-600'}>
                        {formatCurrency(Number(customer.currentBalance))}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatCurrency(Number(customer.creditLimit))}
                    </td>
                    <td className="p-3">{customer.lifetimeOrders}</td>
                    <td className="p-3"><StatusBadge status={customer.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.showing', { count: customers.length, total: pagination.total })}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t('common.previous')}
              </Button>
              <Button variant="outline" size="sm" disabled={!pagination.hasMore} onClick={() => setPage(page + 1)}>
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
