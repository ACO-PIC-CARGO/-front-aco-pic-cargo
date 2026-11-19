export interface ShipmentSubtype {
  id: number;
  codigo: string;
  id_shipment: number;
  shipment: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ShipmentSubtypeForm {
  id: number | null;
  id_shipment: number | null;
  name: string;
}
