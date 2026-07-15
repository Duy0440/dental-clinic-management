const express = require("express");
const {
  listServices,
  listServicesForAdmin,
  addService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// service routes (dich vu hien thi va admin quan ly)
router.get("/", listServices);

router.get(
  "/admin",
  verifyToken,
  authorizeRoles("admin"),
  listServicesForAdmin,
);

router.post("/", verifyToken, authorizeRoles("admin"), addService);

router.put(
  "/:serviceId",
  verifyToken,
  authorizeRoles("admin"),
  updateService,
);

router.delete(
  "/:serviceId",
  verifyToken,
  authorizeRoles("admin"),
  deleteService,
);

module.exports = router;
