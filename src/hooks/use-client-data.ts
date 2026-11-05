'use client';

import { useEffect, useState } from 'react';
import { api } from '@/hooks/use-api';
import type { Customer, FishPond, WaterQualityRecord, DrugRecord, SaleRecord, FishStocking } from '@/types';

export interface ClientFishPond extends FishPond {
  waterQualities: WaterQualityRecord[];
  drugRecords: DrugRecord[];
  saleRecords: SaleRecord[];
  fishStockings: FishStocking[];
}

export interface ClientData {
  customer: Pick<Customer, 'id' | 'name' | 'phone' | 'address'>;
  ponds: ClientFishPond[];
}

// 客户(养殖户)移动端数据:一次拉取本人名下全部鱼塘及近期检测/用药/出售
export function useClientData() {
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ClientData>('/api/mobile/client/data')
      .then((r) => setData(r.data ?? null))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
