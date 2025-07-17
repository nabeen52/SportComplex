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

      <!-- Center Login -->
      <div class="center-content">
        <div class="login-page">
          <div class="card">
            <h2>Login</h2>
            <button class="login-btn" @click="loginWithGoogle">
              🟢 Login with Google
            </button>
            <div v-if="loginError" class="error">{{ loginError }}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>MFU Sport Complex Project</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// ไม่มี need for loginError ref ถ้าไม่มี error จาก backend
const API_BASE = import.meta.env.VITE_API_BASE

const loginWithGoogle = () => {
  // ไป route Google OAuth ตรงๆ (ไม่มี chain logout)
  window.location.href = `${API_BASE}/auth/google`;
}

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
  margin-bottom: 2rem;
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
}
.login-btn {
  width: 70%;
  padding: 15px;
  background-color: #2c3e73dc;
  color: white;
  border: none;
  border-radius: 8px;
  margin-top: 30px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
}
.error {
  color: red;
  margin-top: 10px;
}
.footer {
  text-align: center;
  color: #FFE8BF;
  font-size: 1rem;
  padding-bottom: 1.5rem;
  flex-shrink: 0;
}
</style>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* ป้องกัน scroll ทั้ง window */
}
</style>
