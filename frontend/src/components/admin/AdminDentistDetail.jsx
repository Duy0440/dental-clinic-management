import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

// admin dentist detail (xem thong tin nha si, lich ban va lich da phan cong)
function AdminDentistDetail() {
  const { dentistId } = useParams();

  const [dentist, setDentist] = useState(null);
  const [unavailableTimes, setUnavailableTimes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // fetch dentist data (lay nha si, lich ban va lich hen lien quan)
    const fetchDentistData = async () => {
      try {
        const [dentistsResponse, unavailableResponse, appointmentsResponse] =
          await Promise.all([
            axiosClient.get("/dentists"),
            axiosClient.get(`/dentist-unavailable-times/dentist/${dentistId}`),
            axiosClient.get("/appointments"),
          ]);

        const foundDentist = dentistsResponse.data.data.find(
          (item) => item.id === Number(dentistId),
        );

        setDentist(foundDentist || null);
        setUnavailableTimes(unavailableResponse.data.data || []);

        const dentistAppointments = appointmentsResponse.data.data.filter(
          (appointment) => appointment.dentist_id === Number(dentistId),
        );

        setAppointments(dentistAppointments);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Không thể tải thông tin nha sĩ.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDentistData();
  }, [dentistId]);

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : "";
  };

  // working status (trang thai nha si trong trang chi tiet)
  const getWorkingStatus = () => {
    if (dentist?.is_active === false || dentist?.user_is_active === false) {
      return {
        label: "Tạm ngưng",
        className: "warning",
      };
    }

    const today = new Date().toISOString().slice(0, 10);

    const hasUnavailableToday = unavailableTimes.some(
      (item) => item.unavailable_date === today,
    );

    const hasAppointmentToday = appointments.some(
      (item) => item.appointment_date === today,
    );

    if (hasUnavailableToday) {
      return {
        label: "Có lịch bận hôm nay",
        className: "warning",
      };
    }

    if (hasAppointmentToday) {
      return {
        label: "Có lịch khám hôm nay",
        className: "info",
      };
    }

    return {
      label: "Có thể phân công",
      className: "success",
    };
  };

  if (loading) {
    return <div className="admin-page">Đang tải thông tin nha sĩ...</div>;
  }

  if (errorMessage || !dentist) {
    return (
      <div className="admin-page admin-error-message">
        {errorMessage || "Không tìm thấy nha sĩ."}
      </div>
    );
  }

  const workingStatus = getWorkingStatus();

  return (
    <div className="admin-customer-detail">
      <section className="admin-page">
        <Link to="/admin/dentists" className="admin-back-link">
          ← Quay lại danh sách
        </Link>

        <div className="admin-page-header">
          <div>
            <h2>{dentist.full_name}</h2>
            <p>Hồ sơ nha sĩ #{dentist.id}</p>
          </div>

          <span className={`admin-status-badge ${workingStatus.className}`}>
            {workingStatus.label}
          </span>
        </div>

        <div className="customer-information-grid">
          <div>
            <span>Chuyên môn</span>
            <strong>{dentist.specialty || "Chưa cập nhật"}</strong>
          </div>

          <div>
            <span>Số điện thoại</span>
            <strong>{dentist.phone}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{dentist.email || "Chưa có email"}</strong>
          </div>

          <div>
            <span>Tài khoản</span>
            <strong>{dentist.username || "Chưa có tài khoản"}</strong>
          </div>
        </div>
      </section>

      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2>Lịch bận / nghỉ</h2>
            <p>Những thời điểm nha sĩ không nhận lịch khám.</p>
          </div>
        </div>

        {unavailableTimes.length === 0 ? (
          <p>Nha sĩ chưa có lịch bận nào.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Thời gian</th>
                  <th>Lý do</th>
                </tr>
              </thead>

              <tbody>
                {unavailableTimes.map((item) => (
                  <tr key={item.id}>
                    <td>{item.unavailable_date_display}</td>

                    <td>
                      {item.start_time && item.end_time
                        ? `${formatTime(item.start_time)} - ${formatTime(
                            item.end_time,
                          )}`
                        : "Cả ngày"}
                    </td>

                    <td>{item.reason || "Không có ghi chú"}</td>
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
            <h2>Lịch khám được phân công</h2>
            <p>Danh sách lịch hẹn hiện đang gắn với nha sĩ này.</p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <p>Nha sĩ chưa được phân công lịch khám nào.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã lịch</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>Ngày giờ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>#{appointment.id}</td>

                    <td>
                      <strong>{appointment.patient_name}</strong>
                      <span>{appointment.patient_phone}</span>
                    </td>

                    <td>{appointment.service_name}</td>

                    <td>
                      {appointment.appointment_date}
                      <span>{formatTime(appointment.appointment_time)}</span>
                    </td>

                    <td>{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDentistDetail;
