import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency } from '@/utils/format';
import { Loader2, X, Search } from 'lucide-react';
import type { Deal, PaginatedResponse, ApiResponse } from '@/types';

interface Props {
  onClose: () => void;
  prefillDealId?: string;
}

export function RecordPaymentDialog({ onClose, prefillDealId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [dealSearch, setDealSearch] = useState('');
  const [selectedDealId, setSelectedDealId] = useState(prefillDealId || '');
  const [selectedDealLabel, setSelectedDealLabel] = useState('');
  const [selectedDealRemaining, setSelectedDealRemaining] = useState<number>(0);
  const [selectedDealTotal, setSelectedDealTotal] = useState<number>(0);
  const [selectedDealPaid, setSelectedDealPaid] = useState<number>(0);
  const [showDealDropdown, setShowDealDropdown] = useState(false);
  const [amountUZS, setAmountUZS] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const { data: dealsData } = useQuery<PaginatedResponse<Deal>>({
    queryKey: ['deals-search', dealSearch],
    queryFn: async () => {
      const { data } = await api.get(`/deals?search=${encodeURIComponent(dealSearch)}&limit=10&status=DRAFT&status=CONFIRMED&status=PROCESSING&status=SHIPPED&status=DELIVERED&status=COMPLETED&paymentStatus=UNPAID&paymentStatus=PARTIAL`);
      return data;
    },
    enabled: dealSearch.length >= 2 && !prefillDealId,
  });

  // Fetch deal details when prefillDealId is provided
  const { data: prefillDeal } = useQuery<Deal>({
    queryKey: ['deal', prefillDealId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Deal>>(`/deals/${prefillDealId}`);
      return data.data;
    },
    enabled: !!prefillDealId,
  });

  useEffect(() => {
    if (prefillDeal) {
      const remaining = Number(prefillDeal.remainingAmountUZS);
      const total = Number(prefillDeal.totalUZS);
      const paid = Number(prefillDeal.paidAmountUZS);
      setSelectedDealRemaining(remaining);
      setSelectedDealTotal(total);
      setSelectedDealPaid(paid);
      setSelectedDealLabel(`${prefillDeal.dealNumber} - ${prefillDeal.customer?.companyName}`);
      setAmountUZS(remaining > 0 ? String(remaining) : '');
    }
  }, [prefillDeal]);

  const selectDeal = (deal: Deal) => {
    const remaining = Number(deal.remainingAmountUZS);
    const total = Number(deal.totalUZS);
    const paid = Number(deal.paidAmountUZS);
    setSelectedDealId(deal.id);
    setSelectedDealLabel(`${deal.dealNumber} - ${deal.customer?.companyName}`);
    setSelectedDealRemaining(remaining);
    setSelectedDealTotal(total);
    setSelectedDealPaid(paid);
    setAmountUZS(remaining > 0 ? String(remaining) : '');
    setShowDealDropdown(false);
    setDealSearch('');
  };

  const clearDeal = () => {
    setSelectedDealId('');
    setSelectedDealLabel('');
    setSelectedDealRemaining(0);
    setSelectedDealTotal(0);
    setSelectedDealPaid(0);
    setAmountUZS('');
  };

  const setQuickAmount = (fraction: number) => {
    const amount = Math.round(selectedDealRemaining * fraction);
    setAmountUZS(String(amount));
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedDealId) throw new Error('Select a deal');
      if (!amountUZS || parseFloat(amountUZS) <= 0) throw new Error('Amount must be > 0');
      return api.post('/payments', {
        dealId: selectedDealId,
        amountUZS: parseFloat(amountUZS),
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      addToast({ title: t('payments.recorded'), variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      addToast({
        title: t('payments.failed'),
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const currentAmount = parseFloat(amountUZS) || 0;
  const isOverpaying = currentAmount > selectedDealRemaining && selectedDealRemaining > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('payments.recordPayment')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          {/* Deal Selection */}
          {!prefillDealId && (
            <div className="space-y-1">
              <Label>{t('payments.deal')} *</Label>
              {selectedDealId && selectedDealLabel ? (
                <div className="flex items-center justify-between rounded border p-2 text-sm">
                  <span>{selectedDealLabel}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={clearDeal}>
                    {t('common.change')}
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('payments.dealSearch')}
                    className="pl-9"
                    value={dealSearch}
                    onChange={(e) => { setDealSearch(e.target.value); setShowDealDropdown(true); }}
                    onFocus={() => setShowDealDropdown(true)}
                  />
                  {showDealDropdown && dealSearch.length >= 2 && dealsData?.data && dealsData.data.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg p-3 text-sm text-muted-foreground">
                      {t('payments.noDealFound', { search: dealSearch })}
                    </div>
                  )}
                  {showDealDropdown && dealsData?.data && dealsData.data.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg max-h-48 overflow-y-auto">
                      {dealsData.data.map((deal) => (
                        <button
                          key={deal.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-muted text-sm border-b last:border-0"
                          onClick={() => selectDeal(deal)}
                        >
                          <p className="font-mono text-xs">{deal.dealNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {deal.customer?.companyName} | {t('common.remaining')}: {formatCurrency(Number(deal.remainingAmountUZS))}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deal Financial Summary */}
          {selectedDealId && selectedDealRemaining > 0 && (
            <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payments.dealTotal')}</span>
                <span>{formatCurrency(selectedDealTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('payments.alreadyPaid')}</span>
                <span className="text-green-600">{formatCurrency(selectedDealPaid)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>{t('common.remaining')}</span>
                <span className="text-red-600">{formatCurrency(selectedDealRemaining)}</span>
              </div>
            </div>
          )}

          {/* Amount with Quick Select */}
          <div className="space-y-2">
            <Label>{t('payments.amountUZS')} *</Label>
            {selectedDealId && selectedDealRemaining > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={currentAmount === selectedDealRemaining ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs flex-1"
                  onClick={() => setQuickAmount(1)}
                >
                  {t('payments.fullAmount')}
                </Button>
                <Button
                  type="button"
                  variant={currentAmount === Math.round(selectedDealRemaining * 0.5) ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs flex-1"
                  onClick={() => setQuickAmount(0.5)}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant={currentAmount === Math.round(selectedDealRemaining * 0.25) ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs flex-1"
                  onClick={() => setQuickAmount(0.25)}
                >
                  25%
                </Button>
              </div>
            )}
            <Input
              type="number"
              step="any"
              min="1"
              value={amountUZS}
              onChange={(e) => setAmountUZS(e.target.value)}
              placeholder="Enter amount"
              required
            />
            {isOverpaying && (
              <p className="text-xs text-amber-600">
                {t('payments.overpayWarning', { amount: formatCurrency(selectedDealRemaining) })}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>{t('payments.paymentMethod')}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">{t('payments.CASH')}</option>
              <option value="BANK_TRANSFER">{t('payments.BANK_TRANSFER')}</option>
              <option value="CARD">{t('payments.CARD')}</option>
              <option value="MOBILE_PAYMENT">{t('payments.MOBILE_PAYMENT')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>{t('payments.referenceNumber')}</Label>
            <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder={t('payments.referencePlaceholder')} />
          </div>

          <div className="space-y-1">
            <Label>{t('common.notes')}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('payments.optionalNotes')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('payments.recordPayment')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
