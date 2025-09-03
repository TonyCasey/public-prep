#!/usr/bin/env node

// Simple script to copy assets for deployment
import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy attached_assets to dist directory
try {
  copyDir('attached_assets', 'dist/attached_assets');
  
  // Create URL-safe copy of video file for production compatibility
  const videoSrc = 'attached_assets/Home Page Portrait_1752753602292.mp4';
  const videoDestSafe = 'dist/attached_assets/Home_Page_Portrait_1752753602292.mp4';
  
  if (fs.existsSync(videoSrc)) {
    fs.copyFileSync(videoSrc, videoDestSafe);
    console.log('✓ Created URL-safe video filename copy');
  }
  
  console.log('✓ Assets copied successfully to dist/attached_assets');
} catch (error) {
  console.error('Error copying assets:', error);
  process.exit(1);
}