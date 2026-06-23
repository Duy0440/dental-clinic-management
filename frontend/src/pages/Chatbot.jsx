import { useState } from "react";
import axiosClient from "../api/axiosClient";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axiosClient.post("/chatbot", { message });
      setReply(response.data.reply);
    } catch (error) {
      setReply("Chatbot tam thoi chua tra loi duoc.");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Chatbot tu van nha khoa</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nhap cau hoi</label>
                  <textarea className="form-control" rows="4" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Vi du: Gia nho rang la bao nhieu?"></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Gui cau hoi</button>
              </form>

              {reply && (
                <div className="alert alert-info mt-4 mb-0">
                  <strong>Tra loi:</strong> {reply}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
