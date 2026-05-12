interface BracketConnectorsProps {
  pairCount: number;
}

export function BracketConnectors({ pairCount }: BracketConnectorsProps) {
  return (
    <div className="flex flex-col justify-around">
      {Array.from({ length: pairCount }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="h-6 border-b border-r border-white/10 rounded-br" />
          <div className="h-6 border-t border-r border-white/10 rounded-tr" />
        </div>
      ))}
    </div>
  );
}
