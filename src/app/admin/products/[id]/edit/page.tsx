"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import type { Category, Brand, OlfactiveFamily, Product } from "@/types";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-cream border border-border focus:border-gold text-charcoal font-body text-sm outline-none transition-colors placeholder:text-charcoal-muted/40";


type ImageItem = {
  id: string;
  url: string;
  file?: File;
};

function generateSlug(name: string): string {
  return name
    .normalize("NFD")                        // descomponer tildes: á → a + ́
    .replace(/[\u0300-\u036f]/g, "")          // quitar marcas diacríticas
    .replace(/ñ/gi, "n")                     // ñ → n
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")           // quitar caracteres no válidos
    .replace(/[\s_]+/g, "-")                 // espacios/guiones bajos → guión
    .replace(/-+/g, "-")                     // colapsar guiones múltiples
    .replace(/^-+|-+$/g, "");               // quitar guiones al inicio/final
}



function FamilySelector({ options, selected, onChange }: { options: OlfactiveFamily[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {options.map((f) => {
        const isSelected = selected.includes(f.name);
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              if (isSelected) onChange(selected.filter(s => s !== f.name));
              else onChange([...selected, f.name]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-body transition-colors border ${
              isSelected 
                ? "bg-charcoal text-white border-charcoal" 
                : "bg-cream text-charcoal-muted border-border hover:border-charcoal hover:text-charcoal"
            }`}
          >
            {f.name}
          </button>
        )
      })}
    </div>
  );
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [families, setFamilies] = useState<OlfactiveFamily[]>([]);

  
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach(img => {
        if (img.file) URL.revokeObjectURL(img.url);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: 0, wholesale_price: 0, compare_price: 0, cost_price: 0,
    category_id: "", brand_id: "", gender: "unisex" as "women" | "men" | "unisex",
    concentration: "edp" as "parfum" | "edp" | "edt" | "edc" | "splash",
    stock: 0, olfactive_family: [] as string[], is_featured: false, is_active: true,
  });

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("products").select("*, category:categories(*), brand:brands(*)").eq("id", id).single(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
      supabase.from("olfactive_families").select("*").order("name"),
    ]).then(([{ data: p }, { data: c }, { data: b }, { data: f }]) => {
      if (p) {
        const product = p as Product;
        setForm({
          name: product.name || "",
          slug: product.slug || "",
          description: product.description || "",
          price: product.price || 0,
          wholesale_price: product.wholesale_price || 0,
          compare_price: product.compare_price || 0,
          cost_price: product.cost_price || 0,
          category_id: product.category_id || "",
          brand_id: product.brand_id || "",
          gender: product.gender || "unisex",
          concentration: product.concentration || "edp",
          stock: product.stock || 0,
          olfactive_family: product.olfactive_family || [],
          is_featured: product.is_featured || false,
          is_active: product.is_active !== false,
        });

        
        const initialImages = (product.images || []).map((url) => ({
          id: Math.random().toString(36).substring(2),
          url,
        }));
        setSelectedImages(initialImages);
      }
      setCategories((c as Category[]) || []);
      setBrands((b as Brand[]) || []);
      setFamilies((f as OlfactiveFamily[]) || []);
      setLoading(false);
    });
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(2),
        url: URL.createObjectURL(file),
        file
      }));
      setSelectedImages(prev => [...prev, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      const toRemove = prev[index];
      if (toRemove.file) {
        URL.revokeObjectURL(toRemove.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if ((direction === 'left' && index === 0) || (direction === 'right' && index === selectedImages.length - 1)) return;
    setSelectedImages(prev => {
      const next = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    
    try {
      const finalImageUrls: string[] = [];
      
      for (const item of selectedImages) {
        if (item.file) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('products')
            .upload(fileName, item.file);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(data.path);
            
          finalImageUrls.push(publicUrl);
        } else {
          finalImageUrls.push(item.url);
        }
      }

      const payload = {
      ...form,
      price: Number(form.price),
      wholesale_price: Number(form.wholesale_price) || null,
      compare_price: Number(form.compare_price) || null,
      cost_price: Number(form.cost_price) || null,
      stock: Number(form.stock),
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      olfactive_family: form.olfactive_family.length > 0 ? form.olfactive_family : null,
      images: finalImageUrls,

    };
    
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) throw error;
      toast.success("Producto actualizado");
      router.push("/admin/products");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-8 w-32 bg-cream rounded-lg animate-pulse" />
        <div className="h-96 bg-cream rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-charcoal-muted hover:text-charcoal font-body text-sm transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a Productos
      </Link>

      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
        <h1 className="font-display text-2xl text-charcoal mb-6">Editar Producto</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">Nombre *</label>
              <input
                className={inputClass}
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-charcoal-muted mb-1.5">
                Slug
                <span className="ml-2 text-[10px] font-normal text-charcoal-muted/60 normal-case tracking-normal">⚡ generado automáticamente</span>
              </label>
              <input
                className="w-full px-3 py-2.5 rounded-xl bg-cream/60 border border-border text-charcoal-muted font-body text-sm outline-none cursor-default select-all"
                readOnly
                value={form.slug}
                placeholder="se genera desde el nombre"
                title="El slug se genera automáticamente desde el nombre"
              />
            </div>
          </div>
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">Descripción</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descripción del producto..." />
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio COP *</label><input className={inputClass} type="number" required min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio Mayorista</label><input className={inputClass} type="number" min={0} value={form.wholesale_price} onChange={(e) => setForm((f) => ({ ...f, wholesale_price: Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio comparar</label><input className={inputClass} type="number" min={0} value={form.compare_price} onChange={(e) => setForm((f) => ({ ...f, compare_price: Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Precio de Costo</label><input className={inputClass} type="number" min={0} value={form.cost_price} onChange={(e) => setForm((f) => ({ ...f, cost_price: Number(e.target.value) }))} /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Stock</label><input className={inputClass} type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Categoría</label><SearchableSelect options={[{value: "", label: "Sin categoría"}, ...categories.map(c => ({value: c.id, label: c.name}))]} value={form.category_id} onChange={(v) => setForm((f) => ({ ...f, category_id: v }))} placeholder="Selecciona categoría" /></div>
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Marca</label><SearchableSelect options={[{value: "", label: "Sin marca"}, ...brands.map(b => ({value: b.id, label: b.name}))]} value={form.brand_id} onChange={(v) => setForm((f) => ({ ...f, brand_id: v }))} placeholder="Selecciona marca" /></div>
          </div>
          <div>
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">Familias Olfativas</label>
            <FamilySelector options={families} selected={form.olfactive_family} onChange={(v) => setForm(f => ({ ...f, olfactive_family: v }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Género</label><SearchableSelect options={[{value: "women", label: "Mujer"}, {value: "men", label: "Hombre"}, {value: "unisex", label: "Unisex"}]} value={form.gender} onChange={(v) => setForm((f) => ({ ...f, gender: v as "women" | "men" | "unisex" }))} placeholder="Selecciona género" /></div>
            {/* <div><label className="block font-body text-xs text-charcoal-muted mb-1.5">Concentración</label><SearchableSelect options={[{value: "parfum", label: "Parfum"}, {value: "edp", label: "EDP"}, {value: "edt", label: "EDT"}, {value: "edc", label: "EDC"}, {value: "splash", label: "Splash"}]} value={form.concentration} onChange={(v) => setForm((f) => ({ ...f, concentration: v as "parfum" | "edp" | "edt" | "edc" | "splash" }))} placeholder="Selecciona concentración" /></div> */}
          </div>
          
          {/* Image Upload Component */}
          <div className="pt-2">
            <label className="block font-body text-xs text-charcoal-muted mb-1.5">Imágenes del Producto</label>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-white border border-border hover:border-gold hover:text-gold text-charcoal font-body text-sm transition-colors shadow-sm inline-flex items-center gap-2"
              >
                Seleccionar imágenes
              </button>

              {selectedImages.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-2">
                  {selectedImages.map((item, idx) => (
                    <div key={item.id} className="relative w-24 h-24 rounded-xl overflow-hidden group border border-border bg-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 'left')}
                            className="p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                        {idx < selectedImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 'right')}
                            className="p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-charcoal/60 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.is_active ? "bg-charcoal border-charcoal" : "border-border"}`} onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}>
                {form.is_active && <svg viewBox="0 0 12 9" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4l3.5 3.5L11 1" /></svg>}
              </div>
              <span className="font-body text-sm text-charcoal-muted">Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.is_featured ? "bg-gold border-gold" : "border-border"}`} onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}>
                {form.is_featured && <svg viewBox="0 0 12 9" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4l3.5 3.5L11 1" /></svg>}
              </div>
              <span className="font-body text-sm text-charcoal-muted">Destacado</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/admin/products" className="flex-1 py-3 rounded-xl bg-cream border border-border font-body text-sm text-charcoal-muted hover:text-charcoal transition-colors shadow-sm text-center">Cancelar</Link>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-charcoal hover:bg-gold text-white font-body font-semibold text-sm transition-all shadow-sm disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Guardando imágenes..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
