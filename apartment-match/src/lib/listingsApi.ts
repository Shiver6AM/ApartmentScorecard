import { supabase } from "./supabaseClient";
import { Listing } from "./types";

// Supabase/Postgres columns are snake_case; the app's data model is camelCase.
// These two functions are the only place that translation happens.

export function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    listingType: (row.listing_type as Listing["listingType"]) ?? "rent",
    name: (row.name as string) ?? "",
    neighborhood: (row.neighborhood as string) ?? "",
    status: (row.status as Listing["status"]) ?? "researching",

    rent: (row.rent as number) ?? null,
    bedroomType: (row.bedroom_type as string) ?? "1br",
    utilHeat: Boolean(row.util_heat),
    utilWater: Boolean(row.util_water),
    utilHydro: Boolean(row.util_hydro),
    utilInternet: Boolean(row.util_internet),
    parkingCost: (row.parking_cost as number) ?? null,
    lockerCost: (row.locker_cost as number) ?? null,
    lastMonthDeposit: (row.last_month_deposit as number) ?? null,
    keyDeposit: (row.key_deposit as number) ?? null,
    otherDepositAmount: (row.other_deposit_amount as number) ?? null,
    otherDepositDesc: (row.other_deposit_desc as string) ?? "",
    applicationFeeAsked: Boolean(row.application_fee_asked),

    price: (row.price as number) ?? null,
    condoFees: (row.condo_fees as number) ?? null,
    propertyTaxAnnual: (row.property_tax_annual as number) ?? null,
    depositPct: (row.deposit_pct as number) ?? null,
    firstTimeBuyer: Boolean(row.first_time_buyer),
    reviewedStatusCertificate: Boolean(row.reviewed_status_certificate),
    reserveFundConcern: Boolean(row.reserve_fund_concern),
    specialAssessmentRecent: Boolean(row.special_assessment_recent),
    byWireToIndividual: Boolean(row.by_wire_to_individual),
    byUnverifiedWireChange: Boolean(row.by_unverified_wire_change),
    byPressuredWaiveConditions: Boolean(row.by_pressured_waive_conditions),
    byNoLawyer: Boolean(row.by_no_lawyer),

    commuteLabel: (row.commute_label as string) ?? "",
    commuteMinutes: (row.commute_minutes as number) ?? null,
    closestStop: (row.closest_stop as string) ?? "",
    sourceUrl: (row.source_url as string) ?? "",
    busyRoadFacing: Boolean(row.busy_road_facing),
    utilEstMonthly: (row.util_est_monthly as number) ?? null,
    listedDaysAgo: (row.listed_days_ago as number) ?? null,

    bedrooms: (row.bedrooms as number) ?? null,
    bathrooms: (row.bathrooms as number) ?? null,
    sqft: (row.sqft as number) ?? null,
    floor: (row.floor as number) ?? null,
    buildingType: (row.building_type as string) ?? "",
    occupancyYear: (row.occupancy_year as number) ?? null,
    heating: (row.heating as string) ?? "",
    laundry: (row.laundry as string) ?? "",
    ac: Boolean(row.ac),
    elevator: Boolean(row.elevator),

    amGym: Boolean(row.am_gym),
    amPool: Boolean(row.am_pool),
    amConcierge: Boolean(row.am_concierge),
    amPackage: Boolean(row.am_package),
    amBike: Boolean(row.am_bike),
    amVisitorParking: Boolean(row.am_visitor_parking),
    amRooftop: Boolean(row.am_rooftop),
    amPetFriendly: Boolean(row.am_pet_friendly),
    petFee: (row.pet_fee as number) ?? null,
    amDishwasher: Boolean(row.am_dishwasher),
    amLocker: Boolean(row.am_locker),

    scPayBeforeView: Boolean(row.sc_pay_before_view),
    scNoMeet: Boolean(row.sc_no_meet),
    scWireCryptoGift: Boolean(row.sc_wire_crypto_gift),
    scBelowMarket: Boolean(row.sc_below_market),
    scPressure: Boolean(row.sc_pressure),
    scNoStandardLease: Boolean(row.sc_no_standard_lease),

    notes: (row.notes as string) ?? "",
    listingUrl: (row.listing_url as string) ?? "",
    dateAdded: (row.date_added as string) ?? new Date().toISOString().slice(0, 10),
  };
}

