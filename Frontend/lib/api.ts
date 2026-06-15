/**
 * lib/api.ts — Tatva Quote System API Client
 * ------------------------------------------
 * Fully-typed client for the FastAPI backend running on port 8000.
 * All values come from /api/constants — nothing is hardcoded.
 * 100% offline / LAN — no cloud dependencies.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

// ═══════════════════════════════════════════════════════════════
//  TypeScript Interfaces (matching actual backend response shapes)
// ═══════════════════════════════════════════════════════════════

export interface QLine {
  desc: string   // backend field name
  qty: number
  unit: string
  rate: number   // ₹/unit
  amt: number    // = qty × rate
}

export interface Nest {
  name: string     // sheet name
  sl: number       // sheet length mm
  sw: number       // sheet width mm
  pl: number       // part length mm
  pw: number       // part width mm
  kerf: number
  normal: number   // parts in normal orientation
  rotated: number
  mixed: number
  best: number     // parts per sheet (best layout)
  orient: string   // "Normal" | "Rotated 90°" | "Mixed"
  util: number     // utilization %
  waste: number    // waste %
  sheets: number   // sheets needed for qty
  qty: number
}

// Matches the Quote dataclass from backend exactly
export interface QuoteResult {
  // Part identity (injected by server.py after gen_quote)
  name: string
  customer: string
  drg_no: string
  // Material
  mat: string
  t: number           // thickness mm
  // Dimensions
  pl: number          // part length mm
  pw: number          // part width mm
  qty: number
  // Weight & rate
  weight: number      // kg/pc
  rate_kg: number     // ₹/kg
  band_lo: number
  band_hi: number
  slider: number      // 0–100
  // Line items
  lines: QLine[]
  // Cost breakdown (per piece)
  sub: number         // subtotal
  overhead: number
  overhead_pct: number
  profit: number
  profit_pct: number
  per_pc: number      // rate per piece
  total: number       // grand total (per_pc × qty)
  // Nesting
  n: Nest | null
  sheet_cost: number
  flat_info: string
  surface: string
  geometry_svg?: string
  // Saved quote fields (present after save)
  quote_no?: string
  created_at?: string
}

export interface QuoteRequest {
  part_name: string
  customer?: string
  drg_no?: string
  material: string
  thickness_mm: number
  length_mm: number
  width_mm: number
  box_height_mm?: number
  qty: number
  sheet_name?: string | null
  kerf_mm?: number
  rate_pct?: number
  manual_rate?: number
  do_cut: boolean
  cut_method?: string
  perim_mm?: number
  int_cuts_mm?: number
  do_bend: boolean
  bend_count?: number
  bend_len_mm?: number
  do_punch: boolean
  punch_count?: number
  punch_dia_mm?: number
  do_weld: boolean
  weld_type?: string
  weld_len_mm?: number
  weld_spots?: number
  do_powder_dual: boolean
  surface?: string
  overhead_pct?: number
  profit_pct?: number
  hardware_rs?: number
  stretch_wrap_rs?: number
  packaging_rs?: number
}

export interface ConstantsData {
  materials: string[]
  thicknesses: Record<string, number[]>   // { CRCA: [0.8, 1.0, ...], ... }
  surfaces: Record<string, number>
  standard_sheets: Array<{ name: string; l: number; w: number }>
  cut_methods: string[]
  weld_types: string[]
  std_rates: Record<string, number>
  rate_bands: Record<string, Array<{ t: number; lo: number; hi: number }>>
}

export interface SaveResult {
  success: boolean
  quote_id: number
  quote_no: string
}

export interface ApiError {
  error: true
  message: string
}

export interface StatsData {
  total_quotes: number
  total_value: number
  this_month: number
  last_backup: string
  db_size_kb: number
}

export interface SavedQuote {
  id: number
  quote_no: string
  created_at: string
  updated_at: string
  customer: string
  part_name: string
  material: string
  thickness: number
  length_mm: number
  width_mm: number
  qty: number
  total: number
  status: string
  quote_data?: QuoteResult  // parsed from quote_json
}

// ═══════════════════════════════════════════════════════════════
//  Phase 5 — FAB Sheet Types
// ═══════════════════════════════════════════════════════════════

export interface FabUploadResult {
  file_name?: string
  detected: boolean
  reason?: string
  type?: 'cad' | 'pdf' | 'excel'
  parts?: Array<{
    temp_id: string
    drg_no: string
    description: string
    material: string
    thickness_mm: number
    length_mm: number
    width_mm: number
    qty: number
    process: string
    holes: number
    perimeter_mm: number
    geometry_svg?: string
    confidence: string
    missing_fields: string[]
  }>
}

export interface FabPartSpec {
  name: string
  material: string
  thickness_mm: number
  length_mm: number
  width_mm: number
  qty: number
  do_cut: boolean
  do_bend: boolean
  do_punch: boolean
  do_weld: boolean
  do_powder_dual: boolean
  perim_mm: number
  int_cuts_mm: number
  bend_count: number
  bend_len_mm: number
  punch_count: number
  punch_dia_mm: number
  weld_len_mm: number
  weld_spots: number
  process: string
  drg_no: string
  geometry_svg?: string
  rfq_file_id?: number
  autoDetected?: {
    material: boolean
    thickness_mm: boolean
    length_mm: boolean
    width_mm: boolean
  }
}

export interface BulkGenerateResult {
  items: Array<{ success: boolean; error?: string; part?: string; quote?: QuoteResult }>
  summary: { total_amount: number; total_weight: number; item_count: number }
}

// ═══════════════════════════════════════════════════════════════
//  Module-level constants cache — fetched once per session
// ═══════════════════════════════════════════════════════════════

let _constantsCache: ConstantsData | null = null

// ═══════════════════════════════════════════════════════════════
//  Internal helper
// ═══════════════════════════════════════════════════════════════

async function _fetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  })
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = await res.json() as ApiError | { detail: string | ApiError }
      if ('detail' in err) {
        const detail = (err as { detail: string | ApiError }).detail
        message = typeof detail === 'string'
          ? detail
          : (detail as ApiError).message ?? message
      } else if ('message' in err) {
        message = (err as ApiError).message
      }
    } catch {
      // Body not JSON — keep HTTP status message
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

// ═══════════════════════════════════════════════════════════════
//  Public API functions
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all dropdown/reference constants from the backend.
 * Cached in module-level variable — only fetches once per session.
 */
