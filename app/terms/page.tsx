import Link from 'next/link';
import Icon from '@/components/shared/icon';

export default function TermsPage() {
  return (
    <div className="page-enter flex min-h-[62vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-[26px] border border-border-warm-light bg-surface p-6 text-center shadow-warm-2 md:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Icon name="shield" size={30} stroke={1.9} />
        </span>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.12em] text-brand">
          Mentions légales
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-ink md:text-3xl">
          Cadre légal RUSH Cameroun
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[14px] font-semibold leading-relaxed text-ink-light md:text-[15px]">
          Cette page regroupe les informations légales, conditions d'utilisation, règles de confidentialité et
          conditions de paiement Mobile Money de RUSH. La version complète sera publiée avant ouverture publique.
        </p>
        <div className="mt-6 grid gap-3 text-left md:grid-cols-3">
          {[
            { icon: 'wallet', label: 'Paiements', text: 'MTN MoMo et Orange Money.' },
            { icon: 'truck', label: 'Livraison', text: 'Zone MVP : Douala.' },
            { icon: 'headset', label: 'Support', text: 'Assistance locale 7j/7.' },
          ].map((item) => (
            <div key={item.label} className="rounded-[18px] bg-bg-app-light p-4">
              <Icon name={item.icon} size={21} className="text-brand" />
              <div className="mt-2 text-[13px] font-black text-ink">{item.label}</div>
              <div className="mt-0.5 text-[12px] font-semibold leading-snug text-ink-muted">{item.text}</div>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="mx-auto mt-7 flex h-11 w-fit items-center justify-center gap-2 rounded-pill bg-ink px-6 text-[13px] font-black text-white shadow-warm-1"
        >
          Retour à l'accueil
          <Icon name="arrowR" size={15} stroke={2.4} />
        </Link>
      </section>
    </div>
  );
}
