import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="10" y="12" width="28" height="28" rx="8" />
      <path d="M16 9v7M32 9v7M10 20h28" />
      <circle cx="18" cy="27" r="2.5" />
      <circle cx="25" cy="27" r="2.5" />
      <circle cx="32" cy="27" r="2.5" />
      <circle cx="18" cy="34" r="2.5" />
      <circle cx="25" cy="34" r="2.5" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 42s13-11.2 13-23A13 13 0 0 0 11 19c0 11.8 13 23 13 23Z" />
      <circle cx="24" cy="19" r="5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 7l3.7 10.5L38 21.2l-10.3 3.7L24 36l-3.7-11.1L10 21.2l10.3-3.7L24 7Z" />
      <path d="M37 31l1.7 4.5L43 37l-4.3 1.5L37 43l-1.7-4.5L31 37l4.3-1.5L37 31Z" />
      <path d="M12 8l1.3 3.6L17 13l-3.7 1.4L12 18l-1.3-3.6L7 13l3.7-1.4L12 8Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 14.5A8.5 8.5 0 0 1 18.5 6h11A8.5 8.5 0 0 1 38 14.5v8A8.5 8.5 0 0 1 29.5 31H24l-9 8v-9.4a8.5 8.5 0 0 1-5-7.8v-7.3Z" />
      <path d="M17 18h14M17 24h9" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M17.2 9.4 22 18l-4.1 3.1c2.2 4.7 5.9 8.4 10.9 10.9L32 28l8.6 4.8c.8.5 1.2 1.4.9 2.3-1.1 3.7-4.5 6-8.4 5.3C20.4 38.1 9.9 27.6 7.6 14.9c-.7-3.9 1.6-7.3 5.3-8.4.9-.3 1.8.1 2.3.9Z" />
    </svg>
  );
}

function ConciergeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M13 23.5c0-7.2 4.9-12.5 11-12.5s11 5.3 11 12.5" />
      <path d="M12 24h5v9h-5a4 4 0 0 1-4-4v-1a4 4 0 0 1 4-4Z" />
      <path d="M36 24h-5v9h5a4 4 0 0 0 4-4v-1a4 4 0 0 0-4-4Z" />
      <path d="M31 34c-1.4 2.2-3.8 3.5-7 3.5h-3" />
      <path d="M20 17.5c1.1-1 2.4-1.5 4-1.5s2.9.5 4 1.5" />
      <path d="M24 22l1.5 3.8 3.5 1.4-3.5 1.4L24 32l-1.5-3.4-3.5-1.4 3.5-1.4L24 22Z" />
    </svg>
  );
}

const supportItems = [
  {
    kind: "route",
    to: "/booking",
    tone: "appointment",
    icon: <CalendarIcon />,
    title: "Đặt lịch hẹn",
    description: "Chọn ngày giờ khám",
  },
  {
    kind: "link",
    href: "https://www.google.com/maps/search/?api=1&query=Nha%20Khoa%20V%20Can%20Tho",
    tone: "clinic",
    icon: <LocationIcon />,
    title: "Tìm phòng khám",
    description: "Mở Google Maps",
    external: true,
  },
  {
    kind: "route",
    to: "/chatbot",
    tone: "ai",
    icon: <SparkIcon />,
    title: "Chat tư vấn AI",
    description: "Hỏi đáp nha khoa",
  },
  {
    kind: "link",
    href: "https://zalo.me/",
    tone: "zalo",
    icon: <MessageIcon />,
    title: "Zalo hỗ trợ",
    description: "Nhắn tin nhanh",
    external: true,
  },
  {
    kind: "link",
    href: "tel:19006899",
    tone: "hotline",
    icon: <PhoneIcon />,
    title: "1900 6899",
    description: "Gọi hotline",
  },
];

function SupportLink({ item, onNavigate }) {
  const content = (
    <>
      <span className={`clinic-support-icon ${item.tone}`}>{item.icon}</span>
      <span className="clinic-support-copy">
        <strong>{item.title}</strong>
        <small>{item.description}</small>
      </span>
      <span className="clinic-support-arrow" aria-hidden="true">
        →
      </span>
    </>
  );

  if (item.kind === "route") {
    return (
      <Link className={`clinic-support-item ${item.tone}`} to={item.to} onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  return (
    <a
      className={`clinic-support-item ${item.tone}`}
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noreferrer" : undefined}
      onClick={onNavigate}
    >
      {content}
    </a>
  );
}

function FloatingSupportClinic() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <button
        className={`clinic-support-toggle ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
        aria-label="Mở hỗ trợ nhanh"
      >
        <span className="clinic-support-toggle-orbit" />
        <span className="clinic-support-toggle-icon">
          <ConciergeIcon />
        </span>
        <span className="clinic-support-toggle-pulse" />
      </button>

      {isOpen && (
        <aside className="clinic-support-panel" aria-label="Hỗ trợ trực tuyến">
          <div className="clinic-support-ambient one" />
          <div className="clinic-support-ambient two" />

          <div className="clinic-support-header">
            <div className="clinic-support-mark">
              <span className="clinic-support-cross">+</span>
            </div>

            <div className="clinic-support-heading">
              <span className="clinic-support-eyebrow">Dental concierge</span>
              <p>Hỗ trợ trực tuyến</p>
              <small>
                <span className="clinic-support-live-dot" />
                7h30 - 23h30
              </small>
            </div>

            <button
              className="clinic-support-close"
              onClick={() => setIsOpen(false)}
              type="button"
              aria-label="Đóng hỗ trợ"
            >
              ×
            </button>
          </div>

          <div className="clinic-support-body">
            {supportItems.map((item) => (
              <SupportLink item={item} key={item.title} onNavigate={() => setIsOpen(false)} />
            ))}
          </div>

          <p className="clinic-support-note">
            Tư vấn nhanh trước khi đến phòng khám, thông tin chỉ mang tính tham khảo.
          </p>
        </aside>
      )}
    </>
  );
}

export default FloatingSupportClinic;
