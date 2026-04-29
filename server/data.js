const CASES = [
  {
    id: 1,
    name: "Новичок",
    price: 59,
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    items: [
      { name: "P250 | Sand Dune", rarity: "consumer", value: 15, chance: 40 },
      { name: "UMP-45 | Delusion", rarity: "mil-spec", value: 40, chance: 28 },
      { name: "AK-47 | Elite Build", rarity: "restricted", value: 95, chance: 18 },
      { name: "M4A1-S | Decimator", rarity: "classified", value: 220, chance: 10 },
      { name: "AWP | Asiimov", rarity: "covert", value: 510, chance: 4 }
    ]
  },
  {
    id: 2,
    name: "Солдатик",
    price: 444,
    image:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
    items: [
      { name: "Desert Eagle | Kumicho Dragon", rarity: "restricted", value: 290, chance: 38 },
      { name: "AK-47 | Neon Rider", rarity: "classified", value: 420, chance: 30 },
      { name: "M4A4 | The Emperor", rarity: "classified", value: 580, chance: 17 },
      { name: "AWP | Hyper Beast", rarity: "covert", value: 980, chance: 11 },
      { name: "Karambit | Lore", rarity: "knife", value: 3500, chance: 4 }
    ]
  },
  {
    id: 3,
    name: "Император",
    price: 1999,
    image:
      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=600&q=80",
    items: [
      { name: "AK-47 | Bloodsport", rarity: "classified", value: 1700, chance: 34 },
      { name: "M4A1-S | Printstream", rarity: "covert", value: 2200, chance: 28 },
      { name: "AWP | Lightning Strike", rarity: "covert", value: 3100, chance: 20 },
      { name: "Butterfly Knife | Slaughter", rarity: "knife", value: 6900, chance: 12 },
      { name: "Sport Gloves | Hedge Maze", rarity: "gloves", value: 18500, chance: 6 }
    ]
  }
];

function pickItem(caseData) {
  const max = caseData.items.reduce((sum, item) => sum + item.chance, 0);
  let random = Math.random() * max;

  for (const item of caseData.items) {
    random -= item.chance;
    if (random <= 0) {
      return item;
    }
  }

  return caseData.items[caseData.items.length - 1];
}

module.exports = {
  CASES,
  pickItem
};
