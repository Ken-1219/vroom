import Link from "next/link";

interface ChatVehicleProps {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  transmission: string;
  fuelType: string;
  seats: number;
  pricePerDay: string;
  city: string;
  rating: string | null;
  reviewCount?: number;
  photo: string | null;
  link: string;
  bookLink: string;
}

export function ChatVehicleCard({ vehicle }: { vehicle: ChatVehicleProps }) {
  return (
    <div className="flex gap-3 bg-white rounded-xl border border-[#E8E6E1] p-2.5 hover:border-[#FF4D00]/30 transition-colors">
      {vehicle.photo && (
        <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#F0EFEC]">
          <img
            src={vehicle.photo}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={vehicle.link}
            className="text-xs font-semibold text-[#1A1A1A] hover:text-[#E64500] truncate"
          >
            {vehicle.make} {vehicle.model}
          </Link>
          <span className="text-xs font-bold text-[#FF4D00] whitespace-nowrap">
            {vehicle.pricePerDay}
            <span className="text-[10px] text-[#999] font-normal">/day</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#6B6B6B]">
          <span>{vehicle.year}</span>
          <span>·</span>
          <span className="capitalize">{vehicle.transmission}</span>
          <span>·</span>
          <span className="capitalize">{vehicle.fuelType}</span>
          <span>·</span>
          <span>{vehicle.seats} seats</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2 text-[10px] text-[#6B6B6B]">
            <span>{vehicle.city}</span>
            {vehicle.rating && (
              <>
                <span>·</span>
                <span className="text-amber-600 font-medium">
                  ★ {vehicle.rating}
                </span>
              </>
            )}
          </div>
          <Link
            href={vehicle.bookLink}
            className="text-[10px] font-medium text-[#FF4D00] hover:text-[#E64500]"
          >
            Book →
          </Link>
        </div>
      </div>
    </div>
  );
}
