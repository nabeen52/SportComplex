// userStore.js
import { defineStore } from 'pinia'
export const useUserStore = defineStore('userStore', {
    state: () => ({
        user: {
            name: '',
            user_id: '',
            email: '',
            picture: '',    
    }}),
    actions: {
        setUser(u) { this.user = u }
    }
})
