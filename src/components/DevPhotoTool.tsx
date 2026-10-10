import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, ArrowUpToLine, Copy, ImagePlus, RotateCcw, Trash2, X } from 'lucide-react';
import ADDED from '../data/addedPhotos.json';
import HIDDEN from '../data/hiddenPhotos.json';
import { refreshDevPhotos, useDevToolState } from '../utils/devPhotos';

type Photo = { src: string; alt: string };

/** TEMPORARY DEVELOPER TOOL (development only; see scripts/dev-photo-tool.ts), for one carousel:
    add photographs, put one at any place (first, or a position typed in), delete one (an added
    photograph's file is deleted; any other is hidden from this carousel and can be restored), and
    remove duplicates. `onShow` lets it keep the photograph in view in view after a move. Loaded
    lazily and only under `npm run dev`, so none of it ships. */
export default function DevPhotoTool({ id, label, photos, current, onShow }: { id: string; label: string; photos: Photo[]; current?: Photo; onShow?: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState('');
  const [note, setNote] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const count = names.length;
  const files = useRef<HTMLInputElement>(null);
  const { added, hidden } = useDevToolState(id, {
    added: (ADDED as Record<string, Photo[]>)[id] ?? [],
    hidden: (HIDDEN as Record<string, string[]>)[id] ?? [],
  });
  const isAdded = (src: string) => added.some(photo => photo.src === src);
  /* opening the panel reads the tool's files afresh, so changes made in another tab show here too */
  useEffect(() => { if (open) refreshDevPhotos(); }, [open]);
  /* the position box in the bar follows the photograph in view */
  const at = current ? photos.findIndex(photo => photo.src === current.src) + 1 : 0;
  const [place, setPlace] = useState(String(at));
  useEffect(() => setPlace(String(at)), [at, current?.src]);
  const wanted = Number(place);
  const canMove = Number.isInteger(wanted) && wanted >= 1 && wanted <= photos.length && wanted !== at;

  const read = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const call = async (method: 'POST' | 'DELETE' | 'PUT', payload: object) => {
    const response = await fetch('/__dev/photos', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...payload }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error ?? `HTTP ${response.status}`), { data });
    return data;
  };
  const act = async (work: () => Promise<string>) => {
    setBusy(true); setNote('');
    try { setNote(await work()); } catch (error) { setNote((error as Error).message); }
    await refreshDevPhotos();
    setBusy(false);
  };

  const upload = () => act(async () => {
    const chosen = [...(files.current?.files ?? [])];
    if (!chosen.length) return 'Choose one or more photos first.';
    let done = 0, same = 0;
    for (const file of chosen) {
      const description = alt.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      try { await call('POST', { alt: description, dataUrl: await read(file) }); done++; }
      catch (error) { if ((error as { data?: { duplicate?: string } }).data?.duplicate) same++; else throw error; }
    }
    setAlt(''); setNames([]);
    if (files.current) files.current.value = '';
    return `${done} added${same ? `, ${same} skipped as already in this carousel` : ''}.`;
  });
  const remove = (photo: Photo) => {
    const message = isAdded(photo.src)
      ? 'Delete this photo? It was added with this tool, so its file is deleted too.'
      : 'Remove this photo from this carousel? It is hidden here only (the file stays) and can be restored from this panel.';
    if (!window.confirm(message)) return;
    act(async () => { await call('DELETE', { src: photo.src }); return isAdded(photo.src) ? 'Deleted.' : 'Hidden from this carousel.'; });
  };
  /** Puts a photograph at a place in the carousel (1 = first), the others keeping their order around it. */
  const move = async (photo: Photo, to: number) => {
    const srcs = photos.map(other => other.src);
    const from = srcs.indexOf(photo.src);
    const position = Math.min(Math.max(Math.round(to), 1), srcs.length);
    if (busy || from < 0 || !Number.isFinite(to) || position === from + 1) return;
    const rest = srcs.filter(src => src !== photo.src);
    const next = [...rest.slice(0, position - 1), photo.src, ...rest.slice(position - 1)];
    const inView = current?.src;
    let moved = false;
    await act(async () => {
      await call('POST', { action: 'position', src: photo.src, position, srcs });
      moved = true;
      return position === 1 ? 'Now the first photo of this carousel.' : `Moved to position ${position} of ${srcs.length}.`;
    });
    /* the carousel keeps the same photograph in view, at its new place */
    if (moved && inView && onShow) onShow(next.indexOf(inView));
  };
  const first = (photo: Photo) => move(photo, 1);
  const dedupe = () => act(async () => {
    const { removed } = await call('POST', { action: 'dedupe' });
    return removed.length ? `${removed.length} duplicate photo${removed.length === 1 ? '' : 's'} removed.` : 'No duplicates among the added photos.';
  });
  const restore = (src: string) => act(async () => {
    await call('PUT', { src });
    /* a restored photograph rejoins its carousel from the page's own data, so read it again */
    window.setTimeout(() => window.location.reload(), 300);
    return 'Restored — reloading the page…';
  });

  return (
    <div className="dev-photo-tool" data-open={open}>
      <div className="dev-photo-bar">
        {current && <>
          <button type="button" className="dev-photo-chip" onClick={() => first(current)} disabled={busy || photos[0]?.src === current.src} title="Make the photo in view the first of this carousel"><ArrowUpToLine size={13} aria-hidden="true" />Make first</button>
          {photos.length > 1 && <form className="dev-photo-chip dev-photo-move" onSubmit={event => { event.preventDefault(); if (canMove) move(current, wanted); }} title="Move the photo in view to another position in this carousel">
            <ArrowLeftRight size={13} aria-hidden="true" />
            <label>Position <input type="number" inputMode="numeric" min={1} max={photos.length} value={place} onChange={event => setPlace(event.target.value)}
              onFocus={event => event.currentTarget.select()} onKeyDown={event => { if (event.key === 'Escape') setPlace(String(at)); }}
              aria-label={`Position of the photo in view, 1 to ${photos.length}`} /></label>
            <span>/ {photos.length}</span>
            <button type="submit" disabled={busy || !canMove}>Move</button>
          </form>}
          <button type="button" className="dev-photo-chip dev-photo-danger" onClick={() => remove(current)} disabled={busy} title="Delete the photo in view"><Trash2 size={13} aria-hidden="true" />Delete</button>
        </>}
        <button type="button" className="dev-photo-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          {open ? <X size={14} aria-hidden="true" /> : <ImagePlus size={14} aria-hidden="true" />}{open ? 'Close' : 'Photos'}<small>dev</small>
        </button>
      </div>
      {note && !open && <p className="dev-photo-toast" role="status">{note}</p>}
      {open && (
        <div className="dev-photo-panel" role="dialog" aria-label={`Manage the photos of ${label}`}>
          <p className="dev-photo-title"><strong>{label}</strong><span>{photos.length} in this carousel · {added.length} added · {hidden.length} hidden</span></p>
          <div className="dev-photo-field">
            <span>Add photos (JPEG, PNG or WebP)</span>
            <div className="dev-photo-pick">
              <button type="button" className="dev-photo-choose" onClick={() => files.current?.click()} disabled={busy}><ImagePlus size={14} aria-hidden="true" />{names.length ? 'Choose again' : 'Choose photos'}</button>
              <small title={names.join('\n')}>{names.length === 1 ? names[0] : names.length ? `${names.length} photos chosen` : 'None chosen yet'}</small>
            </div>
            <input ref={files} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => setNames([...(event.target.files ?? [])].map(file => file.name))} />
          </div>
          <label className="dev-photo-field">
            <span>What is happening in the photo{count > 1 ? 's' : ''}</span>
            <input type="text" value={alt} onChange={event => setAlt(event.target.value)} placeholder="e.g. Volunteers planting saplings in Solapur, August 2026" />
          </label>
          <div className="dev-photo-actions">
            <button type="button" className="dev-photo-add" onClick={upload} disabled={busy}>{busy ? 'Working…' : count > 1 ? `Add ${count} photos` : 'Add to carousel'}</button>
            <button type="button" className="dev-photo-secondary" onClick={dedupe} disabled={busy || !added.length}><Copy size={13} aria-hidden="true" />Remove duplicate photos</button>
          </div>
          {note && <p className="dev-photo-note" role="status">{note}</p>}
          <p className="dev-photo-heading">Photos in this carousel, in order <span>· type a number on a photo and press Enter to move it there</span></p>
          <ol className="dev-photo-grid">
            {photos.map((photo, index) => (
              <li key={photo.src} data-current={photo.src === current?.src || undefined}>
                <img src={photo.src} alt="" loading="lazy" />
                <input key={`${photo.src}@${index}`} className="dev-photo-index" type="number" inputMode="numeric" min={1} max={photos.length} defaultValue={index + 1}
                  title="Type a position and press Enter to move this photo there" aria-label={`Position of photo ${index + 1}, 1 to ${photos.length}`}
                  onFocus={event => event.currentTarget.select()}
                  onKeyDown={event => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                    if (event.key === 'Escape') { event.currentTarget.value = String(index + 1); event.currentTarget.blur(); }
                  }}
                  onBlur={event => {
                    const to = Number(event.currentTarget.value);
                    if (Number.isInteger(to) && to >= 1 && to !== index + 1 && !busy) move(photo, to);
                    else event.currentTarget.value = String(index + 1);
                  }} />
                {isAdded(photo.src) && <span className="dev-photo-badge">added</span>}
                <span className="dev-photo-tools">
                  <button type="button" onClick={() => first(photo)} disabled={busy || index === 0} aria-label={`Make photo ${index + 1} first`} title="Make first"><ArrowUpToLine size={12} aria-hidden="true" /></button>
                  <button type="button" className="dev-photo-danger" onClick={() => remove(photo)} disabled={busy} aria-label={`Delete photo ${index + 1}`} title="Delete"><Trash2 size={12} aria-hidden="true" /></button>
                </span>
                <small title={photo.alt}>{photo.alt || photo.src.split('/').pop()}</small>
              </li>
            ))}
          </ol>
          {hidden.length > 0 && <>
            <p className="dev-photo-heading">Hidden from this carousel</p>
            <ul className="dev-photo-list">
              {hidden.map(src => (
                <li key={src}><img src={src} alt="" loading="lazy" /><span>{src.split('/').pop()}</span>
                  <button type="button" onClick={() => restore(src)} disabled={busy} aria-label="Restore this photo"><RotateCcw size={13} aria-hidden="true" /></button></li>
              ))}
            </ul>
          </>}
          <p className="dev-photo-foot">Changes are saved to <code>src/data/addedPhotos.json</code>, <code>hiddenPhotos.json</code> and <code>photoOrder.json</code> (images in <code>public/images/added/</code>). Commit them to keep them.</p>
        </div>
      )}
      <style>{`
        .dev-photo-tool { position: absolute; top: 12px; right: 12px; z-index: 30; display: grid; justify-items: end; gap: 6px; font: 500 12px/1.4 system-ui, sans-serif; color: #10231f; }
        .dev-photo-bar { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
        .dev-photo-toggle, .dev-photo-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border: 1px dashed #f59e0b; border-radius: 999px; background: #fffbeb; color: #92400e; font: 600 12px/1 system-ui, sans-serif; cursor: pointer; box-shadow: 0 6px 16px -8px rgb(0 0 0 / .4); }
        .dev-photo-chip:disabled { opacity: .5; cursor: default; }
        .dev-photo-danger { color: #b91c1c !important; border-color: #fca5a5 !important; background: #fff1f2 !important; }
        .dev-photo-move { padding: 4px 4px 4px 11px; cursor: default; }
        .dev-photo-move label { display: inline-flex; align-items: center; gap: 5px; }
        .dev-photo-move input { width: 4.4ch; padding: 4px 3px; border: 1px solid #fcd34d; border-radius: 7px; background: #fff; color: #10231f; font: 600 12px/1 system-ui, sans-serif; text-align: center; }
        .dev-photo-move input:focus { outline: 2px solid #f59e0b; outline-offset: 0; }
        .dev-photo-move span { color: #b45309; font-weight: 500; }
        .dev-photo-move button { padding: 5px 10px; border: 0; border-radius: 999px; background: #f59e0b; color: #fff; font: 700 11.5px/1 system-ui, sans-serif; cursor: pointer; }
        .dev-photo-move button:disabled { opacity: .45; cursor: default; }
        .dev-photo-tool input[type='number'] { -moz-appearance: textfield; appearance: textfield; }
        .dev-photo-tool input[type='number']::-webkit-inner-spin-button, .dev-photo-tool input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .dev-photo-toggle small { padding: 2px 5px; border-radius: 6px; background: #f59e0b; color: #fff; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
        .dev-photo-toast { margin: 0; max-width: 260px; padding: 6px 10px; border-radius: 8px; background: #ecfdf5; color: #065f46; font-size: 11px; box-shadow: 0 6px 16px -8px rgb(0 0 0 / .4); }
        .dev-photo-panel { width: min(400px, 88vw); max-height: min(72vh, 620px); overflow: auto; padding: 14px; border-radius: 14px; background: #fff; border: 1px solid #fcd34d; box-shadow: 0 20px 40px -18px rgb(0 0 0 / .45); display: grid; gap: 10px; }
        .dev-photo-title { display: grid; gap: 2px; margin: 0; } .dev-photo-title span { color: #6b7280; font-size: 11px; }
        .dev-photo-field { display: grid; gap: 4px; } .dev-photo-field span { font-weight: 600; font-size: 11px; color: #374151; }
        .dev-photo-field input[type='text'] { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; }
        .dev-photo-pick { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .dev-photo-choose { display: inline-flex; flex: none; align-items: center; gap: 7px; padding: 9px 13px; border: 1px solid #0f766e; border-radius: 9px; background: #f0fdfa; color: #0f766e; font: 600 12px/1 system-ui, sans-serif; cursor: pointer; }
        .dev-photo-choose:hover:not(:disabled) { background: #ccfbf1; } .dev-photo-choose:disabled { opacity: .5; cursor: default; }
        .dev-photo-pick small { min-width: 0; overflow: hidden; color: #6b7280; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
        .dev-photo-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .dev-photo-add { padding: 9px 12px; border: 0; border-radius: 9px; background: #0f766e; color: #fff; font: 600 12px/1 system-ui, sans-serif; cursor: pointer; } .dev-photo-add:disabled { opacity: .6; cursor: progress; }
        .dev-photo-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 11px; border: 1px solid #d1d5db; border-radius: 9px; background: #fff; color: #374151; font: 600 11.5px/1 system-ui, sans-serif; cursor: pointer; } .dev-photo-secondary:disabled { opacity: .5; cursor: default; }
        .dev-photo-note { margin: 0; padding: 7px 9px; border-radius: 8px; background: #ecfdf5; color: #065f46; font-size: 11px; }
        .dev-photo-heading { margin: 4px 0 0; font-weight: 700; font-size: 11px; color: #374151; } .dev-photo-heading span { font-weight: 500; color: #6b7280; }
        .dev-photo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
        .dev-photo-grid li { position: relative; display: grid; gap: 3px; }
        .dev-photo-grid li[data-current] img { outline: 3px solid #0f766e; outline-offset: 1px; }
        .dev-photo-grid img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 7px; background: #f3f4f6; }
        .dev-photo-grid small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: #6b7280; }
        .dev-photo-index { position: absolute; top: 4px; left: 4px; width: 4.2ch; padding: 2px 3px; border: 0; border-radius: 6px; background: #111827cc; color: #fff; font: 600 10.5px/1.2 system-ui, sans-serif; text-align: center; cursor: text; }
        .dev-photo-index:hover, .dev-photo-index:focus { outline: 2px solid #f59e0b; outline-offset: 0; background: #111827; }
        .dev-photo-badge { position: absolute; top: 4px; right: 4px; padding: 1px 5px; border-radius: 6px; background: #f59e0b; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
        .dev-photo-tools { position: absolute; left: 4px; right: 4px; top: calc(100% - 46px); display: flex; justify-content: space-between; }
        .dev-photo-tools button { display: grid; place-items: center; width: 24px; height: 24px; border: 1px solid #d1d5db; border-radius: 7px; background: #fffffff0; color: #0f766e; cursor: pointer; }
        .dev-photo-tools button:disabled { opacity: .35; cursor: default; }
        .dev-photo-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
        .dev-photo-list li { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 8px; } .dev-photo-list img { width: 44px; height: 33px; object-fit: cover; border-radius: 5px; }
        .dev-photo-list span { font-size: 11px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dev-photo-list button { display: grid; place-items: center; width: 26px; height: 26px; border: 1px solid #bbf7d0; border-radius: 7px; background: #f0fdf4; color: #15803d; cursor: pointer; }
        .dev-photo-foot { margin: 0; color: #6b7280; font-size: 10.5px; } .dev-photo-foot code { font-size: 10px; }
      `}</style>
    </div>
  );
}
