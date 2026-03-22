export interface TravelerProfile {
  id: string;
  userId: string;
  homeCountry: string;
  passports: string[];
}

export interface VisaRule {
  countryCode: string;
  stayLimitDays: number;
  windowDays?: number;
  visaType?: string;
}

export interface TripLeg {
  id: string;
  countryCode: string;
  arrivalDate: string;
  departureDate: string;
}

export interface Itinerary {
  id: string;
  travelerId: string;
  legs: TripLeg[];
}

export interface ComplianceResult {
  itineraryId: string;
  isCompliant: boolean;
  issues: string[];
}
