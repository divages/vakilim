type Props = {
  name: string;
  profileId?: string;
  hasPhoto?: boolean;
  size?: "sm" | "lg";
};

const DIM = { sm: "h-16 w-16 text-lg", lg: "h-24 w-24 text-3xl" };

export default function Avatar({ name, profileId, hasPhoto, size = "sm" }: Props) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const cls = `${DIM[size]} shrink-0 rounded-full ring-4 ring-emerald-100`;
  if (hasPhoto && profileId)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/avatars/${profileId}`}
        alt={name}
        className={`${cls} object-cover`}
      />
    );
  return (
    <div className={`${cls} flex items-center justify-center bg-navy font-bold text-white`}>
      {initials || "•"}
    </div>
  );
}
