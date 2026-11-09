"use client";

import { useState, useTransition } from "react";
import { deleteReviewAction, updateReviewAction } from "@/app/admin/actions";
import { Notice, Toggle } from "./ui";
import { StarIcon } from "../icons";

type R = { id: number; author: string; rating: number; body: string; reply: string; visible: boolean };

export function ReviewEditor({ review, pot, date, href }: { review: R; pot: string; date: string; href: string }) {
  const [f, setF] = useState(review);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(f) !== JSON.stringify(review);

  return (
    <li className={`grid gap-3 rounded-3xl border-[3px] border-ink bg-paper p-4 ${f.visible ? "" : "bg-cream"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold">
          <a href={href} target="_blank" className="hover:text-pink">
            {pot}
          </a>{" "}
          <span className="font-normal text-ink-soft">· {date}</span>
        </span>
        <Toggle label={f.visible ? "Shown" : "Hidden"} checked={f.visible} onChange={(v) => setF({ ...f, visible: v })} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold">
          Name
          <input value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} className="field w-40 py-1.5" />
        </label>
        <div className="flex" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={f.rating === n}
              aria-label={`${n} stars`}
              onClick={() => setF({ ...f, rating: n })}
              className={f.rating >= n ? "text-sun" : "text-line"}
            >
              <StarIcon width={26} height={26} />
            </button>
          ))}
        </div>
      </div>
      <textarea dir="auto" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={3} className="field resize-y" aria-label="Review" />
      <label className="grid gap-1 text-sm font-bold">
        Your reply (shown under the review)
        <textarea dir="auto" value={f.reply} onChange={(e) => setF({ ...f, reply: e.target.value })} rows={2} className="field resize-y font-normal" placeholder="Thank you so much! 🌵" />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const r = await updateReviewAction(f.id, f);
              setMsg(r.ok ? { kind: "ok", text: "Saved" } : { kind: "error", text: r.error });
            })
          }
          className="btn btn-pink py-1.5 text-base"
        >
          Save
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => confirm("Delete this review for good?") && start(async () => void (await deleteReviewAction(f.id)))}
          className="rounded-full border-2 border-line px-4 py-1.5 font-bold text-ink-soft hover:border-pink hover:text-pink"
        >
          Delete
        </button>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      </div>
    </li>
  );
}
