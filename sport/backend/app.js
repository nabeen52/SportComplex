require('dotenv').config();

const connectDB = require('./db'); // << ต้องมี!
connectDB(); // << ต้องเรียกแค่ที่เดียว!

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const axios = require('axios');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// Models
const Field = require('./models/field');
const User = require('./models/users');
const Equipment = require('./models/equipment');
const Cart = require('./models/cart');
const History = require('./models/history');
const Announcement = require('./models/announcement');
const BookingEquipment = require('./models/booking_equipment');
const ImgNews = require('./models/img_news');
const Information = require('./models/information');
const bcrypt = require('bcrypt');
const UploadFile = require('./models/upload_file');
const BookingField = require('./models/booking_field');


const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || "YOUR_SUPER_SECRET";
const nodemailer = require('nodemailer');

// กำหนด transport ของคุณ (gmail, outlook, smtp ต่างๆ)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});

// ฟังก์ชันสำหรับส่งอีเมล
// ฟังก์ชันส่งอีเมล
async function sendApproveEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: อนุมัติการยืมอุปกรณ์',
        html: `
            <div>
                <h2>รายการยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว</h2>
                <p><b>ชื่อผู้ยืม:</b> ${name || '-'}</p>
                <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
                <p><b>จำนวน:</b> ${quantity || '-'}</p>
                <br>
                <p>กรุณาติดต่อรับอุปกรณ์ที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลไม่สำเร็จ:', err);
    }
}

// Helper: ดึงอีเมล staff ทั้งหมดในระบบ (role staff/admin)
async function getStaffEmails() {
    const staff = await User.find({ role: 'staff', email: { $exists: true, $ne: "" } });
    return staff.map(s => s.email);
}

// ดึงอีเมล admin ทุกคน
async function getAdminEmails() {
    const admins = await User.find({ role: 'admin', email: { $exists: true, $ne: "" } });
    return admins.map(s => s.email);
}
// แจ้งเตือน admin ทุกคนเมื่อมีรายการยืมอุปกรณ์ "หลายวัน"
async function notifyAdminNewBorrow({ requester, items, booking_id }) {
    const adminEmails = await getAdminEmails();
    if (!adminEmails.length) return;
    let itemList = items.map(it => `<li>${it.name} (จำนวน: ${it.quantity})</li>`).join("");
    const html = `
      <div>
        <h2>มีรายการขอยืมอุปกรณ์รออนุมัติ</h2>
        <p><b>ผู้ขอ:</b> ${requester}</p>
        <ul>${itemList}</ul>
        <p><b>Booking ID:</b> ${booking_id || '-'}</p>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: adminEmails,
        subject: 'แจ้งเตือน: มีรายการขอยืมอุปกรณ์รออนุมัติ (ยืมหลายวัน)',
        html
    });
}


// แจ้งเตือน staff ทุกคนเมื่อมีรายการยืมอุปกรณ์วันเดียว
async function notifyStaffNewBorrow({ requester, items, booking_id }) {
    const staffEmails = await getStaffEmails();
    if (!staffEmails.length) return;
    let itemList = items.map(it => `<li>${it.name} (จำนวน: ${it.quantity})</li>`).join("");
    const html = `
      <div>
        <h2>มีรายการขอยืมอุปกรณ์รออนุมัติ</h2>
        <p><b>ผู้ขอ:</b> ${requester}</p>
        <ul>${itemList}</ul>
        <p><b>Booking ID:</b> ${booking_id || '-'}</p>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: staffEmails,
        subject: 'แจ้งเตือน: มีรายการขอยืมอุปกรณ์รออนุมัติ (ยืมวันเดียว)',
        html
    });
}
// Helper: ส่งอีเมลแจ้งเตือน staff (ใช้ subject กับ html อะไรก็ได้)
// Helper: ส่งอีเมลแจ้งเตือนคน approve ว่ามีรายการรอ confirm การคืน
async function notifyApproverReturnPending({ approverId, userName, equipment, quantity, booking_id }) {
    if (!approverId) return;
    const staff = await User.findOne({ user_id: approverId });
    if (!staff || !staff.email) return;
    const html = `
        <div>
            <h2>มีรายการคืนอุปกรณ์ที่รอการยืนยันการคืนจากคุณ</h2>
            <p><b>ชื่อผู้ยืม:</b> ${userName || '-'}</p>
            <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
            <p><b>จำนวน:</b> ${quantity || '-'}</p>
            <p><b>Booking ID:</b> ${booking_id || '-'}</p>
            <br>
            <p>กรุณาตรวจสอบและยืนยันการคืนที่ระบบศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
            <hr>
            <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
        </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: staff.email,
        subject: 'แจ้งเตือน: มีรายการคืนอุปกรณ์รอการยืนยัน',
        html
    });
}


// ฟังก์ชันส่งอีเมลแจ้ง user ว่า "ไม่ได้รับการอนุมัติการยืมอุปกรณ์"
async function sendDisapproveEquipmentEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: ไม่อนุมัติการยืมอุปกรณ์',
        html: `
            <div>
                <h2>รายการขอยืมอุปกรณ์ของคุณไม่ได้รับการอนุมัติ</h2>
                <p><b>ชื่อผู้ยืม:</b> ${name || '-'}</p>
                <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
                <p><b>จำนวน:</b> ${quantity || '-'}</p>
                <br>
                <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง disapprove equipment ไม่สำเร็จ:', err);
    }
}




// ส่งอีเมลแจ้ง user ว่าคืนของสำเร็จแล้ว
async function sendReturnSuccessEmail({ to, name, equipment, quantity }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: คืนอุปกรณ์สำเร็จ',
        html: `
            <div>
                <h2>การคืนอุปกรณ์ของคุณสำเร็จ</h2>
                <p><b>ชื่อผู้คืน:</b> ${name || '-'}</p>
                <p><b>อุปกรณ์:</b> ${equipment || '-'}</p>
                <p><b>จำนวน:</b> ${quantity || '-'}</p>
                <br>
                <p>ขอบคุณที่ใช้บริการศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลคืนของสำเร็จไม่สำเร็จ:', err);
    }
}




// แจ้งเตือน admin ทุกคนเมื่อมีรายการขอใช้สนามเข้ามาใหม่ (pending)
async function notifyAdminNewFieldBooking({ requester, building, activity, since, uptodate, zone, booking_id }) {
    const adminEmails = await getAdminEmails();
    if (!adminEmails.length) return;
    const html = `
      <div>
        <h2>มีรายการขออนุมัติใช้สนาม รอพิจารณา</h2>
        <p><b>ผู้ขอ:</b> ${requester || '-'}</p>
        <p><b>อาคาร/สนาม:</b> ${building || '-'}</p>
        <p><b>กิจกรรม:</b> ${activity || '-'}</p>
        <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
        <p><b>โซน:</b> ${zone || '-'}</p>
        <p><b>Booking ID:</b> ${booking_id || '-'}</p>
        <br>
        <p>กรุณาเข้าสู่ระบบศูนย์กีฬาเพื่ออนุมัติรายการนี้</p>
        <hr>
        <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
      </div>
    `;
    await transporter.sendMail({
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to: adminEmails,
        subject: 'แจ้งเตือน: มีรายการขออนุมัติใช้สนาม',
        html
    });
}

// ส่งอีเมลแจ้ง user ว่าได้รับการอนุมัติการขอใช้สนาม
async function sendApproveFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: การจองสนามของคุณได้รับการอนุมัติ',
        html: `
            <div>
                <h2>รายการขอใช้สนามของคุณได้รับการอนุมัติ</h2>
                <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
                <p><b>สนาม:</b> ${field || '-'}</p>
                <p><b>กิจกรรม:</b> ${activity || '-'}</p>
                <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
                <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
                <br>
                <p>ขอบคุณที่ใช้บริการศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง approve field ไม่สำเร็จ:', err);
    }
}

// ส่งอีเมลแจ้ง user ว่าไม่ได้รับการอนุมัติจองสนาม
async function sendDisapproveFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: ไม่อนุมัติการขอใช้สนาม',
        html: `
            <div>
                <h2>รายการขอใช้สนามของคุณไม่ได้รับการอนุมัติ</h2>
                <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
                <p><b>สนาม:</b> ${field || '-'}</p>
                <p><b>กิจกรรม:</b> ${activity || '-'}</p>
                <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
                <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
                <br>
                <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง disapprove field ไม่สำเร็จ:', err);
    }
}

