export type ListingType = "rent" | "buy";

export type FactorKey =
  | "value"
  | "commute"
  | "transit"
  | "walkability"
  | "safety"
  | "grocery"
  | "noise"
  | "restaurants"
  | "entertainment"
  | "parks"
  | "dog"
  | "unit";

export interface Factor {
  key: FactorKey;
  label: string;
}

export type Weights = Record<FactorKey, number>;

export interface Neighbourhood {
  id: string;
  name: string;
  tier: string; // "$" .. "$$$$"
  lines: string[]; // "line1" | "line2" | "line5" | "streetcar" | "go" | "bus"
  lat: number;
  lng: number;
  // tiers 1-5 (5 = best)
  t: number; // transit
  w: number; // walkability
  f: number; // food / restaurants
  fun: number; // entertainment / nightlife
  p: number; // parks
  d: number; // dogs
  g: number; // grocery / errands
  q: number; // quiet (low noise)
  s: number; // safety (general estimate, see footnote caveat)
  note: string;
  caution?: string;
}

export interface Listing {
  id: string;
  isExample?: boolean;
  listingType: ListingType;
  name: string;
  neighborhood: string;
  status: "researching" | "toured" | "applied" | "offer received" | "rejected";

  // rent fields
  rent: number | null;
  bedroomType: string; // "studio" | "1br" | "2br" | "3br"
  utilHeat: boolean;
  utilWater: boolean;
  utilHydro: boolean;
  utilInternet: boolean;
  parkingCost: number | null;
  lockerCost: number | null;
  lastMonthDeposit: number | null;
  keyDeposit: number | null;
  otherDepositAmount: number | null;
  otherDepositDesc: string;
  applicationFeeAsked: boolean;

  // buy fields
  price: number | null;
  condoFees: number | null;
  propertyTaxAnnual: number | null;
  depositPct: number | null;
  firstTimeBuyer: boolean;
  reviewedStatusCertificate: boolean;
  reserveFundConcern: boolean;
  specialAssessmentRecent: boolean;
  byWireToIndividual: boolean;
  byUnverifiedWireChange: boolean;
  byPressuredWaiveConditions: boolean;
  byNoLawyer: boolean;

  // shared
  commuteLabel: string;
  commuteMinutes: number | null;
  closestStop: string;
  sourceUrl: string;
  busyRoadFacing: boolean;
  utilEstMonthly: number | null;
  listedDaysAgo: number | null;

  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  floor: number | null;
  buildingType: string;
  occupancyYear: number | null;
  heating: string;
  laundry: string;
  ac: boolean;
  elevator: boolean;

  amGym: boolean;
  amPool: boolean;
  amConcierge: boolean;
  amPackage: boolean;
  amBike: boolean;
  amVisitorParking: boolean;
  amRooftop: boolean;
  amPetFriendly: boolean;
  petFee: number | null;
  amDishwasher: boolean;
  amLocker: boolean;

  scPayBeforeView: boolean;
  scNoMeet: boolean;
  scWireCryptoGift: boolean;
  scBelowMarket: boolean;
  scPressure: boolean;
  scNoStandardLease: boolean;

  notes: string;
  listingUrl: string;
  dateAdded: string;
}

export interface Flag {
  level: "good" | "warn" | "bad" | "neutral";
  text: string;
}

export interface WorkSettings {
  neighborhood: string;
}
