export interface RFQFormData {
  name: string
  company: string
  email: string
  phone?: string
  productType: string
  material?: string
  quantity: string
  timeline: string
  description: string
}

export interface RFQApiResponse {
  success: boolean
  referenceId?: string
  errors?: Record<string, string[]>
  message?: string
}
