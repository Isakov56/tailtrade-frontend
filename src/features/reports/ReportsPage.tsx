import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';
import { exportPDF, exportExcel } from '@/utils/exportReport';
import {
  TrendingUp,
  BarChart3,
  Users,
  Package,
  AlertTriangle,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type Tab = 'sales' | 'financial' | 'customers' | 'products';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [period, setPeriod] = useState('month');

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'sales', label: t('reports.salesTab'), icon: TrendingUp },
    { key: 'financial', label: t('reports.financialTab'), icon: BarChart3 },
    { key: 'customers', label: t('reports.customersTab'), icon: Users },
    { key: 'products', label: t('reports.productsTab'), icon: Package },
  ];

  return (
    <div>
      <Header title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="p-6 space-y-6">
        <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'customers' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground">{t('reports.quickPeriod')}</label>
              <div className="flex gap-1 mt-1">
                {(['week', 'month', 'year'] as const).map((p) => (
                  <Button
                    key={p}
                    variant={period === p && !dateFrom ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setPeriod(p); setDateFrom(''); setDateTo(''); }}
                  >
                    {p === 'week' ? t('reports.thisWeek') : p === 'month' ? t('reports.thisMonth') : t('reports.thisYear')}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <label className="text-xs text-muted-foreground">{t('common.from')}</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('common.to')}</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && <SalesReport dateFrom={dateFrom} dateTo={dateTo} period={period} />}
        {activeTab === 'financial' && <FinancialReport dateFrom={dateFrom} dateTo={dateTo} />}
        {activeTab === 'customers' && <CustomerReport />}
        {activeTab === 'products' && <ProductReport dateFrom={dateFrom} dateTo={dateTo} />}
      </div>
    </div>
  );
}

// ===================== SALES REPORT =====================

