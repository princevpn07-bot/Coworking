export interface Booking {
  contract_id: number;
  username: string | null;
  spacename: string | null;
  start_date: string;
  end_date: string | null;
  status: number;
}

export interface BookingDetail {
  contract_id: number;
  username: string | null;
  email: string | null;
  companyname: string | null;
  tax_id: string | null;
  price_type: number | null;
  start_date: string | null;
  end_date: string | null;
  total_price: number | null;
  status: number | null;
}

export interface UserOption {
  user_id: number;
  name: string | null;
  role: number | null;
}

export interface RentOption {
  rent_id: number;
  price_type: number | null;
  price: number | null;
  space_id: number | null;
  spacename: string | null;
}

export interface EmployeeOption {
  employees_id: number;
  user_id: number | null;
  location_id: number | null;
  department: string | null;
  job_title: string | null;
  is_active: boolean | null;
  name: string | null;
}

export interface CreateBookingPayload {
  user_id: number | null;
  rent_id: number | null;
  employees_id: number | null;
  start_date: string | null;
  end_date: string | null;
  company_name: string | null;
  tax_id: string | null;
  status: number;
}

export interface CalendarDay {
  date: Date;
  isOutsideMonth: boolean;
  isToday: boolean;
}
