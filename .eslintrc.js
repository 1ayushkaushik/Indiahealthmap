module.exports = {
  extends: [
    'next/core-web-vitals',
    // other extends...
  ],
  rules: {
    // Disable the no-explicit-any rule
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Or if you prefer to just warn instead of error
    // '@typescript-eslint/no-explicit-any': 'warn',
    
    // Other rules...
  }
}; 