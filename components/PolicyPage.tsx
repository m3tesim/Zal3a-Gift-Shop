import Link from "next/link";
import type { Metadata } from "next";
import { getDict, type Locale } from "@/lib/i18n";
import { POLICIES, POLICY_PATHS, type PolicyId } from "@/lib/policies";
import { SOCIALS } from "@/lib/site";

export function policyMetadata(id: PolicyId, locale: Locale): Metadata {
  const policy = POLICIES[id][locale];
  return { title: policy.title, description: policy.intro[0] ?? policy.sections[0]?.items?.[0]?.text };
}

export function PolicyPage({ id, locale }: { id: PolicyId; locale: Locale }) {
  const policy = POLICIES[id][locale];
  const dictionary = getDict(locale);
  const whatsapp = SOCIALS.find((social) => social.id === "whatsapp")!;

  return (
    <article className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
      <header className="grid gap-4">
        <span className="eyebrow">{dictionary.footer.help}</span>
        <h1 className="font-head text-[clamp(2.2rem,6vw,3.4rem)] leading-tight font-extrabold">
          {policy.title}
          <span className="text-pink">.</span>
        </h1>
        {policy.intro.map((paragraph, index) => (
          <p key={index} className="text-lg text-ink-soft">
            {paragraph}
          </p>
        ))}
      </header>

      {policy.sections.map((section) => (
        <section key={section.heading} className="sticker grid gap-3 p-5 sm:p-6">
          <h2 className="font-head text-2xl font-extrabold">{section.heading}</h2>
          {section.paragraphs?.map((paragraph, index) => (
            <p key={index} className="text-ink-soft">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="grid gap-3">
              {section.items.map((item, index) => (
                <li key={index} className="flex gap-3 text-ink-soft">
                  <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full border-2 border-ink bg-lime" />
                  <span>
                    {item.label && <b className="text-ink">{item.label}: </b>}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div className="grid gap-3 rounded-3xl border-[3px] border-ink bg-sun-soft p-5 sm:p-6">
        <p className="font-bold">{dictionary.policies.questions}</p>
        <div className="flex flex-wrap gap-3">
          <a href={whatsapp.href} target="_blank" rel="noopener noreferrer" className="btn btn-pink">
            {dictionary.policies.whatsapp}
          </a>
          {policy.related && (
            <Link href={`/${locale}/${POLICY_PATHS[policy.related.id]}`} className="btn btn-white">
              {policy.related.label}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
