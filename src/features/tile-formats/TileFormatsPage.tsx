import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency, formatNumber } from '@/utils/format';
import { Plus, Search, Grid3X3, List, Archive, RotateCcw } from 'lucide-react';
import type { TileFormat, PaginatedResponse } from '@/types';
import { TileFormatFormDialog } from './TileFormatFormDialog';

export function TileFormatsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingFormat, setEditingFormat] = useState<TileFormat | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const { data, isLoading } = useQuery<PaginatedResponse<TileFormat>>({
    queryKey: ['tile-formats', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/tile-formats?${params}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tile-formats/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tile-formats'] });
      addToast({ title: t('tileFormats.archived'), variant: 'success' });
    },
  });

  const formats = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header title={t('tileFormats.title')} subtitle={t('tileFormats.subtitle')} />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('tileFormats.searchFormats')}
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-1 rounded-md border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => { setEditingFormat(null); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t('tileFormats.newFormat')}
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner className="py-20" text={t('tileFormats.loading')} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {formats.map((format) => (
              <Card
                key={format.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => { setEditingFormat(format); setShowForm(true); }}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{format.name}</h3>
                      <p className="font-mono text-xs text-muted-foreground">{format.code}</p>
                    </div>
                    <Badge variant={format.isActive ? 'default' : 'secondary'}>
                      {format.isActive ? t('common.active') : t('common.archived')}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('tileFormats.dimensions')}</span>
                      <span>{format.lengthCm}x{format.widthCm}cm ({format.thicknessMm}mm)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('tileFormats.pricePerM2')}</span>
                      <span className="font-medium">{formatCurrency(Number(format.pricePerSqMeterUZS))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('tileFormats.m2PerBox')}</span>
                      <span>{formatNumber(format.sqMetersPerBox, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('tileFormats.stock')}</span>
                      <span className={format.currentStockSqMeters <= format.minimumStockAlert ? 'text-red-600 font-medium' : ''}>
                        {formatNumber(format.currentStockSqMeters, 1)} m2
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1">
                    <Badge variant="outline">{format.category}</Badge>
                    <Badge variant="outline">{format.surface}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">{t('common.code')}</th>
                  <th className="p-3 font-medium">{t('common.name')}</th>
                  <th className="p-3 font-medium">{t('tileFormats.dimensions')}</th>
                  <th className="p-3 font-medium">{t('tileFormats.pricePerM2')}</th>
                  <th className="p-3 font-medium">{t('tileFormats.stockM2')}</th>
                  <th className="p-3 font-medium">{t('common.category')}</th>
                  <th className="p-3 font-medium">{t('common.status')}</th>
                  <th className="p-3 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {formats.map((format) => (
                  <tr key={format.id} className="border-b hover:bg-muted/25">
                    <td className="p-3 font-mono text-xs">{format.code}</td>
                    <td className="p-3 font-medium">{format.name}</td>
                    <td className="p-3">{format.lengthCm}x{format.widthCm}cm</td>
                    <td className="p-3">{formatCurrency(Number(format.pricePerSqMeterUZS))}</td>
                    <td className="p-3">{formatNumber(format.currentStockSqMeters, 1)}</td>
                    <td className="p-3"><Badge variant="outline">{format.category}</Badge></td>
                    <td className="p-3">
                      <Badge variant={format.isActive ? 'default' : 'secondary'}>
                        {format.isActive ? t('common.active') : t('common.archived')}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingFormat(format); setShowForm(true); }}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteMutation.mutate(format.id)}
                        >
                          {format.isActive ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('common.showing', { count: formats.length, total: pagination.total })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasMore}
                onClick={() => setPage(page + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <TileFormatFormDialog
          format={editingFormat}
          onClose={() => { setShowForm(false); setEditingFormat(null); }}
        />
      )}
    </div>
  );
}
