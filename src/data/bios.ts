export type BiosManufacturer = {
  name: string;
  logo: string;
  memLabel: string;
  postDelay: number;
};

const MANUFACTURERS: BiosManufacturer[] = [
  { name: "DELL", logo: "🖥️", memLabel: "Dell Inspiron 15", postDelay: 1200 },
  { name: "HP", logo: "🖥️", memLabel: "HP Pavilion Desktop", postDelay: 1000 },
  { name: "Lenovo", logo: "🖥️", memLabel: "Lenovo ThinkCentre M920", postDelay: 1400 },
  { name: "ASUS", logo: "🖥️", memLabel: "ASUS Desktop M32", postDelay: 1100 },
  { name: "Acer", logo: "🖥️", memLabel: "Acer Aspire TC", postDelay: 1300 },
];

export function getRandomBios(): BiosManufacturer {
  return MANUFACTURERS[Math.floor(Math.random() * MANUFACTURERS.length)];
}

export const BIOS_LIST = MANUFACTURERS;
