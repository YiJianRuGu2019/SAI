<template>
  <div class="loginModalWrapper" v-if="visible" @click="closeOnBackdrop">
    <div class="loginModal" @click.stop>
      <div class="loginContent">
        <!-- 标签页切换 -->
        <div class="loginTabs">
          <div class="tab" :class="{ active: activeTab === 'verification' }" @click="activeTab = 'verification'">
            验证码登录
          </div>
          <div class="tab" :class="{ active: activeTab === 'password' }" @click="activeTab = 'password'">
            密码登录
          </div>
        </div>

        <!-- 登录区域 -->
        <div class="loginFormArea">
          <!-- 手机号登录表单 -->
          <div class="loginForm" v-if="activeTab === 'verification' || activeTab === 'password'">
            <p class="loginHint">你所在地区仅支持 手机号 / 微信 / 邮箱 登录</p>

            <!-- 手机号输入 -->
            <div class="phoneInput">
              <span class="countryCode">+86</span>
              <input type="text" placeholder="请输入手机号" v-model="phoneNumber">
            </div>

            <!-- 验证码输入 -->
            <div class="codeInputRow" v-if="activeTab === 'verification'">
              <input type="text" placeholder="请输入验证码" v-model="verificationCode">
              <button class="sendCodeBtn" @click="sendVerificationCode">
                {{ countdown > 0 ? `${countdown}秒后重发` : '发送验证码' }}
              </button>
            </div>

            <!-- 密码输入 -->
            <div class="passwordInput" v-if="activeTab === 'password'">
              <input type="password" placeholder="请输入密码" v-model="password">
            </div>

            <!-- 同意协议 -->
            <div class="agreementText">
              <span>注册登录即代表已阅读并同意我们的</span>
              <a href="#" class="link">用户协议</a>
              <span>与</span>
              <a href="#" class="link">隐私政策</a>
              <span>，未注册的手机号将自动注册</span>
            </div>

            <!-- 登录按钮 -->
            <button class="loginSubmitBtn" @click="handleLogin">登录</button>
          </div>
        </div>
      </div>

      <!-- 微信登录区域 -->
      <div class="wechatArea" @click="handleWechatLogin">
        <div class="qrCode">
          <img src="../img/my.png" alt="微信扫码登录" class="qrImage">
        </div>
        <div class="wechatLoginLabel">
          <img :src="wechatIconImage" alt="微信" class="wechatIcon">
          <span>微信扫码登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue'
import { mockSendVerificationCode } from '../utils/mockAuth'
import { mockCheckWechatLogin } from '../utils/mockWechat'

interface LoginProps {
  visible: boolean
}

interface LoginUserInfo {
  username: string
}

interface LoginData {
  phoneNumber: string
  loginType: string
  verificationCode?: string
  password?: string
}

const props = defineProps<LoginProps>()

const emit = defineEmits<{
  (e: 'loginSuccess', data: LoginUserInfo): void
  (e: 'close'): void
}>()

const activeTab = ref<'verification' | 'password'>('verification')
const phoneNumber = ref<string>('')
const verificationCode = ref<string>('')
const password = ref<string>('')
const countdown = ref<number>(0)

// 点击空白处关闭模态框
const closeOnBackdrop = () => {
  emit('close')
}

// 处理微信登录点击
const handleWechatLogin = async () => {
  try {
    // 模拟API调用检查微信登录状态
    const response = await mockCheckWechatLogin();

    if (response.logged && response.userInfo) {
      // 触发登录成功事件
      emit('loginSuccess', {
        username: response.userInfo.username
      });

      // 关闭登录框
      emit('close');
    } else {
      console.log('请扫描二维码完成微信登录');
      // 这里可以添加提示用户扫码的逻辑
    }
  } catch (error) {
    console.error('微信登录失败:', error);
  }
};

// 发送验证码
const sendVerificationCode = async (): Promise<void> => {
  // 启动倒计时
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)

  // 调用模拟发送验证码函数
  await mockSendVerificationCode(phoneNumber.value)
}

