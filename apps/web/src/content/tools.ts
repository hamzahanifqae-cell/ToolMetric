export type ToolCategory = "image" | "calculators" | "converters" | "electrical";

export interface CategoryMeta {
  key: ToolCategory;
  /** Short name used in navigation and breadcrumbs. */
  label: string;
  /** Page H1 and document title. Written for the query people search. */
  heading: string;
  path: string;
  description: string;
  keywords: string[];
}

export const CATEGORIES: Record<ToolCategory, CategoryMeta> = {
  image: {
    key: "image",
    label: "Image Tools",
    heading: "Free Image Tools",
    path: "/tools/image",
    description:
      "Free image tools: PNG to JPG, JPG to WebP, WebP to PNG, compress an image, and resize an image. Most processing stays in your browser.",
    keywords: ["png to jpg", "jpg to webp", "webp to png", "compress image", "resize image", "image converter"],
  },
  calculators: {
    key: "calculators",
    label: "Everyday Calculators",
    heading: "Free Online Calculators",
    path: "/tools/calculators",
    description:
      "Free online calculators for percentages, exact age, days between two dates, and percent-off discounts. Results stay in your browser.",
    keywords: ["percentage calculator", "age calculator", "days between dates", "discount calculator", "percent off"],
  },
  converters: {
    key: "converters",
    label: "Unit Converters",
    heading: "Free Unit Converters",
    path: "/tools/converters",
    description:
      "Free unit converters for centimeters to inches, kilograms to pounds, Celsius to Fahrenheit, and acres to square feet.",
    keywords: ["cm to inches", "kg to lbs", "celsius to fahrenheit", "area converter", "unit converter"],
  },
  electrical: {
    key: "electrical",
    label: "Electrical Calculators",
    heading: "Electrical Calculators",
    path: "/tools/electrical",
    description:
      "Free electrical calculators for Ohm's law, watts from volts and amps, series and parallel resistance, and electricity cost in kWh.",
    keywords: ["ohms law calculator", "watts calculator", "series parallel resistance", "electricity cost calculator", "kwh calculator"],
  },
};

export type ProcessingLocation = "local" | "local-or-server";

