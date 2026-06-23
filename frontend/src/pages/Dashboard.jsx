function Dashboard() {
  const cards = [
    { title: "Patients", value: 120, color: "primary" },
    { title: "Dentists", value: 8, color: "success" },
    { title: "Appointments", value: 36, color: "warning" },
    { title: "Invoices", value: 42, color: "danger" }
  ];

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Dashboard thong ke</h2>
      <div className="row g-4">
        {cards.map((card) => (
          <div className="col-md-3" key={card.title}>
            <div className={`card text-bg-${card.color} shadow-sm`}>
              <div className="card-body text-center">
                <h5 className="card-title">{card.title}</h5>
                <p className="display-6 mb-0">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
