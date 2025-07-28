<template>
    <div style="min-height: 100vh; background-image: url('/img/bg_select.png'); background-size: cover; background-repeat: no-repeat; background-position: center center; background-color: black; color: white;">
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 1rem; position: relative;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; position: absolute; top: 0.5rem; left: 1rem;">
          <img src="/img/logo.png" alt="MFU Logo" style="width: 10rem;" />
          <div>
            <h1 style="color: #FFE8BF; font-size: 1.5rem; ">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</h1>
            <h2 style="font-size: 1.05rem;">Mae Fah Luang University Sport Complex Center</h2>
          </div>
        </div>
        
   <!-- User Manual link (top-right corner) -->
        <div style="position: absolute; top: 2rem; right: 2rem;">
  <button style="
    border-radius: 12px;
    padding: 8px 16px;
    border: none;
    background: #546e7a;   /* น้ำเงินเข้ม   #7285A5 */
    cursor: pointer;
  ">
    <a href="#" style="color: #fff; text-decoration: none;">User Manual</a>
  </button>
</div>

  
        <!-- User Manual link (top-right corner) -->
        <div style="position: absolute; top: 2rem; right: 2rem;">
  <button style="
    border-radius: 12px;
    padding: 8px 16px;
    border: none;
    background: #546e7a;   /* น้ำเงินเข้ม   #7285A5 */
    cursor: pointer;
  ">
    <a href="#" style="color: #fff; text-decoration: none;">User Manual</a>
  </button>
</div>

  
        <!-- Spacer for header height -->
        <div style="height: 8rem;"></div>
  
        <!-- Title -->
        <div style="text-align: center; color: white; margin-bottom: 2.5rem;">
          <h3 style="font-size: 1.15rem; font-weight: bold;">FIELD BOOKING / EQUIPMENT LOAN SYSTEM</h3>
          <p style="font-size: 1.125rem;">ระบบจองสนาม/ยืมอุปกรณ์</p>
        </div>
  
        <!-- User Cards -->
        <div class="card-container">
          <router-link to="/login" class="card-button">
            <img src="/img/user.png" />
            <h4 style="color: #1e3a8a ;font-size: 35px;">USER</h4>
            <p>ผู้ใช้งาน</p>
          </router-link>
  
          <router-link to="/login" class="card-button">
            <img src="/img/staff.png" />
            <h4 style="color: #1e3a8a ;font-size: 35px;">STAFF</h4>
            <p>พนักงาน</p>
          </router-link>
  
          <router-link to="/login" class="card-button">
            <img src="/img/admin.png" />
            <h4 style="color: #1e3a8a ;font-size: 35px;">ADMIN</h4>
            <p style="font-size: 20px;">เจ้าหน้าที่</p>
          </router-link>
        </div>
  
        <!-- Footer -->
        <div style="text-align: center; margin-top: 7.5rem; color: #FFE8BF; font-size: 1rem;">
          <p >ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง มหาวิทยาลัยแม่ฟ้าหลวง  333 หมู่1 ต.ท่าสุด อ.เมือง จ.เชียงราย 57100</p>
          <!-- <p >333 หมู่1 ต.ท่าสุด อ.เมือง จ.เชียงราย 57100</p> -->
          <p >
            <span style="margin-right: 1rem;">
              Facebook: <a href="https://www.facebook.com/mfusportcomplex" target="_blank" style="text-decoration: underline; color: #FFFFFF;">MFU Sports Complex Center</a>
            </span>
            <span style="margin-right: 1rem;">
              โทรศัพท์: 0-5391-7821
            </span>
            <!-- <span>
              Email: <a href="mailto:sport-complex@mfu.ac.th" style="text-decoration: underline; color: #BDAE00;">sport-complex@mfu.ac.th</a>
            </span> -->
            <span>
              Email: <a href="mailto:sport-complex@mfu.ac.th" style="text-decoration: underline; color: #FFFFFF;">sport-complex@mfu.ac.th</a>
               </span>
  
          </p>
        </div>
  
      </div>
    </div>
  </template>
  
  <script setup>
  // ไม่มี logic JS พิเศษในตอนนี้
  </script>
  
  <style scoped>
  .card-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2rem;
    color: black;
    max-width: 1000px;
    width: 100%;
    padding: 0 1rem;
  }
  
  .card-button {
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    display: block;
    text-decoration: none;
    color: black;
  }
  
  .card-button:hover {
    transform: translateY(-20px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25);
  }
  
  .card-button img {
    margin: 0 auto 1.25rem auto;
    width: 7rem;
  }
  
  .card-button h4 {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .card-button p {
    font-size: 1.25rem;
  }
  </style>