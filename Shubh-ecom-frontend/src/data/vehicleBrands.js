//src/data/vehicleBrands.js

/**
 * Static vehicle brand data - matches backend MongoDB structure
 * This file will be replaced with API calls through vehicleService
 */

export const vehicleBrands = [
  {
    id: 'maruti',
    name: 'Maruti Suzuki',
    models: [
      {
        id: 'swift',
        name: 'Swift',
        variants: [
          { id: 'swift-vxi', name: 'VXi', yearRange: '2018-2024' },
          { id: 'swift-zxi', name: 'ZXi', yearRange: '2018-2024' },
          { id: 'swift-lxi', name: 'LXi', yearRange: '2018-2024' },
        ],
      },
      {
        id: 'baleno',
        name: 'Baleno',
        variants: [
          { id: 'baleno-delta', name: 'Delta', yearRange: '2019-2024' },
          { id: 'baleno-zeta', name: 'Zeta', yearRange: '2019-2024' },
          { id: 'baleno-alpha', name: 'Alpha', yearRange: '2019-2024' },
        ],
      },
      {
        id: 'dzire',
        name: 'Dzire',
        variants: [
          { id: 'dzire-vxi', name: 'VXi', yearRange: '2017-2024' },
          { id: 'dzire-zxi', name: 'ZXi', yearRange: '2017-2024' },
        ],
      },
    ],
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    models: [
      {
        id: 'creta',
        name: 'Creta',
        variants: [
          { id: 'creta-e', name: 'E', yearRange: '2020-2024' },
          { id: 'creta-ex', name: 'EX', yearRange: '2020-2024' },
          { id: 'creta-sx', name: 'SX', yearRange: '2020-2024' },
        ],
      },
      {
        id: 'i20',
        name: 'i20',
        variants: [
          { id: 'i20-magna', name: 'Magna', yearRange: '2020-2024' },
          { id: 'i20-sportz', name: 'Sportz', yearRange: '2020-2024' },
          { id: 'i20-asta', name: 'Asta', yearRange: '2020-2024' },
        ],
      },
      {
        id: 'venue',
        name: 'Venue',
        variants: [
          { id: 'venue-e', name: 'E', yearRange: '2019-2024' },
          { id: 'venue-s', name: 'S', yearRange: '2019-2024' },
          { id: 'venue-sx', name: 'SX', yearRange: '2019-2024' },
        ],
      },
    ],
  },
  {
    id: 'tata',
    name: 'Tata',
    models: [
      {
        id: 'nexon',
        name: 'Nexon',
        variants: [
          { id: 'nexon-xm', name: 'XM', yearRange: '2020-2024' },
          { id: 'nexon-xz', name: 'XZ', yearRange: '2020-2024' },
          { id: 'nexon-xza', name: 'XZA+', yearRange: '2020-2024' },
        ],
      },
      {
        id: 'punch',
        name: 'Punch',
        variants: [
          { id: 'punch-pure', name: 'Pure', yearRange: '2021-2024' },
          { id: 'punch-adventure', name: 'Adventure', yearRange: '2021-2024' },
          { id: 'punch-creative', name: 'Creative', yearRange: '2021-2024' },
        ],
      },
    ],
  },
  {
    id: 'honda',
    name: 'Honda',
    models: [
      {
        id: 'city',
        name: 'City',
        variants: [
          { id: 'city-v', name: 'V', yearRange: '2020-2024' },
          { id: 'city-vx', name: 'VX', yearRange: '2020-2024' },
          { id: 'city-zx', name: 'ZX', yearRange: '2020-2024' },
        ],
      },
      {
        id: 'amaze',
        name: 'Amaze',
        variants: [
          { id: 'amaze-e', name: 'E', yearRange: '2018-2024' },
          { id: 'amaze-s', name: 'S', yearRange: '2018-2024' },
          { id: 'amaze-vx', name: 'VX', yearRange: '2018-2024' },
        ],
      },
    ],
  },
  {
    id: 'toyota',
    name: 'Toyota',
    models: [
      {
        id: 'innova',
        name: 'Innova Crysta',
        variants: [
          { id: 'innova-gx', name: 'GX', yearRange: '2016-2024' },
          { id: 'innova-vx', name: 'VX', yearRange: '2016-2024' },
          { id: 'innova-zx', name: 'ZX', yearRange: '2016-2024' },
        ],
      },
      {
        id: 'fortuner',
        name: 'Fortuner',
        variants: [
          { id: 'fortuner-4x2', name: '4x2', yearRange: '2016-2024' },
          { id: 'fortuner-4x4', name: '4x4', yearRange: '2016-2024' },
        ],
      },
    ],
  },
  {
    id: 'mahindra',
    name: 'Mahindra',
    models: [
      {
        id: 'xuv700',
        name: 'XUV700',
        variants: [
          { id: 'xuv700-mx', name: 'MX', yearRange: '2021-2024' },
          { id: 'xuv700-ax3', name: 'AX3', yearRange: '2021-2024' },
          { id: 'xuv700-ax5', name: 'AX5', yearRange: '2021-2024' },
          { id: 'xuv700-ax7', name: 'AX7', yearRange: '2021-2024' },
        ],
      },
      {
        id: 'thar',
        name: 'Thar',
        variants: [
          { id: 'thar-ax', name: 'AX', yearRange: '2020-2024' },
          { id: 'thar-lx', name: 'LX', yearRange: '2020-2024' },
        ],
      },
      {
        id: 'scorpio',
        name: 'Scorpio-N',
        variants: [
          { id: 'scorpio-z4', name: 'Z4', yearRange: '2022-2024' },
          { id: 'scorpio-z6', name: 'Z6', yearRange: '2022-2024' },
          { id: 'scorpio-z8', name: 'Z8', yearRange: '2022-2024' },
        ],
      },
    ],
  },
];
