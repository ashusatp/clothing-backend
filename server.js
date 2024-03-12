const express = require("express");
const { APP_PORT } = require("./config");
const app = express();
const cors = require("cors");
const PORT = APP_PORT || 5500;
const connectDB = require("./config/database");
const errorHandler = require("./middlewares/errorHandler");
const cloudinaryConfig = require("./config/cloudinary");
connectDB();
cloudinaryConfig();

const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(
  cors({
    origin:'*',
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);


const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Listning on port : ${PORT}`);
});
