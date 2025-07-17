import { createApp } from 'vue'
import App from './pages/App.vue'
import router from './router/router.js'  // ✅ ต้อง import ก่อนใช้
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'primeicons/primeicons.css'
import axios from 'axios';
import { createPinia } from 'pinia'

// ฟอนด์+ลักษณะ
import "@/assets/fonts/Sarabun-Bold-normal.js";
import "@/assets/fonts/Sarabun-BoldItalic-normal.js";
import "@/assets/fonts/Sarabun-ExtraBold-normal.js";
import "@/assets/fonts/Sarabun-ExtraBoldItalic-normal.js";
import "@/assets/fonts/Sarabun-ExtraLight-normal.js";
import "@/assets/fonts/Sarabun-ExtraLightItalic-normal.js";
import "@/assets/fonts/Sarabun-Italic-normal.js";
import "@/assets/fonts/Sarabun-Light-normal.js";
import "@/assets/fonts/Sarabun-LightItalic-normal.js";
import "@/assets/fonts/Sarabun-Medium-normal.js";
import "@/assets/fonts/Sarabun-MediumItalic-normal.js";
import "@/assets/fonts/Sarabun-Regular-normal.js";
import "@/assets/fonts/Sarabun-SemiBold-normal.js";
import "@/assets/fonts/Sarabun-SemiBoldItalic-normal.js";
import "@/assets/fonts/Sarabun-Thin-normal.js";
import "@/assets/fonts/Sarabun-ThinItalic-normal.js";


axios.defaults.baseURL = 'http://localhost:3000/';


const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(createPinia())

app.mount('#app')
