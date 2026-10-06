"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CharacterCard } from "./character-card";
import { characters, characterById } from "@/lib/characters";
import { GROUP_COLORS, type PuzzleInput } from "@/lib/puzzle-types";

type BuilderGroup = { label: string; characterIds: number[] };
const emptyGroups = (): BuilderGroup[] => Array.from({ length: 4 }, () => ({ label: "", characterIds: [] }));

export function PuzzleBuilder({ initial, slug, manageToken }: { initial?: PuzzleInput; slug?: string; manageToken?: string }) {
  const managing = Boolean(slug && manageToken);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [groups, setGroups] = useState<BuilderGroup[]>(initial?.groups ?? emptyGroups());
  const [activeGroup, setActiveGroup] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<{ publicUrl: string; manageUrl: string } | null>(null);

  useEffect(() => {
    if (managing || initial) return;
    try {
      const saved = localStorage.getItem("multiverse-match-draft");
      if (!saved) return;
      const draft = JSON.parse(saved) as PuzzleInput;
      setTitle(draft.title ?? "");
      if (draft.groups?.length === 4) setGroups(draft.groups);
    } catch { /* Ignore an invalid local draft. */ }
  }, [initial, managing]);

  useEffect(() => {
    if (!managing) localStorage.setItem("multiverse-match-draft", JSON.stringify({ title, groups }));
  }, [groups, managing, title]);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool?: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = modelContext.registerTool({
      name: "stage_marvel_connections_puzzle",
      title: "Stage a Marvel connections puzzle",
      description: "Fill the visible puzzle editor with a title, four category labels, and four Marvel character IDs per group. This stages a draft only and never publishes it.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          groups: { type: "array", minItems: 4, maxItems: 4, items: { type: "object", properties: { label: { type: "string" }, characterIds: { type: "array", minItems: 4, maxItems: 4, items: { type: "integer" } } }, required: ["label", "characterIds"], additionalProperties: false } },
        },
        required: ["title", "groups"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const staged = input as PuzzleInput;
        if (!staged || typeof staged.title !== "string" || !Array.isArray(staged.groups) || staged.groups.length !== 4) throw new Error("Provide a title and exactly four groups.");
        const ids = staged.groups.flatMap((group) => group.characterIds);
        if (ids.length !== 16 || new Set(ids).size !== 16 || ids.some((id) => !characterById.has(id))) throw new Error("Use sixteen different character IDs from the visible catalog.");
        setTitle(staged.title);
        setGroups(staged.groups);
        setStatus("Draft staged. Review it before publishing.");
        return { staged: true, title: staged.title, groups: staged.groups.length };
      },
    }, { signal: lifecycle.signal });
    void Promise.resolve(registration).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const used = useMemo(() => new Set(groups.flatMap((group) => group.characterIds)), [groups]);
  const filtered = characters.filter((character) => `${character.name} ${character.realName}`.toLowerCase().includes(query.toLowerCase()));
  const complete = title.trim().length >= 3 && groups.every((group) => group.label.trim().length >= 1 && group.characterIds.length === 4);

  function addCharacter(id: number) {
    if (used.has(id)) return;
    setGroups((current) => current.map((group, index) => index === activeGroup && group.characterIds.length < 4 ? { ...group, characterIds: [...group.characterIds, id] } : group));
  }

  function removeCharacter(groupIndex: number, id: number) {
    setGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, characterIds: group.characterIds.filter((item) => item !== id) } : group));
  }

  async function save() {
    if (!complete) return;
    setBusy(true);
    setStatus(managing ? "Saving changes…" : "Publishing your puzzle…");
    try {
      const response = await fetch(managing ? `/api/puzzles/${slug}` : "/api/puzzles", {
        method: managing ? "PUT" : "POST",
        headers: { "content-type": "application/json", ...(managing ? { "x-manage-token": manageToken! } : {}) },
        body: JSON.stringify({ title, groups }),
      });
      const data = await response.json() as { error?: string; slug?: string; manageToken?: string };
      if (!response.ok) throw new Error(data.error ?? "The puzzle could not be saved.");
      if (managing) setStatus("Changes saved.");
      else {
        const publicUrl = `${location.origin}/p/${data.slug}`;
        const manageUrl = `${location.origin}/manage/${data.slug}#token=${data.manageToken}`;
        setPublished({ publicUrl, manageUrl });
        localStorage.removeItem("multiverse-match-draft");
        const owned = JSON.parse(localStorage.getItem("multiverse-match-owned") ?? "[]") as string[];
        localStorage.setItem("multiverse-match-owned", JSON.stringify([...new Set([...owned, manageUrl])]));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The puzzle could not be saved.");
    } finally { setBusy(false); }
  }

  async function removePuzzle() {
    setBusy(true);
    const response = await fetch(`/api/puzzles/${slug}`, { method: "DELETE", headers: { "x-manage-token": manageToken! } });
    if (response.ok) location.assign("/");
    else { const data = await response.json() as { error?: string }; setStatus(data.error ?? "The puzzle could not be deleted."); setBusy(false); }
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setStatus(`${label} copied.`);
  }

  if (published) return (
    <section className="success-panel">
      <span className="success-icon"><Check /></span>
      <p className="eyebrow">Puzzle published</p>
      <h1>Your connection is live.</h1>
      <p>Share the play link with anyone. Keep the private management link somewhere safe—it cannot be recovered.</p>
      <div className="link-box"><div><span>Play link</span><strong>{published.publicUrl}</strong></div><Button onClick={() => copy(published.publicUrl, "Play link")}><Copy /> Copy</Button></div>
      <div className="link-box private"><div><span>Private management link</span><strong>{published.manageUrl}</strong></div><Button variant="outline" onClick={() => copy(published.manageUrl, "Management link")}><Copy /> Copy</Button></div>
      <Button asChild size="lg"><Link href={published.publicUrl}><ExternalLink /> Play your puzzle</Link></Button>
    </section>
  );

  return (
    <div className="builder-layout">
      <section className="builder-main">
        <div className="builder-heading"><p className="eyebrow">{managing ? "Private editor" : "No account needed"}</p><h1>{managing ? "Edit your puzzle" : "Create a picture puzzle"}</h1><p>Give each group a connection, then fill it with four characters.</p></div>
        <label className="field-label">Puzzle title<Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="e.g. Secret identities" /><span className="field-hint">Use at least 3 characters for the title. Group labels can be a single character.</span></label>
        <div className="group-editor-list">
          {groups.map((group, groupIndex) => <section key={groupIndex} className={`group-editor ${activeGroup === groupIndex ? "active" : ""}`} style={{ "--group-color": GROUP_COLORS[groupIndex] } as CSSProperties} onClick={() => setActiveGroup(groupIndex)}>
            <div className="group-number">{groupIndex + 1}</div>
            <Input aria-label={`Group ${groupIndex + 1} connection`} value={group.label} onChange={(event) => setGroups((current) => current.map((item, index) => index === groupIndex ? { ...item, label: event.target.value } : item))} placeholder="Name the connection" maxLength={60} />
            <div className="group-slots">
              {Array.from({ length: 4 }, (_, slot) => {
                const id = group.characterIds[slot];
                const character = id ? characterById.get(id) : null;
                return character ? <div className="builder-character" key={id}><CharacterCard character={character} compact /><button type="button" onClick={(event) => { event.stopPropagation(); removeCharacter(groupIndex, id); }} aria-label={`Remove ${character.name}`}><X /></button></div> : <div className="empty-slot" key={slot}>+</div>;
              })}
            </div>
          </section>)}
        </div>
        <div className="builder-footer">
          <p role="status">{status || `${used.size} of 16 portraits chosen`}</p>
          <div className="builder-buttons">
            {managing && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 /> Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this puzzle?</AlertDialogTitle><AlertDialogDescription>The play link will stop working. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep puzzle</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={removePuzzle}>Delete permanently</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
            <Button size="lg" disabled={!complete || busy} onClick={save}>{busy ? "Saving…" : managing ? "Save changes" : "Publish & get link"}</Button>
          </div>
        </div>
      </section>

      <aside className="catalog-panel">
        <div className="catalog-heading"><div><span>Adding to group {activeGroup + 1}</span><strong>{groups[activeGroup].label || "Untitled connection"}</strong></div><span>{groups[activeGroup].characterIds.length}/4</span></div>
        <label className="search-box"><Search aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search heroes or identities" aria-label="Search characters" /></label>
        <div className="catalog-grid">
          {filtered.map((character) => <CharacterCard key={character.id} character={character} compact disabled={used.has(character.id) || groups[activeGroup].characterIds.length >= 4} onClick={() => addCharacter(character.id)} />)}
        </div>
      </aside>
    </div>
  );
}