// ฟังก์ชันส่งอีเมลแจ้ง user ว่า "รายการขอใช้สนามของคุณถูกยกเลิก"
async function sendCancelFieldEmail({ to, name, field, activity, since, uptodate, startTime, endTime }) {
    if (!to) return;
    const mailOptions = {
        from: '"MFU Sport Complex" <your.email@gmail.com>',
        to,
        subject: 'แจ้งเตือน: การขอใช้สนามของคุณถูกยกเลิก',
        html: `
            <div>
                <h2>รายการขอใช้สนามของคุณถูกยกเลิก</h2>
                <p><b>ชื่อผู้ขอ:</b> ${name || '-'}</p>
                <p><b>สนาม:</b> ${field || '-'}</p>
                <p><b>กิจกรรม:</b> ${activity || '-'}</p>
                <p><b>วันที่:</b> ${since || '-'} ถึง ${uptodate || '-'}</p>
                <p><b>เวลา:</b> ${startTime || '-'} ถึง ${endTime || '-'}</p>
                <br>
                <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('ส่งเมลแจ้ง cancel field ไม่สำเร็จ:', err);
    }
}




async function saveGoogleProfilePic(picUrl, userId) {
    try {
        const response = await axios.get(picUrl, { responseType: 'arraybuffer' });
        const imgPath = path.join(__dirname, 'uploads', `profile-${userId}.jpg`);
        fs.writeFileSync(imgPath, response.data);
        // Return url สำหรับ frontend
        return `/uploads/profile-${userId}.jpg`;
    } catch (e) {
        console.error('Download google profile error:', e.message);
        return null;
    }
}


// mongoose.connection.once('open', () => {
//     console.log('[MongoDB connected]', mongoose.connection.name);
// });


const app = express();
// Connect MongoDB


// =============== เชื่อมต่อ MongoDB ที่เดียว! ==================
// mongoose.connect(process.env.MONGO_URI, { // options จะใส่หรือไม่ใส่ก็ได้
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
//     .then(() => console.log('[MongoDB connected]', mongoose.connection.name))
//     .catch(err => console.error('MongoDB connection error:', err));
// // =


app.set('trust proxy', 1);


const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8010',
    'http://localhost:3000',
    'https://reserv-scc.mfu.ac.th'
];
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

//login oauth



app.use(session({
    secret: process.env.SESSION_SECRET || 'YOUR_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',         // true = require HTTPS (production)
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // 'none' = cross-site (prod), 'lax' = dev
        httpOnly: true,
        path: '/',
        // domain: 'reserv-scc.mfu.ac.th'   // เปิดถ้าต้องการ lock domain (แนะนำกรณี deploy จริง)
    }
}));


app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.user_id));  // หรือ user._id ถ้า MongoDB
passport.deserializeUser(async (id, done) => {
    try {
        // หา user จริงจาก database (ควรใช้ user_id)
        const user = await User.findOne({ user_id: id });
        done(null, user);
    } catch (err) {
        done(err);
    }
});



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            // บังคับให้ login ได้เฉพาะ email @mfu.ac.th เท่านั้น
            if (!email.endsWith('.mfu.ac.th')) {
                // ถ้า email ไม่ตรง จะไม่ login ให้
                return done(null, false, { message: 'อนุญาตเฉพาะอีเมล mfu.ac.th เท่านั้น' });
            }
            let user = await User.findOne({ email });
            // ดึง url รูปจาก Google profile
            let profilePicUrl = profile._json.picture || '';

            // ดาวน์โหลดและบันทึกรูป Google profile เป็นไฟล์ใน server (และได้ url กลับมา)
            let savedPicUrl = null;
            if (profilePicUrl && profile.id) {
                savedPicUrl = await saveGoogleProfilePic(profilePicUrl, profile.id);
            }

            if (!user) {
                user = new User({
                    email: email,
                    name: profile.displayName,
                    user_id: profile.id,
                    role: 'user',
                    picture: savedPicUrl || profilePicUrl
                });
                await user.save();
            } else {
                user.picture = savedPicUrl || profilePicUrl;
                await user.save();
            }
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));



function requireLogin(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    res.status(401).json({ success: false, message: 'Not logged in' });
}

function generateToken(user) {
    return jwt.sign({
        user_id: user.user_id,
        role: user.role // เพิ่ม field ที่อยากใช้
    }, SECRET, { expiresIn: '2h' });
}

// Middleware ตรวจ JWT
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.use('/api', (req, res, next) => {
    if (req.path === '/me') return next();
    requireLogin(req, res, next);
});

// ====== OAuth Routes ======

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


app.post('/auth/login', async (req, res) => {
    // ... ตรวจ user/pass ตามระบบเดิม
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    // ตรวจสอบรหัสผ่าน (ใส่ logic ตามระบบเดิม)
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid login" });
    }
    const token = generateToken(user);
    res.json({ token }); // ส่ง JWT กลับไป frontend
});

// ตัวอย่าง protect route:
app.get('/api/protected', authenticateJWT, (req, res) => {
    res.json({ message: "You are authenticated!", user: req.user });
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8010';
// =================== LOGOUT ===================
app.post('/api/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true });
        });
    });
});

// Express Route (เพิ่มเข้าไปใน app.js)
app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            // เปลี่ยน wreply= ให้เป็น url ที่กำหนดใน env
            const ssoLogoutUrl = `https://authsso.mfu.ac.th/adfs/ls/?wa=wsignout1.0&wreply=${FRONTEND_URL}/login`;
            res.clearCookie('connect.sid');
            res.redirect(ssoLogoutUrl);
        });
    });
});





app.get('/auth/logout-google', (req, res) => {
    res.redirect('https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://localhost:3000/auth/google');
});


app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failed', session: true }),
    (req, res) => {
        // เปลี่ยนให้ redirect ไปที่ url ที่กำหนดใน env
        res.redirect(`${FRONTEND_URL}/login-success`);
    }
);



app.get('/api/me', (req, res) => {
    if (req.user) {
        res.json({
            loggedIn: true,
            user: req.user
        });
    } else {
        res.status(401).json({ loggedIn: false });
    }
});









// ไม่มี EquipmentBorrow (ใช้ BookingEquipment แทน)




function calcTotalHours(since, uptodate, startTime, endTime) {
    if (!since || !uptodate || !startTime || !endTime) return 0;
    const sinceDate = new Date(since);
    const uptodateDate = new Date(uptodate);
    if (isNaN(sinceDate) || isNaN(uptodateDate)) return 0;
    const oneDay = 1000 * 60 * 60 * 24;
    const numDays = Math.floor((uptodateDate - sinceDate) / oneDay) + 1;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let hourPerDay = ((endHour + endMin / 60) - (startHour + startMin / 60));
    if (hourPerDay < 0) hourPerDay = 0;
    return +(numDays * hourPerDay).toFixed(2);

}

const bookingFieldUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './uploads/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});










// ============ Multer + Static Uploads (upload file to ./uploads) ==========
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './uploads/');
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedExt = ['.png', '.jpg', '.jpeg', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExt.includes(ext)) {
            return cb(new Error('Unsupported file type'), false);
        }
        cb(null, true);
    }
});


app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
        success: true,
        fileUrl: fullUrl
    });
});
// ===========================================================================

// ==================== Health Check ====================
app.get('/', (req, res) => res.send('Backend is running!'));

// ==================== Register / Login ====================
app.post('/api/register', (req, res) => {
    res.send({ success: true, message: 'Register completed' });
});

// app.get('/auth/callback', async (req, res) => {
//     const code = req.query.code;
//     if (!code) return res.status(400).send('No code provided');
//     try {
//         const tokenResponse = await axios.post('https://lamduan.mfu.ac.th/oauth/token', {
//             grant_type: 'authorization_code',
//             code,
//             redirect_uri: 'http://localhost:3000/auth/callback',
//             client_id: 'YOUR_CLIENT_ID',
//             client_secret: 'YOUR_CLIENT_SECRET'
//         }, {
//             headers: { 'Content-Type': 'application/json' }
//         });
//         const access_token = tokenResponse.data.access_token;
//         const userResponse = await axios.get('https://lamduan.mfu.ac.th/api/userinfo', {
//             headers: { Authorization: `Bearer ${access_token}` }
//         });
//         const { email, name, student_id } = userResponse.data;
//         let user = await User.findOne({ email });
//         if (!user) {
//             user = new User({ email, name, user_id: student_id, role: 'user' });
//             await user.save();
//         }
//         res.json({
//             success: true,
//             user: {
//                 name: user.name,
//                 email: user.email,
//                 user_id: user.user_id,
//                 role: user.role
//             }
//         });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// });


