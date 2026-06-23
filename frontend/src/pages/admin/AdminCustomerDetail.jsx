import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import MedicalRecordForm from "../../components/admin/MedicalRecordForm";

const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

function AdminCustomerDetail() {
  const { customerId } = useParams();

  const [customer, setCustomer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const [
          customerResponse,
          appointmentResponse,
          recordResponse,
          dentistResponse,
        ] = await Promise.all([
          axiosClient.get(`/patients/${customerId}`),
          axiosClient.get(`/appointments/history/${customerId}`),
          axiosClient.get(`/medical-records/patient/${customerId}`),
          axiosClient.get("/dentists"),
        ]);

        setCustomer(customerResponse.data.data);
        setAppointments(appointmentResponse.data.data || []);
        setMedicalRecords(recordResponse.data.data || []);
        setDentists(dentistResponse.data.data || []);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Không thể tải hồ sơ khách hàng.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const refreshMedicalRecords = async () => {
    const response = await axiosClient.get(
      `/medical-records/patient/${customerId}`,
    );

    setMedicalRecords(response.data.data || []);
    setShowRecordForm(false);
  };

  const formatDate = (date) => {
    if (!date) return "Chưa cập nhật";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : "";
  };

  if (loading) {
    return <div className="admin-page">Đang tải hồ sơ khách hàng...</div>;
  }

  if (errorMessage || !customer) {
    return (
      <div className="admin-page admin-error-message">
        {errorMessage || "Không tìm thấy khách hàng."}
      </div>
    );
  }

  return (
    <div className="admin-customer-detail">
      <section className="admin-page">
        <Link to="/admin/customers" className="admin-back-link">
          ← Quay lại danh sách
        </Link>

        <div className="admin-page-header">
          <div>
            <h2>{customer.full_name}</h2>
            <p>Hồ sơ khách hàng #{customer.id}</p>
          </div>

          <span className="customer-account-type">
            {customer.user_id ? "Có tài khoản" : "Khách vãng lai"}
          </span>
        </div>

        <div className="customer-information-grid">
          <div>
            <span>Số điện thoại</span>
            <strong>{customer.phone}</strong>
          </div>

          <div>
            <span>Giới tính</span>
            <strong>{customer.gender || "Chưa cập nhật"}</strong>
          </div>

          <div>
            <span>Ngày sinh</span>
            <strong>{customer.birth_date_display || "Chưa cập nhật"}</strong>
          </div>

          <div>
            <span>Địa chỉ</span>
            <strong>{customer.address || "Chưa cập nhật"}</strong>
          </div>
        </div>
      </section>

      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2>Lịch hẹn</h2>
            <p>Lịch sử và lịch sắp tới của khách hàng.</p>
          </div>

          <Link to="/booking" className="admin-primary-button">
            Tạo lịch mới
          </Link>
        </div>

        {appointments.length === 0 ? (
          <p>Khách hàng chưa có lịch hẹn.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ngày khám</th>
                  <th>Dịch vụ</th>
                  <th>Nha sĩ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      {formatDate(appointment.appointment_date)}
                      <span>{formatTime(appointment.appointment_time)}</span>
                    </td>

                    <td>{appointment.service_name}</td>

                    <td>{appointment.dentist_name || "Chưa phân công"}</td>

                    <td>
                      {STATUS_LABELS[appointment.status] || appointment.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2>Kết quả điều trị</h2>
            <p>Thông tin khám, điều trị và khuyến nghị tái khám.</p>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={() => setShowRecordForm(true)}
          >
            Thêm kết quả
          </button>
        </div>

        {medicalRecords.length === 0 ? (
          <p>Khách hàng chưa có kết quả điều trị.</p>
        ) : (
          <div className="medical-record-list">
            {medicalRecords.map((record) => (
              <article className="medical-record-card" key={record.id}>
                <div>
                  <span>Nha sĩ phụ trách</span>
                  <strong>{record.dentist_name}</strong>
                </div>

                <div>
                  <span>Chẩn đoán</span>
                  <p>{record.diagnosis || "Chưa cập nhật"}</p>
                </div>

                <div>
                  <span>Điều trị</span>
                  <p>{record.treatment || "Chưa cập nhật"}</p>
                </div>

                <div>
                  <span>Tái khám đề xuất</span>
                  <strong>
                    {record.re_examination_date_display ||
                      "Chưa có lịch tái khám"}
                  </strong>

                  {record.re_examination_time && (
                    <p>{formatTime(record.re_examination_time)}</p>
                  )}
                </div>

                <div>
                  <span>Người nhập dữ liệu</span>
                  <strong>
                    {record.entered_by_username || "Chưa xác định"}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showRecordForm && (
        <MedicalRecordForm
          customerId={customerId}
          appointments={appointments}
          dentists={dentists}
          onClose={() => setShowRecordForm(false)}
          onCreated={refreshMedicalRecords}
        />
      )}
    </div>
  );
}

export default AdminCustomerDetail;
