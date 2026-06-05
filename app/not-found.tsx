import Link from 'next/link';
import Icon from '@/components/shared/icon';

export default function NotFound() {
  return (
    <div className="page-enter flex min-h-[62vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-[26px] border border-border-warm-light bg-surface p-6 text-center shadow-warm-2 md:p-9">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Icon name="search" size={30} stroke={1.9} />
        </span>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.12em] text-brand">
          Page introuvable
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-ink">
          Cette page RUSH n'est pas disponible.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] font-semibold leading-relaxed text-ink-light">
          Le lien est peut-être incorrect ou la fonctionnalité n'est pas encore ouverte dans le MVP Douala.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-pill bg-ink px-6 text-[13px] font-black text-white shadow-warm-1"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/categories"
            className="flex h-11 items-center justify-center rounded-pill border border-border-warm bg-surface px-6 text-[13px] font-black text-ink"
          >
            Voir les catégories
          </Link>
        </div>
      </section>
    </div>
  );
}