export interface ToolMeta {
  slug: string;
  category: ToolCategory;
  title: string;
  /** Snippet shown in search results. Keep this the sentence someone would click. */
  metaDescription: string;
  shortDescription: string;
  path: string;
  keywords: string[];
  processing?: ProcessingLocation;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "png-to-jpg",
    category: "image",
    title: "PNG to JPG Converter",
    metaDescription:
      "Free PNG to JPG converter. Turn a PNG into a JPG in your browser, choose a background for transparency, and download. No account.",
    shortDescription: "Convert PNG to JPG online, and choose the background color used where the PNG was transparent.",
    path: "/tools/image/png-to-jpg",
    keywords: ["png to jpg", "png to jpeg", "convert png to jpg", "png to jpg converter", "jpg", "jpeg", "image"],
    processing: "local-or-server",
  },
  {
    slug: "to-webp",
    category: "image",
    title: "JPG & PNG to WebP Converter",
    metaDescription:
      "Convert JPG or PNG to WebP online for free. Make a smaller image file in your browser, with an optional server upload. No account.",
    shortDescription: "Convert JPG or PNG to WebP for a smaller file at comparable visual quality.",
    path: "/tools/image/to-webp",
    keywords: ["jpg to webp", "png to webp", "jpeg to webp", "convert to webp", "webp converter", "image"],
    processing: "local-or-server",
  },
  {
    slug: "webp-to-png",
    category: "image",
    title: "WebP to PNG Converter",
    metaDescription:
      "Free WebP to PNG converter. Turn a WebP image into a PNG and keep transparency. Runs in your browser, with no account required.",
    shortDescription: "Convert WebP to PNG online and keep transparent areas intact.",
    path: "/tools/image/webp-to-png",
    keywords: ["webp to png", "convert webp to png", "webp to png converter", "png", "image"],
    processing: "local-or-server",
  },
  {
    slug: "webp-to-jpg",
    category: "image",
    title: "WebP to JPG Converter",
    metaDescription:
      "Free WebP to JPG converter. Turn a WebP image into a JPG and choose the background color for transparent areas. No account needed.",
    shortDescription: "Convert WebP to JPG online, and fill transparent areas with a background color you choose.",
    path: "/tools/image/webp-to-jpg",
    keywords: ["webp to jpg", "webp to jpeg", "convert webp to jpg", "webp to jpg converter", "image"],
    processing: "local-or-server",
  },
  {
    slug: "compressor",
    category: "image",
    title: "Image Compressor",
    metaDescription:
      "Compress an image online for free. Reduce JPG, PNG, or WebP file size with a quality slider. Processed in your browser by default.",
    shortDescription: "Compress a JPG, PNG, or WebP image and download a smaller file.",
    path: "/tools/image/compressor",
    keywords: ["compress image", "image compressor", "compress jpeg", "reduce image size", "compress png", "webp"],
    processing: "local-or-server",
  },
  {
    slug: "resizer",
    category: "image",
    title: "Image Resizer",
    metaDescription:
      "Resize an image online for free. Set the width and height in pixels, lock the aspect ratio, and download. Runs in your browser.",
    shortDescription: "Resize an image to exact pixel dimensions, with an optional aspect-ratio lock.",
    path: "/tools/image/resizer",
    keywords: ["resize image", "image resizer", "resize image online", "change image size", "aspect ratio", "pixels"],
    processing: "local-or-server",
  },
  {
    slug: "percentage",
    category: "calculators",
    title: "Percentage Calculator",
    metaDescription:
      "Free percentage calculator. Find a percent of a number, what percent one number is of another, and the percentage increase or decrease.",
    shortDescription: "X% of Y, what percent X is of Y, and the percentage change between two values.",
    path: "/tools/calculators/percentage",
    keywords: ["percentage calculator", "percent calculator", "percentage increase", "percentage change", "what percent"],
  },
  {
    slug: "age",
    category: "calculators",
    title: "Age Calculator",
    metaDescription:
      "Free age calculator. Find exact age in years, months, and days from a date of birth, plus days lived and days until the next birthday.",
    shortDescription: "Calculate exact age in years, months, and days from a date of birth.",
    path: "/tools/calculators/age",
    keywords: ["age calculator", "calculate age", "how old am i", "age from date of birth", "birthday calculator"],
  },
  {
    slug: "date-difference",
    category: "calculators",
    title: "Days Between Dates Calculator",
    metaDescription:
      "Days between dates calculator. Find how many days, weeks, months, and years are between two dates. Free, and calculated in your browser.",
    shortDescription: "Count the days, weeks, months, and years between two dates.",
    path: "/tools/calculators/date-difference",
    keywords: ["days between dates", "date difference calculator", "how many days between", "date calculator", "duration"],
  },
  {
    slug: "discount",
    category: "calculators",
    title: "Discount Calculator",
    metaDescription:
      "Free discount calculator. Work out the sale price and how much you save with a percent-off discount. No account needed.",
    shortDescription: "Calculate the sale price and the amount saved after a percentage discount.",
    path: "/tools/calculators/discount",
    keywords: ["discount calculator", "percent off calculator", "sale price calculator", "percentage discount", "price"],
  },
  {
    slug: "length",
    category: "converters",
    title: "CM to Inches Converter",
    metaDescription:
      "Free cm to inches converter, plus feet, meters, miles, yards, and millimeters. Convert length instantly in your browser.",
    shortDescription: "Convert centimeters to inches, and between meters, feet, yards, miles, and millimeters.",
    path: "/tools/converters/length",
    keywords: ["cm to inches", "inches to cm", "feet to meters", "length converter", "mm to inches", "miles to km"],
  },
  {
    slug: "mass",
    category: "converters",
    title: "KG to Lbs Converter",
    metaDescription:
      "Free kg to lbs converter. Convert kilograms to pounds, and between grams, ounces, stone, and tonnes. Instant results in your browser.",
    shortDescription: "Convert kilograms to pounds, and between grams, ounces, stone, and tonnes.",
    path: "/tools/converters/mass",
    keywords: ["kg to lbs", "lbs to kg", "pounds to kg", "weight converter", "grams to ounces", "stone to kg"],
  },
  {
    slug: "temperature",
    category: "converters",
    title: "Celsius to Fahrenheit Converter",
    metaDescription:
      "Celsius to Fahrenheit converter, plus Kelvin. Convert °C, °F, and K instantly, including temperatures below zero. Free, in your browser.",
    shortDescription: "Convert Celsius to Fahrenheit, Fahrenheit to Celsius, and either scale to Kelvin.",
    path: "/tools/converters/temperature",
    keywords: ["celsius to fahrenheit", "fahrenheit to celsius", "c to f", "f to c", "kelvin converter", "temperature converter"],
  },
  {
    slug: "area",
    category: "converters",
    title: "Area Converter",
    metaDescription:
      "Free area converter for acres, square feet, square meters, and hectares. Convert land and floor area instantly in your browser.",
    shortDescription: "Convert acres, square feet, square meters, hectares, and other area units.",
    path: "/tools/converters/area",
    keywords: ["area converter", "acres to square feet", "square meters to square feet", "hectares to acres", "sq ft calculator"],
  },
  {
    slug: "ohms-law",
    category: "electrical",
    title: "Ohm's Law Calculator",
    metaDescription:
      "Free Ohm's law calculator. Solve for voltage, current, or resistance with V = I × R. For DC and resistive circuits, in your browser.",
    shortDescription: "Solve for voltage, current, or resistance in DC and resistive circuits.",
    path: "/tools/electrical/ohms-law",
    keywords: ["ohms law calculator", "ohm's law", "voltage calculator", "current calculator", "resistance calculator", "v=ir"],
  },
  {
    slug: "power",
    category: "electrical",
    title: "Watts Calculator",
    metaDescription:
      "Free watts calculator. Find electrical power from voltage and current for DC, single-phase AC, and balanced three-phase circuits.",
    shortDescription: "Calculate watts from voltage and current for DC, single-phase AC, and three-phase AC.",
    path: "/tools/electrical/power",
    keywords: ["watts calculator", "power calculator", "amps to watts", "volts amps watts", "three phase power", "dc power"],
  },
  {
    slug: "resistance",
    category: "electrical",
    title: "Series & Parallel Resistance Calculator",
    metaDescription:
      "Series and parallel resistance calculator. Find total ohms for resistors in series or in parallel. Free, and instant in your browser.",
    shortDescription: "Calculate total resistance for resistors combined in series or in parallel.",
    path: "/tools/electrical/resistance",
    keywords: ["series parallel resistance calculator", "resistors in parallel", "resistors in series", "total resistance", "ohms"],
  },
  {
    slug: "energy-cost",
    category: "electrical",
    title: "Electricity Cost Calculator",
    metaDescription:
      "Free electricity cost calculator. Estimate kWh and the cost to run an appliance from its watts, hours of use, and your price per kWh.",
    shortDescription: "Estimate kWh used and the cost from an appliance's power, runtime, and your electricity rate.",
    path: "/tools/electrical/energy-cost",
    keywords: ["electricity cost calculator", "kwh calculator", "energy cost calculator", "appliance running cost", "electricity bill"],
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
