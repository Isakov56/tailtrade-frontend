import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';
import { ArrowLeft, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import type { Customer, Deal, Payment, ApiResponse, PaginatedResponse } from '@/types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
      return data.data;
    },
  });

  const { data: dealsData } = useQuery<PaginatedResponse<Deal>>({
    queryKey: ['customer-deals', id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}/deals?limit=10`);
      return data;
    },
    enabled: !!id,
  });

  const { data: paymentsData } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ['customer-payments', id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}/payments?limit=10`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!customer) return <div className="p-6">{t('customers.notFound')}</div>;

  const deals = dealsData?.data || [];
  const payments = paymentsData?.data || [];
  const balanceExceedsLimit = Number(customer.creditLimit) > 0 && Number(customer.currentBalance) > Number(customer.creditLimit);

  return (
    <div>
      <Header title={customer.companyName} subtitle={`${customer.customerType} | ${customer.priceCategory}`} />

      <div className="p-6 space-y-6 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('customers.backToCustomers')}
        </Button>

        {/* Customer Info Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('customers.contactCard')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={customer.status} />
                <Badge variant="outline">{customer.customerType}</Badge>
              </div>
              <p className="font-medium">{customer.contactPerson}</p>
              {customer.position && <p className="text-muted-foreground">{customer.position}</p>}
              {customer.phoneNumbers.map((phone, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {phone}
                </div>
              ))}
              {customer.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {customer.email}
                </div>
              )}
              {customer.telegramUsername && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-3 w-3" /> @{customer.telegramUsername}
                </div>
              )}
              {customer.legalAddress && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {customer.legalAddress}
                </div>
              )}
              {customer.tinNumber && <p className="text-xs text-muted-foreground">TIN: {customer.tinNumber}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('customers.financial')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.currentBalance')}</span>
                <span className={`font-bold ${Number(customer.currentBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Number(customer.currentBalance))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.creditLimit')}</span>
                <span>{formatCurrency(Number(customer.creditLimit))}</span>
              </div>
              {balanceExceedsLimit && (
                <div className="rounded bg-red-50 p-2 text-xs text-red-700 font-medium">
                  {t('customers.balanceExceedsLimit')}
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.paymentTerms')}</span>
                <span>{customer.paymentTermsDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.priceTier')}</span>
                <span>{customer.priceCategory} ({customer.discountPercent}% discount)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.avgPaymentDays')}</span>
                <span>{formatNumber(customer.averagePaymentDays, 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('customers.statistics')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.lifetimeOrders')}</span>
                <span className="font-medium">{customer.lifetimeOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.totalPurchases')}</span>
                <span>{formatCurrency(Number(customer.totalPurchasesUZS))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customers.totalM2Purchased')}</span>
                <span>{formatNumber(customer.totalPurchasesSqMeters, 1)} m2</span>
              </div>
              {customer.lastOrderDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('customers.lastOrder')}</span>
                  <span>{formatDate(customer.lastOrderDate)}</span>
                </div>
              )}
              {customer.assignedSalesRep && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('customers.salesRep')}</span>
                  <span>{customer.assignedSalesRep.firstName} {customer.assignedSalesRep.lastName}</span>
                </div>
              )}
              {customer.leadSource && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('customers.leadSource')}</span>
                  <span>{customer.leadSource}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delivery Addresses */}
        {customer.deliveryAddresses && customer.deliveryAddresses.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t('customers.deliveryAddresses')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {customer.deliveryAddresses.map((addr) => (
                  <div key={addr.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{addr.label}</p>
                      {addr.isDefault && <Badge variant="secondary">{t('common.default')}</Badge>}
                    </div>
                    <p className="text-muted-foreground">{addr.address}</p>
                    <p className="text-muted-foreground">{addr.city}, {addr.region}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('customers.recentDeals')} ({dealsData?.pagination?.total || 0})</CardTitle>
            <Button size="sm" onClick={() => navigate('/deals/new')}>{t('deals.newDeal')}</Button>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('customers.noDeals')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t('deals.dealNum')}</th>
                    <th className="pb-2 font-medium">{t('common.date')}</th>
                    <th className="pb-2 font-medium">{t('common.total')}</th>
                    <th className="pb-2 font-medium">{t('common.status')}</th>
                    <th className="pb-2 font-medium">{t('dashboard.payment')}</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id} className="border-b last:border-0 cursor-pointer hover:bg-muted/25" onClick={() => navigate(`/deals/${deal.id}`)}>
                      <td className="py-2 font-mono text-xs">{deal.dealNumber}</td>
                      <td className="py-2">{formatDate(deal.dealDate)}</td>
                      <td className="py-2 font-medium">{formatCurrency(Number(deal.totalUZS))}</td>
                      <td className="py-2"><StatusBadge status={deal.status} /></td>
                      <td className="py-2"><StatusBadge status={deal.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('customers.recentPayments')} ({paymentsData?.pagination?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('customers.noPayments')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t('common.date')}</th>
                    <th className="pb-2 font-medium">{t('common.amount')}</th>
                    <th className="pb-2 font-medium">{t('common.method')}</th>
                    <th className="pb-2 font-medium">{t('payments.deal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(p.paymentDate)}</td>
                      <td className="py-2 text-green-600 font-medium">{formatCurrency(Number(p.amountUZS))}</td>
                      <td className="py-2"><Badge variant="outline">{p.paymentMethod}</Badge></td>
                      <td className="py-2 font-mono text-xs">{p.deal?.dealNumber || 'General'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {customer.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t('common.notes')}</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{customer.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
