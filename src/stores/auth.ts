// 简单的登录状态管理
interface UserInfo {
  username: string;
}

interface AuthState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  token: string | null;
}

const state: AuthState = {
  isLoggedIn: false,
  userInfo: null,
  token: null
};

const AuthStore = {
  state,
  
  login(userInfo: UserInfo, token: string): void {
    this.state.isLoggedIn = true;
    this.state.userInfo = userInfo;
    this.state.token = token;
    // 存储到localStorage或其他持久化存储
    localStorage.setItem('auth', JSON.stringify({
      isLoggedIn: true,
      userInfo,
      token
    }));
  },
  
  logout(): void {
    this.state.isLoggedIn = false;
    this.state.userInfo = null;
    this.state.token = null;
    // 清除localStorage
    localStorage.removeItem('auth');
  },
  
  checkAuth(): boolean {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      this.state.isLoggedIn = true;
      this.state.userInfo = authData.userInfo;
      this.state.token = authData.token;
      return true;
    }
    return false;
  }
};

export default AuthStore; 