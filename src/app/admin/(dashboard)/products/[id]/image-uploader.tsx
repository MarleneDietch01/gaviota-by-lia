'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export function ImageUploader({ action }: { action: (data: FormData) => void | Promise<void> }) {
  const [url,setUrl]=useState<string>(); const [hover,setHover]=useState(false); const [role,setRole]=useState('main');
  useEffect(()=>()=>{if(url) URL.revokeObjectURL(url)},[url]);
  return <form action={action} className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Uso<select name="imageRole" value={role} onChange={e=>setRole(e.target.value)} className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3"><option value="main">Principal</option><option value="hover">Hover / lifestyle</option><option value="gallery">Galería</option></select></label><label className="text-sm font-medium">Idioma<select name="locale" className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3"><option value="all">Ambos idiomas</option><option value="es">Español</option><option value="en">Inglés</option></select></label></div>
    <label className="block text-sm font-medium">Archivo<input type="file" name="image" required accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const f=e.target.files?.[0];if(url)URL.revokeObjectURL(url);setUrl(f?URL.createObjectURL(f):undefined)}} className="mt-1 block w-full"/></label>
    <label className="block text-sm font-medium">Texto alternativo<input name="altText" required className="mt-1 min-h-10 w-full rounded-xs border border-line-strong bg-white-warm px-3"/></label>
    {url?<div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} className="relative aspect-square w-44 overflow-hidden rounded-sm border border-line bg-ivory"><Image src={url} alt="Vista previa local" fill unoptimized className={`object-contain transition-opacity ${role==='hover'&&!hover?'opacity-40':'opacity-100'}`}/><span className="absolute bottom-2 left-2 rounded bg-ink/80 px-2 py-1 text-xs text-white">{role==='hover'?'Pasa el cursor para comprobar hover':'Vista previa'}</span></div>:null}
    <button className="min-h-10 rounded-xs bg-rose px-5 text-sm font-semibold text-white-warm hover:bg-rose-deep">Subir imagen</button>
  </form>;
}
