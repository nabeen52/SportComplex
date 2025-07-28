<!-- src/pages/another_page.vue -->
<template>

    <div class="layout">
      <!-- Header -->
      
      <aside class="sidebar" :class="{ closed: isSidebarClosed }">
        <div class="sidebar-header">
          <img src="/img/logo.png" alt="logo" class="logo" />
          <p class="sidebar-title">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
        </div>
        <nav class="nav-links">
            <router-link to="/dashboard" exact-active-class="active">
          <i class="pi pi-chart-pie"></i> Dashboard
        </router-link>
        <router-link to="/home_admin" exact-active-class="active">
          <i class="pi pi-megaphone"></i> Edit News
        </router-link>
        <router-link to="/edit_field" active-class="active">
          <i class="pi pi-map-marker"></i> Edit Field
        </router-link>
        <router-link to="/edit_equipment" active-class="active">
          <i class="pi pi-clipboard"></i> Edit Equipment
        </router-link>
        <router-link to="/booking_field_admin" active-class="active">
          <i class="pi pi-map-marker"></i> Book Field
        </router-link>
        <router-link to="/approve_field" active-class="active">
          <i class="pi pi-verified"></i> Approve
        </router-link>
        <router-link to="/members" active-class="active">
          <i class="pi pi-user-edit"></i> Member
        </router-link>
        <router-link to="/history_admin" active-class="active">
          <i class="pi pi-history"></i> History System
        </router-link>
        </nav>
      </aside>

      <div class="main">
        <!-- header -->
        <header class="topbar">
            <button class="menu-toggle" @click="toggleSidebar">☰</button>
          <div class="topbar-actions">
            <router-link to="/notifications"><i class="pi pi-bell"></i></router-link>
            <router-link to="/profile_admin"><i class="pi pi-user"></i></router-link>
          </div>
        </header>

        <!-- Body -->
         <div>
          <div class="headStepper">
            <div class="stepper">
    <div v-for="(step, index) in steps":key="index"class="step">
      <div
        class="circle"
        :class="{
          active: index === currentStep,
          completed: index < currentStep
        }"
      ></div>
      <div class="label">{{ step }}</div>
      <div
        v-if="index < steps.length - 1"
        class="line"
        :class="{
          filled: index < currentStep
        }"
      ></div>
    </div>
  </div>
          </div>

          <div class="form-container">
  <h1 style="text-align: center;">อัปโหลดไฟล์</h1>

  <div class="upload-center">
    <p v-if="uploadedFileName" class="file-name">{{ uploadedFileName }}</p>

    <input type="file" id="fileUpload" @change="handleFileUpload" hidden />
    <label for="fileUpload" class="upload-button">อัปโหลดไฟล์</label>
  </div>
</div>

         </div>

         <div class="button-wrapper">
  <router-link to="/form_field_admin" id="btnBack">Back</router-link>
  <router-link to="/form_field_admin3" id="btnNext">Next</router-link>
        </div>


      </div>
      <footer class="foot">
        <div class="footer-left">
          <p>
            Sport Complex – Mae Fah Luang University |
            Tel. 0-5391-7821 | Facebook:
            <a href="https://www.facebook.com/mfusportcomplex" target="_blank">MFU Sports Complex Center</a> |
            Email: <a href="mailto:sport-complex@mfu.ac.th">sport-complex@mfu.ac.th</a>
          </p>
        </div>
      </footer>

      

    </div>
  </template>
  




  <script setup>

  import { ref } from 'vue';
  const API_BASE = import.meta.env.VITE_API_BASE
  const steps = ['กรอกข้อมูล', 'อัปโหลดไฟล์', 'ยืนยันข้อมูล', 'สำเร็จ'];
  const currentStep = ref(1); // แสดงว่าอยู่ขั้นตอนที่ 2

  const uploadedFileName = ref(''); // เก็บชื่อไฟล์

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadedFileName.value = file.name;
    console.log('ไฟล์ที่อัปโหลด:', file.name);
    // คุณสามารถอัปโหลดไป server ได้ตรงนี้
  }
}

  </script>


  <style scoped>

  .headStepper{
    background-color: white;
  margin: 15px auto;
  padding: 0px;
  width: 90%;
  max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  .stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  
  padding: 20px;
  border-radius: 20px;
}

.step {
  display: flex;
  align-items: center;
  position: relative;
}

.circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #ccc;
  z-index: 1;
}

.circle.active {
  background-color: #ff4d4f;
}

.circle.completed {
  background-color: #ff4d4f;
  opacity: 0.5;
}

.label {
  margin-top: 15px;
  text-align: center;
  font-size: 12px;
  position: absolute;
  top: 40px;
  left: 16px;
  transform: translateX(-50%);
  white-space: nowrap;
}

.line {
  height: 4px;
  width: 80px;
  background-color: #ccc;
  margin: 0 5px;
  z-index: 0;
}

.line.filled {
  background-color: #ff4d4f;
}



.form-container {
  background-color: white;
  margin: 30px auto;
  padding: 40px;
  width: 90%;
  max-width: 900px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}


#btnNext{
  padding: 0.5rem 1rem;
  background-color: #048ace;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none; 
  display: inline-block;
}
.button-wrapper {
  display: flex;
  justify-content: space-between; /* แทน justify-content: flex-end */
  margin: 20px auto 0 auto;
  width: 90%;
  max-width: 900px;
}

#btnBack {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

#btnBack:hover {
  background-color: #5a6268;
}

.upload-button {
  display: inline-block;
  background-color: #048ace;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  text-align: center;
  transition: background-color 0.3s;
}

.upload-button:hover {
  background-color: #036ea1;
}

.upload-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.file-name {
  margin-bottom: 10px;
  font-weight: bold;
  color: #333;
  text-align: center;
  word-break: break-all;
}


  
  </style>

<script>
export default {
  data() {
    return {
      isSidebarClosed: false
    };
  },
  methods: {
    toggleSidebar() {
      this.isSidebarClosed = !this.isSidebarClosed;
    }
  }
};

</script>
  