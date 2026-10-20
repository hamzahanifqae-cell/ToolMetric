import { ToolCard } from "./ToolCard.js";
import { useMemo, useState } from "react";
import { CATEGORIES, TOOLS, type ToolCategory } from "../content/tools.js";
import { inputClass, selectClass } from "./ui/inputClasses.js";

export function ToolSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory | "all">("all");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!normalizedQuery) return true;
      const haystack = [tool.title, tool.shortDescription, ...tool.keywords].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, category]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="tool-search" className="sr-only">
            Search tools
          </label>
          <input
            id="tool-search"
            type="search"
            className={inputClass}
            placeholder="Search tools (e.g. “resize image”, “temperature”, “ohm's law”)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="tool-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="tool-category"
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as ToolCategory | "all")}
          >
            <option value="all">All categories</option>
            {Object.values(CATEGORIES).map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(!compact || query.trim() || category !== "all") && <>
      <p className="mt-3 text-sm text-navy-500" aria-live="polite">
        {results.length} {results.length === 1 ? "tool" : "tools"} found
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((tool) => (
          <li key={tool.path}>
            <ToolCard title={tool.title} href={tool.path} category={tool.category} icon={tool.slug} />
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="mt-6 rounded-lg border border-sand-200 bg-sand-50 p-4 text-sm text-navy-600">
          No tools match "{query}". Try a different search term or category.
        </p>
      )}
      </>}
    </div>
  );
}
