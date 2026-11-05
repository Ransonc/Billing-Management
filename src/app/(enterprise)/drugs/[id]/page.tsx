'use client';

import { use } from 'react';
import { DrugForm } from '@/components/drugs/drug-form';

export default function EditDrugPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DrugForm drugId={id} />;
}
