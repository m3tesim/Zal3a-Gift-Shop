"use client";

import { useState, useTransition } from "react";
import { previewOfferAction, sendOfferAction, sendTestOfferAction, type CampaignFormInput } from "@/app/admin/actions";
import { ImageUpload, LInput, Labeled, Notice, Panel, TextInput } from "./ui";

const blank = { en: "", ar: "" };

export function OfferComposer({ audience, configured, adminEmail }: { audience: number; configured: boolean; adminEmail: string }) {
  const [f, setF] = useState<CampaignFormInput>({ subject: blank, body: blank, ctaLabel: { en: "Shop now", ar: "اطلب دلوقتي" }, ctaUrl: "/{lang}", image: null });
  const [preview, setPreview] = useState<{ locale: "en" | "ar"; html: string } | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof CampaignFormInput>(k: K, v: CampaignFormInput[K]) => setF((s) => ({ ...s, [k]: v }));

  const showPreview = (locale: "en" | "ar") => start(async () => setPreview({ locale, html: await previewOfferAction(f, locale) }));

  return (
    <Panel title="Send an offer" sub={`Goes to the ${audience} customer${audience === 1 ? "" : "s"} who said yes to offers and confirmed their email, each in their own language, with an unsubscribe link.`}>
      <LInput label="Subject / headline" required value={f.subject} onChange={(v) => set("subject", v)} />
      <LInput label="Message" required multiline hint="Plain text. Leave an empty line between paragraphs." value={f.body} onChange={(v) => set("body", v)} />
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="grid content-start gap-1.5">
          <span className="text-sm font-bold">Banner image (optional)</span>
          <ImageUpload value={f.image ?? null} onChange={(url) => set("image", url)} removable className="aspect-[16/9]" emptyText="Drop an image" />
        </div>
        <div className="grid content-start gap-4">
          <LInput label="Button text" value={f.ctaLabel} onChange={(v) => set("ctaLabel", v)} />
          <Labeled label="Button link" hint="A page on the shop like /{lang}/pots/dino ({lang} becomes en or ar), or a full https:// link. Leave empty for no button.">
            <TextInput dir="ltr" value={f.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} />
          </Labeled>
        </div>
      </div>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => showPreview("en")} className="rounded-full border-2 border-ink bg-sky-soft px-4 py-2 font-bold hover:bg-sky">
          Preview English
        </button>
        <button type="button" disabled={pending} onClick={() => showPreview("ar")} className="rounded-full border-2 border-ink bg-sky-soft px-4 py-2 font-bold hover:bg-sky">
          Preview Arabic
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await sendTestOfferAction(f);
              setMsg(r.ok ? { kind: "ok", text: `Test sent to ${adminEmail} (English + Arabic).` } : { kind: "error", text: r.error });
            })
          }
          className="rounded-full border-2 border-ink bg-paper px-4 py-2 font-bold hover:bg-sun"
        >
          Send test to me
        </button>
        <button
          type="button"
          disabled={pending || !configured || audience === 0}
          onClick={() =>
            confirm(`Send “${f.subject.en}” to ${audience} customer${audience === 1 ? "" : "s"}? This can't be undone.`) &&
            start(async () => {
              const r = await sendOfferAction(f);
              setMsg(r.ok ? { kind: "ok", text: "Sending! Progress shows in the history below. Refresh to update it." } : { kind: "error", text: r.error });
            })
          }
          className="btn btn-pink ms-auto py-2 text-base"
        >
          Send to {audience} customer{audience === 1 ? "" : "s"}
        </button>
      </div>
      {!configured && <p className="text-sm font-bold text-ink-soft">Sending to customers unlocks once email is set up (see above). Previews and tests work now.</p>}

      {preview && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <b>{preview.locale === "en" ? "English" : "Arabic"} preview</b>
            <button type="button" onClick={() => setPreview(null)} className="text-sm font-bold underline">
              Close
            </button>
          </div>
          <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="h-[640px] w-full rounded-2xl border-[3px] border-ink bg-cream" />
        </div>
      )}
    </Panel>
  );
}
