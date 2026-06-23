import { useState } from "react";
import { Link } from "react-router-dom";

function FloatingSupport() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="floating-chat-toggle"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
        aria-label="Mo ho tro nhanh"
      >
        HT
      </button>

      {isOpen && (
        <div className="floating-support-panel compact">
          <div className="floating-support-header">
            <div>
              <p className="floating-support-title mb-1">Ho tro truc tuyen</p>
              <small>Tu 7h30 den 23h30</small>
            </div>

            <button
              className="floating-support-close"
              onClick={() => setIsOpen(false)}
              type="button"
              aria-label="Dong ho tro"
            >
              x
            </button>
          </div>

          <div className="floating-support-body">
            <Link to="/booking" className="floating-support-item">
              <span className="floating-support-icon">DL</span>
              <span>Dat lich hen</span>
            </Link>

            <a href="#clinic-system" className="floating-support-item">
              <span className="floating-support-icon">PK</span>
              <span>Tim phong kham</span>
            </a>

            <Link to="/chatbot" className="floating-support-item">
              <span className="floating-support-icon">AI</span>
              <span>Chat tu van</span>
            </Link>

            <a
              href="https://zalo.me/"
              target="_blank"
              rel="noreferrer"
              className="floating-support-item"
            >
              <span className="floating-support-icon">ZL</span>
              <span>Zalo ho tro</span>
            </a>

            <a href="tel:19006899" className="floating-support-item hotline">
              <span className="floating-support-icon">SDT</span>
              <span>1900 6899</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingSupport;
