import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { serviceCategories } from "../data/serviceInfo";
import BrandLogo from "./BrandLogo";

// navbar ui (menu, search, login va mobile menu)
function NavbarClean() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardPath =
    user?.role === "admin" ? "/admin" : user?.role === "dentist" ? "/dentist" : "";
  const canViewDashboard = Boolean(dashboardPath);
  const canViewCustomerMenu = user && user.role === "customer" && user.patient_id;

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setActiveSuggestionIndex(-1);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const query = searchKeyword.trim();

    if (query.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setSearchLoading(true);

      axiosClient
        .get("/search", {
          params: { q: query },
          signal: controller.signal,
        })
        .then((response) => {
          const groups = response.data?.data?.groups || [];
          setSearchSuggestions(
            groups.flatMap((group) => group.items || []).slice(0, 8),
          );
          setActiveSuggestionIndex(-1);
        })
        .catch((error) => {
          if (error.code !== "ERR_CANCELED") setSearchSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchKeyword]);

  // close mobile menu (dong menu khi chuyen trang)
  const closeMenu = () => {
    setIsMenuOpen(false);
    const menuElement = document.getElementById("mainNavbar");
    const togglerElement = document.querySelector(".custom-toggler");

    menuElement?.classList.remove("show");
    togglerElement?.setAttribute("aria-expanded", "false");
  };

  // logout (xoa phien dang nhap)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    closeMenu();
    navigate("/");
  };

  // search submit (chuyen sang trang ket qua tim kiem)
  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (!searchKeyword.trim()) {
      return;
    }

    const selectedSuggestion = searchSuggestions[activeSuggestionIndex];
    if (selectedSuggestion) {
      navigate(selectedSuggestion.url || "/");
      setIsSearchOpen(false);
      closeMenu();
      return;
    }

    navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    setIsSearchOpen(false);
    closeMenu();
  };

  const handleSearchKeyDown = (event) => {
    if (!isSearchOpen || searchSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current >= searchSuggestions.length - 1 ? 0 : current + 1,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current <= 0 ? searchSuggestions.length - 1 : current - 1,
      );
    }

    if (event.key === "Escape") {
      setIsSearchOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const openSuggestion = (suggestion) => {
    navigate(suggestion.url || "/");
    setIsSearchOpen(false);
    setActiveSuggestionIndex(-1);
    closeMenu();
  };

  return (
    <header className="site-header clinic-clean-header">
      <div className="header-main">
        <div className="container header-main-inner">
          <Link className="navbar-brand custom-brand" to="/" onClick={closeMenu}>
            <BrandLogo />
            <span className="brand-text-group">
              <span className="brand-title">Phòng khám nha khoa V</span>
              <span className="brand-subtitle">Chăm sóc nha khoa rõ ràng, hiện đại và thân thiện</span>
            </span>
          </Link>

          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="header-search-input"
              placeholder="Tìm dịch vụ, bác sĩ hoặc thông tin cần xem"
              value={searchKeyword}
              onChange={(event) => {
                setSearchKeyword(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setIsSearchOpen(false), 120)}
              onKeyDown={handleSearchKeyDown}
              maxLength="120"
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-controls="header-search-suggestions"
              aria-activedescendant={
                activeSuggestionIndex >= 0
                  ? `header-search-option-${activeSuggestionIndex}`
                  : undefined
              }
            />
            <button type="submit" className="header-search-button">
              Tìm
            </button>
            {isSearchOpen && searchKeyword.trim().length >= 2 && (
              <div
                className="header-search-suggestions"
                id="header-search-suggestions"
                role="listbox"
              >
                {searchLoading && <p>Đang tìm dữ liệu...</p>}
                {!searchLoading && searchSuggestions.length === 0 && (
                  <p>Không tìm thấy nội dung phù hợp.</p>
                )}
                {!searchLoading &&
                  searchSuggestions.map((suggestion, index) => (
                    <button
                      type="button"
                      id={`header-search-option-${index}`}
                      className={index === activeSuggestionIndex ? "active" : ""}
                      role="option"
                      aria-selected={index === activeSuggestionIndex}
                      key={suggestion.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSuggestion(suggestion)}
                    >
                      <span>{suggestion.type === "dentist" ? "Nha sĩ" : suggestion.type === "service" ? "Dịch vụ" : "Thông tin"}</span>
                      <strong>{suggestion.title}</strong>
                    </button>
                  ))}
                <Link
                  to={`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsSearchOpen(false)}
                >
                  Xem tất cả kết quả
                </Link>
              </div>
            )}
          </form>

          <div className="header-actions">
            <a href="tel:19006899" className="header-hotline-button">
              Gọi ngay
            </a>

            {user ? (
              <button type="button" className="btn custom-login-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            ) : (
              <Link className="btn custom-login-btn" to="/login" onClick={closeMenu}>
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="navbar navbar-expand-lg custom-navbar">
        <div className="container">
          <button
            className="navbar-toggler custom-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Mở menu"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav custom-nav-list">
              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/" onClick={closeMenu}>
                  Trang chủ
                </Link>
              </li>

              <li className="nav-item dropdown custom-hover-dropdown">
                <button
                  className="nav-link custom-nav-link dropdown-toggle custom-menu-button"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Giới thiệu
                </button>
                <ul className="dropdown-menu custom-dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/about" onClick={closeMenu}>
                      Về phòng khám
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/about#about-doctors" onClick={closeMenu}>
                      Đội ngũ bác sĩ
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/about#about-facilities" onClick={closeMenu}>
                      Cơ sở vật chất
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item dropdown custom-hover-dropdown">
                <button
                  className="nav-link custom-nav-link dropdown-toggle custom-menu-button"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Dịch vụ
                </button>
                <ul className="dropdown-menu custom-dropdown-menu service-dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/services" onClick={closeMenu}>
                      Tất cả dịch vụ
                    </Link>
                  </li>
                  {serviceCategories.map((service) => (
                    <li key={service.slug}>
                      <Link className="dropdown-item" to={`/services/${service.slug}`} onClick={closeMenu}>
                        {service.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/pricing" onClick={closeMenu}>
                  Bảng giá
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/?booking=open" onClick={closeMenu}>
                  Đặt lịch
                </Link>
              </li>

              {canViewCustomerMenu && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to="/my-appointments" onClick={closeMenu}>
                    Lịch đã đặt
                  </Link>
                </li>
              )}

              {canViewCustomerMenu && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to="/medical-results" onClick={closeMenu}>
                    Kết quả khám
                  </Link>
                </li>
              )}

              {canViewCustomerMenu && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to="/my-payments" onClick={closeMenu}>
                    Thanh toán của tôi
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <Link className="nav-link custom-nav-link" to="/chatbot" onClick={closeMenu}>
                  Hỏi đáp AI
                </Link>
              </li>

              {canViewDashboard && (
                <li className="nav-item">
                  <Link className="nav-link custom-nav-link" to={dashboardPath} onClick={closeMenu}>
                    Bảng điều khiển
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default NavbarClean;
