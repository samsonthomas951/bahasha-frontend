export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface ApiSuccess {
  message: string
}

export interface ApiError {
  message?: string
  error?: string
  status?: number
}
