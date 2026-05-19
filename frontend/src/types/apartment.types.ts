export interface APARTMENT {
  public_id: string;
  building_public_id: string;
  unit_number: string;
  floor: number;
  status: "vacant" | "occupied";
  is_active: boolean;
  created_at: string;
}
