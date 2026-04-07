type SummaryCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <p>{label}</p>
      <h2>{value}</h2>
      {detail ? <span>{detail}</span> : null}
    </article>
  );
}
