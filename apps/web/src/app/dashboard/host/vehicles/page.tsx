import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { vehicleService } from "@/services/vehicle";
import { formatPrice } from "@/lib/format";
import { VehicleActions } from "@/components/dashboard/vehicle-actions";

export default async function HostVehiclesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const vehicles = await vehicleService.getByHost(session.user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">My Vehicles</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/dashboard/host/vehicles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E8E6E1] rounded-xl p-16 text-center">
          <svg className="w-16 h-16 text-[#999] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <h2 className="text-lg font-medium text-[#1A1A1A] mb-2">
            No vehicles listed yet
          </h2>
          <p className="text-sm text-[#6B6B6B] mb-6 max-w-sm mx-auto">
            List your car to start earning. You can manage pricing, availability,
            and booking rules all from here.
          </p>
          <Link
            href="/dashboard/host/vehicles/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF4D00] hover:bg-[#E64500] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Add Your First Vehicle
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0EFEC] bg-[#FAFAF8]/50">
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">
                    Vehicle
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">
                    City
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">
                    Price/Day
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">
                    Trips
                  </th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">
                    Rating
                  </th>
                  <th className="text-right text-xs font-medium text-[#6B6B6B] uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEC]">
                {vehicles.map((v) => {
                  const photo = (v.photos ?? []).find((p) => p.isPrimary) ?? (v.photos ?? [])[0];
                  return (
                    <tr key={v.id} className="hover:bg-[#FAFAF8]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-md overflow-hidden bg-[#F0EFEC] flex-shrink-0">
                            {photo ? (
                              <img
                                src={photo.url}
                                alt={`${v.make} ${v.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#999]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">
                              {v.make} {v.model}
                            </p>
                            <p className="text-xs text-[#6B6B6B]">
                              {v.year} {v.variant ? `· ${v.variant}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">{v.city}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                        {formatPrice(v.baseDailyRate, v.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={v.status ?? "draft"} />
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">
                        {v.tripCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">
                        {Number(v.ratingAvg) > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="text-amber-500">&#9733;</span>
                            {Number(v.ratingAvg).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[#999]">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <VehicleActions
                          vehicleId={v.id}
                          currentStatus={v.status ?? "draft"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    listed: "bg-[#FFF1EB] text-[#FF4D00]",
    draft: "bg-[#F0EFEC] text-[#6B6B6B]",
    delisted: "bg-red-100 text-red-700",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}