// 处理登录 - 简化验证逻辑，允许任意内容登录
const handleLogin = async (): Promise<void> => {
  // 构建登录数据
  const loginData: LoginData = {
    phoneNumber: phoneNumber.value || '默认用户',
    loginType: activeTab.value,
    ...(activeTab.value === 'verification'
      ? { verificationCode: verificationCode.value }
      : { password: password.value })
  }

  console.log('登录信息', loginData)

  // 直接模拟登录成功，不做任何验证
  emit('loginSuccess', { username: phoneNumber.value || '用户' + Math.floor(Math.random() * 1000) })
  emit('close')
}

// Base64 编码的图片
const qrCodeImage = ref('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAAELZJREFUeF7tnXnQbtUYxp/nPedwzuE4Dkc4HGMOIbRJA2lQmiiaDCVDRKVQKkODSIMhRAlFKpQQGhgOGTOUSGRKcpwhU4bzONM5rvtb33nP933v++699t5rv2vv9e5/v7X2ete97t96nmevva+NSogJERAIzDi3TBs3YDnxlkw+GfKTlwbO+NyLImL8C6cwACaAN2BJ+FVVWl2uPHPgABgBf1jfXLb9R1QoVSgS+xE7D+NmLZvhkgr7OOBCcBbGTJpQXQEnwdlgVbibYjkJXAZfA7OuFHskuAymgmHwHBwDu0HTUUuAJXvgxs50pHsn3Ab/Bp/CTfAQGMa2oC7A0vwW3O7E8X5wA5RYmgCdLGsJkPB9+LFOJ6fBHDjyTgK0IW05CFfB8nMXzIVBsALaDn2WKq1AvGlfgXc+jALq0vMdFM6E9XBtApbMQrktRuNAiRJF8JW7qyXAcB5zhYnw3a/9rkkMZaCeVn3NAuQ3KPGGojg6dRp8GdbWLCCqNJiZDpZQPUF8H8sroHGIaAc7Nco5MNcG+S17CbT9mJmNlF2iDtDW5G+BuSKBtj6kP7h3wKvG/ZWGkahX/9tgmUlwQlw+QSLxOJIpGzV3HyiNQNffeCdLzGOwbA8Uo1BG5HKHnXyBLQ8wPAkjpk1gjhsIfG4oyrPj9xHkMkikyeUcA+Qg5cKHSKRM8Ep1uW+gGkJdgqSZJGomkEpBv5kApSQ0NwFKZZAZM8Erp0HhJbyRm2CZNUA/WXqZA13vQaUFsH/kGkbH73nddwQKsK7eAscygPsUWdZA3tuCzYUBGA9vY8uJz2F0WvBm7lIAKiGLXkZu2wlkJ++j6/QXyG0fgl0sowxZ52Btbj7sV2vBciHMOOuoQkA1e3QdXbsPIdVpoewcOOe3AeeMTRk3G9b18JW9Bc6tYlxCy8EjWB67gbKzsFa5JN8Y7E15MoBXU+gSrVtWEcg5oH8rtGgXsq9KcJaKsUB/a5Og9yC0ePkVBFxpBKfJ9iXQ94RWWO/nPngNGe2Hlt0IHc+n1/3zQ1R58UyPFuP/B9TM8/EbZTAMjuOnqCnUdPDvtC/hOH+MmxdMaXPgX3nMi5/V9+Q7AAAAAElFTkSuQmCC')
const wechatIconImage = ref('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAADYUlEQVRYCcVXTWhUVxT+7sxkEpMYY5ImMWlAjTVNrUkL1YJYbAvdddWFUGgXRcFVQVdSuuhGTBSqC7GgiyJUcKcuXAiCKEptbFNtTGMSY/PT/HvfvefMvG/evHkz85JR6At37r3nnu98/547jwHrfLSsb/hwPn4Fj8EgOB/mxLw3FbDhLpgN5sRcb7nkCIAP4C6eF6cwACaAN2BJ+FVVWl2uPHPgABgBf1jfXLb9R1QoVSgS+xE7D+NmLZvhkgr7OOBCcBbGTJpQXQEnwdlgVbibYjkJXAZfA7OuFHskuAymgmHwHBwDu0HTUUuAJXvgxs50pHsn3Ab/Bp/CTfAQGMa2oC7A0vwW3O7E8X5wA5RYmgCdLGsJkPB9+LFOJ6fBHDjyTgK0IW05CFfB8nMXzIVBsALaDn2WKq1AvGlfgXc+jALq0vMdFM6E9XBtApbMQrktRuNAiRJF8JW7qyXAcB5zhYnw3a/9rkkMZaCeVn3NAuQ3KPGGojg6dRp8GdbWLCCqNJiZDpZQPUF8H8sroHGIaAc7Nco5MNcG+S17CbT9mJmNlF2iDtDW5G+BuSKBtj6kP7h3wKvG/ZWGkahX/9tgmUlwQlw+QSLxOJIpGzV3HyiNQNffeCdLzGOwbA8Uo1BG5HKHnXyBLQ8wPAkjpk1gjhsIfG4oyrPj9xHkMkikyeUcA+Qg5cKHSKRM8Ep1uW+gGkJdgqSZJGomkEpBv5kApSQ0NwFKZZAZM8Erp0HhJbyRm2CZNUA/WXqZA13vQaUFsH/kGkbH73nddwQKsK7eAscygPsUWdZA3tuCzYUBGA9vY8uJz2F0WvBm7lIAKiGLXkZu2wlkJ++j6/QXyG0fgl0sowxZ52Btbj7sV2vBciHMOOuoQkA1e3QdXbsPIdVpoewcOOe3AeeMTRk3G9b18JW9Bc6tYlxCy8EjWB67gbKzsFa5JN8Y7E15MoBXU+gSrVtWEcg5oH8rtGgXsq9KcJaKsUB/a5Og9yC0ePkVBFxpBKfJ9iXQ94RWWO/nPngNGe2Hlt0IHc+n1/3zQ1R58UyPFuP/B9TM8/EbZTAMjuOnqCnUdPDvtC/hOH+MmxdMaXPgX3nMi5/V9+Q7AAAAAElFTkSuQmCC')
</script>

