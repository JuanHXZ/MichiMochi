export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
  status?: number;
}
