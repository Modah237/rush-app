'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface CategorySlugPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategorySlugPage({ params }: CategorySlugPageProps) {
  const router = useRouter();
  const { slug } = use(params);

  useEffect(() => {
    // Rediriger vers la page principale des catégories en appliquant le filtre de catégorie
    router.replace(`/categories?cat=${slug}`);
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="sk-anim w-12 h-12 rounded-full" />
    </div>
  );
}