function SalesReport({ dateFrom, dateTo, period }: { dateFrom: string; dateTo: string; period: string }) {
  const { t } = useTranslation();
  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  if (!dateFrom) params.set('period', period);

  const { data, isLoading } = useQuery({
    queryKey: ['report-sales', dateFrom, dateTo, period],
    queryFn: async () => {
      const { data } = await api.get(`/reports/sales?${params}`);
      return data.data;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-10" text={t('reports.loadingSales')} />;
  if (!data) return null;

  const { summary, byStatus, byPaymentStatus, chartData } = data;

  const handleExportPDF = () => {
    exportPDF({
      title: t('reports.salesTab'),
      subtitle: `${t('reports.totalSales')}: ${formatCurrency(summary.totalSalesUZS)}`,
      summaryRows: [
        { label: t('reports.totalSales'), value: formatCurrency(summary.totalSalesUZS) },
        { label: t('reports.collected'), value: formatCurrency(summary.totalCollectedUZS) },
        { label: t('reports.outstanding'), value: formatCurrency(summary.totalOutstandingUZS) },
        { label: t('reports.avgDealSize'), value: formatCurrency(summary.averageDealSizeUZS) },
      ],
      columns: [
        { header: t('common.status'), key: 'status' },
        { header: t('deals.title'), key: 'count' },
        { header: t('common.total'), key: 'totalUZS', format: (v: number) => formatCurrency(v), align: 'right' },
      ],
      data: byStatus,
    });
  };

  const handleExportExcel = () => {
    exportExcel({
      title: t('reports.salesTab'),
      summaryRows: [
        { label: t('reports.totalSales'), value: formatCurrency(summary.totalSalesUZS) },
        { label: t('reports.collected'), value: formatCurrency(summary.totalCollectedUZS) },
        { label: t('reports.outstanding'), value: formatCurrency(summary.totalOutstandingUZS) },
      ],
      columns: [
        { header: t('common.date'), key: 'date' },
        { header: t('dashboard.sales'), key: 'sales', format: (v: number) => formatCurrency(v) },
        { header: t('reports.collected'), key: 'collected', format: (v: number) => formatCurrency(v) },
      ],
      data: chartData,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" /> {t('reports.exportPDF')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('reports.exportExcel')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title={t('reports.totalSales')} value={formatCurrency(summary.totalSalesUZS)} sub={`${summary.dealCount} ${t('dashboard.deals')}`} />
        <SummaryCard title={t('reports.collected')} value={formatCurrency(summary.totalCollectedUZS)} sub={`${summary.collectionRate.toFixed(1)}% ${t('reports.collectionRate')}`} className="text-green-600" />
        <SummaryCard title={t('reports.outstanding')} value={formatCurrency(summary.totalOutstandingUZS)} className="text-red-600" />
        <SummaryCard title={t('reports.avgDealSize')} value={formatCurrency(summary.averageDealSizeUZS)} />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.salesVsCollections')}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="sales" fill="#0ea5e9" name={t('dashboard.sales')} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="collected" fill="#22c55e" name={t('reports.collected')} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.byDealStatus')}</CardTitle></CardHeader>
          <CardContent>
            {byStatus.length > 0 ? (
              <div className="space-y-2">
                {byStatus.map((s: any) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{String(t(`status.${s.status}`, { defaultValue: s.status }))}</Badge>
                      <span className="text-muted-foreground">{s.count} {t('dashboard.deals')}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(s.totalUZS)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.byPaymentStatus')}</CardTitle></CardHeader>
          <CardContent>
            {byPaymentStatus.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byPaymentStatus} dataKey="totalUZS" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={({ status, percent }: any) => `${t(`status.${status}`, status)} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                        {byPaymentStatus.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-2">
                  {byPaymentStatus.map((s: any, i: number) => (
                    <div key={s.status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{String(t(`status.${s.status}`, { defaultValue: s.status }))}</span>
                        <span className="text-muted-foreground">({s.count})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(s.totalUZS)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===================== FINANCIAL REPORT =====================

function FinancialReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { t } = useTranslation();
  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const { data, isLoading } = useQuery({
    queryKey: ['report-financial', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get(`/reports/financial?${params}`);
      return data.data;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-10" text={t('reports.loadingFinancial')} />;
  if (!data) return null;

  const { accountsReceivable, collections, overdueDeals } = data;
  const { aging } = accountsReceivable;

  const agingData = [
    { name: t('reports.agingCurrent'), value: aging.current },
    { name: t('reports.aging1to30'), value: aging.days1to30 },
    { name: t('reports.aging31to60'), value: aging.days31to60 },
    { name: t('reports.aging61to90'), value: aging.days61to90 },
    { name: t('reports.aging90plus'), value: aging.over90 },
  ].filter((d) => d.value > 0);

  const agingColors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444', '#991b1b'];

  const handleExportPDF = () => {
    exportPDF({
      title: t('reports.financialTab'),
      summaryRows: [
        { label: t('reports.totalOutstanding'), value: formatCurrency(accountsReceivable.totalOutstanding) },
        { label: t('reports.collections'), value: formatCurrency(collections.totalCollected) },
      ],
      columns: [
        { header: t('deals.dealNum'), key: 'dealNumber' },
        { header: t('common.customer'), key: 'customerName' },
        { header: t('reports.dueDate'), key: 'paymentDueDate', format: (v: string) => v ? formatDate(v) : '-' },
        { header: t('reports.daysOverdue'), key: 'daysOverdue' },
        { header: t('common.remaining'), key: 'remainingAmountUZS', format: (v: number) => formatCurrency(v), align: 'right' },
      ],
      data: overdueDeals.map((d: any) => ({ ...d, customerName: d.customer?.companyName })),
    });
  };

  const handleExportExcel = () => {
    exportExcel({
      title: t('reports.financialTab'),
      summaryRows: [
        { label: t('reports.totalOutstanding'), value: formatCurrency(accountsReceivable.totalOutstanding) },
        { label: t('reports.collections'), value: formatCurrency(collections.totalCollected) },
      ],
      columns: [
        { header: t('deals.dealNum'), key: 'dealNumber' },
        { header: t('common.customer'), key: 'customerName' },
        { header: t('reports.dueDate'), key: 'paymentDueDate', format: (v: string) => v ? formatDate(v) : '-' },
        { header: t('reports.daysOverdue'), key: 'daysOverdue' },
        { header: t('common.remaining'), key: 'remainingAmountUZS', format: (v: number) => formatCurrency(v) },
      ],
      data: overdueDeals.map((d: any) => ({ ...d, customerName: d.customer?.companyName })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" /> {t('reports.exportPDF')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('reports.exportExcel')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title={t('reports.totalOutstanding')} value={formatCurrency(accountsReceivable.totalOutstanding)} sub={`${accountsReceivable.dealCount} ${t('dashboard.deals')}`} className="text-red-600" />
        <SummaryCard title={t('reports.collections')} value={formatCurrency(collections.totalCollected)} sub={`${collections.paymentCount} ${t('dashboard.paymentsLabel')}`} className="text-green-600" />
        <SummaryCard title={t('reports.overdue')} value={String(overdueDeals.length)} sub={t('reports.dealsPastDue')} className="text-amber-600" />
        <SummaryCard title={t('reports.daysOverdue90')} value={formatCurrency(aging.over90)} className="text-red-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.arAging')}</CardTitle></CardHeader>
          <CardContent>
            {agingData.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {agingData.map((_, i) => (<Cell key={i} fill={agingColors[i]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-3 border-t pt-3">
                  {agingData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: agingColors[i] }} />
                        <span>{d.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('reports.noOutstandingAR')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.collectionsByMethod')}</CardTitle></CardHeader>
          <CardContent>
            {collections.byMethod.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={collections.byMethod} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ method, percent }: any) => `${t(`payments.${method}`, method)} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                        {collections.byMethod.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-2">
                  {collections.byMethod.map((m: any, i: number) => (
                    <div key={m.method} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{String(t(`payments.${m.method}`, { defaultValue: m.method }))}</span>
                        <span className="text-muted-foreground">({m.count})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(m.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('reports.noPaymentsInPeriod')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {overdueDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              {t('reports.overdueDeals')} ({overdueDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t('deals.dealNum')}</th>
                    <th className="pb-2 font-medium">{t('common.customer')}</th>
                    <th className="pb-2 font-medium">{t('reports.dueDate')}</th>
                    <th className="pb-2 font-medium">{t('reports.daysOverdue')}</th>
                    <th className="pb-2 font-medium text-right">{t('common.remaining')}</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueDeals.map((deal: any) => (
                    <tr key={deal.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{deal.dealNumber}</td>
                      <td className="py-2">{deal.customer?.companyName}</td>
                      <td className="py-2">{formatDate(deal.paymentDueDate)}</td>
                      <td className="py-2">
                        <Badge variant={deal.daysOverdue > 60 ? 'destructive' : 'outline'}>
                          {deal.daysOverdue} {t('common.days')}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-medium text-red-600">{formatCurrency(deal.remainingAmountUZS)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===================== CUSTOMER REPORT =====================

function CustomerReport() {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState('totalPurchasesUZS');

  const { data, isLoading } = useQuery({
    queryKey: ['report-customers', sortBy],
    queryFn: async () => {
      const { data } = await api.get(`/reports/customers?sortBy=${sortBy}&limit=20`);
      return data.data;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-10" text={t('reports.loadingCustomers')} />;
  if (!data) return null;

  const { summary, topCustomers, byType, byTier } = data;

  const handleExportPDF = () => {
    exportPDF({
      title: t('reports.customersTab'),
      summaryRows: [
        { label: t('reports.activeCustomers'), value: String(summary.totalActiveCustomers) },
        { label: t('reports.totalRevenue'), value: formatCurrency(summary.totalRevenue) },
        { label: t('reports.outstandingBalance'), value: formatCurrency(summary.totalOutstandingBalance) },
      ],
      columns: [
        { header: '#', key: 'rank' },
        { header: t('customers.company'), key: 'companyName' },
        { header: t('customers.type'), key: 'customerType' },
        { header: t('common.orders'), key: 'lifetimeOrders' },
        { header: t('reports.revenue'), key: 'totalPurchasesUZS', format: (v: number) => formatCurrency(v), align: 'right' },
        { header: t('dashboard.balance'), key: 'currentBalance', format: (v: number) => formatCurrency(v), align: 'right' },
      ],
      data: topCustomers.map((c: any, i: number) => ({ ...c, rank: i + 1 })),
    });
  };

  const handleExportExcel = () => {
    exportExcel({
      title: t('reports.customersTab'),
      summaryRows: [
        { label: t('reports.activeCustomers'), value: String(summary.totalActiveCustomers) },
        { label: t('reports.totalRevenue'), value: formatCurrency(summary.totalRevenue) },
      ],
      columns: [
        { header: t('customers.company'), key: 'companyName' },
        { header: t('customers.type'), key: 'customerType' },
        { header: t('customers.tier'), key: 'priceCategory' },
        { header: t('common.orders'), key: 'lifetimeOrders' },
        { header: t('reports.totalM2'), key: 'totalPurchasesSqMeters', format: (v: number) => formatNumber(v, 1) },
        { header: t('reports.revenue'), key: 'totalPurchasesUZS', format: (v: number) => formatCurrency(v) },
        { header: t('dashboard.balance'), key: 'currentBalance', format: (v: number) => formatCurrency(v) },
      ],
      data: topCustomers,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" /> {t('reports.exportPDF')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('reports.exportExcel')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title={t('reports.activeCustomers')} value={String(summary.totalActiveCustomers)} />
        <SummaryCard title={t('reports.totalRevenue')} value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title={t('reports.outstandingBalance')} value={formatCurrency(summary.totalOutstandingBalance)} sub={`${summary.customersWithBalance} ${t('nav.customers').toLowerCase()}`} className="text-red-600" />
        <SummaryCard title={t('reports.avgPaymentDays')} value={String(summary.averagePaymentDays)} sub={t('common.days')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.byCustomerType')}</CardTitle></CardHeader>
          <CardContent>
            {byType.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byType} dataKey="totalPurchases" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percent }: any) => `${t(`customers.${type}`, type)} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                      {byType.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.byPriceTier')}</CardTitle></CardHeader>
          <CardContent>
            {byTier.length > 0 ? (
              <div className="space-y-3">
                {byTier.map((tier: any) => (
                  <div key={tier.tier} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Badge variant="outline">{String(t(`customers.${tier.tier}`, { defaultValue: tier.tier }))}</Badge>
                      <span className="ml-2 text-sm text-muted-foreground">{tier.count} {t('nav.customers').toLowerCase()}</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(tier.totalPurchases)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('reports.topCustomers')}</CardTitle>
            <div className="flex gap-1">
              {[
                { key: 'totalPurchasesUZS', label: t('reports.revenue') },
                { key: 'lifetimeOrders', label: t('common.orders') },
                { key: 'currentBalance', label: t('dashboard.balance') },
              ].map((opt) => (
                <Button key={opt.key} variant={sortBy === opt.key ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSortBy(opt.key)}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">{t('customers.company')}</th>
                  <th className="pb-2 font-medium">{t('customers.type')}</th>
                  <th className="pb-2 font-medium">{t('customers.tier')}</th>
                  <th className="pb-2 font-medium">{t('common.orders')}</th>
                  <th className="pb-2 font-medium">{t('reports.totalM2')}</th>
                  <th className="pb-2 font-medium text-right">{t('reports.revenue')}</th>
                  <th className="pb-2 font-medium text-right">{t('dashboard.balance')}</th>
                  <th className="pb-2 font-medium">{t('customers.lastOrder')}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c: any, i: number) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{c.companyName}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{String(t(`customers.${c.customerType}`, { defaultValue: c.customerType }))}</Badge></td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{String(t(`customers.${c.priceCategory}`, { defaultValue: c.priceCategory }))}</Badge></td>
                    <td className="py-2">{c.lifetimeOrders}</td>
                    <td className="py-2">{formatNumber(c.totalPurchasesSqMeters, 1)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(c.totalPurchasesUZS)}</td>
                    <td className={`py-2 text-right ${c.currentBalance > 0 ? 'text-red-600 font-medium' : ''}`}>{formatCurrency(c.currentBalance)}</td>
                    <td className="py-2 text-muted-foreground">{c.lastOrderDate ? formatDate(c.lastOrderDate) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== PRODUCT REPORT =====================

function ProductReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { t } = useTranslation();
  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const { data, isLoading } = useQuery({
    queryKey: ['report-products', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get(`/reports/products?${params}`);
      return data.data;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-10" text={t('reports.loadingProducts')} />;
  if (!data) return null;

  const { summary, products, byCategory } = data;

  const handleExportPDF = () => {
    exportPDF({
      title: t('reports.productsTab'),
      summaryRows: [
        { label: t('reports.productsSold'), value: String(summary.totalProducts) },
        { label: t('reports.totalRevenue'), value: formatCurrency(summary.totalRevenue) },
        { label: t('reports.totalM2Sold'), value: formatNumber(summary.totalSqMetersSold, 1) },
      ],
      columns: [
        { header: t('deals.product'), key: 'name' },
        { header: t('common.code'), key: 'code' },
        { header: t('common.category'), key: 'category' },
        { header: t('deals.title'), key: 'dealCount' },
        { header: t('reports.m2Sold'), key: 'totalSqMeters', format: (v: number) => formatNumber(v, 1) },
        { header: t('reports.revenue'), key: 'totalRevenueUZS', format: (v: number) => formatCurrency(v), align: 'right' },
      ],
      data: products,
    });
  };

  const handleExportExcel = () => {
    exportExcel({
      title: t('reports.productsTab'),
      summaryRows: [
        { label: t('reports.productsSold'), value: String(summary.totalProducts) },
        { label: t('reports.totalRevenue'), value: formatCurrency(summary.totalRevenue) },
        { label: t('reports.totalM2Sold'), value: formatNumber(summary.totalSqMetersSold, 1) },
      ],
      columns: [
        { header: t('deals.product'), key: 'name' },
        { header: t('common.code'), key: 'code' },
        { header: t('common.category'), key: 'category' },
        { header: t('deals.title'), key: 'dealCount' },
        { header: t('reports.m2Sold'), key: 'totalSqMeters', format: (v: number) => formatNumber(v, 1) },
        { header: t('deals.boxes'), key: 'totalBoxes', format: (v: number) => formatNumber(v, 1) },
        { header: t('reports.revenue'), key: 'totalRevenueUZS', format: (v: number) => formatCurrency(v) },
        { header: t('reports.stockM2'), key: 'currentStock', format: (v: number) => formatNumber(v, 1) },
      ],
      data: products,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" /> {t('reports.exportPDF')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> {t('reports.exportExcel')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title={t('reports.productsSold')} value={String(summary.totalProducts)} />
        <SummaryCard title={t('reports.totalRevenue')} value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title={t('reports.totalM2Sold')} value={formatNumber(summary.totalSqMetersSold, 1)} />
        <SummaryCard title={t('reports.avgRevenuePerProduct')} value={formatCurrency(summary.averageRevenuePerProduct)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.revenueByCategory')}</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                        {byCategory.map((_: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 mt-2">
                  {byCategory.map((c: any, i: number) => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{c.category}</span>
                        <span className="text-muted-foreground">({formatNumber(c.sqMeters, 1)} m2)</span>
                      </div>
                      <span className="font-medium">{formatCurrency(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('reports.topProductsByRevenue')}</CardTitle></CardHeader>
          <CardContent>
            {products.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <YAxis type="category" dataKey="code" fontSize={10} width={70} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenueUZS" fill="#0ea5e9" name={t('reports.revenue')} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('reports.productPerformance')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">{t('deals.product')}</th>
                  <th className="pb-2 font-medium">{t('common.category')}</th>
                  <th className="pb-2 font-medium">{t('deals.title')}</th>
                  <th className="pb-2 font-medium">{t('reports.m2Sold')}</th>
                  <th className="pb-2 font-medium">{t('deals.boxes')}</th>
                  <th className="pb-2 font-medium text-right">{t('reports.revenue')}</th>
                  <th className="pb-2 font-medium text-right">{t('reports.stockM2')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any, i: number) => (
                  <tr key={p.tileFormatId} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{p.code}</p>
                    </td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{p.category}</Badge></td>
                    <td className="py-2">{p.dealCount}</td>
                    <td className="py-2">{formatNumber(p.totalSqMeters, 1)}</td>
                    <td className="py-2">{formatNumber(p.totalBoxes, 1)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(p.totalRevenueUZS)}</td>
                    <td className="py-2 text-right">{formatNumber(p.currentStock, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== SHARED =====================

function SummaryCard({ title, value, sub, className }: { title: string; value: string; sub?: string; className?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className={`text-xl font-bold ${className || ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
