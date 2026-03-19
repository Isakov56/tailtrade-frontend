import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency, formatNumber } from '@/utils/format';
import { Plus, Trash2, Loader2, ArrowLeft, Search } from 'lucide-react';
import type { Customer, TileFormat, PaginatedResponse } from '@/types';

interface DealItemInput {
  tileFormatId: string;
  tileFormatName: string;
  tileFormatCode: string;
  quantitySqMeters: number;
  unitPriceUZS: number;
  unitPriceUSD: number;
  discountPercent: number;
  sqMetersPerBox: number;
  notes: string;
}

export function CreateDealPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Deal fields
  const [items, setItems] = useState<DealItemInput[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(12);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryAddressText, setDeliveryAddressText] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [notes, setNotes] = useState('');

  // Tile format picker
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  const [formatSearch, setFormatSearch] = useState('');

  // Fetch customers for search
  const { data: customersData } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['customers-search', customerSearch],
    queryFn: async () => {
      const { data } = await api.get(`/customers?search=${customerSearch}&limit=10`);
      return data;
    },
    enabled: customerSearch.length >= 2,
  });

  // Fetch tile formats
  const { data: formatsData } = useQuery<PaginatedResponse<TileFormat>>({
    queryKey: ['tile-formats-all', formatSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', isActive: 'true' });
      if (formatSearch) params.set('search', formatSearch);
      const { data } = await api.get(`/tile-formats?${params}`);
      return data;
    },
  });

  // Fetch exchange rate
  const { data: exchangeRateData } = useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      const { data } = await api.get('/settings/exchange-rate');
      return data.data;
    },
  });

  const exchangeRate = exchangeRateData ? Number(exchangeRateData.rate) : 12500;

  // Add tile format to deal
  const addItem = (format: TileFormat) => {
    const existing = items.find(i => i.tileFormatId === format.id);
    if (existing) {
      addToast({ title: t('deals.formatAlreadyAdded'), description: t('deals.updateQtyInstead'), variant: 'default' });
      setShowFormatPicker(false);
      return;
    }

    const customerDiscount = selectedCustomer?.discountPercent || 0;

    setItems([...items, {
      tileFormatId: format.id,
      tileFormatName: format.name,
      tileFormatCode: format.code,
      quantitySqMeters: 0,
      unitPriceUZS: Number(format.pricePerSqMeterUZS),
      unitPriceUSD: Number(format.pricePerSqMeterUSD),
      discountPercent: customerDiscount,
      sqMetersPerBox: format.sqMetersPerBox,
      notes: '',
    }]);
    setShowFormatPicker(false);
    setFormatSearch('');
  };

  const updateItem = (index: number, field: keyof DealItemInput, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculateItemTotal = (item: DealItemInput) => {
    return item.quantitySqMeters * item.unitPriceUZS * (1 - item.discountPercent / 100);
  };

  const subtotalUZS = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const discountAmountUZS = subtotalUZS * discountPercent / 100;
  const afterDiscount = subtotalUZS - discountAmountUZS;
  const taxAmountUZS = afterDiscount * taxPercent / 100;
  const totalUZS = afterDiscount + taxAmountUZS;
  const totalUSD = exchangeRate > 0 ? totalUZS / exchangeRate : 0;

  // Submit
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) throw new Error('Select a customer');
      if (items.length === 0) throw new Error('Add at least one item');
      if (items.some(i => i.quantitySqMeters <= 0)) throw new Error('All items must have quantity > 0');

      const payload = {
        customerId: selectedCustomer.id,
        items: items.map(item => ({
          tileFormatId: item.tileFormatId,
          quantitySqMeters: item.quantitySqMeters,
          unitPriceUZS: item.unitPriceUZS,
          unitPriceUSD: item.unitPriceUSD,
          discountPercent: item.discountPercent,
          notes: item.notes || undefined,
        })),
        discountPercent,
        taxPercent,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        deliveryAddressText: deliveryAddressText || undefined,
        vehicleInfo: vehicleInfo || undefined,
        deliveryNotes: deliveryNotes || undefined,
        notes: notes || undefined,
      };

      const { data } = await api.post('/deals', payload);
      return data.data;
    },
    onSuccess: (deal) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      addToast({ title: t('deals.dealCreated', { number: deal.dealNumber }), variant: 'success' });
      navigate('/deals');
    },
    onError: (error: any) => {
      addToast({
        title: t('deals.createFailed'),
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div>
      <Header title={t('deals.createDeal')} subtitle={t('deals.subtitle')} />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/deals')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('deals.backToDeals')}
        </Button>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. {t('deals.selectCustomer')}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{selectedCustomer.companyName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.contactPerson} | {selectedCustomer.phoneNumbers[0]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('customers.tier')}: {selectedCustomer.priceCategory} | {t('customers.discountPercent')}: {selectedCustomer.discountPercent}% |
                    {t('customers.balance')}: {formatCurrency(Number(selectedCustomer.currentBalance))} |
                    {t('customers.creditLimit')}: {formatCurrency(Number(selectedCustomer.creditLimit))}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                  {t('common.change')}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('deals.searchCustomer')}
                  className="pl-9"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
                {showCustomerDropdown && customersData?.data && customersData.data.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg max-h-60 overflow-y-auto">
                    {customersData.data.map((customer) => (
                      <button
                        key={customer.id}
                        className="w-full px-4 py-3 text-left hover:bg-muted text-sm border-b last:border-0"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDropdown(false);
                          setCustomerSearch('');
                          // Auto-apply customer discount to existing items
                          if (customer.discountPercent > 0) {
                            setItems(items.map(item => ({
                              ...item,
                              discountPercent: customer.discountPercent,
                            })));
                          }
                        }}
                      >
                        <p className="font-medium">{customer.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.contactPerson} | {customer.priceCategory} | {t('customers.balance')}: {formatCurrency(Number(customer.currentBalance))}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">2. {t('deals.dealItems')}</CardTitle>
            <Button size="sm" onClick={() => setShowFormatPicker(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('deals.addTileFormat')}
            </Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('deals.noItemsYet')}
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.tileFormatId} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{item.tileFormatName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.tileFormatCode}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('deals.quantityM2')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantitySqMeters || ''}
                          onChange={(e) => updateItem(index, 'quantitySqMeters', parseFloat(e.target.value) || 0)}
                        />
                        {item.sqMetersPerBox > 0 && item.quantitySqMeters > 0 && (
                          <p className="text-xs text-muted-foreground">
                            = {formatNumber(item.quantitySqMeters / item.sqMetersPerBox, 1)} boxes
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('deals.priceM2UZS')}</Label>
                        <Input
                          type="number"
                          step="100"
                          value={item.unitPriceUZS || ''}
                          onChange={(e) => updateItem(index, 'unitPriceUZS', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('customers.discountPercent')}</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={item.discountPercent || ''}
                          onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('deals.lineTotal')}</Label>
                        <p className="h-10 flex items-center font-semibold">
                          {formatCurrency(calculateItemTotal(item))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Summary & Details */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Delivery & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. {t('deals.deliveryNotes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>{t('deals.expectedDeliveryDate')}</Label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('deals.deliveryAddress')}</Label>
                <Input
                  placeholder={t('deals.deliveryAddress')}
                  value={deliveryAddressText}
                  onChange={(e) => setDeliveryAddressText(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('deals.vehicleInfo')}</Label>
                <Input
                  placeholder={t('deals.vehicleInfo')}
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('deals.deliveryNotesLabel')}</Label>
                <Input
                  placeholder={t('deals.deliveryNotesLabel')}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('deals.dealNotes')}</Label>
                <Input
                  placeholder={t('deals.dealNotes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">4. {t('deals.summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('deals.dealDiscount')}</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('deals.taxVAT')}</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={taxPercent || ''}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deals.subtotal')}</span>
                  <span>{formatCurrency(subtotalUZS)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>{t('deals.discount')} ({discountPercent}%)</span>
                    <span>-{formatCurrency(discountAmountUZS)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('deals.tax')} ({taxPercent}%)</span>
                  <span>{formatCurrency(taxAmountUZS)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>{t('common.total')}</span>
                  <div className="text-right">
                    <p>{formatCurrency(totalUZS)}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {formatCurrency(totalUSD, 'USD')} @ {formatNumber(exchangeRate)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCustomer && Number(selectedCustomer.creditLimit) > 0 && (
                <div className={`rounded-lg p-3 text-sm ${
                  Number(selectedCustomer.currentBalance) + totalUZS > Number(selectedCustomer.creditLimit)
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  <p className="font-medium">{t('deals.creditCheck')}</p>
                  <p>{t('deals.currentBalanceLabel')}: {formatCurrency(Number(selectedCustomer.currentBalance))}</p>
                  <p>{t('deals.afterDeal')}: {formatCurrency(Number(selectedCustomer.currentBalance) + totalUZS)}</p>
                  <p>{t('customers.creditLimit')}: {formatCurrency(Number(selectedCustomer.creditLimit))}</p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedCustomer || items.length === 0 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('deals.createDeal')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tile Format Picker Modal */}
      {showFormatPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[80vh] rounded-lg bg-card shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">{t('deals.selectTileFormat')}</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowFormatPicker(false); setFormatSearch(''); }}>
                {t('common.close')}
              </Button>
            </div>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('deals.searchByNameOrCode')}
                  className="pl-9"
                  value={formatSearch}
                  onChange={(e) => setFormatSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-2">
                {(formatsData?.data || []).map((format) => (
                  <button
                    key={format.id}
                    className="w-full rounded-lg border p-3 text-left hover:bg-muted transition-colors"
                    onClick={() => addItem(format)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{format.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{format.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(format.pricePerSqMeterUZS))}/m2</p>
                        <p className="text-xs text-muted-foreground">
                          {format.lengthCm}x{format.widthCm}cm | {format.sqMetersPerBox} m2/box
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
