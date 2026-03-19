import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatDate } from '@/utils/format';
import { Plus, Search } from 'lucide-react';
import type { Payment, PaginatedResponse } from '@/types';
import { RecordPaymentDialog } from './RecordPaymentDialog';

export function PaymentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ['payments', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const { data } = await api.get(`/payments?${params}`);
      return data;
    },
  });

  const payments = data?.data || [];
  const pagination = data?.pagination;

  const paymentMethodLabels: Record<string, string> = {
    CASH: t('payments.CASH'),
    BANK_TRANSFER: t('payments.BANK_TRANSFER'),
    CARD: t('payments.CARD'),
    MOBILE_PAYMENT: t('payments.MOBILE_PAYMENT'),
  };

  return (
    <div>
      <Header title={t('payments.title')} subtitle={t('payments.subtitle')} />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t('payments.searchPayments')} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t('payments.recordPayment')}
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner className="py-20" text={t('payments.loading')} />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">{t('common.date')}</th>
                  <th className="p-3 font-medium">{t('common.customer')}</th>
                  <th className="p-3 font-medium">{t('deals.dealNum')}</th>
                  <th className="p-3 font-medium">{t('payments.amountUZS')}</th>
                  <th className="p-3 font-medium">{t('payments.amountUSD')}</th>
                  <th className="p-3 font-medium">{t('common.method')}</th>
                  <th className="p-3 font-medium">{t('deals.reference')}</th>
                  <th className="p-3 font-medium">{t('deals.receivedBy')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/25">
                    <td className="p-3">{formatDate(payment.paymentDate)}</td>
                    <td className="p-3">{payment.deal?.customer?.companyName || '-'}</td>
                    <td className="p-3 font-mono text-xs">{payment.deal?.dealNumber || t('common.general')}</td>
                    <td className="p-3 font-medium text-green-600">
                      {formatCurrency(Number(payment.amountUZS))}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {payment.amountUSD ? formatCurrency(Number(payment.amountUSD), 'USD') : '-'}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {payment.referenceNumber || '-'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {payment.receivedBy ? `${payment.receivedBy.firstName} ${payment.receivedBy.lastName}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.showing', { count: payments.length, total: pagination.total })}
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

      {showForm && <RecordPaymentDialog onClose={() => setShowForm(false)} />}
    </div>
  );
}
