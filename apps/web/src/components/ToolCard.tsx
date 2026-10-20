import type { ToolCategory } from '../content/tools.js';

const paths: Record<string, string> = {
 image: 'M4 4h16v16H4z M4 15l5-5 5 5 3-3 3 3 M15 8h.01',
 calculators: 'M6 3h12v18H6z M9 7h6 M9 11h.01 M15 11h.01 M9 15h.01 M15 15h.01 M9 18h.01 M15 18h.01',
 converters: 'M4 8h15l-4-4 M20 16H5l4 4',
 electrical: 'M13 2L4 14h7l-1 8 10-13h-7z',
 compressor: 'M4 4l6 6 M4 8V4h4 M20 4l-6 6 M16 4h4v4 M4 20l6-6 M4 16v4h4 M20 20l-6-6 M16 20h4v-4',
 resizer: 'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5 M9 9h6v6H9z',
 percentage: 'M6 18L18 6 M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
 age: 'M5 5h14v15H5z M8 3v4 M16 3v4 M5 10h14 M9 14h6 M9 17h3',
 'date-difference': 'M4 5h16v15H4z M8 3v4 M16 3v4 M4 10h16 M8 15h8 M13 12l3 3-3 3',
 discount: 'M3 3h8l10 10-8 8L3 11z M7 7h.01',
 length: 'M3 8h18v8H3z M7 8v4 M11 8v3 M15 8v4 M19 8v3',
 mass: 'M8 7a4 4 0 0 1 8 0 M5 7h14l2 14H3z',
 temperature: 'M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0 M12 8v9',
 area: 'M4 4h16v16H4z M4 16L16 4 M8 20L20 8 M4 9l5-5 M15 20l5-5',
 'ohms-law': 'M4 20h5v-3a7 7 0 1 1 6 0v3h5',
 resistance: 'M2 12h3l2-5 3 10 4-10 3 10 2-5h3',
 'energy-cost': 'M4 20V11h4v9 M10 20V7h4v13 M16 20V3h4v17',
};
interface Props { title: string; href: string; category: ToolCategory; icon?: string; }
export function ToolCard({ title, href, category, icon }: Props) {
 return <a href={href} className={`tool-card tool-card--${category}`}>
   <span className="tool-card-icon" aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={paths[icon || ''] || paths[category]} /></svg></span>
   <span className="tool-card-title">{title}</span>
   <span className="tool-card-arrow" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></span>
 </a>;
}
