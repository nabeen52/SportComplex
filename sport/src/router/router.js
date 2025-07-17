import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

// --- import ทุกหน้าตามปกติ ---
import Home_user from '../pages/home_user.vue'
import Profile from '@/pages/profile.vue'
import Cart from '@/pages/cart.vue'
import Login from '@/pages/login.vue'
import Register from '@/pages/register.vue'
import Booking_field from '../pages/booking_field.vue'
import Booking_equipment from '@/pages/booking_equipment.vue'
import History from '@/pages/history.vue'
import Form_field from '@/pages/form_field.vue'
import Form_field2 from '@/pages/form_field2.vue'
import Form_field3 from '@/pages/form_field3.vue'
import Form_field4 from '@/pages/form_field4.vue'
import Equipment from '@/pages/equipment.vue'
import Approve_equipment from '@/pages/approve_equipment.vue'
import Return from '@/pages/return.vue'
import Profile_staff from '@/pages/profile_staff.vue'
import History_staff from '@/pages/history_staff.vue'
import Profile_admin from '@/pages/profile_admin.vue'
import History_admin from '@/pages/history_admin.vue'
import Approve_field from '@/pages/approve_field.vue'
import Form_equipment from '@/pages/form_equipment.vue'
import Form_equipment2 from '@/pages/form_equipment2.vue'
import Form_equipement3 from '@/pages/form_equipement3.vue'
import Form_equipment4 from '@/pages/form_equipment4.vue'
import Select_role from '@/pages/select_role.vue'
import Dashboard from '@/pages/dashboard.vue'
import Edit_equipment from '@/pages/Edit_equipment.vue'
import Edit_field from '@/pages/Edit_field.vue'
import Home_admin from '@/pages/home_admin.vue'
import Members from '@/pages/Members.vue'
import Booking from '@/pages/booking.vue'
import Equitment_borrow from '@/pages/Equiptment_borrow.vue'
import Booking_field_admin from '@/pages/booking_field_admin.vue'
import Form_field_admin from '@/pages/form_field_admin.vue'
import Form_field_admin2 from '@/pages/form_field_admin2.vue'
import Form_field_admin3 from '@/pages/form_field_admin3.vue'
import Form_field_admin4 from '@/pages/form_field_admin4.vue'
import Booking_admin from '@/pages/booking_admin.vue'
import Return_admin from '@/pages/return_admin.vue'

// *** ต้อง import LoginSuccess ด้วย ***
import LoginSuccess from '@/pages/login-success.vue'

const routes = [
    { path: '/', component: Select_role },
    { path: '/login', component: Login },
    { path: '/login-success', component: LoginSuccess }, // ← ที่ถูกต้อง!
    { path: '/register', component: Register },

    // --- ใส่ meta: { requiresAuth: true } ทุกหน้าที่ต้อง login ---
    { path: '/home_user', component: Home_user, meta: { requiresAuth: true } },
    { path: '/profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/cart', component: Cart, meta: { requiresAuth: true } },
    { path: '/booking_field', component: Booking_field, meta: { requiresAuth: true } },
    { path: '/booking_equipment', component: Booking_equipment, meta: { requiresAuth: true } },
    { path: '/history', component: History, meta: { requiresAuth: true } },
    { path: '/form_field', component: Form_field, meta: { requiresAuth: true } },
    { path: '/form_field2', component: Form_field2, meta: { requiresAuth: true } },
    { path: '/form_field3', component: Form_field3, meta: { requiresAuth: true } },
    { path: '/form_field4', component: Form_field4, meta: { requiresAuth: true } },
    { path: '/equipment', component: Equipment, meta: { requiresAuth: true } },
    { path: '/approve_equipment', component: Approve_equipment, meta: { requiresAuth: true } },
    { path: '/return', component: Return, meta: { requiresAuth: true } },
    { path: '/profile_staff', component: Profile_staff, meta: { requiresAuth: true } },
    { path: '/profile_admin', component: Profile_admin, meta: { requiresAuth: true } },
    { path: '/history_staff', component: History_staff, meta: { requiresAuth: true } },
    { path: '/history_admin', component: History_admin, meta: { requiresAuth: true } },
    { path: '/approve_field', component: Approve_field, meta: { requiresAuth: true } },
    { path: '/form_equipment', component: Form_equipment, meta: { requiresAuth: true } },
    { path: '/form_equipment2', component: Form_equipment2, meta: { requiresAuth: true } },
    { path: '/form_equipment3', component: Form_equipement3, meta: { requiresAuth: true } },
    { path: '/form_equipment4', component: Form_equipment4, meta: { requiresAuth: true } },
    { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/edit_equipment', component: Edit_equipment, meta: { requiresAuth: true } },
    { path: '/edit_field', component: Edit_field, meta: { requiresAuth: true } },
    { path: '/home_admin', component: Home_admin, meta: { requiresAuth: true } },
    { path: '/members', component: Members, meta: { requiresAuth: true } },
    { path: '/booking', component: Booking, meta: { requiresAuth: true } },
    { path: '/equipment_borrow', component: Equitment_borrow, meta: { requiresAuth: true } },
    { path: '/booking_field_admin', component: Booking_field_admin, meta: { requiresAuth: true } },
    { path: '/form_field_admin', component: Form_field_admin, meta: { requiresAuth: true } },
    { path: '/form_field_admin2', component: Form_field_admin2, meta: { requiresAuth: true } },
    { path: '/form_field_admin3', component: Form_field_admin3, meta: { requiresAuth: true } },
    { path: '/form_field_admin4', component: Form_field_admin4, meta: { requiresAuth: true } },
    { path: '/booking_admin', component: Booking_admin, meta: { requiresAuth: true } },
    { path: '/return_admin', component: Return_admin, meta: { requiresAuth: true } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// --- Middleware: Auth Guard (JWT/Session) ---
router.beforeEach(async (to, from, next) => {
    const guestPages = ['/login', '/login-success', '/login-failed', '/register', '/forgot', '/404'];
    if (guestPages.includes(to.path)) return next();

    const userStore = useUserStore();

    // หน้า /login-success ให้ผ่าน
    if (!userStore.user && to.path === '/login-success') {
        return next();
    }

    // ถ้าหน้านี้ require auth
    if (to.meta.requiresAuth) {
        if (!userStore.user) {
            const localUser = localStorage.getItem('user')
            if (localUser) {
                userStore.setUser(JSON.parse(localUser))
            }
        }
    }
    next();
});


export default router
