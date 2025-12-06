import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const username = ref('')
  const isLoggedIn = ref(false)
  
  const userCapitalized = computed(() => 
    username.value.charAt(0).toUpperCase() + username.value.slice(1)
  )
  
  function login(user: string) {
    username.value = user
    isLoggedIn.value = true
  }
  
  function logout() {
    username.value = ''
    isLoggedIn.value = false
  }
  
  return { 
    username, 
    isLoggedIn, 
    userCapitalized, 
    login, 
    logout 
  }
}) 