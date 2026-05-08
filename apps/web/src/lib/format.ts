const currencyConfig: Record<string, { symbol: string; locale: string }> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "en-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  AED: { symbol: "AED ", locale: "en-AE" },
  THB: { symbol: "฿", locale: "th-TH" },
  MYR: { symbol: "RM ", locale: "ms-MY" },
  SGD: { symbol: "S$", locale: "en-SG" },
};

export function formatPrice(amountInSmallestUnit: number, currency: string): string {
  const config = currencyConfig[currency] ?? { symbol: currency + " ", locale: "en-US" };
  const amount = amountInSmallestUnit / 100;
  const formatted = new Intl.NumberFormat(config.locale, {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${config.symbol}${formatted}`;
}

export function formatRating(rating: string | number): string {
  const n = typeof rating === "string" ? parseFloat(rating) : rating;
  return n.toFixed(1);
}

const flags: Record<string, string> = {
  IN: "🇮🇳",
  US: "🇺🇸",
  GB: "🇬🇧",
  FR: "🇫🇷",
  DE: "🇩🇪",
  AE: "🇦🇪",
  TH: "🇹🇭",
  MY: "🇲🇾",
  SG: "🇸🇬",
};

export function getCountryFlag(countryCode: string): string {
  return flags[countryCode] ?? countryCode;
}

const vehicleTypeLabels: Record<string, string> = {
  sedan: "Sedan",
  suv: "SUV",
  hatchback: "Hatchback",
  luxury: "Luxury",
  ev: "EV",
  mpv: "MPV",
};

export function getVehicleTypeLabel(type: string): string {
  return vehicleTypeLabels[type] ?? type;
}

const fuelTypeLabels: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
  cng: "CNG",
};

export function getFuelTypeLabel(type: string): string {
  return fuelTypeLabels[type] ?? type;
}

const featureIcons: Record<string, string> = {
  gps: "\u{1F6F0}",
  bluetooth: "\u{1F50A}",
  sunroof: "☀",
  backup_camera: "\u{1F4F7}",
  cruise_control: "\u{1F6E3}",
  heated_seats: "\u{1F525}",
  apple_carplay: "\u{1F3B5}",
  android_auto: "\u{1F4F1}",
  keyless_entry: "\u{1F511}",
  parking_sensors: "\u{1F17F}",
  dash_cam: "\u{1F3A5}",
  child_seat: "\u{1FA91}",
  usb_charging: "⚡",
  air_conditioning: "❄",
  leather_seats: "\u{1F4BA}",
};

const featureLabels: Record<string, string> = {
  gps: "GPS Navigation",
  bluetooth: "Bluetooth",
  sunroof: "Sunroof",
  backup_camera: "Backup Camera",
  cruise_control: "Cruise Control",
  heated_seats: "Heated Seats",
  apple_carplay: "Apple CarPlay",
  android_auto: "Android Auto",
  keyless_entry: "Keyless Entry",
  parking_sensors: "Parking Sensors",
  dash_cam: "Dash Cam",
  child_seat: "Child Seat",
  usb_charging: "USB Charging",
  air_conditioning: "A/C",
  leather_seats: "Leather Seats",
};

export function getFeatureLabel(feature: string): string {
  return featureLabels[feature] ?? feature.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getFeatureIcon(feature: string): string {
  return featureIcons[feature] ?? "✓";
}
