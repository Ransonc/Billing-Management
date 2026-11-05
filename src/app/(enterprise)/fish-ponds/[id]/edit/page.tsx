'use client';

import { use } from 'react';
import { PondForm } from '@/components/fish-ponds/pond-form';

export default function EditFishPondPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PondForm pondId={id} />;
}
