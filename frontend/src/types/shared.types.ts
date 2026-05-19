export interface OWNER {
  public_id: string;
  full_name: string;
  email: string;
}

export interface STANDARD_RESPONSE<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PAGINATED_RESPONSE<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
  message: string;
}
