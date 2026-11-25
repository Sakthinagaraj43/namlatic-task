import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import crypto from 'node:crypto';
import {
  createHotelRecord,
  deleteHotelRecord,
  getHotelById,
  listHotels,
  updateHotelRecord,
} from '../store.ts';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_EXTENSIONS[file.mimetype] || '.jpg';
    cb(null, `hotel-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !validExt) {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
      return;
    }
    cb(null, true);
  },
});

async function removeUploadedFileIfLocal(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith('/uploads/')) return;
  const filename = path.basename(imageUrl);
  const resolvedPath = path.resolve(UPLOADS_DIR, filename);
  if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep)) {
    return;
  }
  try {
    await fs.unlink(resolvedPath);
  } catch {
    // Ignore missing file on cleanup
  }
}

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  parsed?: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    price: number;
  };
}

function validateHotelFields(body: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const price = Number(body.price);

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length < 3 || title.length > 100) {
    errors.title = 'Title must be between 3 and 100 characters.';
  }

  if (!description) {
    errors.description = 'Description is required.';
  } else if (description.length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }

  if (body.latitude === undefined || body.latitude === '' || !Number.isFinite(latitude)) {
    errors.latitude = 'Latitude is required and must be a valid number.';
  } else if (latitude < -90 || latitude > 90) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }

  if (body.longitude === undefined || body.longitude === '' || !Number.isFinite(longitude)) {
    errors.longitude = 'Longitude is required and must be a valid number.';
  } else if (longitude < -180 || longitude > 180) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }

  if (body.price === undefined || body.price === '' || !Number.isFinite(price)) {
    errors.price = 'Price is required and must be a valid number.';
  } else if (price <= 0) {
    errors.price = 'Price must be greater than 0.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    parsed: { title, description, latitude, longitude, price },
  };
}

function handleMulterUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('image')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: 'Image file size must not exceed 2MB.',
          errors: { image: 'Image file size must not exceed 2MB.' },
        });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : 'Invalid file upload.';
    res.status(400).json({ error: message, errors: { image: message } });
  });
}

export const hotelsRouter = express.Router();

// GET /api/hotels?search=&minPrice=&maxPrice=&page=&limit=
hotelsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const minPriceRaw = typeof req.query.minPrice === 'string' ? req.query.minPrice.trim() : '';
    const maxPriceRaw = typeof req.query.maxPrice === 'string' ? req.query.maxPrice.trim() : '';
    const minPrice = minPriceRaw !== '' ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw !== '' ? Number(maxPriceRaw) : undefined;
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.max(1, Math.min(50, Number.parseInt(String(req.query.limit || '6'), 10) || 6));

    const result = await listHotels({ search, minPrice, maxPrice, page, limit });
    res.json(result);
  } catch (error) {
    console.error('Failed to list hotels:', error);
    res.status(500).json({ error: 'Unable to load hotels. Please try again.' });
  }
});

// GET /api/hotels/:id
hotelsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const hotel = await getHotelById(id);
    if (!hotel) {
      res.status(404).json({ error: 'Hotel not found.' });
      return;
    }
    res.json({ data: hotel });
  } catch (error) {
    console.error('Failed to fetch hotel:', error);
    res.status(500).json({ error: 'Unable to load hotel details.' });
  }
});

// POST /api/hotels
hotelsRouter.post('/', handleMulterUpload, async (req: Request, res: Response) => {
  try {
    const validation = validateHotelFields(req.body as Record<string, unknown>);
    if (!req.file) {
      validation.errors.image = 'Hotel image is required (JPG, PNG, or WebP, max 2MB).';
      validation.valid = false;
    }

    if (!validation.valid || !validation.parsed || !req.file) {
      if (req.file) {
        await removeUploadedFileIfLocal(`/uploads/${req.file.filename}`);
      }
      res.status(400).json({
        error: 'Please check the form fields for errors.',
        errors: validation.errors,
      });
      return;
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const created = await createHotelRecord({
      ...validation.parsed,
      imageUrl,
    });

    res.status(201).json({
      data: created,
      message: 'Hotel created successfully.',
    });
  } catch (error) {
    if (req.file) {
      await removeUploadedFileIfLocal(`/uploads/${req.file.filename}`);
    }
    console.error('Failed to create hotel:', error);
    res.status(500).json({ error: 'Failed to create hotel. Please try again.' });
  }
});

// PUT /api/hotels/:id
hotelsRouter.put('/:id', handleMulterUpload, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const validation = validateHotelFields(req.body as Record<string, unknown>);

    if (!validation.valid || !validation.parsed) {
      if (req.file) {
        await removeUploadedFileIfLocal(`/uploads/${req.file.filename}`);
      }
      res.status(400).json({
        error: 'Please check the form fields for errors.',
        errors: validation.errors,
      });
      return;
    }

    const newImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const result = await updateHotelRecord(id, {
      ...validation.parsed,
      imageUrl: newImageUrl,
    });

    if (!result) {
      if (req.file) {
        await removeUploadedFileIfLocal(`/uploads/${req.file.filename}`);
      }
      res.status(404).json({ error: 'Hotel not found.' });
      return;
    }

    if (newImageUrl && result.previousImageUrl !== newImageUrl) {
      await removeUploadedFileIfLocal(result.previousImageUrl);
    }

    res.json({
      data: result.updated,
      message: 'Hotel updated successfully.',
    });
  } catch (error) {
    if (req.file) {
      await removeUploadedFileIfLocal(`/uploads/${req.file.filename}`);
    }
    console.error('Failed to update hotel:', error);
    res.status(500).json({ error: 'Failed to update hotel. Please try again.' });
  }
});

// DELETE /api/hotels/:id
hotelsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const removed = await deleteHotelRecord(id);
    if (!removed) {
      res.status(404).json({ error: 'Hotel not found.' });
      return;
    }
    await removeUploadedFileIfLocal(removed.imageUrl);
    res.json({
      message: 'Hotel deleted successfully.',
      id: removed.id,
    });
  } catch (error) {
    console.error('Failed to delete hotel:', error);
    res.status(500).json({ error: 'Failed to delete hotel. Please try again.' });
  }
});
