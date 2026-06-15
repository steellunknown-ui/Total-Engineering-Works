import re

with open('api.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find where EstimateRequestItem starts
start_idx = -1
for i, line in enumerate(lines):
    if line.startswith('export interface EstimateRequestItem'):
        start_idx = i
        break

if start_idx != -1:
    good_lines = lines[:start_idx]
    
    # Append the correct definitions
    new_tail = '''export interface EstimateRequestItem {
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
'''
    good_lines.append(new_tail)
    
    # Find where QuoteHistoryItem ended and get QuoteHistory function onwards
    func_idx = -1
    for i, line in enumerate(lines):
        if line.startswith('export async function getQuoteHistory'):
            func_idx = i
            break
            
    if func_idx != -1:
        good_lines.extend(lines[func_idx:])
        
    with open('api.ts', 'w', encoding='utf-8') as f:
        f.writelines(good_lines)
    print("Fixed api.ts successfully!")
else:
    print("Could not find EstimateRequestItem")
