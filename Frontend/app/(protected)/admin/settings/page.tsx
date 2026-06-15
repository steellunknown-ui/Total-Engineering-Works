'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2, DollarSign, Zap, Layers, Paintbrush, ClipboardList,
  Save, Plus, Trash2, Edit2, Check, X, Loader2, Upload, ToggleLeft, ToggleRight
} from 'lucide-react'
import {
  getSettings, updateSettings, getSettingsAudit,
  getMaterials, createMaterial, updateMaterial, deleteMaterial,
  addThickness, updateThickness, deleteThickness,
  getRateBands, createRateBand, updateRateBand, deleteRateBand,
  getSurfaceFinishes, createSurfaceFinish, updateSurfaceFinish, deleteSurfaceFinish,
  MaterialData, RateBandData, SurfaceFinishData, SettingsMap,
} from '@/lib/api'

// ── Small helpers ──────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

type Tab = 'company' | 'pricing' | 'rates' | 'materials' | 'surface' | 'audit'

function TabBtn({ id, label, icon: Icon, active, onClick }: { id: Tab; label: string; icon: any; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
        active ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-xl animate-fade-up ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <Check size={16} /> : <X size={16} />}
      {msg}
    </div>
  )
}

// ── Tab 1 — Company Profile ────────────────────────────────────────────────────

