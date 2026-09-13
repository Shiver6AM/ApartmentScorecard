import { Listing } from "./types";

export function blankListing(): Listing {
  return {
    id: "", isExample: false, listingType: "rent", name: "", neighborhood: "", status: "researching",
    rent: null, bedroomType: "1br", utilHeat: false, utilWater: false, utilHydro: false, utilInternet: false,
    parkingCost: null, lockerCost: null, lastMonthDeposit: null, keyDeposit: null, otherDepositAmount: null, otherDepositDesc: "",
    applicationFeeAsked: false,
    price: null, condoFees: null, propertyTaxAnnual: null, depositPct: null, firstTimeBuyer: false,
    reviewedStatusCertificate: false, reserveFundConcern: false, specialAssessmentRecent: false,
    byWireToIndividual: false, byUnverifiedWireChange: false, byPressuredWaiveConditions: false, byNoLawyer: false,
    commuteLabel: "", commuteMinutes: null, closestStop: "", sourceUrl: "",
    busyRoadFacing: false, utilEstMonthly: null, listedDaysAgo: null,
    bedrooms: 1, bathrooms: 1, sqft: null, floor: null, buildingType: "", occupancyYear: null,
    heating: "", laundry: "", ac: false, elevator: false,
    amGym: false, amPool: false, amConcierge: false, amPackage: false, amBike: false, amVisitorParking: false,
    amRooftop: false, amPetFriendly: false, petFee: null, amDishwasher: false, amLocker: false,
    scPayBeforeView: false, scNoMeet: false, scWireCryptoGift: false, scBelowMarket: false, scPressure: false, scNoStandardLease: false,
    notes: "", listingUrl: "", dateAdded: new Date().toISOString().slice(0, 10),
  };
}

export function seedExamples(): Listing[] {
  return [
    { ...blankListing(), id: "example-1", isExample: true, name: "King St W condo", neighborhood: "kingwest", status: "researching",
      rent: 2450, bedroomType: "1br", utilHeat: true, utilWater: true, utilHydro: false, utilInternet: false,
      parkingCost: 200, lockerCost: 45, lastMonthDeposit: 2450, keyDeposit: 40, otherDepositAmount: 500, otherDepositDesc: "damage deposit",
      commuteLabel: "work (Financial District)", commuteMinutes: 12, closestStop: "King streetcar",
      bedrooms: 1, bathrooms: 1, sqft: 560, floor: 22, buildingType: "Condo apartment", occupancyYear: 2021,
      heating: "forced air", laundry: "in-unit", ac: true, elevator: true,
      amGym: true, amConcierge: true, amPackage: true, amRooftop: true, amDishwasher: true,
      notes: "Bright, but hydro not included — ask for last winter's average bill." },
    { ...blankListing(), id: "example-2", isExample: true, name: "Danforth 2-bed house share", neighborhood: "danforth", status: "toured",
      rent: 1900, bedroomType: "2br", utilHeat: true, utilWater: true, utilHydro: true, utilInternet: true,
      lastMonthDeposit: 1900, keyDeposit: 20,
      commuteLabel: "downtown campus", commuteMinutes: 28, closestStop: "Chester (Line 2)",
      bedrooms: 2, bathrooms: 1, sqft: 750, floor: 2, buildingType: "House (upper/main floor unit)", occupancyYear: 1948,
      heating: "radiator", laundry: "shared in building", ac: false, elevator: false,
      amPetFriendly: true, petFee: 0, amBike: true,
      notes: "All utilities included — good value once you factor that in. No AC, could be warm in July." },
    { ...blankListing(), id: "example-3", isExample: true, name: "Leslieville 1-bed walk-up", neighborhood: "leslieville", status: "researching",
      rent: 2050, bedroomType: "1br", utilHeat: true, utilWater: true, utilHydro: false, utilInternet: false,
      lastMonthDeposit: 2050, keyDeposit: 25,
      commuteLabel: "work (downtown)", commuteMinutes: 24, closestStop: "501 Queen streetcar",
      bedrooms: 1, bathrooms: 1, sqft: 600, floor: 2, buildingType: "Low-rise apartment (walk-up)", occupancyYear: 2016,
      heating: "forced air", laundry: "in-unit", ac: true, elevator: false,
      amDishwasher: true,
      notes: "No elevator, second floor. Great food street, quieter at night than King West." },
    { ...blankListing(), id: "example-4", isExample: true, listingType: "buy", name: "Etobicoke 2-bed resale condo", neighborhood: "etobicoke", status: "researching",
      price: 640000, condoFees: 640, propertyTaxAnnual: 2850, parkingCost: 0, lockerCost: 0, depositPct: 5, firstTimeBuyer: true,
      reviewedStatusCertificate: false, reserveFundConcern: false, specialAssessmentRecent: false,
      commuteLabel: "work (downtown)", commuteMinutes: 34, closestStop: "Islington (Line 2)",
      bedrooms: 2, bathrooms: 2, sqft: 820, floor: 9, buildingType: "Condo apartment", occupancyYear: 2015,
      heating: "forced air", laundry: "in-unit", ac: true, elevator: true,
      amGym: true, amConcierge: true, amVisitorParking: true,
      notes: "Haven't requested the status certificate yet — do that before removing conditions." },
  ];
}