// app.post('/api/login', async (req, res) => {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username, password });
//     if (!user) return res.status(401).send({ success: false, message: "Username หรือ Password ไม่ถูกต้อง" });
//     res.send({
//         success: true,
//         token: "dummy-token",
//         user_id: user.user_id,
//         role: user.role,
//         name: user.name,
//         email: user.email   // <<<< เพิ่มบรรทัดนี้
//     });
// });


app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // บังคับให้ login ได้เฉพาะ email @mfu.ac.th เท่านั้น
        if (!username.endsWith('.mfu.ac.th')) {
            return res.status(401).json({ success: false, message: 'กรุณาใช้ email ที่ลงท้ายด้วย @mfu.ac.th' });
        }

        // หา user จาก username
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ success: false, message: "Username หรือ Password ไม่ถูกต้อง" });

        // ตรวจสอบ password กับ hash ที่อยู่ใน database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Username หรือ Password ไม่ถูกต้อง" });

        // สำเร็จ!
        res.json({
            success: true,
            token: "dummy-token", // หรือ JWT จริงก็ได้
            user_id: user.user_id,
            role: user.role,
            name: user.name
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});



// ==================== User APIs ====================
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/users/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.userId });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/users/email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
// === เพิ่ม API ดูชื่อจาก user_id ===
app.get('/api/user/:user_id', async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.user_id });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send({ name: user.name, user_id: user.user_id });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Field CRUD ====================
app.get('/api/fields', async (req, res) => {
    try {
        const fields = await Field.find();
        res.send(fields);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/fields', async (req, res) => {
    try {
        const { name, image, visible, hasZone, zones } = req.body;
        const field = new Field({
            name,
            image,
            visible,
            hasZone,
            zones: hasZone ? (zones || []) : []
        });
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.patch('/api/fields/:id', async (req, res) => {
    try {
        const updateFields = {};
        ['name', 'image', 'visible', 'hasZone', 'zones'].forEach(key => {
            if (req.body[key] !== undefined) updateFields[key] = req.body[key];
        });
        const updated = await Field.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!updated) return res.status(404).send({ success: false, message: 'ไม่พบสนาม' });
        res.send({ success: true, data: updated });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/fields/:id', async (req, res) => {
    try {
        const deleted = await Field.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send({ message: 'ไม่พบสนาม' });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/fields/:fieldId/zones', async (req, res) => {
    try {
        const { name, image, status, active } = req.body;
        const field = await Field.findById(req.params.fieldId);
        if (!field) return res.status(404).send({ message: 'ไม่พบสนาม' });
        field.hasZone = true;
        field.zones.push({ name, image, status, active });
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.patch('/api/fields/:fieldId/zones/:zoneIndex', async (req, res) => {
    try {
        const field = await Field.findById(req.params.fieldId);
        if (!field) return res.status(404).send({ message: 'ไม่พบสนาม' });
        const z = parseInt(req.params.zoneIndex);
        if (!field.zones[z]) return res.status(404).send({ message: 'ไม่พบโซน' });
        ['name', 'image', 'status', 'active'].forEach(key => {
            if (req.body[key] !== undefined) field.zones[z][key] = req.body[key];
        });
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/fields/:fieldId/zones/:zoneIndex', async (req, res) => {
    try {
        const field = await Field.findById(req.params.fieldId);
        if (!field) return res.status(404).send({ message: 'ไม่พบสนาม' });
        const z = parseInt(req.params.zoneIndex);
        if (!field.zones[z]) return res.status(404).send({ message: 'ไม่พบโซน' });
        field.zones.splice(z, 1);
        await field.save();
        res.send({ success: true, data: field });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Equipment CRUD ====================
app.get('/api/equipments', async (req, res) => {
    try {
        const equipments = await Equipment.find();
        res.send(equipments);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/equipments', async (req, res) => {
    try {
        const { name, quantity, image, visible } = req.body;
        const equipment = new Equipment({ name, quantity, image, visible });
        await equipment.save();
        res.send({ success: true, data: equipment });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.patch('/api/equipments/:id', async (req, res) => {
    try {
        const updateFields = {};
        if (req.body.quantity !== undefined) updateFields.quantity = req.body.quantity;
        if (req.body.name !== undefined) updateFields.name = req.body.name;
        if (req.body.image !== undefined) updateFields.image = req.body.image;
        if (req.body.visible !== undefined) updateFields.visible = req.body.visible;
        const updated = await Equipment.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!updated) return res.status(404).send({ success: false, message: 'ไม่พบอุปกรณ์' });
        res.send({ success: true, data: updated });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.delete('/api/equipments/:id', async (req, res) => {
    try {
        const deleted = await Equipment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send({ success: false, message: 'ไม่พบอุปกรณ์' });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// ==================== Cart CRUD ====================
app.get('/api/cart', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).send({ message: "user_id is required" });
        }
        const cart = await Cart.find({ user_id });
        res.send(cart);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/cart', async (req, res) => {
    try {
        const { user_id, name, quantity, image } = req.body;
        if (!user_id || !name || !quantity) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
        }
        // **ถ้ามีอยู่แล้วให้ update ปริมาณ**
        let cartItem = await Cart.findOne({ user_id, name });
        if (cartItem) {
            cartItem.quantity += Number(quantity);
            await cartItem.save();
        } else {
            cartItem = new Cart({ user_id, name, quantity, image });
            await cartItem.save();
        }
        res.send({ success: true, message: 'Added to cart', cartItem });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

app.delete('/api/cart', async (req, res) => {
    try {
        const user_id = req.body?.user_id || req.query?.user_id;
        if (user_id) {
            await Cart.deleteMany({ user_id });
        } else {
            await Cart.deleteMany({});
        }
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.put('/api/cart/update', async (req, res) => {
    const { user_id, name, quantity } = req.body;
    try {
        await Cart.updateOne({ user_id, name }, { $set: { quantity } });
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.delete('/api/cart/delete', async (req, res) => {
    const { user_id, name } = req.body;
    try {
        await Cart.deleteOne({ user_id, name });
        res.sendStatus(200);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==================== History (Borrow/Return/Approve/Disapprove) ====================
app.post('/api/history', async (req, res) => {
    try {
        // Default ให้ quantity = 1 สำหรับ type field
        if (req.body.type === 'field' && !req.body.quantity) {
            req.body.quantity = 1;
        }
        if (!req.body.user_id || !req.body.name || !req.body.quantity || !req.body.status) {
            return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบ (user_id, name, quantity, status)' });
        }

        // ===== ป้องกัน duplicate การจองซ้ำ (โดยเฉพาะตอน network lag / double-click) =====
        const duplicateCond = {
            user_id: req.body.user_id,
            name: req.body.name,
            status: "pending",
            type: req.body.type,
            since: req.body.since || "",
            uptodate: req.body.uptodate || "",
            zone: req.body.zone || "",
            startTime: req.body.startTime || req.body.start_time || "",
            endTime: req.body.endTime || req.body.end_time || "",
            booking_id: req.body.booking_id || ""
        };
        // ถ้ามีรายการซ้ำ (pending) อยู่แล้ว ไม่สร้างใหม่
        const exist = await History.findOne(duplicateCond);
        if (exist) {
            return res.status(409).json({ success: false, message: "พบรายการที่ยังไม่อนุมัติอยู่แล้ว", duplicate: exist });
        }
        // ============================================================

        let agencyName = (req.body.agency || '').trim();
        if (req.body.type === 'field') {
            // ---- สร้าง history สำหรับ field ----
            const newHistory = new History({
                user_id: req.body.user_id,
                name: req.body.name,
                name_active: req.body.name_active,
                zone: req.body.zone,
                since: req.body.since,
                uptodate: req.body.uptodate,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                status: req.body.status,
                type: 'field',
                attachment: req.body.attachment || null,
                fileName: req.body.fileName || null,
                fileType: req.body.fileType || null,
                agency: req.body.agency || '',
                booking_id: req.body.booking_id || '',
                date: req.body.date || new Date(),
            });
            await newHistory.save();

            if (agencyName !== "") {
                const existField = await Information.findOne({ unit: agencyName, type: 'field' });
                if (!existField) {
                    await Information.create({ unit: agencyName, usage: 0, type: 'field' });
                }
                const existEquip = await Information.findOne({ unit: agencyName, type: 'equipment' });
                if (!existEquip) {
                    await Information.create({ unit: agencyName, usage: 0, type: 'equipment' });
                }
            }

            // ======================= แจ้งเตือน admin เมื่อมีการจองสนามใหม่ =======================
            try {
                let user = await User.findOne({ user_id: req.body.user_id });
                let requester = user?.name || user?.email || req.body.user_id;
                await notifyAdminNewFieldBooking({
                    requester,
                    building: req.body.name,
                    activity: req.body.name_active,
                    since: req.body.since,
                    uptodate: req.body.uptodate,
                    zone: req.body.zone,
                    booking_id: req.body.booking_id || newHistory._id
                });
            } catch (mailErr) {
                console.error('[Send field-booking notify mail error]', mailErr.message);
            }
            // =============================================================================
            return res.send({ success: true, history: newHistory });

        } else {
            // ===== กรณี equipment =====
            const newHistory = new History({
                user_id: req.body.user_id,
                name: req.body.name,
                quantity: Number(req.body.quantity),
                status: req.body.status,
                date: req.body.since ? req.body.since : new Date(),
                since: req.body.since || '',
                uptodate: req.body.uptodate || '',
                type: 'equipment',
                attachment: req.body.attachment || null,
                fileName: req.body.fileName || null,
                fileType: req.body.fileType || null,
                agency: req.body.agency || '',
                booking_id: req.body.booking_id || '',
            });
            await newHistory.save();

            if (newHistory.agency && newHistory.agency.trim() !== "") {
                await Information.findOneAndUpdate(
                    { unit: newHistory.agency, type: 'equipment' },
                    { $setOnInsert: { usage: 0 } },
                    { upsert: true }
                );
            }

            // ====== ส่วนนี้คือจุดที่ต้องปรับ (เลือก staff หรือ admin) ======
            if (req.body.status === 'pending') {
                const isOneDay = !req.body.since || !req.body.uptodate || req.body.since === req.body.uptodate;
                let user = await User.findOne({ user_id: req.body.user_id });
                let requester = user?.name || user?.email || req.body.user_id;

                const itemData = [{
                    name: req.body.name,
                    quantity: req.body.quantity
                }];
                const booking_id = req.body.booking_id || "";

                if (isOneDay) {
                    await notifyStaffNewBorrow({ requester, items: itemData, booking_id });
                } else {
                    await notifyAdminNewBorrow({ requester, items: itemData, booking_id });
                }
            }
            // ====== จบส่วนส่งอีเมล ======

            return res.send({ success: true, history: newHistory });
        }
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});




app.get('/api/history', async (req, res) => {
    try {
        const filter = {};
        if (req.query.user_id) {
            filter.user_id = req.query.user_id;
        }
        const histories = await History.find(filter).lean();
        console.log("All histories:", histories.map(h => ({ name: h.name, user_id: h.user_id, type: h.type, status: h.status })));

        const userIds = histories.map(h => h.user_id);
        const users = await User.find({ user_id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u.name);

        histories.forEach(h => {
            // สร้าง timestamp จาก ObjectId (แบบ new)
            const timestamp = new mongoose.Types.ObjectId(h._id).getTimestamp();

            let sortDate;
            if (h.type === 'field' && h.date && h.startTime) {
                sortDate = new Date(`${h.date}T${h.startTime}`);
            } else if (h.approvedAt) {
                sortDate = new Date(h.approvedAt);
            } else {
                sortDate = timestamp;
            }

            h.sortDate = sortDate;
            h.requester = userMap[h.user_id] || h.user_id;
            h.fileUrl = h.attachment ? h.attachment : null;
        });

        // เรียงจากใหม่ไปเก่า โดยใช้ sortDate รวมทั้งสนามและอุปกรณ์
        histories.sort((a, b) => b.sortDate - a.sortDate);

        res.send(histories);


    } catch (err) {
        console.error('Error in /api/history:', err);
        res.status(500).send({ message: err.message });
    }
});




app.delete('/api/history/:id', async (req, res) => {
    try {
        const deleted = await History.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send({ message: 'Not found' });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.patch('/api/history/:id/return', async (req, res) => {
    try {
        const staffId = req.body.staff_id;
        const staff = await User.findOne({ user_id: staffId });
        const staffName = staff ? staff.name : staffId;
        const oldRecord = await History.findById(req.params.id);
        if (!oldRecord) return res.status(404).send({ message: 'Not found' });

        // อัปเดตจำนวนใน Equipment
        await Equipment.updateOne(
            { name: oldRecord.name.trim() },
            { $inc: { quantity: Math.abs(oldRecord.quantity) } }
        );

        const returnedRecord = new History({
            user_id: oldRecord.user_id,
            name: oldRecord.name,
            type: oldRecord.type,
            quantity: oldRecord.quantity,
            date: new Date(),
            status: 'returned',
            approvedBy: oldRecord.approvedBy,
            approvedById: oldRecord.approvedById,
            returnedBy: staffName,
            returnedById: staffId,
            remark: req.body.remark || '',
            returnedAt: new Date(),
            attachment: oldRecord.attachment || null,
            fileName: oldRecord.fileName || null,
            fileType: oldRecord.fileType || null,
            booking_id: oldRecord.booking_id || null  // เพิ่มบรรทัดนี้
        });

        await returnedRecord.save();

        // ลบ record เก่าที่ยังไม่คืน
        await History.findByIdAndDelete(req.params.id);

        // === ส่งอีเมลแจ้ง user ว่าคืนของสำเร็จแล้ว ===
        try {
            const user = await User.findOne({ user_id: oldRecord.user_id });
            if (user && user.email) {
                await sendReturnSuccessEmail({
                    to: user.email,
                    name: user.name || user.email || oldRecord.user_id,
                    equipment: oldRecord.name,
                    quantity: oldRecord.quantity
                });
            }
        } catch (mailErr) {
            console.error('ส่งเมลคืนของสำเร็จไม่สำเร็จ:', mailErr.message);
        }

        res.send(returnedRecord);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


app.patch('/api/history/:id/request-return', async (req, res) => {
    try {
        const oldRecord = await History.findById(req.params.id);
        if (!oldRecord) return res.status(404).send({ message: 'Not found' });
        const returnRequest = new History({
            user_id: oldRecord.user_id,
            name: oldRecord.name,
            type: oldRecord.type,
            quantity: oldRecord.quantity,
            date: new Date(),
            status: 'return-pending',
            attachment: req.body.attachment || null,
            fileName: req.body.fileName || null,
            fileType: req.body.fileType || null,
            booking_id: req.body.booking_id || oldRecord.booking_id || null,
            returnPhoto: req.body.attachment || null,
            // **** เพิ่ม 2 บรรทัดนี้ ****
            since: oldRecord.since || '',
            uptodate: oldRecord.uptodate || ''

        });
        await returnRequest.save();

        // ==== แจ้งเตือนคน approve (ถ้ามี) ====
        try {
            const approverId = oldRecord.approvedById;
            let borrowerName = "";
            const borrower = await User.findOne({ user_id: oldRecord.user_id });
            if (borrower) borrowerName = borrower.name || borrower.email || borrower.user_id;
            if (approverId) {
                await notifyApproverReturnPending({
                    approverId: approverId,
                    userName: borrowerName,
                    equipment: oldRecord.name,
                    quantity: oldRecord.quantity,
                    booking_id: oldRecord.booking_id || ""
                });
            }
        } catch (mailErr) {
            console.error('[Send return-pending notify mail error]', mailErr.message);
        }

        res.send(returnRequest);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});



// app.js (backend)
// app.js (backend)
app.get('/api/history/file/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fileIdx = Number(req.query.fileIdx || 0);

        // 1. หา History ก่อน
        let history = await History.findById(id);

        // 2. ถ้าไม่เจอ History ให้หา BookingEquipment
        if (!history) {
            // ถ้ากดดาวน์โหลดจากหน้าอุปกรณ์บางทีจะเป็น booking_id ของ BookingEquipment
            let equip = await BookingEquipment.findById(id);
            if (!equip) equip = await BookingEquipment.findOne({ booking_id: id });
            if (equip && equip.attachedFiles && equip.attachedFiles[fileIdx]) {
                const file = equip.attachedFiles[fileIdx];
                // กรณีไฟล์ upload จริง
                if (file.fileUrl && file.fileUrl.startsWith('http')) {
                    return res.redirect(file.fileUrl);
                }
                // base64 แบบแนบมา
                let base64Data = file.base64 || file.fileData;
                let mimeType = file.mimeType || 'application/octet-stream';
                let fileName = file.fileName || file.originalName || 'attachment';
                if (base64Data && base64Data.startsWith('data:')) {
                    // ตัด prefix data:mimetype;base64,
                    mimeType = base64Data.substring(5, base64Data.indexOf(';'));
                    base64Data = base64Data.split(',')[1];
                }
                const buffer = Buffer.from(base64Data, 'base64');
                res.setHeader('Content-Type', mimeType);
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                return res.end(buffer);
            }
            return res.status(404).send('No file data');
        }

        // 3. หาไฟล์แนบจาก History (แบบ array หรือเดี่ยว)
        let fileData = Array.isArray(history.attachment) ? history.attachment[fileIdx] : history.attachment;
        let fileType = Array.isArray(history.fileType) ? history.fileType[fileIdx] : history.fileType || 'application/octet-stream';
        let fileName = Array.isArray(history.fileName) ? history.fileName[fileIdx] : history.fileName || 'attachment';

        if (!fileData) return res.status(404).send('No file data');

        // ถ้าเป็น URL (เช่น "/uploads/xxx.pdf" หรือ "http://...")
        if (typeof fileData === 'string' && fileData.startsWith('http')) {
            return res.redirect(fileData);
        }

        // ถ้าเป็น base64
        let base64Data = fileData;
        if (base64Data.startsWith('data:')) {
            if (!fileType || fileType === 'application/octet-stream') {
                fileType = base64Data.substring(5, base64Data.indexOf(';'));
            }
            base64Data = base64Data.split(',')[1];
        }
        const fileBuffer = Buffer.from(base64Data, 'base64');
        // ให้ preview ได้ถ้าเป็น PDF/JPG/PNG
        const inlineTypes = [
            'application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'
        ];
        const dispositionType = inlineTypes.includes(fileType) ? 'inline' : 'attachment';
        res.setHeader('Content-Type', fileType);
        res.setHeader('Content-Disposition', `${dispositionType}; filename="${fileName}"`);
        res.end(fileBuffer);
    } catch (e) {
        res.status(500).send('Invalid base64 or server error');
    }
});








// ยืมวันเดียว
app.post('/api/history/singleday', async (req, res) => {
    try {
        const { user_id, items, status, borrowDate } = req.body
        if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
        }
        const savedItems = []
        for (const item of items) {
            const newHistory = new History({
                user_id,
                name: item.name,
                quantity: item.quantity,
                status,
                date: borrowDate ? new Date(borrowDate) : new Date(),
                type: 'equipment',
                agency: item.agency || ''   // ต้องส่งมาแต่ละชิ้น
            });
            await newHistory.save();

            // เพิ่ม usage ให้กับ Information type:equipment
            if (newHistory.agency && newHistory.agency.trim() !== "") {
                await Information.findOneAndUpdate(
                    { unit: newHistory.agency, type: 'equipment' },
                    { $inc: { usage: 1 } },
                    { upsert: true }
                );
            }
            savedItems.push(newHistory)
        }

        res.json({ success: true, items: savedItems })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

// API: ดึงรายการอุปกรณ์ที่รอคืน (return-pending)
app.get('/api/equipments/return-pending', async (req, res) => {
    try {
        // 1. ดึงรายการที่ return-pending ทั้งหมด จาก History
        const pendings = await History.find({ type: 'equipment', status: 'return-pending' }).lean();

        // 2. รวบรวม booking_id ทั้งหมดที่พบในรายการ pending
        const bookingIds = pendings.map(item => item.booking_id).filter(Boolean);

        // 3. ดึงรายการที่ถูก approved ที่ booking_id ตรงกัน (เพื่อ join since/uptodate)
        const approveds = await History.find({
            type: 'equipment',
            status: 'approved',
            booking_id: { $in: bookingIds }
        }).lean();

        // 4. สร้าง Map จาก booking_id -> ข้อมูล approved
        const approvedMap = {};
        approveds.forEach(a => {
            if (a.booking_id) approvedMap[String(a.booking_id)] = a;
        });

        // 5. join ข้อมูล since/uptodate และคืนค่า
        const results = pendings.map(p => {
            const approved = approvedMap[String(p.booking_id)];
            return {
                ...p,
                since: approved?.since || "",
                uptodate: approved?.uptodate || ""
            };
        });

        // DEBUG LOG (ดูว่ามีข้อมูลหรือไม่)
        // console.log("return-pending results:", results);

        res.send(results);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});




// === Helper: เช็คว่ายืมวันเดียวหรือหลายวัน ===
function isSingleDay(history) {
    // เอา key ที่ใช้จริงใน schema ด้วย (since/uptodate หรือ start_date/end_date)
    const s = history.since || history.start_date || (history.date ? history.date.toISOString().slice(0, 10) : '');
    const u = history.uptodate || history.end_date;
    if (!s) return true;     // ถ้าไม่มีวัน เรียกว่ายืมวันเดียวไปก่อน
    if (!u) return true;     // ถ้าไม่มีวันคืน ก็ถือว่าวันเดียว
    return s === u;
}



app.get('/api/equipments/pending', async (req, res) => {
    try {
        const items = await History.find({ type: 'equipment', status: 'pending' });
        // เฉพาะยืมวันเดียว (isSingleDay = true)
        const singleDayItems = items.filter(isSingleDay);
        res.send(singleDayItems);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});





app.patch('/api/equipments/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await History.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


// app.patch('/api/history/:id/approve_equipment', async (req, res) => {
//     try {
//         const staffId = req.body.staff_id;
//         const staff = await User.findOne({ user_id: staffId });
//         const staffName = staff ? staff.name : staffId;
//         const updated = await History.findByIdAndUpdate(
//             req.params.id,
//             {
//                 status: 'approved',
//                 approvedBy: staffName,
//                 approvedById: staffId,
//                 approvedAt: new Date()
//             },
//             { new: true }
//         );
//         if (updated && updated.name && updated.quantity) {
//             const equipName = (updated.name || '').trim();
//             await Equipment.updateOne(
//                 { name: equipName },
//                 { $inc: { quantity: -Math.abs(updated.quantity) } }
//             );
//         }
//         res.send(updated);
//     } catch (err) {
//         res.status(500).send({ message: err.message });
//     }
// });


app.patch('/api/history/:id/disapprove_equipment', async (req, res) => {
    try {
        const staffId = req.body.staff_id;
        const staff = await User.findOne({ user_id: staffId });
        const staffName = staff ? staff.name : staffId;
        const updated = await History.findByIdAndUpdate(
            req.params.id,
            {
                status: 'disapproved',
                disapprovedBy: staffName,
                disapprovedById: staffId,
                disapprovedAt: new Date()
            },
            { new: true }
        );


        // ======== ส่งอีเมลแจ้ง user ว่า "ไม่ได้รับอนุมัติ" ========
        if (updated) {
            try {
                const user = await User.findOne({ user_id: updated.user_id });
                if (user && user.email) {
                    await sendDisapproveEquipmentEmail({
                        to: user.email,
                        name: user.name || user.email || updated.user_id,
                        equipment: updated.name,
                        quantity: updated.quantity
                    });
                }
            } catch (mailErr) {
                console.error('ส่งเมลแจ้ง disapprove equipment ไม่สำเร็จ:', mailErr.message);
            }
        }
        // =======================================================
        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ========== Approve/Disapprove Field ==========

app.get('/api/history/approve_field', async (req, res) => {
    try {
        // 1. เอาทั้ง field และ equipment (pending)
        const all = await History.find({
            status: 'pending',
            $or: [
                { type: 'field' },
                { type: 'equipment' }
            ]
        }).lean();

        // 2. เหลือเฉพาะ field หรือ equipment ที่ยืมหลายวัน
        const multiDayItems = all.filter(f =>
            (f.type === 'field') ||
            (f.type === 'equipment' && !isSingleDay(f))
        );

        // 3. join user name
        const userIds = multiDayItems.map(f => f.user_id);
        const users = await User.find({ user_id: { $in: userIds } }).lean();
        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u.name);

        const result = multiDayItems.map(f => ({
            ...f,
            requester_name: userMap[f.user_id] || f.user_id,
            booking_id: f.booking_id ? f.booking_id.toString() : "",
        }));
        res.send(result);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Cancel field booking (admin/staff ยกเลิก)
app.patch('/api/history/:id/cancel_field', async (req, res) => {
    console.log("cancel_field payload", req.body);

    try {
        const adminId = req.body.admin_id || ""; // ถ้าส่ง admin_id มาด้วย
        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin ? admin.name : adminId;

        // ====== เพิ่มบรรทัดนี้ ======
        const oldHistory = await History.findById(req.params.id);

        const updated = await History.findByIdAndUpdate(
            req.params.id,
            {
                status: 'cancel',
                canceledBy: adminName,
                canceledById: adminId,
                canceledAt: new Date()
            },
            { new: true }
        );
        if (!updated) return res.status(404).send({ message: "ไม่พบรายการ" });

        // ========= ส่งอีเมลแจ้ง user ว่าถูกยกเลิก =========
        try {
            // เช็คเฉพาะกรณีที่เดิมเป็น approved แล้วถูก cancel (ถ้าต้องการแจ้งทุกครั้ง ให้ลบบรรทัด if)
            if (oldHistory.status === 'approved') {
                const user = await User.findOne({ user_id: updated.user_id });
                if (user && user.email) {
                    await sendCancelFieldEmail({
                        to: user.email,
                        name: user.name || user.email || updated.user_id,
                        field: updated.name,
                        activity: updated.name_active,
                        since: updated.since,
                        uptodate: updated.uptodate,
                        startTime: updated.startTime,
                        endTime: updated.endTime
                    });
                }
            }
        } catch (mailErr) {
            console.error('ส่งเมลแจ้ง cancel field ไม่สำเร็จ:', mailErr.message);
        }
        // ========================================

        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


// ====== อันนี้คือตัวที่ต้องเหลือไว้เท่านั้น! ======
// --------- PATCH APPROVE ------------
app.patch('/api/history/:id/approve_equipment', async (req, res) => {
    try {
        const staffId = req.body.staff_id;
        if (!staffId) {
            return res.status(400).json({ success: false, message: "ต้องระบุ staff_id (user_id ของ admin/staff)" });
        }
        const staff = await User.findOne({ user_id: staffId });

        let staffName = "";
        if (staff) {
            if (staff.name && typeof staff.name === 'string') {
                staffName = staff.name;
            } else if (staff.email && typeof staff.email === 'string') {
                staffName = staff.email;
            } else if (staff.user_id && typeof staff.user_id === 'string') {
                staffName = staff.user_id;
            } else if (staff.user_id) {
                staffName = staff.user_id.toString();
            } else {
                staffName = staffId.toString();
            }
        } else {
            staffName = staffId.toString();
        }

        // หา record
        const old = await History.findById(req.params.id);
        if (!old) return res.status(404).send({ message: 'Not found' });

        let updatedList = [];
        let now = new Date();

        if (old.booking_id) {
            await History.updateMany(
                { booking_id: old.booking_id.toString() },
                {
                    $set: {
                        status: 'approved',
                        approvedBy: staffName,
                        approvedById: staffId.toString(),
                        approvedAt: now
                    }
                }
            );
            updatedList = await History.find({ booking_id: old.booking_id.toString() });
        } else {
            const updated = await History.findByIdAndUpdate(
                req.params.id,
                {
                    status: 'approved',
                    approvedBy: staffName,
                    approvedById: staffId.toString(),
                    approvedAt: now
                },
                { new: true }
            );
            updatedList = [updated];
        }

        // อัพเดตจำนวนอุปกรณ์
        for (const h of updatedList) {
            if (h && h.name && h.quantity) {
                const equipName = (h.name || '').trim();
                await Equipment.updateOne(
                    { name: equipName },
                    { $inc: { quantity: -Math.abs(h.quantity) } }
                );
            }
        }

        // ======= ส่งอีเมลแจ้งเตือน (เวอร์ชันส่งฉบับเดียว) =======
        if (updatedList.length > 0) {
            // (กรณี booking_id เดียว user_id ควรเหมือนกันหมด)
            const userId = updatedList[0].user_id;
            let user = await User.findOne({ user_id: userId });
            if (!user) user = await User.findById(userId).catch(() => null);

            if (user && user.email) {
                // รวมชื่ออุปกรณ์กับจำนวน
                let listHtml = '<ul style="font-size:1.1em">';
                updatedList.forEach((h, idx) => {
                    listHtml += `<li>${idx + 1}. ${h.name || '-'} (จำนวน: ${h.quantity || '-'})</li>`;
                });
                listHtml += '</ul>';
                const html = `
            <div>
                <h2>รายการยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว</h2>
                <p><b>ชื่อผู้ยืม:</b> ${user.firstname || user.name || ""}</p>
                ${listHtml}
                <p>กรุณาติดต่อรับอุปกรณ์ที่ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
                <hr>
                <p style="font-size: 0.95em; color: #888;">Sport Complex – MFU</p>
            </div>
        `;
                await transporter.sendMail({
                    from: '"MFU Sport Complex" <your.email@gmail.com>',
                    to: user.email,
                    subject: 'แจ้งเตือน: อนุมัติการยืมอุปกรณ์',
                    html
                });
            }
        }

        // ====== จบส่งอีเมล =======

        res.send({
            success: true,
            approved_by: {
                user_id: staffId.toString(),
                name: staffName
            },
            updated: updatedList
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});







// Approve field booking
app.patch('/api/history/:id/approve_field', async (req, res) => {
    try {
        const adminId = req.body.admin_id;
        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin ? admin.name : adminId;

        const updated = await History.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                approvedBy: adminName,
                approvedById: adminId,
                approvedAt: new Date()
            },
            { new: true }
        );

        // ======== คำนวณชั่วโมงจากข้อมูล history ========
        let totalHours = 0;
        if (updated && updated.since && updated.uptodate && updated.startTime && updated.endTime) {
            totalHours = calcTotalHours(updated.since, updated.uptodate, updated.startTime, updated.endTime);
        }

        // ==== อัปเดต usageByMonthYear พร้อมชื่อสนามด้วย ====
        if (updated && updated.agency && updated.agency.trim() !== "" && updated.approvedAt) {
            const dt = new Date(updated.approvedAt);
            await Information.findOneAndUpdate(
                { unit: new RegExp('^' + updated.agency.trim() + '$', 'i'), type: 'field' },
                {
                    $push: {
                        usageByMonthYear: {
                            year: dt.getFullYear(),
                            month: dt.getMonth() + 1,
                            usage: 1,
                            hours: totalHours,
                            fieldName: updated.name || ""
                        }
                    },
                    $inc: { usage: 1 }
                },
                { upsert: true, new: true }
            );
        }

        // ========= เพิ่มส่วนนี้ (แจ้ง user) =========
        try {
            // หา user จาก user_id ของประวัติ
            const user = await User.findOne({ user_id: updated.user_id });
            if (user && user.email) {
                await sendApproveFieldEmail({
                    to: user.email,
                    name: user.name || user.email || user.user_id,
                    field: updated.name,
                    activity: updated.name_active,
                    since: updated.since,
                    uptodate: updated.uptodate,
                    startTime: updated.startTime,
                    endTime: updated.endTime
                });
            }
        } catch (mailErr) {
            console.error('ส่งเมลแจ้ง approve field ไม่สำเร็จ:', mailErr.message);
        }
        // ========================================

        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});












app.patch('/api/history/:id/disapprove_field', async (req, res) => {
    try {
        const adminId = req.body.admin_id;
        const admin = await User.findOne({ user_id: adminId });
        const adminName = admin ? admin.name : adminId;
        const updated = await History.findByIdAndUpdate(
            req.params.id,
            {
                status: 'disapproved',
                disapprovedBy: adminName,
                disapprovedById: adminId
            },
            { new: true }
        );

        // ======== ส่งอีเมลแจ้ง user ว่าไม่ได้รับการอนุมัติจองสนาม ========
        if (updated) {
            try {
                const user = await User.findOne({ user_id: updated.user_id });
                if (user && user.email) {
                    await sendDisapproveFieldEmail({
                        to: user.email,
                        name: user.name || user.email || updated.user_id,
                        field: updated.name,
                        activity: updated.name_active,
                        since: updated.since,
                        uptodate: updated.uptodate,
                        startTime: updated.startTime,
                        endTime: updated.endTime
                    });
                }
            } catch (mailErr) {
                console.error('ส่งเมลแจ้ง disapprove field ไม่สำเร็จ:', mailErr.message);
            }
        }
        // =======================================================

        res.send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Announcement (News) ====================
app.put('/api/announcement', async (req, res) => {
    try {
        const ann = await Announcement.findOneAndUpdate(
            {},
            { announce: req.body.announce },
            { upsert: true, new: true }
        );
        res.send(ann);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/announcement', async (req, res) => {
    try {
        const ann = await Announcement.findOne({}).sort({ _id: -1 });
        res.send(ann || { announce: "" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/announcement', async (req, res) => {
    try {
        await Announcement.deleteMany({});
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Booking Equipment (form data) ====================
app.post('/api/booking_equipment', async (req, res) => {
    try {

        const data = req.body;
        const booking = new BookingEquipment({
            ...data,
            attachedFiles: data.attachedFiles || []
        });
        await booking.save();

        // เพิ่มโค้ดนี้เพื่อ sync booking_id = _id (ครั้งแรก)
        if (!booking.booking_id) {
            booking.booking_id = booking._id.toString();
            await booking.save();
        }

        // ... เดิม
        const agencyName = (data.agency || '').trim();
        if (agencyName && agencyName !== "อื่นๆ") {
            const exist = await Information.findOne({ unit: agencyName, type: "equipment" });
            if (!exist) {
                await Information.create({ unit: agencyName, type: "equipment", usage: 0 });
            }
        }

        res.send({ success: true, booking });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});



app.get('/api/booking_equipment', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).json({ message: 'Missing id' });
        const booking = await BookingEquipment.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json([booking]);  // คืน array เช่นกัน (เหมือนไฟล์ที่สอง)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


app.get('/api/booking_equipment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // หาได้ทั้ง booking_id และ _id
        const booking = await BookingEquipment.findOne({
            $or: [
                { _id: id },
                { booking_id: id }
            ]
        });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// =================== Booking Equipment Borrow API (ใช้ BookingEquipment) ===================
app.get('/api/booking_equipment_borrow', async (req, res) => {
    try {
        const list = await BookingEquipment.find();
        res.json(list);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ======================= BookingField CRUD ============================
app.post('/api/booking_field', upload.array('files', 10), async (req, res) => {
    try {
        // เก็บ array ไฟล์ที่อัปโหลดไว้
        let filesArr = [];
        if (req.files && req.files.length) {
            filesArr = req.files.map(file => ({
                fileName: file.filename,
                originalName: file.originalname,
                fileUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
                mimetype: file.mimetype,
                size: file.size
            }));
        }

        // ฟังก์ชันช่วย parse วันที่
        const parseDate = (v) => (v ? new Date(v) : null);

        // เก็บข้อมูล booking
        const bookingData = {
            aw: req.body.aw,
            date: parseDate(req.body.date),
            tel: req.body.tel,
            agency: req.body.agency,
            name_activity: req.body.name_activity,
            reasons: req.body.reasons,
            since: parseDate(req.body.since),
            uptodate: parseDate(req.body.uptodate),
            since_time: req.body.since_time,
            until_thetime: req.body.until_thetime,
            participants: req.body.participants,
            requester: req.body.requester,
            building: req.body.building,
            zone: req.body.zone,
            need: req.body.need,
            needless: req.body.needless,
            turnon_air: req.body.turnon_air,
            turnoff_air: req.body.turnoff_air,
            turnon_lights: req.body.turnon_lights,
            turnoff_lights: req.body.turnoff_lights,
            other: req.body.other,
            amphitheater: req.body.amphitheater,
            need_equipment: req.body.need_equipment, // equipment
            user_id: req.body.user_id,
            files: filesArr,
            no_receive: req.body.no_receive,
            date_receive: parseDate(req.body.date_receive),
            receiver: req.body.receiver,
            uploadFiles: req.body.uploadFiles || [], // (ถ้ามีส่งมาด้วย)
            // **เพิ่มสองอันนี้**
            utilityRequest: req.body.utilityRequest,
            facilityRequest: req.body.facilityRequest,

        };

        // สร้าง booking record
        const booking = await BookingField.create(bookingData);

        // เพิ่ม booking_id ให้เท่ากับ _id ของตัวเอง
        if (!booking.booking_id) {
            booking.booking_id = booking._id.toString();
            await booking.save();
        }

        res.json({ bookingId: booking._id, booking_id: booking.booking_id });
    } catch (err) {
        console.error('Create booking_field error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// GET: ข้อมูล booking_field ตาม id (พร้อมไฟล์แนบ)
app.get('/api/booking_field/:id', async (req, res) => {
    try {
        const booking = await BookingField.findById(req.params.id).lean();
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/booking_field', async (req, res) => {
    try {
        const bookings = await BookingField.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ตัวอย่าง flow การสร้าง booking + history
app.post('/api/booking_field_and_history', async (req, res) => {
    try {
        // 1. สร้าง booking_field
        const booking = await BookingField.create(req.body); // booking._id จะเป็น ObjectId

        // 2. สร้าง history แล้ว set booking_id = booking._id
        const newHistory = new History({
            user_id: req.body.user_id,
            name: req.body.building || req.body.name,    // ชื่อสนาม
            name_active: req.body.name_activity,         // ชื่อกิจกรรม
            zone: zone,
            since: req.body.since,
            uptodate: req.body.uptodate,
            startTime: req.body.since_time,
            endTime: req.body.until_thetime,
            status: "pending",
            type: 'field',
            agency: req.body.agency || '',
            booking_id: booking._id,   // <<<<----- สำคัญ! ใส่ ObjectId จริงๆ
        });
        await newHistory.save();

        res.send({ success: true, booking, history: newHistory });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});


// ================== UploadFile API (base64 style) ==================
app.post('/api/upload_file', async (req, res) => {
    try {
        const { fileName, fileData, user_id } = req.body;
        if (!fileName || !fileData) return res.status(400).send({ message: 'ข้อมูลไม่ครบ' });
        const upload = new UploadFile({
            fileName,
            fileData,
            user_id: user_id || null,
        });
        await upload.save();
        res.send({ success: true, message: 'บันทึกไฟล์สำเร็จ', id: upload._id });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});
app.get('/api/upload_file', async (req, res) => {
    try {
        const files = await UploadFile.find().sort({ uploadedAt: -1 });
        res.send(files);
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// Download base64 file by id
app.get('/api/uploadfile/:id', async (req, res) => {
    const file = await UploadFile.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');
    let base64Data = file.fileData;
    if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
    }
    const buffer = Buffer.from(base64Data, 'base64');
    res.set('Content-Type', file.mimetype || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(buffer);
});



// ==================== News Image API ====================
app.get('/api/img_news', async (req, res) => {
    try {
        const news = await ImgNews.find();
        res.send(news);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.get('/api/img_news/:id', async (req, res) => {
    try {
        const news = await ImgNews.findById(req.params.id);
        if (!news) return res.status(404).send({ message: 'Not found' });
        res.send(news);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.put('/api/img_news/:id', async (req, res) => {
    try {
        const { img } = req.body;
        const updated = await ImgNews.findByIdAndUpdate(req.params.id, { img }, { new: true });
        if (!updated) return res.status(404).send({ message: 'ไม่พบข้อมูล' });
        res.send({ success: true, data: updated });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/img_news/:id', async (req, res) => {
    try {
        const deleted = await ImgNews.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).send({ message: 'ไม่พบข้อมูล' });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/img_news', async (req, res) => {
    try {
        const { img } = req.body;
        const news = new ImgNews({ img: img || "" });
        await news.save();
        res.send({ success: true, data: news });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/img_news/:id/permanent', async (req, res) => {
    try {
        await ImgNews.findByIdAndDelete(req.params.id);
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Members API ====================
app.post('/api/members', async (req, res) => {
    try {
        const { email, position } = req.body;
        if (!email || !position) return res.status(400).send({ message: 'ข้อมูลไม่ครบ' });
        // หา user เดิม
        const user = await User.findOne({ email });
        if (user) {
            user.role = position.toLowerCase();
            await user.save();
            res.send({ success: true, data: user });
        } else {
            return res.status(404).send({ message: 'ไม่พบ user นี้ในระบบ' });
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.get('/api/members', async (req, res) => {
    try {
        const members = await User.find(
            { role: { $in: ['staff', 'admin'] } },
            { email: 1, role: 1, user_id: 1, name: 1, _id: 0 }
        );
        const mapRole = (role) => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        res.send(
            members.map(m => ({
                id: m.user_id,   // <- เพิ่ม id
                name: m.name,    // <- เพิ่ม name
                email: m.email,
                position: mapRole(m.role)
            }))
        );
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


app.patch('/api/members/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const { email: newEmail, position } = req.body;
        let newRole = position ? position.toLowerCase() : undefined;
        const updateObj = {};
        if (newEmail) updateObj.email = newEmail;
        if (newRole) updateObj.role = newRole;
        const updated = await User.findOneAndUpdate(
            { email: email },
            updateObj,
            { new: true }
        );
        if (!updated) return res.status(404).send({ message: "Member not found" });
        res.send({ success: true, data: updated });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});
app.delete('/api/members/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const deleted = await User.findOneAndDelete({ email });
        if (!deleted) return res.status(404).send({ message: "Member not found" });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// ==================== Dashboard/Information ====================
// สมมติใน app.js
app.get('/api/information', async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) {
            filter.type = req.query.type;
        }
        const infos = await Information.find(filter);
        res.json(infos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/information/increase-usage', async (req, res) => {
    const { unit } = req.body
    if (!unit) return res.status(400).json({ success: false, message: 'unit required' })
    try {
        // อัปเดต usage ตาม unit (ชื่อหน่วยงาน)
        const info = await Information.findOneAndUpdate(
            { unit },
            { $inc: { usage: 1 } },
            { new: true }
        )
        if (!info) return res.status(404).json({ success: false, message: 'not found' })
        res.json({ success: true, info })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

app.post('/api/information/aggregate-usage', async (req, res) => {
    try {
        // ลบ usageByMonthYear เดิม
        await Information.updateMany({}, { $set: { usageByMonthYear: [] } });

        // Field
        const fieldHistory = await History.find({ type: 'field', status: 'approved', approvedAt: { $exists: true } });
        const fieldMap = {};
        fieldHistory.forEach(item => {
            if (!item.agency || !item.approvedAt) return;
            const dt = new Date(item.approvedAt);
            const year = dt.getFullYear();
            const month = dt.getMonth() + 1;
            const key = `${item.agency}|field|${year}|${month}`;
            if (!fieldMap[key]) fieldMap[key] = { unit: item.agency, type: 'field', year, month, usage: 0 };
            fieldMap[key].usage += 1;
        });

        // Equipment
        const equipHistory = await History.find({ type: 'equipment', status: 'approved', approvedAt: { $exists: true } });
        const equipMap = {};
        equipHistory.forEach(item => {
            if (!item.agency || !item.approvedAt) return;
            const dt = new Date(item.approvedAt);
            const year = dt.getFullYear();
            const month = dt.getMonth() + 1;
            const key = `${item.agency}|equipment|${year}|${month}`;
            if (!equipMap[key]) equipMap[key] = { unit: item.agency, type: 'equipment', year, month, usage: 0 };
            equipMap[key].usage += 1;
        });

        // รวม field/equipment
        const all = [...Object.values(fieldMap), ...Object.values(equipMap)];

        // รวม usageByMonthYear ตามหน่วยงานและ type
        const agencyMap = {};
        for (const item of all) {
            const key = `${item.unit}|${item.type}`;
            if (!agencyMap[key]) agencyMap[key] = { unit: item.unit, type: item.type, usageByMonthYear: [] };
            agencyMap[key].usageByMonthYear.push({
                year: item.year,
                month: item.month,
                usage: item.usage
            });
        }

        // อัปเดต usageByMonthYear ใหม่ทั้งหมด
        for (const key in agencyMap) {
            const data = agencyMap[key];
            await Information.findOneAndUpdate(
                { unit: data.unit, type: data.type },
                { $set: { usageByMonthYear: data.usageByMonthYear } },
                { upsert: true }
            );
        }

        // รวม usage
        for (const info of await Information.find()) {
            let sum = 0;
            if (info.usageByMonthYear && info.usageByMonthYear.length) {
                sum = info.usageByMonthYear.reduce((s, u) => s + u.usage, 0);
            }
            info.usage = sum;
            await info.save();
        }

        res.json({ success: true, message: "Aggregated usageByMonthYear updated." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ใน app.js
// สร้าง BookingEquipment + History พร้อมคัดลอกไฟล์แนบ
app.post('/api/booking_equipment_and_history', async (req, res) => {
    try {
        // 1. สร้าง booking อุปกรณ์ (BookingEquipment)
        const booking = await BookingEquipment.create(req.body); // booking._id

        // 2. สร้าง history อุปกรณ์ (History)
        const newHistory = await History.create({
            user_id: req.body.user_id,
            name: req.body.name,
            quantity: req.body.quantity,
            status: req.body.status,
            date: req.body.since ? req.body.since : new Date(),
            since: req.body.since || '',
            uptodate: req.body.uptodate || '',
            type: 'equipment',
            agency: req.body.agency || '',
            booking_id: booking._id,
        });

        // 3. คัดลอกไฟล์แนบจาก booking.attachedFiles มาใส่ history.attachment
        if (booking.attachedFiles && booking.attachedFiles.length) {
            const attachments = [];
            const fileNames = [];
            const fileTypes = [];
            booking.attachedFiles.forEach(f => {
                attachments.push(f.fileUrl || f.base64 || "");
                fileNames.push(f.originalName || f.fileName || "attachment");
                fileTypes.push(f.mimetype || "application/octet-stream");
            });
            await History.findByIdAndUpdate(newHistory._id, {
                attachment: attachments,
                fileName: fileNames,
                fileType: fileTypes
            });
        }

        res.send({ success: true, booking, history: newHistory });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});



// GET: ไฟล์แนบทีละไฟล์ จาก id ของ history และ index ของไฟล์ใน array
app.get('/api/history/:id/file/:idx', async (req, res) => {
    try {
        const historyItem = await History.findById(req.params.id);
        const idx = parseInt(req.params.idx, 10);
        if (!historyItem || !historyItem.attachment || !historyItem.attachment[idx]) {
            return res.status(404).send('File not found');
        }
        const base64Data = historyItem.attachment[idx];
        // ⭐️ ใส่ default แบบนี้
        const mimeType = (historyItem.fileType && historyItem.fileType[idx]) || historyItem.fileType || 'application/octet-stream';
        const fileName = (historyItem.fileName && historyItem.fileName[idx]) || 'download';

        const fileBuffer = Buffer.from(base64Data, 'base64');
        res.set('Content-Type', mimeType || 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileBuffer);
    } catch (error) {
        res.status(500).send(error.message);
    }
});




// GET: ดาวน์โหลดไฟล์ base64 จาก UploadFile collection
app.get('/api/uploadfile/:id', async (req, res) => {
    try {
        const file = await UploadFile.findById(req.params.id);
        if (!file) return res.status(404).send('File not found');
        res.set('Content-Type', file.mimetype || 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
        res.send(file.fileData);
    } catch (e) {
        res.status(500).send('Download error');
    }
});

app.post('/api/booking_field_upload', bookingFieldUpload.array('files'), async (req, res) => {
    try {
        const data = req.body;
        // convert files info
        const files = (req.files || []).map(file => ({
            originalName: file.originalname,
            fileName: file.filename,
            fileUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        }));

        const booking = await BookingField.create({
            ...data,
            files, // save files array
            agency: data.agency,
            zone: data.zone,
            // ... add fields as needed
            user_id: data.user_id
        });

        res.json({ bookingId: booking._id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});







// ========== Start server ==========
const PORT = process.env.PORT || 8021;
app.listen(PORT, () => console.log('Backend running on port', PORT));