<style scoped>
.loginModalWrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loginModal {
  display: flex;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  width: 900px;
  height: 550px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.loginContent {
  flex: 1;
  padding: 50px;
  display: flex;
  flex-direction: column;
}

.loginTabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 40px;
}

.tab {
  padding: 14px 0;
  margin-right: 40px;
  cursor: pointer;
  color: #999;
  font-size: 18px;
  transition: color 0.3s;
}

.tab.active {
  color: #4e6ef2;
  border-bottom: 2px solid #4e6ef2;
  font-weight: 500;
}

.loginHint {
  color: #666;
  font-size: 16px;
  margin-bottom: 40px;
}

.phoneInput {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 30px;
  transition: border-color 0.3s;
}

.phoneInput:focus-within {
  border-color: #4e6ef2;
}

.countryCode {
  color: #666;
  padding-right: 18px;
  border-right: 1px solid #eee;
  margin-right: 18px;
  font-size: 16px;
  font-weight: 500;
}

input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 16px;
}

.codeInputRow {
  display: flex;
  margin-bottom: 30px;
}

.codeInputRow input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-right: 15px;
  transition: border-color 0.3s;
}

.codeInputRow input:focus {
  border-color: #4e6ef2;
}

.sendCodeBtn {
  white-space: nowrap;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0 25px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.sendCodeBtn:hover {
  background-color: #e8e8e8;
}

.passwordInput {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 30px;
  transition: border-color 0.3s;
}

.passwordInput:focus-within {
  border-color: #4e6ef2;
}

.agreementText {
  font-size: 14px;
  color: #999;
  margin-bottom: 40px;
  line-height: 1.6;
}

.link {
  color: #4e6ef2;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.loginSubmitBtn {
  width: 100%;
  background-color: #4e6ef2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 16px 0;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: auto;
}

.loginSubmitBtn:hover {
  background-color: #3d5bd9;
}

.wechatArea {
  width: 320px;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 30px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.wechatArea:hover {
  background-color: #f0f0f0;
}

.qrCode {
  width: 220px;
  height: 220px;
  background-color: white;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.qrImage {
  width: 180px;
  height: 180px;
}

.wechatLoginLabel {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.wechatIcon {
  width: 28px;
  height: 28px;
  margin-right: 12px;
}
</style>