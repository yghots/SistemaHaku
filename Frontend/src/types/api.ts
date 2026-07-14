/** Forma exacta del error devuelto por HttpExceptionFilter (backend). */
export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
}

/** Forma exacta de PaginatedResponseDto<T> (backend). */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
