export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly path: string;
  public readonly timestamp: string;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = response.status;
    this.error = response.error;
    this.path = response.path;
    this.timestamp = response.timestamp;
  }

  static isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401;
  }
}
