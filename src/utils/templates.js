export const TEMPLATES = [
  {
    id: 'groceries',
    name: 'Grocery',
    icon: '🛒',
    color: 'green',
    items: [
      { text: 'Milk', tags: ['errand'] },
      { text: 'Eggs', tags: ['errand'] },
      { text: 'Bread', tags: ['errand'] },
      { text: 'Fruit & vegetables', tags: ['errand'] },
    ],
  },
  {
    id: 'packing',
    name: 'Weekly packing',
    icon: '✈️',
    color: 'blue',
    items: [
      { text: 'Clothes for the week', tags: ['personal'] },
      { text: 'Toiletries', tags: ['personal'] },
      { text: 'Chargers & cables', tags: ['personal'] },
      { text: 'Travel documents', tags: ['urgent'] },
    ],
  },
  {
    id: 'reading',
    name: 'Reading',
    icon: '📚',
    color: 'amber',
    items: [
      { text: 'Current book', description: 'Add title and notes', tags: ['personal'] },
      { text: 'Next up', tags: ['idea'] },
      { text: 'Articles to catch up on', tags: ['work'] },
    ],
  },
];
