/** Formato uniforme de listados paginados (docs/14_api.md §14.2). */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
