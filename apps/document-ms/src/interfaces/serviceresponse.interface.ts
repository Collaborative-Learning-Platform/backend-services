export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  status?: number;
  data?: T;
}
