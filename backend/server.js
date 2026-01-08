import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { body, validationResult } from "express-validator";

dotenv.config();
const app = express();

// Needed for ES module path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve frontend as STATIC
app.use(express.static(path.join(__dirname, "../frontend")));

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
// ---------------- FRONTEND ROUTING ----------------

// Admin setup page
app.get("/setup", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/setup.html"));
});

// Admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin/login.html"));
});

// Dashboard page
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard/dashboard.html"));
});


app.use(express.json());
app.use(helmet());
app.use(morgan("tiny"));

// CORS - in production change origin to your site only
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// rate limiter (general)
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // limit each IP
  })
);

// --------------------------------------
// CONNECT TO MONGO
// --------------------------------------
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/viveezdb";
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✔ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// --------------------------------------
// MODELS
// --------------------------------------
const bookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  eventType: String,
  date: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Booking = mongoose.model("Booking", bookingSchema);
const Admin = mongoose.model("Admin", adminSchema);

// --------------------------------------
// EMAIL SENDER (Nodemailer)
// --------------------------------------
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.BREVO_SMTP_KEY,
  },
});


// Test transporter (optional)
transporter.verify().then(() => console.log("✔ Email transporter verified")).catch((err) => console.warn("Email verify failed:", err && err.message));

// --------------------------------------
// HELPERS
// --------------------------------------
function sendOwnerNotification(booking) {
  return transporter.sendMail({
    from: `"Viveez Makeover" <viveezmakeover@gmail.com>`,
    to: process.env.OWNER_EMAIL,

    // VERY IMPORTANT FOR GMAIL DELIVERABILITY
    replyTo: booking.email,

    subject: "New Booking - Viveez Makeover",
    html: `
      <h3>New Booking Received</h3>
      <p><b>Name:</b> ${booking.name}</p>
      <p><b>Phone:</b> ${booking.phone}</p>
      <p><b>Email:</b> ${booking.email}</p>
      <p><b>Event:</b> ${booking.eventType}</p>
      <p><b>Date:</b> ${booking.date || "N/A"}</p>
      <p><b>Message:</b> ${booking.message || "N/A"}</p>
    `,
  });
}


function sendCustomerConfirmation(booking) {
  if (!booking.email) return Promise.resolve();

  return transporter.sendMail({
    from: `"Viveez Makeover" <viveezmakeover@gmail.com>`,
    to: booking.email,
    replyTo: "viveezmakeover@gmail.com",

    subject: "Booking Confirmation - Viveez Makeover",
    html: `
      <p>Hello <b>${booking.name}</b>,</p>

      <p>Thank you for contacting <b>Viveez Makeover</b>.</p>

      <p>We received your booking request:</p>
      <ul>
        <li><b>Event:</b> ${booking.eventType}</li>
        <li><b>Date:</b> ${booking.date || "To be discussed"}</li>
      </ul>

      <p>We will contact you shortly.</p>

      <p>📞 95857 33112<br/>
      💄 Viveez Makeover</p>
    `,
  });
}


// --------------------------------------
// CREATE BOOKING (Customer Form) - with validation & rate limit
// booking rate limiter (keep or adjust)
const bookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: "Too many booking attempts. Try again later." }
});

app.post(
  "/api/book",
  bookRateLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .bail()
      .isEmail().withMessage("Email must be valid")
      .normalizeEmail(),
    body("eventType").trim().notEmpty().withMessage("Event Type is required"),
    body("date").optional().trim(),
    body("message").optional().trim().escape()
  ],
  async (req, res) => {
    try {
      // log incoming body for debugging (remove in production)
      console.log("Incoming booking request body:", req.body);

      // validate
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      // destructure sanitized values
      const { name, phone, email, eventType, date, message } = req.body;

      // save booking
      const booking = new Booking({ name, phone, email, eventType, date, message });
      const saved = await booking.save();

      // send emails but do not block response on failure
      // use Promise.allSettled so failures are captured but don't throw
      const emailPromises = [
        sendOwnerNotification(saved).catch((err) => { throw new Error(`Owner email failed: ${err?.message || err}`); }),
        sendCustomerConfirmation(saved).catch((err) => { throw new Error(`Customer email failed: ${err?.message || err}`); })
      ];

      const emailResults = await Promise.allSettled(emailPromises);
      emailResults.forEach((r, i) => {
        if (r.status === "rejected") {
          console.warn(`Email #${i} error:`, r.reason?.message || r.reason);
        }
      });

      // success response
      return res.status(201).json({
        success: true,
        message: "Booking saved. Emails processed (may have failed).",
        booking: saved
      });
    } catch (error) {
      console.error("Booking error:", error);
      return res.status(500).json({ success: false, message: "Booking failed." });
    }
  }
);


// --------------------------------------
// ONE-TIME ADMIN SETUP (RUN ONCE) - create admin
// --------------------------------------
app.post("/api/admin/setup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ success: false, message: "username & password required" });
    }

    const exists = await Admin.findOne({ username });
    if (exists) {
      return res.json({ success: false, message: "Admin already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await Admin.create({ username, password: hashed });

    res.json({ success: true, message: "Admin created successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Setup failed" });
  }
});


app.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"Viveez Makeover" <viveezmakeover@gmail.com>`,
      to: "viveezmakeover@gmail.com",
      subject: "Brevo Gmail Test",
      text: "If you received this, Brevo + Gmail works.",
    });

    res.send("Email sent successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Email failed");
  }
});



// --------------------------------------
// ADMIN LOGIN -> returns JWT
// --------------------------------------
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    const admin = await Admin.findOne({ username });
    console.log("ADMIN FOUND:", admin);

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, message: "Login error" });
  }
});


// --------------------------------------
// GET BOOKINGS (Admin Protected)
// --------------------------------------
app.get("/api/admin/bookings", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, message: "Unauthorized" });

    const token = auth.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);

    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Admin bookings failed:", err && err.message);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// --------------------------------------
// START SERVER
// --------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✔ Backend running on port ${PORT}`));


import PDFDocument from "pdfkit"

app.get("/api/admin/bookings/pdf", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).end();

    jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);

    const bookings = await Booking.find().sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=bookings.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Viveez Makeover – Booking Report", { align: "center" });
    doc.moveDown();

    bookings.forEach((b, i) => {
      doc
        .fontSize(11)
        .text(
          `${i + 1}. ${b.name} | ${b.phone} | ${b.eventType} | ${b.date || "N/A"}`
        );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch {
    res.status(401).end();
  }
});
