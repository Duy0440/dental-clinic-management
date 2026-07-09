import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const getRatingText = (rating) => {
  if (Number(rating) >= 5) return "Rất hài lòng";
  if (Number(rating) === 4) return "Hài lòng";
  if (Number(rating) === 3) return "Bình thường";
  return "Cần cải thiện";
};

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axiosClient.get("/reviews");
        setReviews(response.data.data || []);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Không thể tải danh sách đánh giá.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((total, review) => total + Number(review.rating), 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="admin-card">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h2 className="mb-1">Đánh giá của khách hàng</h2>
          <p className="text-secondary mb-0">
            Theo dõi phản hồi sau điều trị để cải thiện chất lượng dịch vụ.
          </p>
        </div>

        <div className="text-end">
          <p className="text-secondary mb-1">Điểm trung bình</p>
          <h3 className="mb-0 text-warning">{averageRating}/5</h3>
        </div>
      </div>

      {loading && <p>Đang tải danh sách đánh giá...</p>}

      {!loading && errorMessage && (
        <div className="alert alert-danger rounded-4">{errorMessage}</div>
      )}

      {!loading && !errorMessage && reviews.length === 0 && (
        <div className="alert alert-light border rounded-4">
          Chưa có khách hàng nào gửi đánh giá.
        </div>
      )}

      {!loading && !errorMessage && reviews.length > 0 && (
        <div className="table-responsive">
          <table className="table align-middle admin-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Điểm</th>
                <th>Nội dung đánh giá</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.patient_name}</strong>
                  </td>
                  <td>{review.service_name}</td>
                  <td>
                    <span className="badge rounded-pill text-bg-warning px-3 py-2">
                      {review.rating} sao - {getRatingText(review.rating)}
                    </span>
                  </td>
                  <td>{review.comment || "Khách hàng không để lại nhận xét."}</td>
                  <td>
                    {new Date(review.created_at).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
