export interface Authentication {
  key: string;
  secret: string;
  passphrase: string;
}

export interface CallLimit {
  limit: number;
  frequency: number;
  period: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
}

// Account

// Spot
export interface InstrumentsResponse {
  base_currency: string;
  instrument_id: string;
  min_size: string;
  quote_currency: string;
  size_increment: string;
  tick_size: string;
}
