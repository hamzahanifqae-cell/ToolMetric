export interface ToolFaq {
  question: string;
  answer: string;
}

/**
 * Visible answers to the questions people type before they use each tool.
 * Kept in sync with what the tool actually does — these are also emitted as
 * FAQ structured data, which Google only accepts when the text is on the page.
 */
export const TOOL_FAQS: Record<string, ToolFaq[]> = {
  "png-to-jpg": [
    {
      question: "Does converting PNG to JPG keep transparency?",
      answer:
        "No. JPG has no transparency. Transparent or semi-transparent pixels are filled with the background color you choose before the file is saved as a JPG.",
    },
    {
      question: "Is my PNG uploaded to convert it to JPG?",
      answer:
        "Not by default. The conversion runs in your browser. An upload happens only if you explicitly choose the labelled server option.",
    },
  ],
  "to-webp": [
    {
      question: "Why convert JPG or PNG to WebP?",
      answer:
        "WebP usually produces a smaller file than JPG or PNG at a similar visual quality, which helps pages load faster and makes images easier to share.",
    },
    {
      question: "Can I convert both JPG and PNG to WebP here?",
      answer: "Yes. The converter accepts a JPG or a PNG and saves a WebP file. Processing runs in your browser unless you choose the server option.",
    },
  ],
  "webp-to-png": [
    {
      question: "Does WebP to PNG keep transparency?",
      answer: "Yes. PNG supports transparency, and this converter keeps the transparent areas from the WebP file.",
    },
    {
      question: "When should I convert WebP to PNG?",
      answer:
        "Use PNG when the program you are sending the image to does not open WebP, or when you need a lossless file that still has a transparent background.",
    },
  ],
  "webp-to-jpg": [
    {
      question: "What happens to a transparent WebP when I convert it to JPG?",
      answer:
        "JPG cannot store transparency, so those pixels are painted with the background color you pick. The rest of the image is saved as a JPG.",
    },
  ],
  compressor: [
    {
      question: "How do I compress an image without uploading it?",
      answer:
        "Choose the image and a JPEG or WebP quality setting. Compression runs on your device. The file is uploaded only if you turn on the labelled server option.",
    },
    {
      question: "Will a lower quality setting always make a specific file size?",
      answer:
        "No. Quality changes how aggressively the image is compressed, but the final size still depends on what is in the picture. The result is lossy, so compressing the same file again reduces quality further.",
    },
  ],
  resizer: [
    {
      question: "Can I resize an image without stretching it?",
      answer: "Yes. Lock the aspect ratio and enter either the width or the height. The other side is calculated so the picture keeps its shape.",
    },
    {
      question: "What units does the image resizer use?",
      answer: "Width and height are in pixels, which is the size websites, forms, and social uploads ask for.",
    },
  ],
  percentage: [
    {
      question: "How do I calculate a percentage of a number?",
      answer: "Divide the percent by 100, then multiply by the number. For example, 20% of 150 is (20 ÷ 100) × 150 = 30.",
    },
    {
      question: "How is percentage increase calculated?",
      answer:
        "Subtract the original value from the new value, divide by the absolute value of the original, and multiply by 100. A change from 150 to 180 is an increase of 20%.",
    },
  ],
  age: [
    {
      question: "How is exact age calculated?",
      answer:
        "The calculator counts whole years, then the remaining months, then the remaining days between the birth date and the date you choose. It also shows total days lived and the days until the next birthday.",
    },
  ],
  "date-difference": [
    {
      question: "How many days are counted between two dates?",
      answer:
        "The count is the days elapsed from the start date to the end date. 1 January to 2 January is 1 day, and the same date twice is 0 days. Add 1 when you need both dates included. The result also shows weeks, months, and years.",
    },
  ],
  discount: [
    {
      question: "How do I calculate a percent-off sale price?",
      answer:
        "Multiply the original price by the discount percent, divide by 100, and subtract that saving from the original price. A 25% discount on 80 is a saving of 20, so the sale price is 60.",
    },
  ],
  length: [
    {
      question: "How do I convert length between centimeters and inches?",
      answer:
        "One inch is exactly 2.54 centimeters, so divide centimeters by 2.54 to get inches. This length converter uses that factor, with meters as the common base for feet, yards, miles, and millimeters too.",
    },
    {
      question: "How many feet are in a meter?",
      answer: "One meter is 3.28084 feet. One foot is exactly 0.3048 meters.",
    },
  ],
  mass: [
    {
      question: "How do I convert kg to lbs?",
      answer:
        "One pound is exactly 0.45359237 kilograms. Enter the value, choose kilograms and pounds, and the converter applies that factor.",
    },
  ],
  temperature: [
    {
      question: "How do I convert Celsius to Fahrenheit?",
      answer: "Multiply the Celsius temperature by 9/5 and add 32. Water freezes at 0°C, which is 32°F, and boils at 100°C, which is 212°F.",
    },
    {
      question: "Does this convert Fahrenheit back to Celsius and to Kelvin?",
      answer: "Yes. It converts among Celsius, Fahrenheit, and Kelvin, including temperatures below zero. Kelvin cannot go below absolute zero (0 K).",
    },
  ],
  area: [
    {
      question: "How do I convert acres to square feet?",
      answer: "One acre is exactly 43,560 square feet, and 4,046.8564224 square meters. Enter the value in this area converter and pick the two units.",
    },
    {
      question: "Which area units can I convert?",
      answer:
        "Square millimeters, square centimeters, square meters, hectares, square kilometers, square feet, square yards, acres, and square miles. One square meter is shown as 10.76391 square feet.",
    },
  ],
  "ohms-law": [
    {
      question: "How do I calculate electrical current?",
      answer:
        "Current in amps is voltage divided by resistance: I = V ÷ R. Leave the current field blank, enter the other two, and this current calculator fills it in. A 12 V supply across 6 Ω draws 2 A.",
    },
    {
      question: "What is the Ohm's law formula?",
      answer: "Voltage equals current times resistance: V = I × R. Enter any two values and the calculator solves for the missing one.",
    },
    {
      question: "Does this Ohm's law calculator work for every AC circuit?",
      answer:
        "It applies to DC circuits and purely resistive loads. Circuits with coils or capacitors need impedance, not plain resistance. Use the watts calculator for AC power.",
    },
  ],
  power: [
    {
      question: "How are watts calculated from volts and amps?",
      answer:
        "Enter voltage in volts and current in amps. For DC, watts = volts × amps, so 230 V at 10 A is 2,300 W. For AC, the calculator also uses the power factor. It does not solve for the current.",
    },
  ],
  resistance: [
    {
      question: "How do I add resistors in series and in parallel?",
      answer:
        "Series resistance is the sum of the resistors. Parallel resistance is the reciprocal of the sum of the reciprocals. Two 10Ω resistors in parallel make 5Ω.",
    },
  ],
  "energy-cost": [
    {
      question: "How do I estimate what an appliance costs to run?",
      answer:
        "Energy in kWh is power in kilowatts multiplied by hours of use. Cost is that energy multiplied by your price per kWh. A 1000 W appliance run for 2 hours uses 2 kWh.",
    },
  ],
};

export function getToolFaqs(slug: string): ToolFaq[] {
  return TOOL_FAQS[slug] ?? [];
}
