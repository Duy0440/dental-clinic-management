require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

// start server (chay backend)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