export function listingToRow(l: Listing): Record<string, unknown> {
  return {
    listing_type: l.listingType,
    name: l.name,
    neighborhood: l.neighborhood,
    status: l.status,

    rent: l.rent,
    bedroom_type: l.bedroomType,
    util_heat: l.utilHeat,
    util_water: l.utilWater,
    util_hydro: l.utilHydro,
    util_internet: l.utilInternet,
    parking_cost: l.parkingCost,
    locker_cost: l.lockerCost,
    last_month_deposit: l.lastMonthDeposit,
    key_deposit: l.keyDeposit,
    other_deposit_amount: l.otherDepositAmount,
    other_deposit_desc: l.otherDepositDesc,
    application_fee_asked: l.applicationFeeAsked,

    price: l.price,
    condo_fees: l.condoFees,
    property_tax_annual: l.propertyTaxAnnual,
    deposit_pct: l.depositPct,
    first_time_buyer: l.firstTimeBuyer,
    reviewed_status_certificate: l.reviewedStatusCertificate,
    reserve_fund_concern: l.reserveFundConcern,
    special_assessment_recent: l.specialAssessmentRecent,
    by_wire_to_individual: l.byWireToIndividual,
    by_unverified_wire_change: l.byUnverifiedWireChange,
    by_pressured_waive_conditions: l.byPressuredWaiveConditions,
    by_no_lawyer: l.byNoLawyer,

    commute_label: l.commuteLabel,
    commute_minutes: l.commuteMinutes,
    closest_stop: l.closestStop,
    source_url: l.sourceUrl,
    busy_road_facing: l.busyRoadFacing,
    util_est_monthly: l.utilEstMonthly,
    listed_days_ago: l.listedDaysAgo,

    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    sqft: l.sqft,
    floor: l.floor,
    building_type: l.buildingType,
    occupancy_year: l.occupancyYear,
    heating: l.heating,
    laundry: l.laundry,
    ac: l.ac,
    elevator: l.elevator,

    am_gym: l.amGym,
    am_pool: l.amPool,
    am_concierge: l.amConcierge,
    am_package: l.amPackage,
    am_bike: l.amBike,
    am_visitor_parking: l.amVisitorParking,
    am_rooftop: l.amRooftop,
    am_pet_friendly: l.amPetFriendly,
    pet_fee: l.petFee,
    am_dishwasher: l.amDishwasher,
    am_locker: l.amLocker,

    sc_pay_before_view: l.scPayBeforeView,
    sc_no_meet: l.scNoMeet,
    sc_wire_crypto_gift: l.scWireCryptoGift,
    sc_below_market: l.scBelowMarket,
    sc_pressure: l.scPressure,
    sc_no_standard_lease: l.scNoStandardLease,

    notes: l.notes,
    listing_url: l.listingUrl,
    date_added: l.dateAdded,
  };
}

export async function fetchListings(): Promise<Listing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToListing);
}

export async function insertListing(l: Listing): Promise<Listing> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.from("listings").insert(listingToRow(l)).select().single();
  if (error) throw error;
  return rowToListing(data);
}

export async function updateListing(id: string, l: Listing): Promise<Listing> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.from("listings").update(listingToRow(l)).eq("id", id).select().single();
  if (error) throw error;
  return rowToListing(data);
}

export async function deleteListingRow(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToListings(onChange: () => void) {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel("listings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => onChange())
    .subscribe();
  return () => { client.removeChannel(channel); };
}
