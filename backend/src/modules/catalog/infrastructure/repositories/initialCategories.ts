import { Category } from '../../domain/entities/Category.js';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_strawberry',
    name: 'Strawberry',
    description: 'Fresh berry delights',
    icon: '🍓',
    visible: true,
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat_mango',
    name: 'Mango',
    description: 'Tropical sweetness',
    icon: '🥭',
    visible: true,
    displayOrder: 2,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'cat_matcha',
    name: 'Matcha',
    description: 'Premium green tea',
    icon: '🍵',
    visible: true,
    displayOrder: 3,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'cat_chocolate',
    name: 'Chocolate',
    description: 'Rich cocoa flavors',
    icon: '🍫',
    visible: true,
    displayOrder: 4,
    createdAt: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'cat_special',
    name: 'Special',
    description: 'Limited edition & seasonal flavors',
    icon: '🌸',
    visible: true,
    displayOrder: 5,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
];
