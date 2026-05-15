interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  ownerName?: string;
}

export default function PrintHeader({ title, subtitle, ownerName }: PrintHeaderProps) {
  const today = new Date().toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="hidden print:block mb-6">
      <div className="flex justify-between items-start border-b pb-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">RentFlow</h1>
          <h2 className="text-base font-semibold mt-1">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="text-right text-sm">
          {ownerName && <p className="font-medium">{ownerName}</p>}
          <p className="text-gray-500">{today}</p>
        </div>
      </div>
    </div>
  );
}
