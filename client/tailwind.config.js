import { defineConfig } from 'tailwindcss'

/** @type {import('tailwindcss').Config} */
export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        'screen-2xl': '1400px', 
        'custom-1200': '1200px', 
        'custom-900': '900px', 
      },
      colors: {
        // Primary brand colors
        'primary': '#2563eb',      // Trust-building blue
        'primary-dark': "#1d4ed8", // Hover state
        'primary-light': '#dbeafe', // Backgrounds
        
        // Ecommerce-specific colors
        'cta': '#dc2626',         // Red for "Buy Now", "Sale" buttons
        'cta-dark': '#b91c1c',    // Darker red for hover
        'success': '#059669',     // Green for success messages, stock
        'warning': '#d97706',     // Amber for warnings, low stock
        'error': '#dc2626',       // Red for errors
        
        // Neutral colors
        'text-dark': '#1e293b',   // Main text
        'text-light': '#475569',  // Secondary text
        'extra-light': '#f8fafc', // Backgrounds
        'border': '#e2e8f0',      // Borders, dividers
        
        // Status colors
        'sale': '#ef4444',        // Sale tags
        'new': '#10b981',         // New arrival badges
        'discount': '#8b5cf6'     // Discount highlights
      },
      boxShadow: {
        'product': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'product-hover': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }
    },
  },
  plugins: [],
})