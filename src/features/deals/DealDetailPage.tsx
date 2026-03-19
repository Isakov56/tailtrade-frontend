import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';
import { ArrowLeft, Copy, Truck, CheckCircle } from 'lucide-react';
import type { Deal, ApiResponse } from '@/types';

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const { t } = useTranslation();

  const statusTransitions: Record<string, { next: string; label: string; icon: any }[]> = {
    DRAFT: [{ next: 'CONFIRMED', label: t('deals.confirmDeal'), icon: CheckCircle }],
    CONFIRMED: [{ next: 'PROCESSING', label: t('deals.startProcessing'), icon: CheckCircle }],
    PROCESSING: [{ next: 'SHIPPED', label: t('deals.markShipped'), icon: Truck }],
    SHIPPED: [{ next: 'DELIVERED', label: t('deals.markDelivered'), icon: CheckCircle }],
    DELIVERED: [{ next: 'COMPLETED', label: t('deals.completeDeal'), icon: CheckCircle }],
  };

  const { data, isLoading } = useQuery<Deal>({
    queryKey: ['deal', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Deal>>(`/deals/${id}`);
      return data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/deals/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      addToast({ title: t('deals.statusUpdated'), variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: t('deals.updateFailed'), description: error.response?.data?.message, variant: 'destructive' });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: () => api.post(`/deals/${id}/clone`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      addToast({ title: t('deals.cloned'), variant: 'success' });
      navigate(`/deals/${res.data.data.id}`);
    },
  });

  if (isLoading) {
    return <LoadingSpinner className="py-20" size="lg" text={t('deals.loadingDeal')} />;
  }

  if (!data) {
    return <div className="p-6">{t('deals.notFound')}</div>;
  }

  const deal = data;
  const transitions = statusTransitions[deal.status] || [];

  return (
    <div>
      <Header title={`Deal ${deal.dealNumber}`} subtitle={`${deal.customer?.companyName || ''}`} />

      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/deals')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('deals.backToDeals')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => cloneMutation.mutate()} disabled={cloneMutation.isPending}>
              <Copy className="mr-2 h-4 w-4" /> {t('deals.cloneDeal')}
            </Button>
            {transitions.map((tr) => (
              <Button
                key={tr.next}
                size="sm"
                onClick={() => statusMutation.mutate(tr.next)}
                disabled={statusMutation.isPending}
              >
                <tr.icon className="mr-2 h-4 w-4" /> {tr.label}
              </Button>
            ))}
            {deal.status !== 'CANCELLED' && deal.status !== 'COMPLETED' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => statusMutation.mutate('CANCELLED')}
              >
                {t('deals.cancelDeal')}
              </Button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap gap-3">
          <StatusBadge status={deal.status} />
          <StatusBadge status={deal.paymentStatus} />
          <StatusBadge status={deal.deliveryStatus} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Customer & Dates */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('deals.dealInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('common.customer')}</span>
                <span className="font-medium">{deal.customer?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.contact')}</span>
                <span>{deal.customer?.contactPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deals.createdBy')}</span>
                <span>{deal.createdBy?.firstName} {deal.createdBy?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deals.dealDate')}</span>
                <span>{formatDate(deal.dealDate)}</span>
              </div>
              {deal.expectedDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deals.expectedDelivery')}</span>
                  <span>{formatDate(deal.expectedDeliveryDate)}</span>
                </div>
              )}
              {deal.actualDeliveryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deals.actualDelivery')}</span>
                  <span>{formatDate(deal.actualDeliveryDate)}</span>
                </div>
              )}
              {deal.paymentDueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deals.paymentDue')}</span>
                  <span className={new Date(deal.paymentDueDate) < new Date() && deal.paymentStatus !== 'PAID' ? 'text-red-600 font-medium' : ''}>
                    {formatDate(deal.paymentDueDate)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('customers.financial')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deals.subtotal')}</span>
                <span>{formatCurrency(Number(deal.subtotalUZS))}</span>
              </div>
              {deal.discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t('deals.discount')} ({deal.discountPercent}%)</span>
                  <span>-{formatCurrency(Number(deal.discountAmountUZS))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('deals.tax')} ({deal.taxPercent}%)</span>
                <span>{formatCurrency(Number(deal.taxAmountUZS))}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>{t('common.total')}</span>
                <div className="text-right">
                  <p>{formatCurrency(Number(deal.totalUZS))}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {formatCurrency(Number(deal.totalUSD), 'USD')}
                  </p>
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-muted-foreground">{t('deals.paid')}</span>
                <span className="text-green-600 font-medium">{formatCurrency(Number(deal.paidAmountUZS))}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">{t('common.remaining')}</span>
                <span className={Number(deal.remainingAmountUZS) > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(Number(deal.remainingAmountUZS))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {t('deals.exchangeRateLabel')}: {formatNumber(Number(deal.exchangeRateUsed))} UZS/USD
              </p>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('deals.delivery')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {deal.deliveryAddressText && (
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p>{deal.deliveryAddressText}</p>
                </div>
              )}
              {deal.vehicleInfo && (
                <div>
                  <span className="text-muted-foreground">Vehicle:</span>
                  <p>{deal.vehicleInfo}</p>
                </div>
              )}
              {deal.deliveryNotes && (
                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <p>{deal.deliveryNotes}</p>
                </div>
              )}
              {!deal.deliveryAddressText && !deal.vehicleInfo && !deal.deliveryNotes && (
                <p className="text-muted-foreground">No delivery details</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader><CardTitle className="text-base">Items ({deal.items?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t('deals.product')}</th>
                    <th className="pb-2 font-medium">{t('deals.qtyM2')}</th>
                    <th className="pb-2 font-medium">{t('deals.boxes')}</th>
                    <th className="pb-2 font-medium">{t('tileFormats.pricePerM2')}</th>
                    <th className="pb-2 font-medium">{t('deals.discount')}</th>
                    <th className="pb-2 font-medium text-right">{t('common.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {deal.items?.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">
                        <p className="font-medium">{'name' in item.tileFormat ? item.tileFormat.name : '-'}</p>
                        <p className="font-mono text-xs text-muted-foreground">{'code' in item.tileFormat ? item.tileFormat.code : '-'}</p>
                      </td>
                      <td className="py-2">{formatNumber(item.quantitySqMeters, 2)}</td>
                      <td className="py-2">{formatNumber(item.quantityBoxes, 1)}</td>
                      <td className="py-2">{formatCurrency(Number(item.unitPriceUZS))}</td>
                      <td className="py-2">{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(Number(item.lineTotalUZS))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        {deal.payments && deal.payments.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Payments ({deal.payments.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">{t('common.date')}</th>
                      <th className="pb-2 font-medium">{t('common.amount')}</th>
                      <th className="pb-2 font-medium">{t('common.method')}</th>
                      <th className="pb-2 font-medium">{t('deals.reference')}</th>
                      <th className="pb-2 font-medium">{t('deals.receivedBy')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deal.payments.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2">{formatDate(p.paymentDate)}</td>
                        <td className="py-2 text-green-600 font-medium">{formatCurrency(Number(p.amountUZS))}</td>
                        <td className="py-2"><Badge variant="outline">{p.paymentMethod}</Badge></td>
                        <td className="py-2 font-mono text-xs">{p.referenceNumber || '-'}</td>
                        <td className="py-2">{p.receivedBy?.firstName} {p.receivedBy?.lastName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {deal.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t('common.notes')}</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{deal.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
