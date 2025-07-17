import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
const router = createRouter({
    history: createWebHistory(),
    routes,
});
router.beforeEach(async (to, from, next) => {
    const guestPages = ['/login', '/login-success', '/login-failed', '/forgot', '/404'];
    if (guestPages.includes(to.path)) return next();
    try {
        const res = await fetch('http://localhost:3000/api/me', { credentials: 'include' });
        const data = await res.json();
        if (data.loggedIn) next();
        else next('/login');
    } catch (e) {
        next('/login');
    }
});
export default router;
