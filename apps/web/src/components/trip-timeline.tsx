interface TimelineEvent {
  label: string;
  time: string | null;
  icon: "start" | "end" | "active";
}

interface TripTimelineProps {
  events: TimelineEvent[];
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ICON_STYLES = {
  start: "bg-[#FFF1EB] text-[#FF4D00]",
  end: "bg-blue-100 text-blue-600",
  active: "bg-amber-100 text-amber-600",
};

export function TripTimeline({ events }: TripTimelineProps) {
  return (
    <div className="relative">
      {events.map((event, i) => (
        <div key={i} className="flex gap-3 pb-6 last:pb-0">
          <div className="relative flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ICON_STYLES[event.icon]}`}
            >
              {event.icon === "start" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              )}
              {event.icon === "end" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              )}
              {event.icon === "active" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              )}
            </div>
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-[#E8E6E1] mt-1" />
            )}
          </div>
          <div className="pt-1">
            <p className="text-sm font-medium text-[#1A1A1A]">{event.label}</p>
            {event.time && (
              <p className="text-xs text-[#999] mt-0.5">
                {formatDateTime(event.time)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
