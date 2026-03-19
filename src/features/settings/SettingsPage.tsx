import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToastStore } from '@/stores/toastStore';
import { formatNumber } from '@/utils/format';
import { DollarSign, Loader2 } from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const [newRate, setNewRate] = useState('');
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const { data: exchangeRate, isLoading } = useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      const { data } = await api.get('/settings/exchange-rate');
      return data.data;
    },
  });

  const rateMutation = useMutation({
    mutationFn: (rate: number) => api.post('/settings/exchange-rate', { rate, source: 'manual' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rate'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      addToast({ title: t('settings.rateUpdated'), variant: 'success' });
      setNewRate('');
    },
  });

  if (isLoading) {
    return <LoadingSpinner className="py-20" />;
  }

  return (
    <div>
      <Header title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="p-6 space-y-6">
        {/* Exchange Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5" /> {t('settings.exchangeRateManagement')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exchangeRate && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">{t('settings.currentRate')}</p>
                <p className="text-2xl font-bold">{t('settings.usdRate', { rate: formatNumber(Number(exchangeRate.rate)) })}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings.source', { source: exchangeRate.source, date: new Date(exchangeRate.validFrom).toLocaleString() })}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>{t('settings.newExchangeRate')}</Label>
                <Input
                  type="number"
                  placeholder="e.g. 12500"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => newRate && rateMutation.mutate(parseFloat(newRate))}
                  disabled={!newRate || rateMutation.isPending}
                >
                  {rateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('settings.updateRate')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* More settings sections can be added here */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.businessSettings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('settings.businessSettingsDesc')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
