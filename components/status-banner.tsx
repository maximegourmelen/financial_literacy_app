type StatusBannerProps = {
  message?: string | null;
  error?: string | null;
};

export function StatusBanner({ message, error }: StatusBannerProps) {
  if (!message && !error) {
    return null;
  }

  return (
    <div className={error ? "status-banner error" : "status-banner success"}>
      {error || message}
    </div>
  );
}
