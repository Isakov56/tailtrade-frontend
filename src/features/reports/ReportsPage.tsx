import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';
import {
  TrendingUp,
  BarChart3,
  Users,
  Package,
  Calendar,
  AlertTriangle,
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

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'sales', label: 'Sales', icon: TrendingUp },
  { key: 'financial', label: 'Financial', icon: BarChart3 },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'products', label: 'Products', icon: Package },
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [period, setPeriod] = useState('month');

  return (
    <div>
      <Header title="Reports" subtitle="Analytics and business intelligence" />
      <div className="p-6 space-y-6">
        {/* Tab Navigation */}
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

        {/* Date Filters */}
        {activeTab !== 'customers' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Quick Period</label>
              <div className="flex gap-1 mt-1">
                {['week', 'month', 'year'].map((p) => (
                  <Button
                    key={p}
                    variant={period === p && !dateFrom ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setPeriod(p); setDateFrom(''); setDateTo(''); }}
                  >
                    {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div>
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
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

  if (isLoading) return <LoadingSpinner className="py-10" text="Loading sales report..." />;
  if (!data) return null;

  const { summary, byStatus, byPaymentStatus, chartData } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Sales" value={formatCurrency(summary.totalSalesUZS)} sub={`${summary.dealCount} deals`} />
        <SummaryCard title="Collected" value={formatCurrency(summary.totalCollectedUZS)} sub={`${summary.collectionRate.toFixed(1)}% collection rate`} className="text-green-600" />
        <SummaryCard title="Outstanding" value={formatCurrency(summary.totalOutstandingUZS)} className="text-red-600" />
        <SummaryCard title="Avg Deal Size" value={formatCurrency(summary.averageDealSizeUZS)} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Sales vs Collections</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="sales" fill="#0ea5e9" name="Sales" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">By Deal Status</CardTitle></CardHeader>
          <CardContent>
            {byStatus.length > 0 ? (
              <div className="space-y-2">
                {byStatus.map((s: any) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.status}</Badge>
                      <span className="text-muted-foreground">{s.count} deals</span>
                    </div>
                    <span className="font-medium">{formatCurrency(s.totalUZS)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By Payment Status</CardTitle></CardHeader>
          <CardContent>
            {byPaymentStatus.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byPaymentStatus}
                        dataKey="totalUZS"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ status, percent }: any) => `${status} ${(percent * 100).toFixed(0)}%`}
                        fontSize={11}
                      >
                        {byPaymentStatus.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
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
                        <span>{s.status}</span>
                        <span className="text-muted-foreground">({s.count})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(s.totalUZS)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ===================== FINANCIAL REPORT =====================

function FinancialReport({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
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

  if (isLoading) return <LoadingSpinner className="py-10" text="Loading financial report..." />;
  if (!data) return null;

  const { accountsReceivable, collections, overdueDeals } = data;
  const { aging } = accountsReceivable;

  const agingData = [
    { name: 'Current', value: aging.current },
    { name: '1-30 days', value: aging.days1to30 },
    { name: '31-60 days', value: aging.days31to60 },
    { name: '61-90 days', value: aging.days61to90 },
    { name: '90+ days', value: aging.over90 },
  ].filter((d) => d.value > 0);

  const agingColors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444', '#991b1b'];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Outstanding"
          value={formatCurrency(accountsReceivable.totalOutstanding)}
          sub={`${accountsReceivable.dealCount} deals`}
          className="text-red-600"
        />
        <SummaryCard
          title="Collections"
          value={formatCurrency(collections.totalCollected)}
          sub={`${collections.paymentCount} payments`}
          className="text-green-600"
        />
        <SummaryCard
          title="Overdue"
          value={String(overdueDeals.length)}
          sub="deals past due"
          className="text-amber-600"
        />
        <SummaryCard
          title="90+ Days Overdue"
          value={formatCurrency(aging.over90)}
          className="text-red-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AR Aging */}
        <Card>
          <CardHeader><CardTitle className="text-base">Accounts Receivable Aging</CardTitle></CardHeader>
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
                        {agingData.map((_, i) => (
                          <Cell key={i} fill={agingColors[i]} />
                        ))}
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
              <p className="text-sm text-muted-foreground">No outstanding receivables</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader><CardTitle className="text-base">Collections by Method</CardTitle></CardHeader>
          <CardContent>
            {collections.byMethod.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={collections.byMethod}
                        dataKey="amount"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ method, percent }: any) => `${method.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`}
                        fontSize={10}
                      >
                        {collections.byMethod.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
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
                        <span>{m.method.replace('_', ' ')}</span>
                        <span className="text-muted-foreground">({m.count})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(m.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No payments in this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Deals */}
      {overdueDeals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Overdue Deals ({overdueDeals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Deal #</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium">Days Overdue</th>
                    <th className="pb-2 font-medium text-right">Remaining</th>
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
                          {deal.daysOverdue} days
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-medium text-red-600">
                        {formatCurrency(deal.remainingAmountUZS)}
                      </td>
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
  const [sortBy, setSortBy] = useState('totalPurchasesUZS');

  const { data, isLoading } = useQuery({
    queryKey: ['report-customers', sortBy],
    queryFn: async () => {
      const { data } = await api.get(`/reports/customers?sortBy=${sortBy}&limit=20`);
      return data.data;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-10" text="Loading customer report..." />;
  if (!data) return null;

  const { summary, topCustomers, byType, byTier } = data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Active Customers" value={String(summary.totalActiveCustomers)} />
        <SummaryCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title="Outstanding Balance" value={formatCurrency(summary.totalOutstandingBalance)} sub={`${summary.customersWithBalance} customers`} className="text-red-600" />
        <SummaryCard title="Avg Payment Days" value={String(summary.averagePaymentDays)} sub="days" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By Type */}
        <Card>
          <CardHeader><CardTitle className="text-base">By Customer Type</CardTitle></CardHeader>
          <CardContent>
            {byType.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byType}
                      dataKey="totalPurchases"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ type, percent }: any) => `${type} ${(percent * 100).toFixed(0)}%`}
                      fontSize={11}
                    >
                      {byType.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* By Tier */}
        <Card>
          <CardHeader><CardTitle className="text-base">By Price Tier</CardTitle></CardHeader>
          <CardContent>
            {byTier.length > 0 ? (
              <div className="space-y-3">
                {byTier.map((t: any) => (
                  <div key={t.tier} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Badge variant="outline">{t.tier}</Badge>
                      <span className="ml-2 text-sm text-muted-foreground">{t.count} customers</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(t.totalPurchases)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Top Customers</CardTitle>
            <div className="flex gap-1">
              {[
                { key: 'totalPurchasesUZS', label: 'Revenue' },
                { key: 'lifetimeOrders', label: 'Orders' },
                { key: 'currentBalance', label: 'Balance' },
              ].map((opt) => (
                <Button
                  key={opt.key}
                  variant={sortBy === opt.key ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSortBy(opt.key)}
                >
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
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Tier</th>
                  <th className="pb-2 font-medium">Orders</th>
                  <th className="pb-2 font-medium">Total m2</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">Balance</th>
                  <th className="pb-2 font-medium">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c: any, i: number) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{c.companyName}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{c.customerType}</Badge></td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{c.priceCategory}</Badge></td>
                    <td className="py-2">{c.lifetimeOrders}</td>
                    <td className="py-2">{formatNumber(c.totalPurchasesSqMeters, 1)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(c.totalPurchasesUZS)}</td>
                    <td className={`py-2 text-right ${c.currentBalance > 0 ? 'text-red-600 font-medium' : ''}`}>
                      {formatCurrency(c.currentBalance)}
                    </td>
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

  if (isLoading) return <LoadingSpinner className="py-10" text="Loading product report..." />;
  if (!data) return null;

  const { summary, products, byCategory } = data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Products Sold" value={String(summary.totalProducts)} />
        <SummaryCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title="Total m2 Sold" value={formatNumber(summary.totalSqMetersSold, 1)} />
        <SummaryCard title="Avg Revenue/Product" value={formatCurrency(summary.averageRevenuePerProduct)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Category */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Category</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`}
                        fontSize={11}
                      >
                        {byCategory.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
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
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Top Products Bar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Products by Revenue</CardTitle></CardHeader>
          <CardContent>
            {products.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <YAxis type="category" dataKey="code" fontSize={10} width={70} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenueUZS" fill="#0ea5e9" name="Revenue" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Product Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Deals</th>
                  <th className="pb-2 font-medium">m2 Sold</th>
                  <th className="pb-2 font-medium">Boxes</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">Stock (m2)</th>
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
