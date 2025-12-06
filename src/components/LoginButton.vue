<template>
  <button class="loginBtn" @click="openLoginModal">登录</button>
</template>

<script setup lang='ts'>

const emit = defineEmits<{
  (e: 'openLogin'): void
}>()

const openLoginModal = (): void => {
  emit('openLogin')
}
</script>

<style scoped>
.loginBtn {
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}
</style> 