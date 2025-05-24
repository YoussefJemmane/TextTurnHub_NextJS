/**
 * Utility functions for handling file uploads
 */

import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

// Base directory for local file storage
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directories exist
export const ensureUploadDirectories = () => {
  const dirs = [
    path.join(LOCAL_STORAGE_DIR, 'products'),
    path.join(LOCAL_STORAGE_DIR, 'textile-waste'),
    path.join(LOCAL_STORAGE_DIR, 'profiles')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Save base64 image to file system
export const saveBase64Image = async (
  base64Data: string,
  folderName: 'products' | 'textile-waste' | 'profiles'
): Promise<string> => {
  // Extract the MIME type and base64 data
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }
  
  const type = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  
  // Get file extension from MIME type
  const extension = type.split('/')[1];
  const filename = `${randomUUID()}.${extension}`;
  
  // Save to the appropriate folder
  ensureUploadDirectories();
  const filePath = path.join(LOCAL_STORAGE_DIR, folderName, filename);
  await fs.promises.writeFile(filePath, buffer);
  
  // Return the relative URL path
  return `/uploads/${folderName}/${filename}`;
};

// Delete a file from the storage
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    // Extract the path relative to /public
    const relativePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get public URL for a file
export const getPublicUrl = (relativePath: string): string => {
  if (!relativePath) return '';
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
};