import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatDate } from '@/utils/format';
import { Plus, Search } from 'lucide-react';
import type { Deal, PaginatedResponse } from '@/types';

export function DealsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<PaginatedResponse<Deal>>({
    queryKey: ['deals', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/deals?${params}`);
      return data;
    },
  });

  const deals = data?.data || [];
  const pagination = data?.pagination;

  const statuses = ['', 'DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

  return (
    <div>
      <Header title={t('deals.title')} subtitle={t('deals.subtitle')} />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('deals.searchDeals')}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">{t('deals.allStatuses')}</option>
            {statuses.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button onClick={() => navigate('/deals/new')}>
            <Plus className="mr-2 h-4 w-4" /> {t('deals.newDeal')}
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner className="py-20" text={t('deals.loading')} />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">{t('deals.dealNum')}</th>
                  <th className="p-3 font-medium">{t('common.customer')}</th>
                  <th className="p-3 font-medium">{t('common.date')}</th>
                  <th className="p-3 font-medium">{t('common.items')}</th>
                  <th className="p-3 font-medium">{t('deals.totalUZS')}</th>
                  <th className="p-3 font-medium">{t('deals.totalUSD')}</th>
                  <th className="p-3 font-medium">{t('common.status')}</th>
                  <th className="p-3 font-medium">{t('dashboard.payment')}</th>
                  <th className="p-3 font-medium">{t('deals.delivery')}</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="cursor-pointer border-b hover:bg-muted/25"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <td className="p-3 font-mono text-xs font-medium">{deal.dealNumber}</td>
                    <td className="p-3">{deal.customer?.companyName || '-'}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(deal.dealDate)}</td>
                    <td className="p-3">{`${deal.items?.length || 0} ${t('common.items')}`}</td>
                    <td className="p-3 font-medium">{formatCurrency(Number(deal.totalUZS))}</td>
                    <td className="p-3 text-muted-foreground">{formatCurrency(Number(deal.totalUSD), 'USD')}</td>
                    <td className="p-3"><StatusBadge status={deal.status} /></td>
                    <td className="p-3"><StatusBadge status={deal.paymentStatus} /></td>
                    <td className="p-3"><StatusBadge status={deal.deliveryStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.showing', { count: deals.length, total: pagination.total })}
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
