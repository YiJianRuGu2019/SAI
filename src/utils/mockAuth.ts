// 模拟验证码存储
const verificationCodes: Record<string, string> = {};

// 模拟发送验证码
export const mockSendVerificationCode = (
  phoneNumber: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码(实际应存在后端)
    verificationCodes[phoneNumber] = code;

    // 在控制台显示验证码(仅用于开发)
    console.log(`向 ${phoneNumber} 发送验证码: ${code}`);

    // 模拟网络延迟
    setTimeout(() => resolve(true), 500);
  });
};

// 模拟验证码验证
// 未使用，注释掉
/*
export const mockVerifyCode = (phoneNumber: string, code: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const isValid = verificationCodes[phoneNumber] === code;
    
    // 模拟网络延迟
    setTimeout(() => resolve(isValid), 300);
    
    // 验证后删除验证码(一次性使用)
    if (isValid) {
      delete verificationCodes[phoneNumber];
    }
  });
}; 
*/
