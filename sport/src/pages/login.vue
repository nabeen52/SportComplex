<template>
  <div class="main-bg">
    <div class="main-layout">
      <!-- Header -->
      <div class="header">
        <img src="/img/logo.png" alt="MFU Logo" style="width: 10rem;" />
        <div>
          <h1 style="color: #FFE8BF; font-size: 1.5rem;">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h1>
          <h2 style="font-size: 1.05rem;">Mae Fah Luang University Sport Complex Center</h2>
        </div>
      </div>

         <!-- User Manual link (top-right corner) -->
        <div style="position: absolute; top: 2rem; right: 2rem;">
 <button style="
  border-radius: 12px;
  padding: 8px 16px;
  border: none;
  background: rgba(84, 110, 122, 0.50); /* ใช้ rgba สีเดิมแต่ใส */
  cursor: pointer;
">
    <a href="#" style="color: #fff; text-decoration: none;">User Manual</a>
  </button>
</div>
  
        <!-- Title -->
        <div style="text-align: center; color: white; margin-bottom: 0rem;">
          <h3 style="font-size: 1.15rem; font-weight: bold;">FIELD BOOKING / EQUIPMENT LOAN SYSTEM</h3>
          <p style="font-size: 1.125rem;">ระบบจองสนาม/ยืมอุปกรณ์</p>
        </div>



      <!-- Center Login -->
      <div class="center-content">
        <div class="login-page">
          <div class="card">
            <h2>LOGIN</h2>
           <button class="login-btn" @click="loginWithGoogle">
  <img src="/img/icons8-google-48.png" alt="Google" class="icon-google" />
  Login with Google
</button>

            <div v-if="loginError" class="error">{{ loginError }}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
        <div class="footer">
  <div class="footer-address">
    <span class="footer-univ">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง มหาวิทยาลัยแม่ฟ้าหลวง </span>
    <span class="footer-location"> 333 หมู่1 ต.ท่าสุด อ.เมือง จ.เชียงราย 57100</span>
  </div>
  <div class="footer-row">
    <div class="footer-fb">
      Facebook: <a href="https://www.facebook.com/mfusportcomplex" target="_blank" style="text-decoration: underline; color: #FFFFFF;">MFU Sports Complex Center</a>
    </div>
    <div class="footer-contact">
      <span>โทรศัพท์: 0-5391-7821</span>
      <span style="margin-left:1.5rem">Email: <a href="mailto:sport-complex@mfu.ac.th" style="text-decoration: underline; color: #FFFFFF;">sport-complex@mfu.ac.th</a></span>
    </div>
  </div>
</div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// ไม่มี need for loginError ref ถ้าไม่มี error จาก backend
const API_BASE = import.meta.env.VITE_API_BASE
const loginError = ref(""); 

const loginWithGoogle = () => {
  // ไป route Google OAuth ตรงๆ (ไม่มี chain logout)
  window.location.href = `${API_BASE}/auth/google`;
}


// อ่าน query param error
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  if (error === "not_mfu") {
    loginError.value = "เว็บนี้สำหรับผู้ใช้งาน @lamduan.mfu.ac.th หรือ @mfu.ac.th เท่านั้น";
  } else if (error === "logout") {
    loginError.value = "ออกจากระบบเรียบร้อยแล้ว";
  } else if (error === "oauth_failed") {
    loginError.value = "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่";
  } else {
    loginError.value = "";
  }
});

</script>

<style scoped>
.main-bg {
  min-height: 100vh;
  height: 100vh;
  background-image: url('/img/bg_select.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-color: black;
  color: white;
  overflow: hidden; /* ป้องกัน scroll */
}
.main-layout {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Footer ติดล่าง */
  align-items: stretch;
  padding: 1rem;
  box-sizing: border-box;
}
.header {
  display: flex;
  align-items: center;
  margin-bottom: 0rem;
  gap: 1rem;
}
.center-content {
  flex: 1 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card {
  background-color: rgba(255, 255, 255, 0.626);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 400px;
  height: 200px;
  text-align: center;
  color: #222;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
/* ปุ่ม Login */
.login-btn {
  width: 80%;
  padding: 5px 0;
  background: linear-gradient(90deg, #2956be 0%, #3788ff 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.08rem;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 2px 10px #1c376240;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.18s, transform 0.12s;
  margin-top: 0.3rem;
}
.login-btn:hover {
  background: linear-gradient(90deg, #184b8a 0%, #2e71d7 100%);
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 20px #223a8040;
}

.error {
  color: #d32f2f;
  margin-top: 0.4rem;
  font-size: 1rem;
  font-weight: 500;
  background: #fff7;
  border-radius: 6px;
  padding: 4px 0 2px 0;
  width: 100%;
}

.footer {
  text-align: center;
  color: #FFE8BF;
  font-size: 1rem;
  padding-bottom: 1.5rem;
  flex-shrink: 0;
}

html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* ป้องกัน scroll ทั้ง window */
}
@media (max-width: 600px) {
  .main-layout {
    padding: 0.5rem;
  }

  .header {
    flex-direction: column;
    align-items: center;
    gap: 0rem;
    margin-bottom: 0.3rem;
    text-align: center;
  }

  .header img {
    width: 7rem !important;
    margin-bottom: 0rem;
  }

  .card {
    width: 95vw;
    max-width: 350px;
    height: auto;
    min-height: 170px;
    padding: 0.7rem 0.5rem;
  }

  .login-btn {
    font-size: 1rem;
    width: 90%;
    padding: 8px 0;
  }

  .footer {
    font-size: 0.92rem;
    padding-left: 0.1rem;
    padding-right: 0.1rem;
    margin-top: 1.2rem;
    text-align: center;
  }

  /* *** ให้ address ต่อกันบรรทัดเดียวบนมือถือ *** */
  .footer-address {
    flex-direction: column !important;
    gap: 0.02rem;
    align-items: center;
  }
 .footer-univ,
  .footer-location {
    display: block !important;
    width: 100%;
    text-align: center;
  }

  .footer-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.09rem;
    margin-top: 0.32rem;
  }

  .footer-fb {
    font-size: 0.97rem;
    margin-bottom: 0.04rem;
  }
  .footer-contact {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0;
  }
  .footer-contact span {
    font-size: 0.97rem;
    white-space: nowrap;
    margin-left: 0;
    margin-right: 0;
  }

  .center-content {
    min-height: unset;
    padding: 1.2rem 0 0 0;
    align-items: flex-start;
  }

  /* ปุ่ม User Manual ให้ขนาดเล็กลง */
  div[style*="top: 2rem; right: 2rem;"] {
    top: 1rem !important;
    right: 1rem !important;
    z-index: 9;
  }
  div[style*="top: 2rem; right: 2rem;"] button {
    font-size: 0.97rem;
    padding: 7px 12px;
  }

  h2, h1 {
    font-size: 1.09rem !important;
  }

  h3 {
margin-top: 5rem;
    font-size: 1.09rem !important;
  }

  .error {
    font-size: 0.98rem;
  }
}




</style>

