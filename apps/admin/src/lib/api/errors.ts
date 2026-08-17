/** Formato uniforme de error de la API (docs/14_api.md §14.3). */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
  requestId?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details ?? [];
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const data = (await response.json()) as { error?: ApiErrorBody };
    if (data.error) return new ApiError(response.status, data.error);
  } catch {
    // respuesta sin cuerpo JSON (p. ej. 204, error de red del proxy)
  }
  return new ApiError(response.status, {
    code: "ERROR_DESCONOCIDO",
    message: "Ocurrió un error inesperado. Intente nuevamente.",
  });
}
