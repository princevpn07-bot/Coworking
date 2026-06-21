export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  require2fa?: boolean;
}

export interface FrontendMyOrderDto {
  contract_id: number;
  space_id: number | null;
  space_name: string | null;
  location_city: string | null;
  location_address: string | null;
  price_type: number | null;
  price: number | null;
  start_date: string | null;
  end_date: string | null;
  total_price: number | null;
  status: number | null;
  created_date: string | null;
  pay_deadline: string | null;
}
