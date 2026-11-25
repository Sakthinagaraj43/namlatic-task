import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Hotel, HotelQueryParams, PaginatedHotelsResult } from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'hotels.json');

const SEED_HOTELS: Hotel[] = [
  {
    id: 'hotel-kyoto-komorebi',
    title: 'Komorebi Cedar Ryokan',
    description:
      'Set along a quiet moss-lined lane in Kyoto Higashiyama ward, Komorebi blends traditional sugi-cedar joinery with private hinoki soaking tubs overlooking a lantern-lit koi pond.',
    latitude: 35.0037,
    longitude: 135.7785,
    price: 540,
    imageUrl: '/src/assets/images/hotel_kyoto_ryokan_1795583313299.jpg',
    createdAt: '2026-10-12T09:00:00.000Z',
    updatedAt: '2026-10-12T09:00:00.000Z',
  },
  {
    id: 'hotel-amalfi-solaria',
    title: 'Villa Solaria Cliffside',
    description:
      'Carved into the limestone terraces above Positano, Villa Solaria offers sun-drenched vaulted suites, private citrus gardens, and panoramic dining terraces above the Tyrrhenian Sea.',
    latitude: 40.6281,
    longitude: 14.485,
    price: 780,
    imageUrl: '/src/assets/images/hotel_amalfi_cliffside_1795583313712.jpg',
    createdAt: '2026-10-14T11:30:00.000Z',
    updatedAt: '2026-10-14T11:30:00.000Z',
  },
  {
    id: 'hotel-zermatt-kamm',
    title: 'Kamm Alpine Timber Lodge',
    description:
      'An intimate ski-in sanctuary in Zermatt framed in charred larch and floor-to-ceiling glazing, featuring wood-burning hearth suites and direct Matterhorn ridge views.',
    latitude: 46.0207,
    longitude: 7.7491,
    price: 620,
    imageUrl: '/src/assets/images/hotel_swiss_chalet_1795583314231.jpg',
    createdAt: '2026-10-16T15:20:00.000Z',
    updatedAt: '2026-10-16T15:20:00.000Z',
  },
  {
    id: 'hotel-marrakech-zelligia',
    title: 'Riad Zelligia Courtyard',
    description:
      'Restored from a 19th-century merchant courtyard in the Marrakech Medina, this serene residence centers on an emerald zellige plunge pool shaded by Seville orange trees.',
    latitude: 31.6295,
    longitude: -7.9811,
    price: 310,
    imageUrl: '/src/assets/images/hotel_marrakech_riad_1795583314598.jpg',
    createdAt: '2026-10-18T08:45:00.000Z',
    updatedAt: '2026-10-18T08:45:00.000Z',
  },
  {
    id: 'hotel-nordic-lyngen',
    title: 'Lyngen Fjord Pavilion',
    description:
      'Cantilevered over granite shoreline along Norway Aurlandsfjord, Lyngen Pavilion pairs minimalist Nordic oak interiors with private fjord-water sauna decks.',
    latitude: 60.9052,
    longitude: 7.1894,
    price: 495,
    imageUrl: '/src/assets/images/hotel_nordic_fjord_1795583314945.jpg',
    createdAt: '2026-10-20T14:10:00.000Z',
    updatedAt: '2026-10-20T14:10:00.000Z',
  },
  {
    id: 'hotel-lisbon-miradouro',
    title: 'Casa do Miradouro House',
    description:
      'Occupying a sunlit ochre townhouse in Alfama, Casa do Miradouro welcomes travelers with hand-painted azulejo salons and a rooftop terrace overlooking the Tagus River.',
    latitude: 38.7117,
    longitude: -9.1303,
    price: 275,
    imageUrl: '/src/assets/images/hotel_lisbon_townhouse_1795583315395.jpg',
    createdAt: '2026-10-22T10:15:00.000Z',
    updatedAt: '2026-10-22T10:15:00.000Z',
  },
  {
    id: 'hotel-big-sur-ventis',
    title: 'Ventis Redwood Cliff Retreat',
    description:
      'Perched high on Big Sur rugged coastal bluffs, Ventis combines salvaged redwood architecture, salt-mist infinity pools, and quiet trails winding through ancient coastal pines.',
    latitude: 36.2469,
    longitude: -121.7717,
    price: 890,
    imageUrl: '/src/assets/images/hotel_big_sur_retreat_1795583315323.jpg',
    createdAt: '2026-10-24T17:00:00.000Z',
    updatedAt: '2026-10-24T17:00:00.000Z',
  },
];

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(SEED_HOTELS, null, 2), 'utf8');
  }
}

async function readHotels(): Promise<Hotel[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Hotel[]) : [];
}

async function writeHotels(hotels: Hotel[]): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmpFile = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(hotels, null, 2), 'utf8');
    await fs.rename(tmpFile, DATA_FILE);
  });
  return writeQueue;
}

export async function listHotels(params: HotelQueryParams): Promise<PaginatedHotelsResult> {
  const all = await readHotels();
  const searchTerm = params.search?.trim().toLowerCase() || '';

  const filtered = all.filter((hotel) => {
    if (searchTerm && !hotel.title.toLowerCase().includes(searchTerm)) {
      return false;
    }
    if (typeof params.minPrice === 'number' && !Number.isNaN(params.minPrice)) {
      if (hotel.price < params.minPrice) return false;
    }
    if (typeof params.maxPrice === 'number' && !Number.isNaN(params.maxPrice)) {
      if (hotel.price > params.maxPrice) return false;
    }
    return true;
  });

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const limit = Math.max(1, Math.min(50, params.limit));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.max(1, Math.min(params.page, totalPages));
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  const all = await readHotels();
  return all.find((h) => h.id === id) ?? null;
}

export async function createHotelRecord(input: {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  price: number;
  imageUrl: string;
}): Promise<Hotel> {
  const all = await readHotels();
  const now = new Date().toISOString();
  const newHotel: Hotel = {
    id: `hotel-${crypto.randomUUID().slice(0, 8)}`,
    title: input.title,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    price: input.price,
    imageUrl: input.imageUrl,
    createdAt: now,
    updatedAt: now,
  };
  all.unshift(newHotel);
  await writeHotels(all);
  return newHotel;
}

export async function updateHotelRecord(
  id: string,
  input: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    price: number;
    imageUrl?: string;
  }
): Promise<{ updated: Hotel; previousImageUrl: string } | null> {
  const all = await readHotels();
  const index = all.findIndex((h) => h.id === id);
  if (index === -1) return null;

  const existing = all[index];
  const updated: Hotel = {
    ...existing,
    title: input.title,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    price: input.price,
    imageUrl: input.imageUrl ?? existing.imageUrl,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  await writeHotels(all);
  return { updated, previousImageUrl: existing.imageUrl };
}

export async function deleteHotelRecord(id: string): Promise<Hotel | null> {
  const all = await readHotels();
  const index = all.findIndex((h) => h.id === id);
  if (index === -1) return null;

  const [removed] = all.splice(index, 1);
  await writeHotels(all);
  return removed;
}
