
import CryptoJS from 'crypto-js';

// Encryption key - In a real app, this would be stored securely
// This key should be unique to your application and never exposed
const ENCRYPTION_KEY = 'cyrus-resource-tool-secure-key-2024';

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const hashPassword = (password: string): string => {
  // First salt the password and then hash it
  const salt = 'cyrus-resource-tool-salt-2024';
  return CryptoJS.SHA256(password + salt).toString();
};

export const comparePasswords = (inputPassword: string, hashedPassword: string): boolean => {
  const hashedInput = hashPassword(inputPassword);
  return hashedInput === hashedPassword;
};
