<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { onMounted, ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const user = ref(null)

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' })
    const data = await res.json()
    console.log("API /me", data)
    if (data.loggedIn) {
      userStore.setUser(data.user)
      user.value = data.user

      // DEBUG
      console.log("user_id", data.user.user_id)
      console.log("_id", data.user._id)

      const actualUserId = data.user.user_id || data.user._id || ''
      localStorage.setItem('user_id', actualUserId)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('role', data.user.role || '')
      localStorage.setItem('name', data.user.name || '')
      localStorage.setItem('email', data.user.email || '')
      loading.value = false

      setTimeout(() => {
        switch (data.user.role) {
          case 'admin':
            router.replace('/dashboard')
            break
          case 'staff':
            router.replace('/approve_equipment')
            break
          default:
            router.replace('/home_user')
        }
      }, 1200)
    } else {
      loading.value = false
      user.value = null
      router.replace('/login')
    }
  } catch (e) {
    loading.value = false
    user.value = null
    router.replace('/login')
  }
})

</script>

<!-- <template>
  <div class="login-success-page">
    <div v-if="loading">กำลังเข้าสู่ระบบ...</div>
    <div v-else-if="user">
      <h2>Login Success!</h2>
      <p>สวัสดีคุณ {{ user.name }}</p>
      <p>กำลังพาไปหน้าแรก...</p>
    </div>
    <div v-else>
      <h2>Login failed!</h2>
      <button @click="() => router.push('/login')">กลับไปหน้า Login</button>
    </div>
  </div>
</template> -->
