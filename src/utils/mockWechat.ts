// 模拟微信登录检测
export const mockCheckWechatLogin = (): Promise<{ logged: boolean, userInfo?: any }> => {
  return new Promise((resolve) => {
    // 在真实场景中，前端会轮询后端API检查二维码是否被扫描
    // 这里我们随机模拟扫码成功的情况
    
    // 80%的概率未登录，模拟用户还未扫码
    if (Math.random() > 0.2) {
      setTimeout(() => resolve({ logged: false }), 1000);
      return;
    }
    
    // 模拟登录成功，返回用户信息
    const mockUserInfo = {
      username: '微信用户' + Math.floor(Math.random() * 10000),
      avatar: 'https://placekitten.com/200/200', // 随机头像
      openid: 'wx_' + Math.random().toString(36).substring(2, 15)
    };
    
    setTimeout(() => resolve({ 
      logged: true,
      userInfo: mockUserInfo
    }), 1000);
  });
}; 