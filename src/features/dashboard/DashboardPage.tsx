import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Truck,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardSummary, ChartDataPoint } from '@/types';

export function DashboardPage() {
  const { t } = useTranslation();

  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary');
      return data.data;
    },
  });

  const { data: chartData } = useQuery<ChartDataPoint[]>({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/charts?period=month');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text={t('dashboard.loadingDashboard')} />
      </div>
    );
  }

  if (!summary) return null;

  const statCards = [
    {
      title: t('dashboard.todaySales'),
      value: formatCurrency(summary.todaySales.amount),
      sub: `${summary.todaySales.count} ${t('dashboard.deals')}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: t('dashboard.todayPayments'),
      value: formatCurrency(summary.todayPayments.amount),
      sub: `${summary.todayPayments.count} ${t('dashboard.received')}`,
      icon: CreditCard,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: t('dashboard.overduePayments'),
      value: String(summary.overdueDeals),
      sub: t('dashboard.dealsOverdue'),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: t('dashboard.pendingDeliveries'),
      value: String(summary.pendingDeliveries),
      sub: t('dashboard.inPipeline'),
      icon: Truck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: t('dashboard.activeCustomers'),
      value: String(summary.activeCustomers),
      sub: t('dashboard.ofTotal', { total: summary.totalCustomers }),
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      title: t('dashboard.exchangeRate'),
      value: `${formatNumber(summary.exchangeRate)} UZS`,
      sub: t('dashboard.usd'),
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div>
      <Header title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.salesPaymentsTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#0ea5e9" name={t('dashboard.sales')} strokeWidth={2} />
                    <Line type="monotone" dataKey="payments" stroke="#22c55e" name={t('dashboard.paymentsLabel')} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.topCustomers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{customer.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.lifetimeOrders} {t('common.orders')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(Number(customer.totalPurchasesUZS))}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('dashboard.balance')}: {formatCurrency(Number(customer.currentBalance))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.recentDeals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t('dashboard.dealNum')}</th>
                    <th className="pb-2 font-medium">{t('common.customer')}</th>
                    <th className="pb-2 font-medium">{t('common.date')}</th>
                    <th className="pb-2 font-medium">{t('common.total')}</th>
                    <th className="pb-2 font-medium">{t('common.status')}</th>
                    <th className="pb-2 font-medium">{t('dashboard.payment')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentDeals.map((deal) => (
                    <tr key={deal.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{deal.dealNumber}</td>
                      <td className="py-2">{deal.customer?.companyName || '-'}</td>
                      <td className="py-2 text-muted-foreground">{formatDate(deal.dealDate)}</td>
                      <td className="py-2 font-medium">{formatCurrency(Number(deal.totalUZS))}</td>
                      <td className="py-2"><StatusBadge status={deal.status} /></td>
                      <td className="py-2"><StatusBadge status={deal.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('dashboard.monthlySales')}</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.monthSales.amount)}</p>
              <p className="text-sm text-muted-foreground">{summary.monthSales.count} {t('dashboard.dealsThisMonth')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('dashboard.monthlyCollections')}</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.monthPayments.amount)}</p>
              <p className="text-sm text-muted-foreground">{summary.monthPayments.count} {t('dashboard.paymentsReceived')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
