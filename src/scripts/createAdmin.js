import { createAdminAccount } from '../firebase/firebase';

// Admin account details
const adminEmail = "admin@schedease.com";
const adminPassword = "Admin@123"; // Make sure to change this
const adminName = "System Administrator";

// Create admin account
const createAdmin = async () => {
  try {
    const result = await createAdminAccount(adminEmail, adminPassword, adminName);
    console.log(result);
  } catch (error) {
    console.error("Failed to create admin account:", error);
  }
};

createAdmin(); 