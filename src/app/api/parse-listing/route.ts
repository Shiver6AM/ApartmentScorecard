import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Listing } from "@/lib/types";

// Best-effort auto-fill: given a realtor.ca or rentals.ca listing URL, fetch the page
// server-side (avoids browser CORS) and pull out whatever fields we can find. Real estate
// sites change their markup often and some render listing data client-side via JS that a
// plain fetch can't see, so this deliberately layers a few strategies — structured JSON-LD
// first (most reliable when present), then Open Graph / meta text, then loose regex over
// that text — and simply returns fewer fields rather than failing when a layer comes up
// empty. The user always reviews and fills in the rest by hand.

type ParsedFields = Partial<Listing>;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function toNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1] : null;
}

function bedroomTypeFromCount(n: number): Listing["bedroomType"] {
  if (n <= 0) return "studio";
  if (n === 1) return "1br";
  if (n === 2) return "2br";
  return "3br";
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asString(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

// Walks one JSON-LD node (and any nested @graph) pulling out real-estate-ish fields.
// Only fills a field the caller hasn't already found, so earlier (more specific) nodes win.
function applyJsonLd(node: unknown, fields: ParsedFields, found: Set<string>) {
  const item = asRecord(node);
  if (!item) return;

  const graph = item["@graph"];
  if (Array.isArray(graph)) {
    for (const g of graph) applyJsonLd(g, fields, found);
  }

  if (!fields.name) {
    const name = asString(item.name);
    if (name) {
      fields.name = name.slice(0, 120);
      found.add("name");
    } else {
      const address = item.address;
      const addrRec = asRecord(address);
      const addrStr = typeof address === "string" ? address
        : addrRec ? [asString(addrRec.streetAddress), asString(addrRec.addressLocality)].filter(Boolean).join(", ")
        : null;
      if (addrStr) {
        fields.name = addrStr.slice(0, 120);
        found.add("name");
      }
    }
  }

  if (fields.rent == null && fields.price == null) {
    const offersRaw = item.offers;
    const offer = Array.isArray(offersRaw) ? asRecord(offersRaw[0]) : asRecord(offersRaw);
    const priceNum = offer ? toNumber(asString(offer.price)) : null;
    if (priceNum) {
      if (priceNum < 20000) {
        fields.listingType = "rent";
        fields.rent = priceNum;
        found.add("rent");
      } else {
        fields.listingType = "buy";
        fields.price = priceNum;
        found.add("price");
      }
    }
  }

  if (fields.bedrooms == null) {
    const n = Number(item.numberOfBedrooms ?? item.numberOfRooms);
    if (Number.isFinite(n) && n >= 0) {
      fields.bedrooms = n;
      fields.bedroomType = bedroomTypeFromCount(n);
      found.add("bedrooms");
    }
  }

  if (fields.bathrooms == null) {
    const n = Number(item.numberOfBathroomsTotal ?? item.numberOfBathrooms);
    if (Number.isFinite(n) && n >= 0) {
      fields.bathrooms = n;
      found.add("bathrooms");
    }
  }

  if (fields.sqft == null) {
    const floorSize = item.floorSize;
    const rec = asRecord(floorSize);
    const val = rec ? rec.value : floorSize;
    const n = toNumber(asString(val));
    if (n) {
      fields.sqft = n;
      found.add("sqft");
    }
  }
}

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const url = (body.url || "").trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: "Paste a listing URL first." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, error: "That doesn't look like a valid URL." }, { status: 400 });
  }

  const host = parsedUrl.hostname.replace(/^www\./, "");
  const isRealtor = host === "realtor.ca";
  const isRentals = host === "rentals.ca";
  if (!isRealtor && !isRentals) {
    return NextResponse.json({
      ok: false,
      error: "Auto-fill currently supports realtor.ca and rentals.ca links only — paste one of those, or fill the form in by hand.",
    });
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: `The site returned an error (HTTP ${res.status}) — the listing may no longer be live, or the site blocked the request.`,
      });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({
      ok: false,
      error: "Couldn't reach that page. It may be down, slow, or blocking automated requests.",
    });
  }

  const $ = cheerio.load(html);
  const fields: ParsedFields = {};
  const found = new Set<string>();

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const data: unknown = JSON.parse(raw);
      if (Array.isArray(data)) data.forEach((d) => applyJsonLd(d, fields, found));
      else applyJsonLd(data, fields, found);
    } catch {
      // malformed JSON-LD on the page — ignore and fall through to text heuristics
    }
  });

  const ogTitle = $('meta[property="og:title"]').attr("content") || $("title").first().text() || "";
  const ogDescription =
    $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
  const combinedText = `${ogTitle}\n${ogDescription}`;

  if (!fields.name && ogTitle) {
    const cleaned = ogTitle.split(/[|–—]/)[0].trim();
    if (cleaned) {
      fields.name = cleaned.slice(0, 120);
      found.add("name");
    }
  }

  if (fields.rent == null && fields.price == null) {
    const priceNum = toNumber(firstMatch(combinedText, /\$\s?([\d,]{3,10})/));
    if (priceNum) {
      const isRentKeyword = /for rent|rental/i.test(combinedText);
      const isSaleKeyword = /for sale/i.test(combinedText);
      const looksLikeRent = isRentals || isRentKeyword || (!isSaleKeyword && priceNum < 10000);
      if (looksLikeRent) {
        fields.listingType = "rent";
        fields.rent = priceNum;
        found.add("rent");
      } else {
        fields.listingType = "buy";
        fields.price = priceNum;
        found.add("price");
      }
    }
  }

  if (fields.bedrooms == null) {
    const bedStr = firstMatch(combinedText, /(\d+(?:\.\d)?)\s*(?:bed|bd|bdrm)/i);
    if (bedStr) {
      const n = Number(bedStr);
      fields.bedrooms = n;
      fields.bedroomType = bedroomTypeFromCount(n);
      found.add("bedrooms");
    } else if (/\bstudio\b/i.test(combinedText)) {
      fields.bedrooms = 0;
      fields.bedroomType = "studio";
      found.add("bedrooms");
    }
  }

  if (fields.bathrooms == null) {
    const bathStr = firstMatch(combinedText, /(\d+(?:\.\d)?)\s*(?:bath|ba\b)/i);
    if (bathStr) {
      fields.bathrooms = Number(bathStr);
      found.add("bathrooms");
    }
  }

  if (fields.sqft == null) {
    const sqftNum = toNumber(firstMatch(combinedText, /([\d,]{2,6})\s*(?:sq\s?\.?\s?ft|sqft|square feet)/i));
    if (sqftNum) {
      fields.sqft = sqftNum;
      found.add("sqft");
    }
  }

  if (isRentals && !fields.listingType) fields.listingType = "rent";
  fields.sourceUrl = url;
  fields.listingUrl = url;

  if (found.size === 0) {
    return NextResponse.json({
      ok: false,
      error:
        "Couldn't find any usable details on that page — it may load its listing data with JavaScript after the page loads, which this can't see, or the listing may have expired. You'll need to fill the form in by hand this time.",
    });
  }

  return NextResponse.json({ ok: true, fields, found: Array.from(found) });
}
