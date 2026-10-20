export type ToolCategory = "image" | "calculators" | "converters" | "electrical";

export interface CategoryMeta {
  key: ToolCategory;
  label: string;
  path: string;
  description: string;
}

export const CATEGORIES: Record<ToolCategory, CategoryMeta> = {
  image: {
    key: "image",
    label: "Image Tools",
    path: "/tools/image",
    description: "Convert, compress, and resize images. Most operations run locally in your browser.",
  },
  calculators: {
    key: "calculators",
    label: "Everyday Calculators",
    path: "/tools/calculators",
    description: "Percentage, age, date, and discount calculators for everyday math.",
  },
  converters: {
    key: "converters",
    label: "Unit Converters",
    path: "/tools/converters",
    description: "Convert length, mass/weight, temperature, and area between common units.",
  },
  electrical: {
    key: "electrical",
    label: "Electrical Calculators",
    path: "/tools/electrical",
    description: "Ohm's law, power, resistance, and energy-cost calculators for DC and AC circuits.",
  },
};

export type ProcessingLocation = "local" | "local-or-server";

export interface ToolMeta {
  slug: string;
  category: ToolCategory;
  title: string;
  shortDescription: string;
  path: string;
  keywords: string[];
  processing?: ProcessingLocation;
}

export const TOOLS: ToolMeta[] = [
  // Image tools
  {
    slug: "png-to-jpg",
    category: "image",
    title: "PNG to JPG Converter",
    shortDescription: "Convert PNG images to JPG, with control over the background color used for transparency.",
    path: "/tools/image/png-to-jpg",
    keywords: ["png", "jpg", "jpeg", "convert", "image"],
    processing: "local-or-server",
  },
  {
    slug: "to-webp",
    category: "image",
    title: "JPG/PNG to WebP Converter",
    shortDescription: "Convert JPG or PNG images to the modern WebP format for smaller file sizes.",
    path: "/tools/image/to-webp",
    keywords: ["jpg", "png", "webp", "convert", "image"],
    processing: "local-or-server",
  },
  {
    slug: "webp-to-png",
    category: "image",
    title: "WebP to PNG Converter",
    shortDescription: "Convert WebP images to PNG, preserving transparency.",
    path: "/tools/image/webp-to-png",
    keywords: ["webp", "png", "convert", "image"],
    processing: "local-or-server",
  },
  {
    slug: "webp-to-jpg",
    category: "image",
    title: "WebP to JPG Converter",
    shortDescription: "Convert WebP images to JPG, with control over the background color used for transparency.",
    path: "/tools/image/webp-to-jpg",
    keywords: ["webp", "jpg", "jpeg", "convert", "image"],
    processing: "local-or-server",
  },
  {
    slug: "compressor",
    category: "image",
    title: "Image Compressor",
    shortDescription: "Reduce JPG or WebP file size with an adjustable quality slider.",
    path: "/tools/image/compressor",
    keywords: ["compress", "jpg", "webp", "quality", "file size", "image"],
    processing: "local-or-server",
  },
  {
    slug: "resizer",
    category: "image",
    title: "Image Resizer",
    shortDescription: "Resize an image to exact dimensions, with an optional aspect-ratio lock.",
    path: "/tools/image/resizer",
    keywords: ["resize", "dimensions", "aspect ratio", "image"],
    processing: "local-or-server",
  },

  // Everyday calculators
  {
    slug: "percentage",
    category: "calculators",
    title: "Percentage Calculator",
    shortDescription: "X% of Y, what percent X is of Y, and percentage change between two values.",
    path: "/tools/calculators/percentage",
    keywords: ["percent", "percentage", "percentage change"],
  },
  {
    slug: "age",
    category: "calculators",
    title: "Age Calculator",
    shortDescription: "Calculate exact age in years, months, and days from a birth date.",
    path: "/tools/calculators/age",
    keywords: ["age", "birthday", "years old"],
  },
  {
    slug: "date-difference",
    category: "calculators",
    title: "Date Difference Calculator",
    shortDescription: "Find the number of days, weeks, months, and years between two dates.",
    path: "/tools/calculators/date-difference",
    keywords: ["date", "days between", "duration"],
  },
  {
    slug: "discount",
    category: "calculators",
    title: "Discount Calculator",
    shortDescription: "Calculate the final price and savings after a percentage discount.",
    path: "/tools/calculators/discount",
    keywords: ["discount", "sale", "percent off", "price"],
  },

  // Unit converters
  {
    slug: "length",
    category: "converters",
    title: "Length Converter",
    shortDescription: "Convert between millimeters, meters, kilometers, inches, feet, yards, and miles.",
    path: "/tools/converters/length",
    keywords: ["length", "distance", "meters", "feet", "inches"],
  },
  {
    slug: "mass",
    category: "converters",
    title: "Mass / Weight Converter",
    shortDescription: "Convert between grams, kilograms, tonnes, ounces, pounds, and stone.",
    path: "/tools/converters/mass",
    keywords: ["mass", "weight", "kilograms", "pounds", "grams"],
  },
  {
    slug: "temperature",
    category: "converters",
    title: "Temperature Converter",
    shortDescription: "Convert between Celsius, Fahrenheit, and Kelvin, including negative values.",
    path: "/tools/converters/temperature",
    keywords: ["temperature", "celsius", "fahrenheit", "kelvin"],
  },
  {
    slug: "area",
    category: "converters",
    title: "Area Converter",
    shortDescription: "Convert between square meters, square feet, acres, hectares, and more.",
    path: "/tools/converters/area",
    keywords: ["area", "square meters", "acres", "hectares"],
  },

  // Electrical calculators
  {
    slug: "ohms-law",
    category: "electrical",
    title: "Ohm's Law Calculator",
    shortDescription: "Solve for voltage, current, or resistance in DC and resistive circuits.",
    path: "/tools/electrical/ohms-law",
    keywords: ["ohms law", "voltage", "current", "resistance", "dc"],
  },
  {
    slug: "power",
    category: "electrical",
    title: "Electrical Power & Current Calculator",
    shortDescription: "Calculate real power for DC, single-phase AC, and balanced three-phase AC circuits.",
    path: "/tools/electrical/power",
    keywords: ["power", "watts", "ac", "dc", "three-phase", "single-phase"],
  },
  {
    slug: "resistance",
    category: "electrical",
    title: "Series & Parallel Resistance Calculator",
    shortDescription: "Calculate total resistance for resistors combined in series or in parallel.",
    path: "/tools/electrical/resistance",
    keywords: ["resistance", "series", "parallel", "resistors", "ohms"],
  },
  {
    slug: "energy-cost",
    category: "electrical",
    title: "Electrical Energy Cost Calculator",
    shortDescription: "Estimate kWh consumption and cost from power, usage time, and your electricity rate.",
    path: "/tools/electrical/energy-cost",
    keywords: ["energy", "kwh", "electricity bill", "cost"],
  },
];

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return TOOLS.filter((t) => t.category === category);
}

export function getToolByPath(path: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.path === path);
}

export function getRelatedTools(tool: ToolMeta, limit = 3): ToolMeta[] {
  const sameCategory = TOOLS.filter((t) => t.category === tool.category && t.path !== tool.path);
  return sameCategory.slice(0, limit);
}