function CompanyTab({ settings, onChange, onSave, saving }: {
  settings: SettingsMap; onChange: (k: string, v: string | number) => void; onSave: () => void; saving: boolean
}) {
  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={String(settings[key] ?? '')}
        placeholder={placeholder}
        onChange={e => onChange(key, e.target.value)}
        className="w-full h-10 px-3 bg-bg-surface border border-border-default rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none transition-colors"
      />
    </div>
  )

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${BASE_URL}/api/admin/settings/logo`, {
        method: 'POST', body: formData, credentials: 'include'
      })
      if (res.ok) {
        const { url } = await res.json()
        onChange('company_logo_url', url)
      }
    } catch {
      // Logo upload handled gracefully — URL can be set manually
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {field('Company Name', 'company_name', 'text', 'Total Engineering Works')}
        {field('GST Number', 'company_gst', 'text', '27XXXXX1234Z5')}
        {field('Phone', 'company_phone', 'tel', '+91 9545 450 786')}
        {field('Email', 'company_email', 'email', 'rfq@example.com')}
        {field('Website', 'company_website', 'url', 'www.example.com')}
        {field('Quote Validity (days)', 'quote_validity_days', 'number', '30')}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Address</label>
        <textarea
          value={String(settings['company_address'] ?? '')}
          onChange={e => onChange('company_address', e.target.value)}
          rows={2}
          placeholder="B-79 Ambad, MIDC, Nasik"
          className="w-full px-3 py-2 bg-bg-surface border border-border-default rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none transition-colors resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Terms & Conditions</label>
        <textarea
          value={String(settings['terms_and_conditions'] ?? '')}
          onChange={e => onChange('terms_and_conditions', e.target.value)}
          rows={5}
          placeholder="Enter standard terms and conditions for all quotes..."
          className="w-full px-3 py-2 bg-bg-surface border border-border-default rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Company Logo</label>
        <div className="flex items-center gap-4">
          {settings['company_logo_url'] && (
            <img src={String(settings['company_logo_url'])} alt="Logo" className="h-12 w-auto rounded border border-border-default bg-white p-1" />
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-default text-text-secondary text-sm rounded cursor-pointer hover:border-accent-primary hover:text-text-primary transition-colors">
            <Upload size={14} />
            Upload Logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
          {settings['company_logo_url'] && (
            <input
              value={String(settings['company_logo_url'])}
              onChange={e => onChange('company_logo_url', e.target.value)}
              placeholder="or paste URL"
              className="flex-1 h-9 px-3 bg-bg-surface border border-border-default rounded text-xs text-text-muted focus:border-accent-primary focus:outline-none"
            />
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-border-hairline flex justify-end">
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-white text-sm font-semibold rounded hover:bg-accent-primary-hover disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save Company Profile'}
        </button>
      </div>
    </div>
  )
}

// ── Tab 2 — Material Pricing (Rate Bands) ─────────────────────────────────────

function PricingTab() {
  const [bands, setBands] = useState<RateBandData[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<RateBandData>>({})
  const [saving, setSaving] = useState(false)
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [newBand, setNewBand] = useState({ thickness_min: 0, thickness_max: 0, rate_low: 0, rate_high: 0 })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const load = async () => { setLoading(true); setBands(await getRateBands()); setLoading(false) }
  useEffect(() => { load() }, [])

  const grouped = bands.reduce<Record<string, RateBandData[]>>((acc, b) => {
    if (!acc[b.material_name]) acc[b.material_name] = []
    acc[b.material_name].push(b)
    return acc
  }, {})

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
    try {
      await updateRateBand(editId, editData)
      setEditId(null); setEditData({})
      await load(); showToast('Rate updated successfully')
    } catch (e: any) { showToast(e.message, 'error') }
    setSaving(false)
  }

  const addBand = async (materialName: string) => {
    setSaving(true)
    try {
      await createRateBand({ material_name: materialName, ...newBand })
      setAddingFor(null); setNewBand({ thickness_min: 0, thickness_max: 0, rate_low: 0, rate_high: 0 })
      await load(); showToast('Rate band added')
    } catch (e: any) { showToast(e.message, 'error') }
    setSaving(false)
  }

  const softDelete = async (id: number) => {
    await deleteRateBand(id); await load(); showToast('Rate band deactivated')
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <p className="text-xs text-text-muted">All rates in ₹/kg (landed, ex-GST). Mid-rate = average of low and high.</p>
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([matName, matBands]) => (
        <div key={matName} className="bg-bg-surface border border-border-hairline rounded overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-bg-elevated/40 border-b border-border-hairline">
            <span className="text-sm font-semibold text-text-primary">{matName}</span>
            <button onClick={() => setAddingFor(matName)}
              className="flex items-center gap-1 text-[11px] px-2 py-1 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 rounded border border-accent-primary/20 transition-colors">
              <Plus size={12} /> Add Band
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-text-muted border-b border-border-hairline">
                <th className="px-4 py-2 text-left">Thk Min (mm)</th>
                <th className="px-4 py-2 text-left">Thk Max (mm)</th>
                <th className="px-4 py-2 text-left">Rate Low (₹)</th>
                <th className="px-4 py-2 text-left">Rate High (₹)</th>
                <th className="px-4 py-2 text-left">Mid Rate</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {matBands.map(b => editId === b.id ? (
                <tr key={b.id} className="bg-accent-primary/5">
                  {(['thickness_min', 'thickness_max', 'rate_low', 'rate_high'] as const).map(f => (
                    <td key={f} className="px-3 py-2">
                      <input type="number" value={editData[f] ?? b[f]} onChange={e => setEditData(p => ({ ...p, [f]: parseFloat(e.target.value) }))}
                        className="w-24 h-8 px-2 bg-bg-elevated border border-accent-primary rounded text-sm text-text-primary focus:outline-none" />
                    </td>
                  ))}
                  <td className="px-4 py-2 font-mono text-text-muted text-sm">—</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={saveEdit} disabled={saving} className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/20 transition-colors">
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      </button>
                      <button onClick={() => { setEditId(null); setEditData({}) }} className="p-1.5 bg-bg-elevated text-text-muted hover:text-text-primary rounded border border-border-default transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={b.id} className="hover:bg-bg-elevated/20 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-sm text-text-secondary">{b.thickness_min}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-text-secondary">{b.thickness_max}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-emerald-400">₹{b.rate_low}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-emerald-400">₹{b.rate_high}</td>
                  <td className="px-4 py-2.5 font-mono text-sm text-accent-primary">₹{((b.rate_low + b.rate_high) / 2).toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditId(b.id); setEditData({ thickness_min: b.thickness_min, thickness_max: b.thickness_max, rate_low: b.rate_low, rate_high: b.rate_high }) }}
                        className="p-1.5 bg-bg-elevated text-text-muted hover:text-accent-primary rounded border border-border-default transition-colors"><Edit2 size={12} /></button>
                      <button onClick={() => softDelete(b.id)}
                        className="p-1.5 bg-bg-elevated text-text-muted hover:text-red-400 rounded border border-border-default transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {addingFor === matName && (
                <tr className="bg-accent-primary/5 border-t border-accent-primary/20">
                  {(['thickness_min', 'thickness_max', 'rate_low', 'rate_high'] as const).map(f => (
                    <td key={f} className="px-3 py-2">
                      <input type="number" value={newBand[f]} placeholder={f.replace('_', ' ')} onChange={e => setNewBand(p => ({ ...p, [f]: parseFloat(e.target.value) || 0 }))}
                        className="w-24 h-8 px-2 bg-bg-elevated border border-accent-primary/40 rounded text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-text-muted text-sm">—</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => addBand(matName)} disabled={saving}
                        className="p-1.5 bg-accent-primary text-white rounded transition-colors">
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      </button>
                      <button onClick={() => setAddingFor(null)} className="p-1.5 bg-bg-elevated text-text-muted rounded border border-border-default transition-colors"><X size={12} /></button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

// ── Tab 3 — Process Rates ──────────────────────────────────────────────────────

function RatesTab({ settings, onChange, onSave, saving }: {
  settings: SettingsMap; onChange: (k: string, v: number) => void; onSave: () => void; saving: boolean
}) {
  const rateField = (label: string, key: string, unit: string) => (
    <div className="bg-bg-surface border border-border-hairline rounded p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded">{unit}</span>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
        <input type="number" step="0.01" value={settings[key] as number ?? ''}
          onChange={e => onChange(key, parseFloat(e.target.value))}
          className="w-full h-10 pl-7 pr-3 bg-bg-elevated border border-border-default rounded text-sm font-mono text-text-primary focus:border-accent-primary focus:outline-none transition-colors" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Operation Rates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rateField('Laser Cutting', 'laser_cutting_rate', '₹/mm perimeter')}
          {rateField('Bending', 'bending_rate', '₹/bend')}
          {rateField('Welding', 'welding_rate', '₹/hr')}
          {rateField('Machining', 'machining_rate', '₹/hr')}
          {rateField('Labour', 'labour_rate', '₹/hr')}
          {rateField('Weight Multiplier', 'weight_rate_multiplier', '₹/kg base')}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Margins & Tax</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rateField('Material Markup', 'material_markup_percent', '%')}
          {rateField('Default Margin', 'default_margin_percent', '%')}
          {rateField('GST', 'gst_percent', '%')}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">STD Flat Rates (₹/kg)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rateField('Punching', 'std_rate_punching', '₹/kg')}
          {rateField('Bending (Flat)', 'std_rate_bending', '₹/kg')}
          {rateField('Welding (Flat)', 'std_rate_welding', '₹/kg')}
          {rateField('Powder Coating Dual', 'std_rate_powder_dual', '₹/kg')}
        </div>
      </div>
      <div className="pt-2 border-t border-border-hairline flex justify-end">
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-white text-sm font-semibold rounded hover:bg-accent-primary-hover disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save All Rates'}
        </button>
      </div>
    </div>
  )
}

// ── Tab 4 — Materials & Thicknesses ───────────────────────────────────────────

function MaterialsTab() {
  const [materials, setMaterials] = useState<MaterialData[]>([])
  const [loading, setLoading] = useState(true)
  const [addingMat, setAddingMat] = useState(false)
  const [newMat, setNewMat] = useState({ name: '', density: 7850 })
  const [addingThkFor, setAddingThkFor] = useState<number | null>(null)
  const [newThk, setNewThk] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [editingMat, setEditingMat] = useState<number | null>(null)
  const [editMatData, setEditMatData] = useState({ name: '', density: 7850 })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }
  const load = async () => { setLoading(true); setMaterials(await getMaterials(true)); setLoading(false) }
  useEffect(() => { load() }, [])

  const doAddMat = async () => {
    if (!newMat.name.trim()) return
    try {
      await createMaterial(newMat); setAddingMat(false); setNewMat({ name: '', density: 7850 })
      await load(); showToast('Material added')
    } catch (e: any) { showToast(e.message, 'error') }
  }

  const doSaveMatEdit = async (id: number) => {
    try {
      await updateMaterial(id, editMatData); setEditingMat(null)
      await load(); showToast('Material updated')
    } catch (e: any) { showToast(e.message, 'error') }
  }

  const toggleMat = async (mat: MaterialData) => {
    await updateMaterial(mat.id, { active: !mat.active }); await load()
    showToast(mat.active ? 'Material deactivated' : 'Material activated')
  }

  const doAddThk = async (matId: number) => {
    const val = parseFloat(newThk)
    if (!val || val <= 0) return
    try {
      await addThickness(matId, val); setAddingThkFor(null); setNewThk('')
      await load(); showToast('Thickness added')
    } catch (e: any) { showToast(e.message, 'error') }
  }

  const toggleThk = async (t: { id: number; active: boolean; thickness_mm: number }) => {
    await updateThickness(t.id, { active: !t.active }); await load()
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent-primary animate-spin" /></div>

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} />}
      <div className="flex justify-between items-center">
        <p className="text-xs text-text-muted">Click a thickness chip to toggle active/inactive. Grey = inactive.</p>
        <button onClick={() => setAddingMat(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent-primary/10 text-accent-primary text-sm font-medium rounded border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors">
          <Plus size={14} /> Add Material
        </button>
      </div>

      {addingMat && (
        <div className="flex items-center gap-3 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded">
          <input value={newMat.name} onChange={e => setNewMat(p => ({ ...p, name: e.target.value }))} placeholder="Material name"
            className="flex-1 h-8 px-3 bg-bg-elevated border border-border-default rounded text-sm text-text-primary focus:border-accent-primary focus:outline-none" />
          <input type="number" value={newMat.density} onChange={e => setNewMat(p => ({ ...p, density: parseFloat(e.target.value) }))} placeholder="Density kg/m³"
            className="w-36 h-8 px-3 bg-bg-elevated border border-border-default rounded text-sm font-mono text-text-primary focus:border-accent-primary focus:outline-none" />
          <button onClick={doAddMat} className="p-1.5 bg-accent-primary text-white rounded"><Check size={14} /></button>
          <button onClick={() => setAddingMat(false)} className="p-1.5 bg-bg-elevated text-text-muted rounded border border-border-default"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.map(mat => (
          <div key={mat.id} className={`bg-bg-surface border rounded overflow-hidden transition-all ${mat.active ? 'border-border-hairline' : 'border-border-hairline opacity-50'}`}>
            <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated/30">
              {editingMat === mat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input value={editMatData.name} onChange={e => setEditMatData(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 h-7 px-2 bg-bg-elevated border border-accent-primary rounded text-sm text-text-primary focus:outline-none" />
                  <input type="number" value={editMatData.density} onChange={e => setEditMatData(p => ({ ...p, density: parseFloat(e.target.value) }))}
                    className="w-24 h-7 px-2 bg-bg-elevated border border-accent-primary rounded text-xs font-mono text-text-primary focus:outline-none" />
                  <button onClick={() => doSaveMatEdit(mat.id)} className="p-1 bg-emerald-500/10 text-emerald-400 rounded"><Check size={12} /></button>
                  <button onClick={() => setEditingMat(null)} className="p-1 bg-bg-elevated text-text-muted rounded border border-border-default"><X size={12} /></button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-semibold text-text-primary">{mat.name}</span>
                    <span className="ml-2 text-[10px] font-mono text-text-muted">{mat.density} kg/m³</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingMat(mat.id); setEditMatData({ name: mat.name, density: mat.density }) }}
                      className="p-1 text-text-muted hover:text-text-primary transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => toggleMat(mat)} className="transition-colors">
                      {mat.active
                        ? <ToggleRight size={20} className="text-accent-primary" />
                        : <ToggleLeft size={20} className="text-text-muted" />}
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {[...mat.thicknesses].sort((a, b) => a.thickness_mm - b.thickness_mm).map(t => (
                  <button key={t.id} onClick={() => toggleThk(t)}
                    className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                      t.active ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30 hover:bg-accent-primary/20' : 'bg-bg-elevated text-text-muted border-border-default opacity-50 hover:opacity-75'
                    }`}>{t.thickness_mm}mm</button>
                ))}
                {addingThkFor === mat.id ? (
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.1" value={newThk} onChange={e => setNewThk(e.target.value)} placeholder="mm" autoFocus
                      className="w-16 h-7 px-2 bg-bg-elevated border border-accent-primary rounded text-xs font-mono text-text-primary focus:outline-none"
                      onKeyDown={e => { if (e.key === 'Enter') doAddThk(mat.id); if (e.key === 'Escape') { setAddingThkFor(null); setNewThk('') } }} />
                    <button onClick={() => doAddThk(mat.id)} className="p-0.5 text-emerald-400"><Check size={12} /></button>
                    <button onClick={() => { setAddingThkFor(null); setNewThk('') }} className="p-0.5 text-text-muted"><X size={12} /></button>
                  </div>
                ) : (
                  <button onClick={() => setAddingThkFor(mat.id)}
                    className="px-2 py-1 text-xs text-text-muted border border-dashed border-border-default rounded hover:border-accent-primary hover:text-accent-primary transition-colors">
                    + Add
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 5 — Surface Finishing ──────────────────────────────────────────────────

function SurfaceTab() {
  const [finishes, setFinishes] = useState<SurfaceFinishData[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<SurfaceFinishData>>({})
  const [adding, setAdding] = useState(false)
  const [newFinish, setNewFinish] = useState({ name: '', rate: 0, unit: 'Rs/sqm' })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }
  const load = async () => { setLoading(true); setFinishes(await getSurfaceFinishes(true)); setLoading(false) }
  useEffect(() => { load() }, [])

  const saveEdit = async () => {
    if (!editId) return
    try { await updateSurfaceFinish(editId, editData); setEditId(null); setEditData({}); await load(); showToast('Updated') }
    catch (e: any) { showToast(e.message, 'error') }
  }

  const doAdd = async () => {
    try { await createSurfaceFinish(newFinish); setAdding(false); setNewFinish({ name: '', rate: 0, unit: 'Rs/sqm' }); await load(); showToast('Finish added') }
    catch (e: any) { showToast(e.message, 'error') }
  }

  const toggleActive = async (sf: SurfaceFinishData) => {
    await updateSurfaceFinish(sf.id, { active: !sf.active }); await load()
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent-primary animate-spin" /></div>

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} />}
      <div className="flex justify-between items-center">
        <p className="text-xs text-text-muted">Manage surface finishing processes and their rates per sqm.</p>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent-primary/10 text-accent-primary text-sm font-medium rounded border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors">
          <Plus size={14} /> Add Finish
        </button>
      </div>
      <div className="bg-bg-surface border border-border-hairline rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-elevated/40 border-b border-border-hairline">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Rate (₹)</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-hairline">
            {adding && (
              <tr className="bg-accent-primary/5">
                <td className="px-3 py-2"><input value={newFinish.name} onChange={e => setNewFinish(p => ({ ...p, name: e.target.value }))} placeholder="Name"
                  className="w-full h-8 px-2 bg-bg-elevated border border-accent-primary rounded text-sm text-text-primary focus:outline-none" /></td>
                <td className="px-3 py-2"><input type="number" value={newFinish.rate} onChange={e => setNewFinish(p => ({ ...p, rate: parseFloat(e.target.value) }))}
                  className="w-24 h-8 px-2 bg-bg-elevated border border-accent-primary rounded text-sm font-mono text-text-primary focus:outline-none" /></td>
                <td className="px-3 py-2"><input value={newFinish.unit} onChange={e => setNewFinish(p => ({ ...p, unit: e.target.value }))}
                  className="w-28 h-8 px-2 bg-bg-elevated border border-accent-primary rounded text-sm text-text-primary focus:outline-none" /></td>
                <td className="px-3 py-2 text-center"><span className="text-emerald-400 text-xs">Yes</span></td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={doAdd} className="p-1.5 bg-accent-primary text-white rounded"><Check size={12} /></button>
                    <button onClick={() => setAdding(false)} className="p-1.5 bg-bg-elevated text-text-muted rounded border border-border-default"><X size={12} /></button>
                  </div>
                </td>
              </tr>
            )}
            {finishes.map(sf => editId === sf.id ? (
              <tr key={sf.id} className="bg-accent-primary/5">
                <td className="px-3 py-2"><input value={editData.name ?? sf.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  className="w-full h-8 px-2 bg-bg-elevated border border-accent-primary rounded text-sm text-text-primary focus:outline-none" /></td>
                <td className="px-3 py-2"><input type="number" value={editData.rate ?? sf.rate} onChange={e => setEditData(p => ({ ...p, rate: parseFloat(e.target.value) }))}
                  className="w-24 h-8 px-2 bg-bg-elevated border border-accent-primary rounded text-sm font-mono text-text-primary focus:outline-none" /></td>
                <td className="px-3 py-2"><input value={editData.unit ?? sf.unit} onChange={e => setEditData(p => ({ ...p, unit: e.target.value }))}
                  className="w-28 h-8 px-2 bg-bg-elevated border border-accent-primary rounded text-sm text-text-primary focus:outline-none" /></td>
                <td className="px-3 py-2 text-center">—</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={saveEdit} className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20"><Check size={12} /></button>
                    <button onClick={() => { setEditId(null); setEditData({}) }} className="p-1.5 bg-bg-elevated text-text-muted rounded border border-border-default"><X size={12} /></button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={sf.id} className={`hover:bg-bg-elevated/20 transition-colors ${!sf.active ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3 text-text-primary font-medium">{sf.name}</td>
                <td className="px-4 py-3 font-mono text-emerald-400">₹{sf.rate.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{sf.unit}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(sf)}>
                    {sf.active ? <ToggleRight size={20} className="text-accent-primary mx-auto" /> : <ToggleLeft size={20} className="text-text-muted mx-auto" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditId(sf.id); setEditData({ name: sf.name, rate: sf.rate, unit: sf.unit }) }}
                    className="p-1.5 bg-bg-elevated text-text-muted hover:text-accent-primary rounded border border-border-default transition-colors mr-1"><Edit2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab 6 — Audit History ──────────────────────────────────────────────────────

function AuditTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [keyFilter, setKeyFilter] = useState('')

  const load = async () => {
    setLoading(true)
    const data = await getSettingsAudit(page, 30, keyFilter)
    setItems(data.items); setTotalPages(data.total_pages)
    setLoading(false)
  }
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [page, keyFilter])

  return (
    <div className="space-y-4">
      <div className="relative w-64">
        <input value={keyFilter} onChange={e => { setKeyFilter(e.target.value); setPage(1) }} placeholder="Filter by key…"
          className="w-full h-9 px-3 bg-bg-surface border border-border-default rounded text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none" />
      </div>
      <div className="bg-bg-surface border border-border-hairline rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-elevated/40 border-b border-border-hairline">
              <th className="px-4 py-3 text-left">Setting Key</th>
              <th className="px-4 py-3 text-left">Old Value</th>
              <th className="px-4 py-3 text-left">New Value</th>
              <th className="px-4 py-3 text-left">Changed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-hairline">
            {loading ? (
              <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="w-5 h-5 text-accent-primary animate-spin mx-auto" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-text-muted text-sm">No audit records yet</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-bg-elevated/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-accent-primary">{item.setting_key}</td>
                <td className="px-4 py-3 font-mono text-xs text-red-400">{item.old_value ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-emerald-400">{item.new_value ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-text-muted">{new Date(item.changed_at).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-1">
          <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 h-8 bg-bg-surface border border-border-default text-sm text-text-primary rounded disabled:opacity-40 hover:bg-bg-elevated transition-colors">Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 h-8 bg-bg-surface border border-border-default text-sm text-text-primary rounded disabled:opacity-40 hover:bg-bg-elevated transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [settings, setSettings] = useState<SettingsMap>({})
  const [dirty, setDirty] = useState<SettingsMap>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    getSettings().then(r => setSettings(r.settings))
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (k: string, v: string | number) => {
    setSettings(p => ({ ...p, [k]: v }))
    setDirty(p => ({ ...p, [k]: v }))
  }

  const handleSave = async () => {
    if (Object.keys(dirty).length === 0) return
    setSaving(true)
    try {
      await updateSettings(dirty)
      setDirty({})
      showToast('Settings saved successfully')
    } catch (e: any) {
      showToast(e.message || 'Failed to save settings', 'error')
    }
    setSaving(false)
  }

  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'pricing', label: 'Material Pricing', icon: DollarSign },
    { id: 'rates', label: 'Process Rates', icon: Zap },
    { id: 'materials', label: 'Materials & Thicknesses', icon: Layers },
    { id: 'surface', label: 'Surface Finishing', icon: Paintbrush },
    { id: 'audit', label: 'Audit History', icon: ClipboardList },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="font-sans text-[13px] text-text-secondary mt-1">
          Configure company profile, material pricing, process rates, and surface finishes.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-bg-elevated border border-border-hairline rounded-lg mb-6 overflow-x-auto">
        {tabs.map(t => (
          <TabBtn key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-bg-surface border border-border-hairline rounded-lg p-6">
        {activeTab === 'company' && (
          <CompanyTab settings={settings} onChange={handleChange} onSave={handleSave} saving={saving} />
        )}
        {activeTab === 'pricing' && <PricingTab />}
        {activeTab === 'rates' && (
          <RatesTab settings={settings} onChange={handleChange} onSave={handleSave} saving={saving} />
        )}
        {activeTab === 'materials' && <MaterialsTab />}
        {activeTab === 'surface' && <SurfaceTab />}
        {activeTab === 'audit' && <AuditTab />}
      </div>
    </div>
  )
}
