
export const UserRole = {
  USER: 'user',
  OWNER: 'owner',
  ADMIN: 'admin'
};

export const MOCK_HOTELS = [
  {
    id: '1',
    name: 'The Azure Peninsula',
    city: 'Santorini',
    state: 'Cyclades',
    price: 450,
    rating: 4.9,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
    tags: ['Infinity Pool', 'Luxury'],
    description: 'A breathtaking escape perched on the edge of the caldera, offering unmatched views of the Aegean Sea.'
  },
  {
    id: '2',
    name: 'Lakeside Serenity',
    city: 'Lake Como',
    state: 'Lombardy',
    price: 320,
    rating: 4.7,
    reviews: 84,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    tags: ['Breakfast', 'Private Dock'],
    description: 'Elegant historical villa with lush gardens and direct access to the tranquil waters of Lake Como.'
  },
  {
    id: '3',
    name: 'Urban Oasis Loft',
    city: 'New York',
    state: 'NY',
    price: 210,
    rating: 4.5,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1555854816-809d28f9a215?w=800&q=80',
    tags: ['City View', 'Modern'],
    description: 'A stylish industrial loft in the heart of SoHo, featuring sky-high ceilings and boutique amenities.'
  }
];

export const BACKEND_ERRORS = [
  { file: 'controllers/hotelController.js', error: 'Missing authentication middleware on POST /api/hotels', severity: 'critical' },
  { file: 'models/Booking.js', error: 'Unoptimized query: indexing missing on userId field', severity: 'warning' },
  { file: 'utils/email.js', error: 'Hardcoded SMTP credentials detected in source code', severity: 'critical' },
  { file: 'routes/userRoutes.js', error: 'Unused import statement found at line 12', severity: 'warning' },
  { file: 'app.js', error: 'Express JSON parser missing limit, susceptible to large payload attacks', severity: 'critical' }
];
