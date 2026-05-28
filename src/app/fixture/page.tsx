"use client";

import { useState, useEffect } from "react";
import { groups } from "@/data/groups";
import { MatchResult } from "@/data/results";
import { FixtureGroupCard } from "@/components/fixture/FixtureGroupCard";

export default function FixturePage() {
  const [results, setResults] = useState<Record<string, MatchResult>>({});

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.ok ? r.json() : { results: {} })
      .then((data) => setResults(data.results))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Fixture
        </h1>
        <p className="mt-1 text-xs text-fifa-dark-gray">
          Fase de grupos · Resultados y posiciones oficiales
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <FixtureGroupCard key={group.id} group={group} results={results} />
        ))}
      </div>
    </div>
  );
}
