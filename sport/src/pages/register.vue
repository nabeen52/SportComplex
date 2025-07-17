<template>
    <header class="navbar">
          <!-- Left hand -->
          <div class="left-group">
              <img src="/img/logo.png" alt="" style="width: 80px; height: 80px;">
  
              <div class="text-group">
                  <p style="font-size: large; color: white;">ศูนย์กีฬามหาวิทยาลัยแม่ฟ้าหลวง</p>
              <span class="subtext">Mae Fah Luang University Sport Complex Center</span>
              </div>
          </div>
      </header>
  
  
  
  
    <div class="login-page">
      <!-- Login Card -->
      <div class="card">
        <h2>Register</h2>
        <input type="text" placeholder="Username" style="height: 50px;" />
        <p style="padding-bottom: 10px;"></p>
        <input type="password" placeholder="Password" style="height: 50px;" />
        <p style="padding-bottom: 10px;"></p>
        <input type="password" placeholder="Confirm password" style="height: 50px;" />
        <p style="padding-bottom: 4px;"></p>
        <button class="login-btn">Login</button>
        
      </div>
  
      <button class="email-btn">
          📧 Continue with Email
        </button>

        <p class="register">
        Already have an account? <a href="/register">Login</a>
      </p>
     
    </div>
  
     <!-- Footer -->
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
  </template>
  
  <style scoped>

  .login-page {
    min-height: 100vh;
    background-color: #dbe9f4;
    background-image: url('/img/bg-pattern.png'); /* ใส่ pattern ด้านหลังถ้ามี */
    background-repeat: repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .logo {
    width: 80px;
    height: 80px;
  }
  
  .title-group {
    margin-top: 10px;
  }
  
  .th-title {
    font-size: 18px;
    font-weight: bold;
  }
  
  .en-title {
    font-size: 14px;
    color: #555;
  }
  
  .card {
    background-color: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 550px;
    height: 440px;
    text-align: center;
  }
  
  .card input {
    display: block;
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border-radius: 8px;
    border: 1px solid #aaa;
  }
  
  .login-btn {
    width: 30%;
    padding: 10px;
    background-color: #2c3e73;
    color: white;
    border: none;
    border-radius: 8px;
    margin-top: 10px;
    cursor: pointer;
  }
  
  .email-btn {
    margin-top: 50px;
    
    padding: 10px;
    background-color: #213555;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
  }
  
  .register {
    margin-top: 10px;
    font-size: 12px;
  }
  
  .footer {
    
    font-size: 12px;
    text-align: center;
    color: #2c3e73;
    background-color: #dbe9f4;
  }
  
  
  .foot{
    padding-top: 0px;
    padding-bottom: 8px;
  }


  </style>
  
  <style>
  @import '../css/style.css';
  </style>
  