export type Forecast = {
  medicine_id: string;
  name: string;
  recorded: number;
  usable: number;
  version: number;
  source: string;
  last_update: string;
  last_sync: string;
  anomaly_flags: string[];
  last_reconciliation: string;
  daily_demand: number;
  days_cover: number;
  risk: number;
  shortage_date: string;
  forecast_confidence: number;
  observed_dispensing: number;
  estimated_demand: number;
  estimated_unmet: number;
  truth: {
    score: number;
    level: string;
    components: Record<string, number>;
    reasons: string[];
  };
  horizons: {
    days: number;
    predicted_demand: number;
    lower: number;
    upper: number;
    risk: number;
    remaining: number;
  }[];
};
export type Facility = {
  id: string;
  name: string;
  district_id: string;
  district: string;
  state_id: string;
  lat: number;
  lon: number;
  population: number;
  connectivity: string;
  cold_chain: boolean;
  ors: Forecast;
  capacity: {
    score: number;
    predicted_footfall: number;
    throughput: number;
    overflow: number;
    staff: Record<string, number[]>;
    forecast: {
      days: number;
      patients: number;
      capacity: number;
      expected_overflow: number;
      score: number;
    }[];
  };
  beds: {
    total: number;
    occupied: number;
    available: number;
    forecast: {
      days: number;
      admissions: number;
      discharges: number;
      occupancy: number;
    }[];
  };
  inventory: Forecast[];
  history: { date: string; footfall: number; dispensed: number }[];
};
export type District = {
  id: string;
  name: string;
  state_id: string;
  lat: number;
  lon: number;
};
export type Plan = {
  id: string;
  recipient_id: string;
  recipient_name: string;
  medicine_id: string;
  required: number;
  unfilled: number;
  risk_before: number;
  risk_after: number;
  status: string;
  assumptions: string;
  donors: {
    id: string;
    name: string;
    district: string;
    cross_district: boolean;
    quantity: number;
    safe_quantity: number;
    risk_before: number;
    risk_after: number;
    distance_km: number;
    safety_floor: number;
    stock_after: number;
  }[];
  rejected: {
    id: string;
    name: string;
    naive_quantity: number;
    naive_risk: number;
    safe_quantity: number;
    reason: string;
  }[];
};
export type Alert = {
  phc_id: string;
  name: string;
  medicine: string;
  medicine_id: string;
  priority: number;
  risk: number;
  days_cover: number;
  truth: number;
  components: Record<string, number>;
};
export type Timeline = {
  day: number;
  medicine_failures: number;
  bed_failures: number;
  capacity_failures: number;
  critical_failures: number;
  unmet_units: number;
  spillover_patients: number;
};
export type Simulation = {
  id: string;
  label: string;
  assumptions: string;
  before: {
    timeline: Timeline[];
    unmet_units: number;
    critical_failures: number;
  };
  after: {
    timeline: Timeline[];
    unmet_units: number;
    critical_failures: number;
    transfers: {
      day: number;
      donor: string;
      recipient: string;
      quantity: number;
    }[];
  };
};
export type Federation = {
  round: number;
  raw_rows_transferred: number;
  note?: string;
  states: {
    state: string;
    samples: number;
    validation_samples: number;
    mae_before: number;
    mae_after: number;
    global_mae: number;
  }[];
};