export async function getConstants(): Promise<ConstantsData> {
  if (_constantsCache) return _constantsCache
  const data = await _fetch<ConstantsData>('/api/constants')
  _constantsCache = data
  return data
}

/**
 * Generate a quote. Calls the core calculation engine on the backend.
 * Throws on HTTP error or validation failure.
 */
export async function generateQuote(params: QuoteRequest): Promise<QuoteResult> {
  return _fetch<QuoteResult>('/api/quote/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * Save a generated quote to the local SQLite DB.
 * Returns the assigned quote_no and database id.
 */
export async function saveQuote(
  quote: QuoteResult,
  opts: {
    customer?: string
    cutMethod?: string
    weldType?: string
    boxHeightMm?: number
    cadFile?: string
    status?: string
  } = {}
): Promise<SaveResult> {
  return _fetch<SaveResult>('/api/quote/save', {
    method: 'POST',
    body: JSON.stringify({
      quote,
      customer:       opts.customer    ?? quote.customer ?? '',
      cut_method:     opts.cutMethod   ?? 'laser',
      weld_type:      opts.weldType    ?? 'mig',
      box_height_mm:  opts.boxHeightMm ?? 0,
      cad_file:       opts.cadFile     ?? '',
      status:         opts.status      ?? 'draft',
    }),
  })
}

/**
 * List saved quotes with optional filters.
 */
export async function listQuotes(params?: {
  customer?: string
  material?: string
  status?: string
  search?: string
  limit?: number
}): Promise<{ count: number; quotes: SavedQuote[] }> {
  const qs = new URLSearchParams()
  if (params?.customer) qs.set('customer', params.customer)
  if (params?.material) qs.set('material', params.material)
  if (params?.status)   qs.set('status', params.status)
  if (params?.search)   qs.set('search', params.search)
  if (params?.limit)    qs.set('limit', String(params.limit))
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return _fetch<{ count: number; quotes: SavedQuote[] }>(`/api/quotes${query}`)
}

/**
 * Fetch a single saved quote by database ID.
 */
export async function getQuote(id: number): Promise<SavedQuote> {
  return _fetch<SavedQuote>(`/api/quotes/${id}`)
}

/**
 * Permanently delete a quote by ID.
 */
export async function deleteQuote(id: number): Promise<void> {
  await _fetch<{ success: boolean; deleted_id: number }>(
    `/api/quotes/${id}`,
    { method: 'DELETE' }
  )
}

/**
 * Fetch aggregate stats (total quotes, value, this month, DB size).
 */
export async function getStats(): Promise<StatsData> {
  return _fetch<StatsData>('/api/stats')
}

/**
 * Update the status of a saved quote.
 * Valid statuses: draft | sent | accepted | rejected
 */
export async function updateQuoteStatus(
  id: number,
  status: string
): Promise<{ success: boolean; quote_id: number; status: string }> {
  return _fetch(`/api/quotes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ═══════════════════════════════════════════════════════════════
//  Phase 5 — FAB Sheet Client Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Uploads a file (DXF, PDF, Excel) for parsing.
 */
export async function uploadFabFile(file: File): Promise<FabUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/fab/upload-file`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    throw new Error(`Upload failed: HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * Generates bulk quotes for a list of FAB parts.
 */
export async function generateBulkQuote(parts: FabPartSpec[], opts: any = {}): Promise<BulkGenerateResult> {
  return _fetch<BulkGenerateResult>('/api/fab/generate-bulk', {
    method: 'POST',
    body: JSON.stringify({
      parts,
      customer: opts.customer || '',
      overhead_pct: opts.overhead_pct || 15.0,
      profit_pct: opts.profit_pct || 20.0,
      cut_method: opts.cut_method || 'laser',
      kerf_mm: opts.kerf_mm || 2.0,
      rate_pct: opts.rate_pct || 50.0
    }),
  })
}

/**
 * Generates and saves a list of Quotes as a single batch.
 */
export async function saveBulkQuote(parts: FabPartSpec[], customer: string, note: string, opts: any = {}): Promise<{ success: boolean; batch_id: number | null; items_saved: number; note?: string }> {
  return _fetch('/api/fab/save-bulk', {
    method: 'POST',
    body: JSON.stringify({
      parts,
      customer,
      note,
      overhead_pct: opts.overhead_pct || 15.0,
      profit_pct: opts.profit_pct || 20.0,
      cut_method: opts.cut_method || 'laser',
      kerf_mm: opts.kerf_mm || 2.0,
      rate_pct: opts.rate_pct || 50.0
    }),
  })
}

/**
 * Exports a bulk quote result as a multi-page grouped PDF.
 * POSTs the generate-bulk response to /api/fab/export-pdf
 * and triggers a browser download.
 */
export async function exportBulkPdf(
  items: BulkGenerateResult['items'],
  summary: BulkGenerateResult['summary'],
  parts: FabPartSpec[],
  customer: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/fab/export-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, summary, parts, customer }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PDF export failed: HTTP ${res.status} — ${text}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cd = res.headers.get('Content-Disposition') || ''
  const match = cd.match(/filename="?([^"]+)"?/)
  a.download = match ? match[1] : 'bulk-quote.pdf'
  a.href = url
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


// ═══════════════════════════════════════════════════════════════
//  Pure helper — no API call
// ═══════════════════════════════════════════════════════════════

const DENSITY_KG_M3 = 7850 // steel density — matches backend

/**
 * Calculate part weight in kg using the same formula as the backend.
 * Pure function — no API call needed.
 */
export function calcWeight(
  _material: string,
  lengthMm: number,
  widthMm: number,
  thicknessMm: number
): number {
  if (lengthMm <= 0 || widthMm <= 0 || thicknessMm <= 0) return 0
  return (lengthMm / 1000) * (widthMm / 1000) * (thicknessMm / 1000) * DENSITY_KG_M3
}

/**
 * Format a number as Indian rupees.
 * e.g. 12345.5 → "12,345.50"
 */
export function fmtINR(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
export interface EstimateRequestItem {
  rfq_file_id?: number
  part_name: string
  material: string
  thickness: number
  quantity: number
  weight: number
  perim_mm: number
  bend_count: number
  welding_time: number
  machining_time: number
  labour_time: number
  geometry_svg?: string
}

export interface EstimateItemResponse {
  part_name: string
  material: string
  thickness: number
  quantity: number
  weight: number
  material_cost: number
  cutting_cost: number
  bending_cost: number
  welding_cost: number
  machining_cost: number
  labour_cost: number
  part_total: number
  line_total: number
  rfq_file_id?: number
  geometry_svg?: string
}

export interface EstimateResponse {
  subtotal: number
  margin_amount: number
  gst_amount: number
  grand_total: number
  items: EstimateItemResponse[]
  snapshots: any
}

export async function generateEstimate(items: EstimateRequestItem[]): Promise<EstimateResponse> {
  return _fetch<EstimateResponse>('/api/admin/quotes/estimate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

export async function createDraftQuote(rfq_id: number, customer_id: number, estimate: EstimateResponse, notes: string | null = null): Promise<{ message: string; quote_number: string; quote_id: number }> {
  return _fetch('/api/admin/quotes', {
    method: 'POST',
    body: JSON.stringify({ rfq_id, customer_id, estimate, notes }),
  })
}

export interface QuoteHistoryItem {
  id: number
  quote_number: string
  rfq_number: string
  customer_name: string
  status: string

  grand_total: number
  created_by_name: string | null
  created_at: string
  // Phase 7A: PDF
  pdf_storage_path: string | null
  pdf_version: number | null
  pdf_generated_at: string | null
}
export async function getQuoteHistory(page = 1, pageSize = 20, search = '', status = ''): Promise<{ total: number; page: number; page_size: number; total_pages: number; quotes: QuoteHistoryItem[] }> {
  const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() })
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  return _fetch(`/api/admin/quote-history?${params.toString()}`)
}

export async function updateAdminQuoteStatus(quoteId: number, newStatus: string, notes?: string): Promise<{ message: string }> {
  return _fetch(`/api/admin/quotes/${quoteId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ new_status: newStatus, notes }),
  })
}

// ═══════════════════════════════════════════════════════════════
//  Phase 7A — PDF Generation
// ═══════════════════════════════════════════════════════════════

export interface PdfGenerateResponse {
  quote_id: number
  quote_number: string
  signed_url: string
  version: number
  generated_at: string
  quality_status: 'PASS' | 'WARN' | 'FAIL'
  warnings: string[]
}

export interface PdfUrlResponse {
  signed_url: string
  version: number | null
  generated_at: string | null
  expires_in_seconds: number
}

/**
 * Trigger professional PDF generation for an Approved/Sent/Accepted quote.
 */
export async function generateQuotePdf(quoteId: number): Promise<PdfGenerateResponse> {
  return _fetch<PdfGenerateResponse>(`/api/admin/quotes/${quoteId}/generate-pdf`, {
    method: 'POST'
  })
}

/**
 * Fetch a fresh signed URL for the latest generated PDF.
 */
export async function getQuotePdfUrl(quoteId: number): Promise<PdfUrlResponse> {
  return _fetch<PdfUrlResponse>(`/api/admin/quotes/${quoteId}/pdf`)
}

export async function exportApproxPdf(estimate: EstimateResponse): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/quotes/export-approx-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(estimate),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PDF export failed: HTTP ${res.status} — ${text}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cd = res.headers.get('Content-Disposition') || ''
  const match = cd.match(/filename="?([^"]+)"?/)
  a.download = match ? match[1] : 'Approximate_Estimate.pdf'
  a.href = url
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportExcelBOM(estimate: EstimateResponse): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/quotes/export-excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(estimate),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Excel export failed: HTTP ${res.status} — ${text}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cd = res.headers.get('Content-Disposition') || ''
  const match = cd.match(/filename="?([^"]+)"?/)
  a.download = match ? match[1] : 'BOM_Export.xlsx'
  a.href = url
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


