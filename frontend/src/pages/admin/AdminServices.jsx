import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const initialFormData = {
  service_name: "",
  description: "",
  is_active: true,
};

// admin services page (quan ly dich vu cho dat lich va bang gia)
function AdminServices() {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [editingService, setEditingService] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // fetch services (lay danh sach dich vu)
  const fetchServices = async () => {
    try {
      const response = await axiosClient.get("/services/admin");
      setServices(response.data.data || []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tải danh sách dịch vụ.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // search services (tim dich vu theo ten/nhom)
  const filteredServices = services.filter((service) => {
    const keyword = searchKeyword.toLowerCase();

    return (
      service.service_name?.toLowerCase().includes(keyword) ||
      service.description?.toLowerCase().includes(keyword)
    );
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingService(null);
    setShowForm(false);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // edit service (dua du lieu len form)
  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      service_name: service.service_name || "",
      description: service.description || "",
      is_active: service.is_active,
    });
    setShowForm(true);
  };

  // submit service (them hoac cap nhat dich vu)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (editingService) {
        await axiosClient.put(`/services/${editingService.id}`, formData);
        setMessage("Cập nhật dịch vụ thành công.");
      } else {
        await axiosClient.post("/services", formData);
        setMessage("Thêm dịch vụ thành công.");
      }

      resetForm();
      await fetchServices();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể lưu thông tin dịch vụ.",
      );
    } finally {
      setSaving(false);
    }
  };

  // soft delete service (tam ngung dich vu)
  const handleDeactivate = async (service) => {
    const isConfirmed = window.confirm(
      `Tạm ẩn dịch vụ "${service.service_name}" khỏi trang đặt lịch?`,
    );

    if (!isConfirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      await axiosClient.delete(`/services/${service.id}`);
      setMessage("Đã tạm ẩn dịch vụ khỏi phía khách hàng.");
      await fetchServices();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tạm ẩn dịch vụ.",
      );
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Quản lý dịch vụ</h2>
          <p>
            Quản lý các nhóm dịch vụ hiển thị cho khách hàng khi xem thông tin
            và đặt lịch.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setEditingService(null);
            setFormData(initialFormData);
            setShowForm(true);
          }}
        >
          Thêm dịch vụ
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="Tìm theo tên dịch vụ hoặc mô tả..."
        />
      </div>

      {message && <p className="text-success">{message}</p>}
      {errorMessage && <p className="text-danger">{errorMessage}</p>}

      {loading ? (
        <p>Đang tải danh sách dịch vụ...</p>
      ) : filteredServices.length === 0 ? (
        <p>Không tìm thấy dịch vụ phù hợp.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Dịch vụ</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th className="text-end">Xử lý</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>#{service.id}</td>
                  <td>
                    <strong>{service.service_name}</strong>
                  </td>
                  <td>{service.description || "Chưa có mô tả"}</td>
                  <td>
                    <span
                      className={`badge ${
                        service.is_active ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {service.is_active ? "Đang hiển thị" : "Đã tạm ẩn"}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEdit(service)}
                    >
                      Sửa
                    </button>

                    {service.is_active && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeactivate(service)}
                      >
                        Tạm ẩn
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>{editingService ? "Sửa dịch vụ" : "Thêm dịch vụ"}</h3>
                <p>
                  Không nhập giá tại đây. Giá thực tế sẽ do lễ tân nhập khi lập
                  hóa đơn.
                </p>
              </div>

              <button type="button" onClick={resetForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Tên dịch vụ</label>
                <input
                  type="text"
                  name="service_name"
                  className="form-control"
                  value={formData.service_name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Khám và tư vấn ban đầu"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mô tả</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn để khách hàng hiểu dịch vụ này dùng để làm gì..."
                />
              </div>

              <div className="form-check mb-4">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  className="form-check-input"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="is_active">
                  Hiển thị dịch vụ này cho khách hàng
                </label>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={resetForm}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu dịch vụ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminServices;
