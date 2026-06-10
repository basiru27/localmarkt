import { describe, it, expect } from 'vitest';
import { createListingSchema, updateListingSchema } from '../schemas/listing.js';
import { moderateListingSchema } from '../schemas/admin.js';
import { createReportSchema, updateReportStatusSchema } from '../schemas/report.js';

const VALID_LISTING = {
  title: 'Samsung Galaxy S24',
  description: 'Brand new phone',
  price: 15000,
  condition: 'new',
  area_id: 1,
  category_id: 2,
  contact: '+220 3123456',
  negotiable: false,
};

describe('createListingSchema', () => {
  it('accepts valid listing data', () => {
    const result = createListingSchema.safeParse(VALID_LISTING);
    expect(result.success).toBe(true);
  });

  it('accepts listing with optional fields omitted', () => {
    const minimal = {
      title: 'Phone',
      price: 5000,
      condition: 'used_good',
      area_id: 1,
      category_id: 2,
      contact: '+220 3123456',
    };
    const result = createListingSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    expect(result.data.negotiable).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createListingSchema.safeParse({ ...VALID_LISTING, title: 'a' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('title');
    }
  });

  it('rejects negative price', () => {
    const result = createListingSchema.safeParse({ ...VALID_LISTING, price: -100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('price');
    }
  });

  it('rejects zero price', () => {
    const result = createListingSchema.safeParse({ ...VALID_LISTING, price: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid condition', () => {
    const result = createListingSchema.safeParse({ ...VALID_LISTING, condition: 'mint' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone number', () => {
    const result = createListingSchema.safeParse({ ...VALID_LISTING, contact: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 100 characters', () => {
    const result = createListingSchema.safeParse({
      ...VALID_LISTING,
      title: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = createListingSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects images array exceeding 5', () => {
    const result = createListingSchema.safeParse({
      ...VALID_LISTING,
      images: Array(6).fill('https://example.com/image.jpg'),
    });
    expect(result.success).toBe(false);
  });

  it('rejects string price (must be number)', () => {
    const result = createListingSchema.safeParse({
      ...VALID_LISTING,
      price: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateListingSchema', () => {
  it('accepts partial update data', () => {
    const result = updateListingSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone on update', () => {
    const result = updateListingSchema.safeParse({ contact: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('moderateListingSchema', () => {
  it('accepts approved status', () => {
    const result = moderateListingSchema.safeParse({ moderation_status: 'approved' });
    expect(result.success).toBe(true);
  });

  it('accepts rejected status', () => {
    const result = moderateListingSchema.safeParse({ moderation_status: 'rejected' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid moderation status', () => {
    const result = moderateListingSchema.safeParse({ moderation_status: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('createReportSchema', () => {
  it('accepts valid report with listing_id', () => {
    const result = createReportSchema.safeParse({
      listing_id: '00000000-0000-0000-0000-000000000001',
      reason: 'This is a scam',
    });
    expect(result.success).toBe(true);
  });

  it('rejects too-short reason', () => {
    const result = createReportSchema.safeParse({
      listing_id: '00000000-0000-0000-0000-000000000001',
      reason: 'ab',
    });
    expect(result.success).toBe(false);
  });

  it('rejects report with neither listing_id nor reported_user_id', () => {
    const result = createReportSchema.safeParse({ reason: 'Suspicious activity' });
    expect(result.success).toBe(false);
  });
});

describe('updateReportStatusSchema', () => {
  it('accepts valid status values', () => {
    for (const status of ['pending', 'resolved', 'dismissed']) {
      const result = updateReportStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = updateReportStatusSchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });
});