// ═══════════════════════════════════════════════════════════════
//  Phase 8.5 — Settings, Materials, Surface Finishes, Customers
// ═══════════════════════════════════════════════════════════════

// ── Settings ─────────────────────────────────────────────────────────────────

export interface SettingsMap { [key: string]: string | number | null }

export async function getSettings(): Promise<{ settings: SettingsMap }> {
  return _fetch('/api/admin/settings')
}
export async function updateSettings(updates: SettingsMap): Promise<{ updated: string[]; count: number }> {
  return _fetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ updates }) })
}
export async function getSettingsAudit(page = 1, pageSize = 30, keyFilter = ''): Promise<{
  total: number; page: number; page_size: number; total_pages: number
  items: Array<{ id: number; setting_key: string; old_value: string | null; new_value: string | null; changed_by: number | null; changed_at: string }>
}> {
  const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() })
  if (keyFilter) params.set('key_filter', keyFilter)
  return _fetch(`/api/admin/settings/audit?${params}`)
}

// ── Materials ─────────────────────────────────────────────────────────────────

export interface MaterialThicknessData { id: number; material_id: number; thickness_mm: number; active: boolean; created_at: string }
export interface MaterialData {
  id: number; name: string; density: number; active: boolean
  created_at: string; updated_at: string | null; thicknesses: MaterialThicknessData[]
}
export async function getMaterials(includeInactive = false): Promise<MaterialData[]> {
  return _fetch(`/api/admin/materials?include_inactive=${includeInactive}`)
}
export async function createMaterial(data: { name: string; density: number; active?: boolean }): Promise<MaterialData> {
  return _fetch('/api/admin/materials', { method: 'POST', body: JSON.stringify(data) })
}
export async function updateMaterial(id: number, data: Partial<{ name: string; density: number; active: boolean }>): Promise<MaterialData> {
  return _fetch(`/api/admin/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteMaterial(id: number): Promise<{ message: string }> {
  return _fetch(`/api/admin/materials/${id}`, { method: 'DELETE' })
}
export async function addThickness(materialId: number, thicknessMm: number): Promise<MaterialThicknessData> {
  return _fetch('/api/admin/material-thicknesses', { method: 'POST', body: JSON.stringify({ material_id: materialId, thickness_mm: thicknessMm }) })
}
export async function updateThickness(id: number, data: Partial<{ thickness_mm: number; active: boolean }>): Promise<MaterialThicknessData> {
  return _fetch(`/api/admin/material-thicknesses/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteThickness(id: number): Promise<{ message: string }> {
  return _fetch(`/api/admin/material-thicknesses/${id}`, { method: 'DELETE' })
}

// ── Material Rate Bands ───────────────────────────────────────────────────────

export interface RateBandData {
  id: number; material_name: string; thickness_min: number; thickness_max: number
  rate_low: number; rate_high: number; active: boolean; created_at: string; updated_at: string | null
}
export async function getRateBands(materialName?: string): Promise<RateBandData[]> {
  const params = materialName ? `?material_name=${encodeURIComponent(materialName)}` : ''
  return _fetch(`/api/admin/material-rate-bands${params}`)
}
export async function createRateBand(data: { material_name: string; thickness_min?: number; thickness_max: number; rate_low: number; rate_high: number }): Promise<RateBandData> {
  return _fetch('/api/admin/material-rate-bands', { method: 'POST', body: JSON.stringify(data) })
}
export async function updateRateBand(id: number, data: Partial<RateBandData>): Promise<RateBandData> {
  return _fetch(`/api/admin/material-rate-bands/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteRateBand(id: number): Promise<{ message: string }> {
  return _fetch(`/api/admin/material-rate-bands/${id}`, { method: 'DELETE' })
}

// ── Surface Finishes ──────────────────────────────────────────────────────────

export interface SurfaceFinishData { id: number; name: string; rate: number; unit: string; active: boolean; created_at: string; updated_at: string | null }
export async function getSurfaceFinishes(includeInactive = false): Promise<SurfaceFinishData[]> {
  return _fetch(`/api/admin/surface-finishes?include_inactive=${includeInactive}`)
}
export async function createSurfaceFinish(data: { name: string; rate: number; unit?: string; active?: boolean }): Promise<SurfaceFinishData> {
  return _fetch('/api/admin/surface-finishes', { method: 'POST', body: JSON.stringify(data) })
}
export async function updateSurfaceFinish(id: number, data: Partial<SurfaceFinishData>): Promise<SurfaceFinishData> {
  return _fetch(`/api/admin/surface-finishes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteSurfaceFinish(id: number): Promise<{ message: string }> {
  return _fetch(`/api/admin/surface-finishes/${id}`, { method: 'DELETE' })
}

// ── Customers ────────────────────────────────────────────────────────────────

export interface CustomerListItem {
  id: number; company_name: string; contact_person: string; email: string
  phone: string | null; website: string | null; lead_source: string | null
  created_at: string; updated_at: string | null
  rfq_count: number; quote_count: number; accepted_count: number; rejected_count: number
  total_revenue: number; avg_quote_value: number; conversion_rate: number
  last_activity: string | null
}
export interface CustomerListResponse {
  total: number; page: number; page_size: number; total_pages: number; customers: CustomerListItem[]
}
export interface CustomerRFQItem { id: number; rfq_number: string; status: string; lead_source: string | null; created_at: string }
export interface CustomerQuoteItem { id: number; quote_number: string; status: string; grand_total: number; created_at: string }
export interface CustomerDetail extends CustomerListItem {
  notes: string | null
  last_rfq_date: string | null; last_quote_date: string | null
  most_used_material: string | null; most_used_thickness: number | null
  rfqs: CustomerRFQItem[]; quotes: CustomerQuoteItem[]
}
export async function getCustomers(page = 1, pageSize = 20, search = '', leadSource = ''): Promise<CustomerListResponse> {
  const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() })
  if (search) params.set('search', search)
  if (leadSource) params.set('lead_source', leadSource)
  return _fetch(`/api/admin/customers?${params}`)
}
export async function getCustomerDetail(id: number): Promise<CustomerDetail> {
  return _fetch(`/api/admin/customers/${id}`)
}
export async function createCustomer(data: { company_name: string; contact_person: string; email: string; phone?: string; website?: string; lead_source?: string; notes?: string }): Promise<CustomerDetail> {
  return _fetch('/api/admin/customers', { method: 'POST', body: JSON.stringify(data) })
}
export async function updateCustomer(id: number, data: Partial<{ company_name: string; contact_person: string; email: string; phone: string; website: string; lead_source: string; notes: string }>): Promise<CustomerDetail> {
  return _fetch(`/api/admin/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function exportCustomers(exportAll: boolean, search = '', leadSource = ''): Promise<void> {
  const params = new URLSearchParams({ export_all: exportAll.toString() })
  if (search) params.set('search', search)
  if (leadSource) params.set('lead_source', leadSource)
  const res = await fetch(`${BASE_URL}/api/admin/customers/export?${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cd = res.headers.get('Content-Disposition') || ''
  const match = cd.match(/filename="?([^"]+)"?/)
  a.download = match ? match[1] : 'customers.xlsx'
  a.href = url; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ── Public Materials (for Instant Estimate, no auth) ─────────────────────────
export interface PublicMaterial { name: string; density: number; thicknesses: number[] }
export async function getPublicMaterials(): Promise<PublicMaterial[]> {
  const res = await fetch(`${BASE_URL}/api/public/materials`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
