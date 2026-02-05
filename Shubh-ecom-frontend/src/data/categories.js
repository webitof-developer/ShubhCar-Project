//src/data/categories.js

/**
 * Static category data - matches backend MongoDB structure
 * This file will be replaced with API calls through categoryService
 */

export const categories = [
  // Root categories (isActive: true by default)
  { id: 'brakes', name: 'Brake Parts', slug: 'brake-parts', icon: 'Disc3', iconUrl: '/icons/brakes.svg', description: 'Complete brake system parts', productCount: 245, parentId: null, isActive: true },
  { id: 'engine', name: 'Engine Parts', slug: 'engine-parts', icon: 'Cog', iconUrl: '/icons/engine.svg', description: 'Engine components and assemblies', productCount: 312, parentId: null, isActive: true },
  { id: 'filters', name: 'Filters', slug: 'filters', icon: 'Filter', iconUrl: '/icons/filters.svg', description: 'Air, oil, and fuel filters', productCount: 189, parentId: null, isActive: true },
  { id: 'suspension', name: 'Suspension', slug: 'suspension', icon: 'ArrowDownUp', iconUrl: '/icons/suspension.svg', description: 'Suspension and steering parts', productCount: 156, parentId: null, isActive: true },
  { id: 'electricals', name: 'Electricals', slug: 'electricals', icon: 'Zap', iconUrl: '/icons/electricals.svg', description: 'Electrical and lighting components', productCount: 278, parentId: null, isActive: true },
  { id: 'body', name: 'Body Parts', slug: 'body-parts', icon: 'Car', iconUrl: '/icons/body.svg', description: 'Exterior body panels and trim', productCount: 423, parentId: null, isActive: true },

  // Brake Parts sub-categories
  { id: 'brake-pads', name: 'Brake Pads', slug: 'brake-pads', productCount: 89, parentId: 'brakes', isActive: true },
  { id: 'brake-discs', name: 'Brake Discs', slug: 'brake-discs', productCount: 67, parentId: 'brakes', isActive: true },
  { id: 'calipers', name: 'Calipers', slug: 'calipers', productCount: 45, parentId: 'brakes', isActive: true },
  { id: 'brake-fluid', name: 'Brake Fluid', slug: 'brake-fluid', productCount: 44, parentId: 'brakes', isActive: true },
  // Brake Pads sub-sub-categories
  { id: 'ceramic-pads', name: 'Ceramic Pads', slug: 'ceramic-pads', productCount: 34, parentId: 'brake-pads', isActive: true },
  { id: 'semi-metallic-pads', name: 'Semi-Metallic Pads', slug: 'semi-metallic-pads', productCount: 28, parentId: 'brake-pads', isActive: true },
  { id: 'organic-pads', name: 'Organic Pads', slug: 'organic-pads', productCount: 27, parentId: 'brake-pads', isActive: true },

  // Engine Parts sub-categories
  { id: 'pistons', name: 'Pistons', slug: 'pistons', productCount: 78, parentId: 'engine', isActive: true },
  { id: 'timing-belt', name: 'Timing Belts', slug: 'timing-belt', productCount: 56, parentId: 'engine', isActive: true },
  { id: 'gaskets', name: 'Gaskets', slug: 'gaskets', productCount: 98, parentId: 'engine', isActive: true },
  { id: 'spark-plugs', name: 'Spark Plugs', slug: 'spark-plugs', productCount: 80, parentId: 'engine', isActive: true },

  // Filters sub-categories
  { id: 'air-filter', name: 'Air Filters', slug: 'air-filter', productCount: 65, parentId: 'filters', isActive: true },
  { id: 'oil-filter', name: 'Oil Filters', slug: 'oil-filter', productCount: 72, parentId: 'filters', isActive: true },
  { id: 'fuel-filter', name: 'Fuel Filters', slug: 'fuel-filter', productCount: 52, parentId: 'filters', isActive: true },

  // Suspension sub-categories
  { id: 'shock-absorbers', name: 'Shock Absorbers', slug: 'shock-absorbers', productCount: 68, parentId: 'suspension', isActive: true },
  { id: 'struts', name: 'Struts', slug: 'struts', productCount: 45, parentId: 'suspension', isActive: true },
  { id: 'bushings', name: 'Bushings', slug: 'bushings', productCount: 43, parentId: 'suspension', isActive: true },

  // Electricals sub-categories
  { id: 'headlights', name: 'Headlights', slug: 'headlights', productCount: 89, parentId: 'electricals', isActive: true },
  { id: 'alternators', name: 'Alternators', slug: 'alternators', productCount: 56, parentId: 'electricals', isActive: true },
  { id: 'starters', name: 'Starters', slug: 'starters', productCount: 67, parentId: 'electricals', isActive: true },
  { id: 'batteries', name: 'Batteries', slug: 'batteries', productCount: 66, parentId: 'electricals', isActive: true },

  // Body Parts sub-categories
  { id: 'bumpers', name: 'Bumpers', slug: 'bumpers', productCount: 112, parentId: 'body', isActive: true },
  { id: 'mirrors', name: 'Mirrors', slug: 'mirrors', productCount: 89, parentId: 'body', isActive: true },
  { id: 'fenders', name: 'Fenders', slug: 'fenders', productCount: 78, parentId: 'body', isActive: true },
  { id: 'grilles', name: 'Grilles', slug: 'grilles', productCount: 67, parentId: 'body', isActive: true },
  { id: 'hoods', name: 'Hoods', slug: 'hoods', productCount: 77, parentId: 'body', isActive: true },
];
