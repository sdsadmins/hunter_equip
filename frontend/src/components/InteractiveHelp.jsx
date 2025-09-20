import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './InteractiveHelp.css';

export default function InteractiveHelp() {
  const [showHelp, setShowHelp] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50); // Panel width percentage
  const [isResizing, setIsResizing] = useState(false);
  const location = useLocation();

  // Load Tawk.to script for live chat
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/YOUR_TAWK_ID/default';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src*="tawk.to"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Handle panel resizing
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const windowWidth = window.innerWidth;
    const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
    
    // Constrain width between 30% and 80%
    const constrainedWidth = Math.min(Math.max(newWidth, 30), 80);
    setPanelWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Check for error messages on the page
  const detectPageErrors = () => {
    const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [class*="warning"]');
    const errorTexts = Array.from(errorElements).map(el => el.textContent?.toLowerCase() || '');
    
    // Check for specific error messages
    if (errorTexts.some(text => 
      text.includes('email and password didn\'t match') || 
      text.includes('credentials') || 
      text.includes('incorrect') ||
      text.includes('wrong password')
    )) {
      return 'login_error';
    }
    
    if (errorTexts.some(text => 
      text.includes('already exists') || 
      text.includes('already registered') ||
      text.includes('email already')
    )) {
      return 'registration_error';
    }
    
    return null;
  };

  // Get context-aware help based on current page and errors
  const getContextualHelp = () => {
    const path = location.pathname;
    const pageError = detectPageErrors();
    
    // If there's a login error, show login error help
    if (pageError === 'login_error') {
      return {
        title: '❌ Login Error Detected',
        content: [
          'I see you\'re having trouble logging in. Let me help you fix this!',
          '',
          '🔍 COMMON CAUSES:',
          '• Typo in email address',
          '• Wrong password',
          '• Caps Lock is on',
          '• Extra spaces in fields',
          '',
          '🛠️ QUICK FIXES:',
          '1. Check your email: venkat@yopmail.com',
          '2. Verify your password is correct',
          '3. Make sure Caps Lock is off',
          '4. Remove any extra spaces',
          '5. Try the "Forgot Password?" button below'
        ],
        tips: [
          '💡 Most login issues are simple typos',
          '💡 Click "Forgot Password?" to reset if needed',
          '💡 Contact support if problem persists'
        ],
        showOnlyRelevant: true,
        relevantButtons: ['forgot_password', 'wrong_password', 'live_chat']
      };
    }
    
    // If there's a registration error, show registration error help
    if (pageError === 'registration_error') {
      return {
        title: '⚠️ Registration Error Detected',
        content: [
          'I see you\'re trying to register but there\'s an issue.',
          '',
          '🔍 LIKELY CAUSE:',
          '• This email is already registered',
          '• You already have an account',
          '',
          '🛠️ WHAT TO DO:',
          '1. Try logging in instead of registering',
          '2. Use "Forgot Password?" if you can\'t remember',
          '3. Check if you used a different email',
          '4. Contact support if you\'re sure you don\'t have an account'
        ],
        tips: [
          '💡 You can only have one account per email',
          '💡 Try logging in first',
          '💡 Use "Forgot Password?" if needed'
        ],
        showOnlyRelevant: true,
        relevantButtons: ['login', 'forgot_password', 'live_chat']
      };
    }
    
    switch (path) {
      case '/':
        return {
          title: '🏠 Home Page Help',
          content: [
            'Welcome to Crane Inspection Management System!',
            'This system helps you manage crane inspections and track expiration dates.',
            '',
            'What you can do here:',
            '• View available cranes (public data)',
            '• Get started with registration',
            '• Access your account',
            '• Learn about the system'
          ],
          tips: [
            '💡 New users should click "New User Register"',
            '💡 Existing users should click "Existing User Login"',
            '💡 You can view crane data without logging in'
          ],
          showOnlyRelevant: false
        };
        
      case '/login':
        return {
          title: '🔐 Login Help',
          content: [
            'Login to access your crane management dashboard.',
            '',
            'How to login:',
            '1. Enter your email address',
            '2. Enter your password',
            '3. Click "Login" button',
            '4. You\'ll be redirected to your dashboard'
          ],
          tips: [
            '💡 Use the same email you registered with',
            '💡 Password is case-sensitive',
            '💡 Click the eye icon to show/hide password',
            '💡 If you forgot password, click "Forgot Password?"'
          ],
          showOnlyRelevant: false
        };
        
      case '/forgot-password':
        return {
          title: '🔑 Forgot Password Help',
          content: [
            'Reset your password to regain access to your account.',
            '',
            'How to reset password:',
            '1. Enter your registered email address',
            '2. Click "Send Reset Link" button',
            '3. Check your email inbox',
            '4. Click the reset link in the email',
            '5. Create a new password',
            '6. Login with your new password'
          ],
          tips: [
            '💡 Use the same email you registered with',
            '💡 Check spam/junk folder if you don\'t see the email',
            '💡 Reset link expires after 24 hours',
            '💡 New password must meet all requirements'
          ],
          showOnlyRelevant: true,
          relevantButtons: ['forgot_password', 'login', 'live_chat']
        };
        
      case '/register':
        return {
          title: '📝 Registration Help',
          content: [
            'Create your account to start managing crane inspections.',
            '',
            'How to register:',
            '1. Enter your full name',
            '2. Enter a valid email address',
            '3. Create a strong password',
            '4. Confirm your password',
            '5. Click "Register" button'
          ],
          tips: [
            '💡 Password must be 8+ characters with uppercase, lowercase, number, and special character',
            '💡 Use a valid email - you\'ll need it to login',
            '💡 After registration, you\'ll be automatically logged in'
          ],
          showOnlyRelevant: false
        };
        
      case '/supervisor-dashboard':
        return {
          title: '📊 Supervisor Dashboard - Quick Reference',
          content: [
            'Welcome to your crane management dashboard! Here\'s what you can do:',
            '',
            '🎯 QUICK ACTIONS:',
            '• Click any function button below for detailed help',
            '• Use search box to find specific cranes',
            '• Click colored alert numbers to filter by status',
            '• All major functions are available as clickable buttons',
            '',
            '📊 CURRENT VIEW:',
            '• You can see all your cranes in the table',
            '• Green dates = OK, Orange = Expiring soon, Red = Expired',
            '• Click edit/delete icons next to any crane to modify',
            '• Use filters to narrow down your view'
          ],
          tips: [
            '💡 Click the function buttons below for step-by-step help',
            '💡 Each button provides detailed instructions',
            '💡 Use search and filters to find specific cranes quickly'
          ],
          showOnlyRelevant: true,
          relevantButtons: ['upload', 'email_alerts', 'expiration_date', 'add_crane', 'edit_crane', 'delete_crane', 'search_crane', 'live_chat']
        };

      case '/add-crane':
        return {
          title: '➕ Add New Crane - Form Help',
          content: [
            'You\'re on the Add New Crane form. Here\'s how to fill it out:',
            '',
            '📝 REQUIRED FIELDS:',
            '• Unit # - Enter crane identifier (e.g., C-210)',
            '• Make & Model - Enter full crane model (e.g., TADANO GR1600XL-3)',
            '',
            '📋 OPTIONAL FIELDS:',
            '• Year - Manufacturing year (e.g., 2018)',
            '• Ton - Crane capacity (e.g., 160 TON)',
            '• Serial # - Crane serial number (e.g., FE5144)',
            '• Expiration Date - Inspection due date',
            '',
            '📅 EXPIRATION DATE RULES:',
            '• Must be in MM/DD/YYYY format (e.g., 12/15/2025)',
            '• Must be a FUTURE date (not past)',
            '• System will reject invalid dates',
            '• Leave empty if not known (can be added later)',
            '',
            '💾 SAVING:',
            '• Click "Save" button to add the crane',
            '• You\'ll be redirected back to dashboard',
            '• New crane will appear in your crane list'
          ],
          tips: [
            '💡 Unit # and Make & Model are required',
            '💡 Expiration date must be in the future',
            '💡 Use MM/DD/YYYY format for dates',
            '💡 You can edit the crane later if needed'
          ],
          showOnlyRelevant: true,
          relevantButtons: ['add_crane', 'expiration_date', 'edit_crane', 'live_chat']
        };

      case '/edit-crane':
      case '/update-crane':
        return {
          title: '✏️ Edit Crane - Update Form Help',
          content: [
            'You\'re editing an existing crane. Here\'s what you can change:',
            '',
            '✏️ EDITABLE FIELDS:',
            '• Unit # - Change crane identifier',
            '• Year - Update manufacturing year',
            '• Make & Model - Modify crane model',
            '• Ton - Change tonnage capacity',
            '• Serial # - Update serial number',
            '• Expiration Date - Change inspection date',
            '',
            '📅 EXPIRATION DATE RULES:',
            '• Must be in MM/DD/YYYY format (e.g., 12/15/2025)',
            '• Must be a FUTURE date (not past)',
            '• System will reject past dates',
            '• Status will update automatically after saving',
            '',
            '💾 SAVING CHANGES:',
            '• Click "Save" button to update the crane',
            '• You\'ll be redirected back to dashboard',
            '• Changes will appear immediately',
            '• Status colors will update automatically',
            '',
            '⚠️ IMPORTANT NOTES:',
            '• All changes are saved immediately',
            '• Original crane ID cannot be changed',
            '• Make sure expiration date is in the future'
          ],
          tips: [
            '💡 Expiration date must be in the future',
            '💡 Use MM/DD/YYYY format for dates',
            '💡 Changes are saved immediately',
            '💡 Status colors update automatically'
          ],
          showOnlyRelevant: true,
          relevantButtons: ['edit_crane', 'expiration_date', 'delete_crane', 'live_chat']
        };
        
      default:
        return {
          title: '🆘 General Help',
          content: [
            'I can help you with the Crane Management System.',
            'This system helps you track crane inspection expiration dates.'
          ],
          tips: [
            '💡 Navigate to different pages to get specific help',
            '💡 Each page has its own help content'
          ],
          showOnlyRelevant: false
        };
    }
  };

  // Help responses based on user input
  const getHelpResponse = (input) => {
    const lowerInput = input.toLowerCase().trim();
    
    // New user related queries
    if (lowerInput.includes('new user') || lowerInput.includes('register') || lowerInput.includes('sign up') || lowerInput.includes('create account')) {
      return {
        type: 'steps',
        title: '📝 How to Register (New User)',
        content: [
          '1. Click "New User Register" button on homepage',
          '2. Enter your full name',
          '3. Enter a valid email address',
          '4. Create a strong password (8+ chars, uppercase, lowercase, number, special char)',
          '5. Confirm your password',
          '6. Click "Register" button',
          '7. You will be automatically logged in and redirected to dashboard'
        ],
        tips: [
          '💡 Make sure your email is valid - you\'ll need it to login',
          '💡 Remember your password - write it down somewhere safe',
          '💡 After registration, you can start uploading crane data'
        ]
      };
    }
    
    // Existing user related queries
    if (lowerInput.includes('existing user') || lowerInput.includes('login') || lowerInput.includes('sign in') || lowerInput.includes('already have account')) {
      return {
        type: 'steps',
        title: '🔐 How to Login (Existing User)',
        content: [
          '1. Click "Existing User Login" button on homepage',
          '2. Enter your email address',
          '3. Enter your password',
          '4. Click "Login" button',
          '5. You will be redirected to your dashboard'
        ],
        tips: [
          '💡 Use the same email you registered with',
          '💡 Password is case-sensitive',
          '💡 Click the eye icon to show/hide password',
          '💡 If you forgot password, click "Forgot Password?"'
        ]
      };
    }
    
    // Upload/Excel related queries
    if (lowerInput.includes('upload') || lowerInput.includes('excel') || lowerInput.includes('import') || lowerInput.includes('file')) {
      return {
        type: 'steps',
        title: '📁 How to Upload Excel File',
        content: [
          '1. Login to your dashboard',
          '2. Click "Excel Data Import" section',
          '3. Click "Choose File" and select your Excel file',
          '4. Make sure your Excel has these columns:',
          '   • Unit #',
          '   • Year',
          '   • Make and Model',
          '   • Ton',
          '   • Serial #',
          '   • Expiration (MM/DD/YYYY format)',
          '5. Click "Upload" button',
          '6. Review the results and confirm'
        ],
        tips: [
          '💡 Excel file should be .xlsx or .xls format',
          '💡 Date format must be MM/DD/YYYY (e.g., 12/25/2024)',
          '💡 Remove empty rows from your Excel file',
          '💡 Make sure column names match exactly'
        ]
      };
    }
    
    // Email alerts related queries
    if (lowerInput.includes('email') || lowerInput.includes('alert') || lowerInput.includes('notification') || lowerInput.includes('reminder')) {
      return {
        type: 'steps',
        title: '📧 Email Alerts System',
        content: [
          '1. System automatically checks daily at 9 AM',
          '2. You will receive emails for:',
          '   • Expired cranes (urgent)',
          '   • Cranes expiring in 7 days (high priority)',
          '   • Cranes expiring in 14 days (medium priority)',
          '   • Cranes expiring in 30 days (low priority)',
          '3. To set up email alerts:',
          '   • Go to dashboard',
          '   • Click email icon next to any crane',
          '   • Enter email address for alerts',
          '   • Save the settings'
        ],
        tips: [
          '💡 Check your spam folder if you don\'t receive emails',
          '💡 You can set different email addresses for different cranes',
          '💡 Use "Trigger Auto-Email" button to test the system'
        ]
      };
    }
    
    // Search/filter related queries
    if (lowerInput.includes('search') || lowerInput.includes('find') || lowerInput.includes('filter') || lowerInput.includes('look for')) {
      return {
        type: 'steps',
        title: '🔍 How to Search and Filter',
        content: [
          '1. In the dashboard, use the search box',
          '2. You can search by:',
          '   • Unit # (exact match gets priority)',
          '   • Make and Model',
          '   • Serial #',
          '   • Particular Date (MM/DD) or(MM/DD/YYYY)',
          '   • Ton capacity',
          '3. Use filters:',
          '   • Month filter: Enter "Jan", "Feb", or "1", "2"',
          '   • Year filter: Enter "2025", "2026"',
          '   • Status filter: Click alert numbers to filter by status'
        ],
        tips: [
          '💡 Type 3+ characters for better search results',
          '💡 Exact Unit # match shows first',
          '💡 You can combine search with filters',
          '💡 Clear filters to see all cranes again'
        ]
      };
    }
    
    // Add crane related queries
    if (lowerInput.includes('add crane') || lowerInput.includes('new crane') || lowerInput.includes('create crane')) {
      return {
        type: 'steps',
        title: '➕ How to Add New Crane',
        content: [
          '1. In the dashboard, click "➕ Add New Crane" button',
          '2. Fill in the required information:',
          '   • Unit # (unique identifier)',
          '   • Year (manufacturing year)',
          '   • Make and Model',
          '   • Ton (lifting capacity)',
          '   • Serial #',
          '   • Expiration date (DD/MM/YYYY)',
          '   • Currently In Use (Yes/No)',
          '   • Add Email for Alerts',
          '3. Click "Save" button',
          '4. The crane will appear in your dashboard'
        ],
        tips: [
          '💡 Unit # must be unique - no duplicates allowed',
          '💡 Use MM/DD/YYYY format for expiration date',
          '💡 Mark "Currently In Use" as Yes if crane is active',
          '💡 You can edit crane details later'
        ]
      };
    }
    
    // Contact/support related queries
    if (lowerInput.includes('contact') || lowerInput.includes('support') || lowerInput.includes('help') || lowerInput.includes('phone') || lowerInput.includes('email')) {
      return {
        type: 'info',
        title: '📞 Contact Support',
        content: [
          '🏢 Company: Crane Inspection Management',
          '📍 Address: 2829 Texas Ave, Texas City, TX 77590-8259',
          '📞 Phone: (409) 945-2382 - Press "3" for rentals',
          '✉️ Email: support@craneinspection.com',
          '⏰ Support Hours: Monday-Friday 8AM-5PM CST',
          '🚨 Emergency: Available 24/7 for critical issues'
        ],
        tips: [
          '💡 For technical issues, email tech-support@craneinspection.com',
          '💡 Include your browser and error details when contacting support',
          '💡 Check the troubleshooting section first'
        ]
      };
    }
    
    // Handle forgot password issues
    if (lowerInput.includes('forgot password') || lowerInput.includes('forgot') || lowerInput.includes('reset password') || lowerInput.includes('can\'t login') || lowerInput.includes('password not working')) {
      return {
        type: 'steps',
        title: '🔑 Forgot Password Help',
        content: [
          'If you forgot your password, here\'s how to reset it:',
          '',
          '1. Go to the Login page',
          '2. Click "Forgot Password?" link below the login form',
          '3. Enter your registered email address',
          '4. Check your email for reset instructions',
          '5. Follow the link in the email to create a new password',
          '6. Use your new password to login'
        ],
        tips: [
          '💡 Make sure you use the same email you registered with',
          '💡 Check your spam/junk folder if you don\'t see the email',
          '💡 The reset link expires after 24 hours',
          '💡 If you still have issues, contact support at (409) 945-2382'
        ]
      };
    }

    // Handle existing user trying to register
    if (lowerInput.includes('already registered') || lowerInput.includes('user already exists') || lowerInput.includes('email already') || lowerInput.includes('account exists') || lowerInput.includes('already have account')) {
      return {
        type: 'info',
        title: '⚠️ Account Already Exists',
        content: [
          'It looks like you already have an account with this email address.',
          '',
          'What to do:',
          '• Try logging in with your existing credentials',
          '• If you forgot your password, use "Forgot Password?" on login page',
          '• Make sure you\'re using the correct email address',
          '• Check if you registered with a different email'
        ],
        tips: [
          '💡 You can only have one account per email address',
          '💡 Try logging in first before creating a new account',
          '💡 If you\'re sure you don\'t have an account, contact support'
        ]
      };
    }

    // Handle wrong credentials
    if (lowerInput.includes('wrong password') || lowerInput.includes('incorrect password') || lowerInput.includes('invalid credentials') || lowerInput.includes('login failed') || lowerInput.includes('can\'t login') || lowerInput.includes('password incorrect')) {
      return {
        type: 'steps',
        title: '❌ Login Failed - Wrong Credentials',
        content: [
          'Your login failed. Here\'s how to fix it:',
          '',
          '1. Check your email address:',
          '   • Make sure it\'s spelled correctly',
          '   • Use the same email you registered with',
          '   • Check for typos (gmail.com vs gmial.com)',
          '',
          '2. Check your password:',
          '   • Make sure Caps Lock is off',
          '   • Password is case-sensitive',
          '   • Check for extra spaces before/after',
          '',
          '3. If still not working:',
          '   • Click "Forgot Password?" to reset',
          '   • Try registering again if you\'re not sure',
          '   • Contact support if problem persists'
        ],
        tips: [
          '💡 Most login issues are due to typos in email or password',
          '💡 Passwords are case-sensitive (A ≠ a)',
          '💡 Make sure you\'re using the correct email from registration'
        ]
      };
    }

    // Handle registration errors
    if (lowerInput.includes('registration failed') || lowerInput.includes('can\'t register') || lowerInput.includes('signup error') || lowerInput.includes('registration error') || lowerInput.includes('invalid email') || lowerInput.includes('password requirements')) {
      return {
        type: 'steps',
        title: '❌ Registration Failed - How to Fix',
        content: [
          'Registration failed. Here\'s how to fix common issues:',
          '',
          '📧 EMAIL ISSUES:',
          '• Use a valid email format: yourname@domain.com',
          '• Don\'t use spaces or special characters',
          '• Make sure the email isn\'t already registered',
          '',
          '🔒 PASSWORD REQUIREMENTS:',
          '• Must be 8+ characters long',
          '• Include uppercase letter (A-Z)',
          '• Include lowercase letter (a-z)',
          '• Include number (0-9)',
          '• Include special character (!@#$%^&*)',
          '',
          '✅ NAME REQUIREMENTS:',
          '• Enter your full name',
          '• No numbers or special characters',
          '• At least 2 characters long',
          '',
          '🔄 PASSWORD CONFIRMATION:',
          '• Both password fields must match exactly',
          '• Copy and paste to avoid typos'
        ],
        tips: [
          '💡 Example password: MyPass123!',
          '💡 Make sure both passwords are identical',
          '💡 Use a real email address you can access'
        ]
      };
    }

    // Handle expiration date questions
    if (lowerInput.includes('expiration date') || lowerInput.includes('expiry date') || lowerInput.includes('future date') || lowerInput.includes('past date') || lowerInput.includes('date format') || lowerInput.includes('update crane') || lowerInput.includes('edit crane')) {
      return {
        type: 'steps',
        title: '📅 Expiration Date Help',
        content: [
          'Here\'s everything you need to know about expiration dates:',
          '',
          '📅 DATE FORMAT:',
          '• Use format: MM/DD/YYYY',
          '• Example: 12/15/2025 (15th December 2025)',
          '• Don\'t use: 15/12/2025 or 2025-12-15',
          '',
          '⚠️ IMPORTANT RULES:',
          '• Expiration date MUST be in the FUTURE',
          '• System will reject past dates',
          '• Minimum date is tomorrow',
          '• Maximum date is 10 years from now',
          '',
          '🎨 COLOR CODING:',
          '• Red = Expired (past due date)',
          '• Orange = Expiring within 30 days',
          '• Green = OK (more than 30 days)',
          '',
          '✏️ HOW TO UPDATE:',
          '1. Click edit icon next to any crane',
          '2. Change the expiration date field',
          '3. Use MM/DD/YYYY format',
          '4. Make sure it\'s a future date',
          '5. Click Save to update',
          '6. Status will update immediately'
        ],
        tips: [
          '💡 Always use MM/DD/YYYY format',
          '💡 Future dates only - no past dates allowed',
          '💡 System automatically calculates days remaining',
          '💡 Updated status shows immediately after saving'
        ]
      };
    }

    // Handle general login/registration problems
    if (lowerInput.includes('login problem') || lowerInput.includes('registration problem') || lowerInput.includes('can\'t access') || lowerInput.includes('account issue') || lowerInput.includes('system error')) {
      return {
        type: 'info',
        title: '🆘 Login/Registration Problems',
        content: [
          'Having trouble with login or registration? Here\'s a complete troubleshooting guide:',
          '',
          '🔍 COMMON ISSUES:',
          '• Wrong email or password',
          '• Account already exists',
          '• Password doesn\'t meet requirements',
          '• Email format is invalid',
          '• Network connection problems',
          '',
          '🛠️ STEP-BY-STEP FIX:',
          '1. Double-check your email address',
          '2. Verify your password meets all requirements',
          '3. Try "Forgot Password?" if you can\'t login',
          '4. Clear your browser cache and cookies',
          '5. Try a different browser',
          '6. Check your internet connection',
          '',
          '📞 STILL NOT WORKING?',
          'Contact our support team:',
          '• Phone: (409) 945-2382',
          '• Email: support@craneinspection.com',
          '• Live chat: Click "Talk to Human Support"'
        ],
        tips: [
          '💡 90% of issues are solved by checking email/password',
          '💡 Try the "Forgot Password" option first',
          '💡 Our support team is here to help!'
        ]
      };
    }

    // Handle live chat requests
    if (lowerInput.includes('human') || lowerInput.includes('live chat') || lowerInput.includes('talk to') || lowerInput.includes('agent') || lowerInput.includes('person')) {
      return {
        type: 'live-chat',
        title: '👨‍💼 Connect with Human Support',
        content: [
          'I can connect you with our human support team!',
          'They can help with:',
          '• Complex technical issues',
          '• Account problems',
          '• Custom requirements',
          '• Emergency support'
        ],
        tips: [
          '💡 Live chat is available Monday-Friday 8AM-5PM CST',
          '💡 For urgent issues, call (409) 945-2382'
        ]
      };
    }

    // Handle delete function questions
    if (lowerInput.includes('delete') || lowerInput.includes('remove') || lowerInput.includes('delete crane') || lowerInput.includes('how to delete')) {
      return {
        type: 'steps',
        title: '🗑️ How to Delete Cranes',
        content: [
          'Here\'s how to delete cranes from your system:',
          '',
          '1. Go to Supervisor Dashboard',
          '2. Find the crane you want to delete in the table',
          '3. Click the delete icon (🗑️) next to that crane',
          '4. A confirmation dialog will appear',
          '5. The crane will be permanently removed',
          '',
          '⚠️ IMPORTANT WARNINGS:',
          '• This action cannot be undone',
          '• The crane data will be permanently deleted',
          '• Make sure you really want to delete it',
        ],
        tips: [
          '💡 Deleted cranes cannot be recovered',
          '💡 Consider editing instead of deleting if you just need to update info'
        ]
      };
    }

    // Handle add function questions
    if (lowerInput.includes('add') || lowerInput.includes('add crane') || lowerInput.includes('new crane') || lowerInput.includes('how to add') || lowerInput.includes('create crane')) {
      return {
        type: 'steps',
        title: '➕ How to Add New Cranes',
        content: [
          'Here\'s how to add new cranes to your system:',
          '',
          'METHOD 1 - Manual Entry:',
          '1. Go to Supervisor Dashboard',
          '2. Click "➕ Add New Crane" button',
          '3. A new tab will open with the crane form',
          '4. Fill in all required fields:',
          '   • Unit # (e.g., C-210)',
          '   • Year (e.g., 2018)',
          '   • Make and Model (e.g., TADANO GR1600XL-3)',
          '   • Ton (e.g., 160 TON)',
          '   • Serial # (e.g., FE5144)',
          '   • Expiration Date (MM/DD/YYYY format)',
          '5. Click "Save" to add the crane',
          '6. The crane will appear in your dashboard',
          '',
          'METHOD 2 - Excel Upload:',
          '1. Click "📁 Excel Data Import" to expand',
          '2. Click "Choose File" and select your Excel file',
          '3. Make sure Excel has correct columns',
          '4. Click "Upload" to import all cranes at once'
        ],
        tips: [
          '💡 Manual entry is good for single cranes',
          '💡 Excel upload is better for multiple cranes',
          '💡 Expiration date must be in MM/DD/YYYY format',
          '💡 All fields are required'
        ]
      };
    }

    // Handle edit function questions
    if (lowerInput.includes('edit') || lowerInput.includes('edit crane') || lowerInput.includes('update') || lowerInput.includes('modify') || lowerInput.includes('change crane') || lowerInput.includes('how to edit')) {
      return {
        type: 'steps',
        title: '✏️ How to Edit Cranes',
        content: [
          'Here\'s how to edit existing crane information:',
          '',
          '1. Go to Supervisor Dashboard',
          '2. Find the crane you want to edit in the table',
          '3. Click the edit icon (✏️) next to that crane',
          '4. A new tab will open with the crane form',
          '5. Make your changes to any field:',
          '   • Unit # - Change the crane identifier',
          '   • Year - Update the manufacturing year',
          '   • Make and Model - Modify the crane model',
          '   • Ton - Change the tonnage capacity',
          '   • Serial # - Update the serial number',
          '   • Expiration Date - Change the inspection date',
          '6. Click "Save" to update the crane',
          '7. Changes will appear immediately in the dashboard',
          '',
          '📅 EXPIRATION DATE RULES:',
          '• Must be in MM/DD/YYYY format',
          '• Must be a future date (not past)',
          '• System will reject invalid dates',
          '• Status will update automatically after saving'
        ],
        tips: [
          '💡 All fields can be edited except the ID',
          '💡 Expiration date must be in the future',
          '💡 Changes are saved immediately',
          '💡 Status colors update automatically'
        ]
      };
    }

    // Handle search function questions
    if (lowerInput.includes('search') || lowerInput.includes('find') || lowerInput.includes('filter') || lowerInput.includes('look for') || lowerInput.includes('how to search')) {
      return {
        type: 'steps',
        title: '🔍 How to Search and Filter Cranes',
        content: [
          'Here\'s how to search and filter your crane data:',
          '',
          '🔍 SEARCH BOX:',
          '1. Use the search box at the top of the table',
          '2. Type any of these to find cranes:',
          '   • Unit # (e.g., "C-210")',
          '   • Year (e.g., "2018")',
          '   • Model (e.g., "TADANO")',
          '   • Serial # (e.g., "FE5144")',
          '3. Results will filter as you type',
          '',
          '📅 MONTH FILTER:',
          '1. Enter month in the Month filter box',
          '2. Use formats like:',
          '   • "Jan", "Feb", "Mar" (month names)',
          '   • "1", "2", "3" (month numbers)',
          '3. Shows cranes expiring in that month',
          '',
          '📆 YEAR FILTER:',
          '1. Enter year in the Year filter box',
          '2. Use format: "2025", "2026", etc.',
          '3. Shows cranes expiring in that year',
          '',
          '🚨 STATUS FILTER:',
          '1. Click the colored alert numbers at the top',
          '2. Red number = Show only expired cranes',
          '3. Orange number = Show only expiring soon',
          '4. Green number = Show only OK cranes'
        ],
        tips: [
          '💡 Search works across all text fields',
          '💡 Filters can be combined for precise results',
          '💡 Click alert numbers to filter by status',
          '💡 Clear filters to see all cranes again'
        ]
      };
    }
    
    // Handle specific questions that don't match categories
    if (lowerInput.includes('login button') || lowerInput.includes('where is login') || lowerInput.includes('find login')) {
      return {
        type: 'direct',
        title: '🔍 Login Button Location',
        content: [
          'The login button is on the homepage.',
          'Look for the green button that says "Existing User Login"',
          'It\'s located in the main button area on the homepage',
          'If you can\'t see it, scroll up to the top of the page'
        ],
        tips: [
          '💡 The button is green and says "Existing User Login"',
          '💡 It\'s next to the "New User Register" button'
        ]
      };
    }
    
    // Handle "where it is" or similar vague questions
    if (lowerInput.includes('where it is') || lowerInput.includes('where is it') || lowerInput.includes('where') || lowerInput.includes('location')) {
      return {
        type: 'direct',
        title: '📍 What are you looking for?',
        content: [
          'I can help you find:',
          '• Login button (green "Existing User Login" button on homepage)',
          '• Register button (blue "New User Register" button on homepage)',
          '• Dashboard (after you login)',
          '• Upload area (in dashboard under "Excel Data Import")',
          '• Search box (in dashboard)',
          '• Help button (this chat - bottom right corner)'
        ],
        tips: [
          '💡 Be more specific about what you\'re looking for',
          '💡 Tell me what you want to do and I\'ll guide you'
        ]
      };
    }
    
    if (lowerInput.includes('register button') || lowerInput.includes('where is register') || lowerInput.includes('find register')) {
      return {
        type: 'direct',
        title: '🔍 Register Button Location',
        content: [
          'The register button is on the homepage.',
          'Look for the blue button that says "New User Register"',
          'It\'s located in the main button area on the homepage',
          'If you can\'t see it, scroll up to the top of the page'
        ],
        tips: [
          '💡 The button is blue and says "New User Register"',
          '💡 It\'s next to the "Existing User Login" button'
        ]
      };
    }
    
    if (lowerInput.includes('dashboard') || lowerInput.includes('where is dashboard') || lowerInput.includes('access dashboard')) {
      return {
        type: 'direct',
        title: '📊 Dashboard Access',
        content: [
          'To access the dashboard:',
          '1. First login with your email and password',
          '2. After successful login, you\'ll be automatically redirected to the dashboard',
          '3. The dashboard shows all your crane data and management tools'
        ],
        tips: [
          '💡 You must login first to access the dashboard',
          '💡 Dashboard is only available for registered users'
        ]
      };
    }
    
    if (lowerInput.includes('forgot password') || lowerInput.includes('reset password') || lowerInput.includes('lost password')) {
      return {
        type: 'direct',
        title: '🔑 Forgot Password Help',
        content: [
          'To reset your password:',
          '1. Go to the login page',
          '2. Click "Forgot Password?" link below the login button',
          '3. Enter your email address',
          '4. Check your email for reset instructions',
          '5. Follow the link in the email to create a new password'
        ],
        tips: [
          '💡 Use the same email you registered with',
          '💡 Check your spam folder if you don\'t receive the email'
        ]
      };
    }
    
    if (lowerInput.includes('error') || lowerInput.includes('not working') || lowerInput.includes('problem') || lowerInput.includes('issue')) {
      return {
        type: 'direct',
        title: '🛠️ Troubleshooting Help',
        content: [
          'Common solutions:',
          '• Refresh the page (F5 or Ctrl+R)',
          '• Clear your browser cache',
          '• Check your internet connection',
          '• Try a different browser',
          '• Make sure JavaScript is enabled'
        ],
        tips: [
          '💡 If the problem persists, contact support',
          '💡 Include details about what you were trying to do'
        ]
      };
    }
    
    // Handle common user needs and questions
    if (lowerInput.includes('start') || lowerInput.includes('begin') || lowerInput.includes('first time') || lowerInput.includes('new here')) {
      return {
        type: 'direct',
        title: '🚀 Getting Started',
        content: [
          'Welcome! Here\'s how to get started:',
          '1. If you\'re new: Click "New User Register" (blue button on homepage)',
          '2. If you have an account: Click "Existing User Login" (green button on homepage)',
          '3. After login: You\'ll see your dashboard with all crane management tools',
          '4. Upload your crane data: Use "Excel Data Import" in dashboard'
        ],
        tips: [
          '💡 Registration is free and takes 2 minutes',
          '💡 You can upload crane data immediately after registration'
        ]
      };
    }
    
    if (lowerInput.includes('upload') || lowerInput.includes('excel') || lowerInput.includes('data') || lowerInput.includes('import')) {
      return {
        type: 'direct',
        title: '📁 Uploading Crane Data',
        content: [
          'To upload your crane data:',
          '1. Login to your dashboard',
          '2. Look for "Excel Data Import" section',
          '3. Click to expand it',
          '4. Choose your Excel file (.xlsx or .xls)',
          '5. Make sure your Excel has these columns: Unit #, Year, Make and Model, Ton, Serial #, Expiration',
          '6. Click Upload and review results'
        ],
        tips: [
          '💡 Date format must be MM/DD/YYYY (like 12/25/2024)',
          '💡 Remove empty rows from your Excel file first'
        ]
      };
    }
    
    if (lowerInput.includes('crane') || lowerInput.includes('inspection') || lowerInput.includes('expire') || lowerInput.includes('track')) {
      return {
        type: 'direct',
        title: '🏗️ Crane Management',
        content: [
          'This system helps you manage crane inspections:',
          '• Track expiration dates automatically',
          '• Get email alerts before cranes expire',
          '• Search and filter your crane data',
          '• Print reports and export data',
          '• Add new cranes manually or via Excel'
        ],
        tips: [
          '💡 System checks daily at 9 AM for expiring cranes',
          '💡 Red = expired, Orange = expiring soon, Green = OK'
        ]
      };
    }
    
    if (lowerInput.includes('email') || lowerInput.includes('alert') || lowerInput.includes('notification')) {
      return {
        type: 'direct',
        title: '📧 Email Alerts',
        content: [
          'Email alerts work automatically:',
          '• System checks daily at 9 AM',
          '• You get emails for: Expired cranes, 7-day warnings, 14-day warnings, 30-day warnings',
          '• To set up: Go to dashboard, click email icon next to any crane',
          '• Enter the email address where you want to receive alerts'
        ],
        tips: [
          '💡 Check your spam folder if you don\'t receive emails',
          '💡 You can set different emails for different cranes'
        ]
      };
    }
    
    if (lowerInput.includes('search') || lowerInput.includes('find') || lowerInput.includes('look for')) {
      return {
        type: 'direct',
        title: '🔍 Finding Cranes',
        content: [
          'To find specific cranes:',
          '• Use the search box in dashboard',
          '• Search by: Unit #, Model, Serial #, Year',
          '• Use filters: Month (Jan, Feb, 1, 2) or Year (2025, 2026)',
          '• Click alert numbers to filter by status (expired, expiring, OK)'
        ],
        tips: [
          '💡 Exact Unit # match shows first in results',
          '💡 Type 3+ characters for better search results'
        ]
      };
    }
    
    if (lowerInput.includes('problem') || lowerInput.includes('error') || lowerInput.includes('not working') || lowerInput.includes('issue')) {
      return {
        type: 'direct',
        title: '🛠️ Quick Fixes',
        content: [
          'Try these quick solutions:',
          '• Refresh the page (F5)',
          '• Clear browser cache',
          '• Check internet connection',
          '• Try different browser',
          '• Make sure JavaScript is enabled'
        ],
        tips: [
          '💡 Most issues are fixed by refreshing the page',
          '💡 Contact support if problem continues'
        ]
      };
    }
    
    // Default response for unrecognized input - more helpful
    return {
      type: 'direct',
      title: '🤔 Tell me what you want to do',
      content: [
        'I can help you with:',
        '• Getting started (register/login)',
        '• Uploading crane data',
        '• Finding specific cranes',
        '• Setting up email alerts',
        '• Managing inspections',
        '• Troubleshooting problems'
      ],
      tips: [
        '💡 Be specific: "I want to upload my crane data"',
        '💡 Or ask: "How do I find a specific crane?"'
      ]
    };
  };

  const handleSendMessage = (customInput = null) => {
    const inputText = customInput || userInput;
    if (!inputText.trim()) return;
    
    // Add user message to chat
    const userMessage = { type: 'user', text: inputText };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate typing delay
    setTimeout(() => {
      const response = getHelpResponse(inputText);
      const botMessage = { type: 'bot', response };
      setChatHistory(prev => [...prev, botMessage]);
      setIsTyping(false);
      setUserInput('');
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setUserInput('');
  };

  const openLiveChat = () => {
    // Open Tawk.to live chat
    if (window.Tawk_API) {
      window.Tawk_API.showWidget();
    } else {
      // Fallback: show instructions to contact support
      alert('Live chat is loading... Please contact us at (409) 945-2382 or support@craneinspection.com');
    }
  };

  const handleLiveChatRequest = () => {
    const liveChatMessage = {
      type: 'bot',
      response: {
        type: 'direct',
        title: '👨‍💼 Connect with Human Support',
        content: [
          'I can connect you with our human support team!',
          'They can help with:',
          '• Complex technical issues',
          '• Account problems',
          '• Custom requirements',
          '• Emergency support'
        ],
        tips: [
          '💡 Live chat is available Monday-Friday 8AM-5PM CST',
          '💡 For urgent issues, call (409) 945-2382'
        ]
      }
    };
    
    setChatHistory(prev => [...prev, liveChatMessage]);
    setIsTyping(true);
    
    setTimeout(() => {
      const connectMessage = {
        type: 'bot',
        response: {
          type: 'direct',
          title: '🔗 Connecting to Live Chat...',
          content: [
            'Opening live chat with our support team...',
            'If the chat doesn\'t open automatically, please:',
            '• Call us at (409) 945-2382',
            '• Email us at support@craneinspection.com',
            '• Try refreshing the page'
          ],
          tips: [
            '💡 Our team will respond within 2 minutes during business hours',
            '💡 Please describe your issue clearly for faster help'
          ]
        }
      };
      setChatHistory(prev => [...prev, connectMessage]);
      setIsTyping(false);
      
      // Open live chat after showing the message
      setTimeout(() => {
        openLiveChat();
      }, 1000);
    }, 1500);
  };

  return (
    <>
      {/* Floating Help Button */}
      <button 
        className="interactive-help-button"
        onClick={() => setShowHelp(true)}
        title="Ask for Help"
      >
        💬 Help
      </button>

      {/* Help Chat Modal */}
      {showHelp && (
        <div 
          className="interactive-help-modal"
          style={{ width: `${panelWidth}%` }}
        >
          <div className="resize-handle" onMouseDown={handleMouseDown}>
            <div className="resize-grip"></div>
          </div>
          <div className="help-chat-container">
            <div className="chat-header">
              <h3>💬 Interactive Help</h3>
              <div className="chat-controls">
                <button onClick={clearChat} className="clear-btn" title="Clear Chat">
                  🗑️
                </button>
                <button onClick={() => setShowHelp(false)} className="close-btn" title="Close">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="chat-messages">
              {chatHistory.length === 0 && (
                <div className="welcome-message">
                  <p>👋 Hi! I'm here to help you with the Crane Management System.</p>
                  <p>I'll show you help specific to this page, or you can ask me anything:</p>
                  
                  {/* Show contextual help based on current page */}
                  <div className="contextual-help">
                    <h4>{getContextualHelp().title}</h4>
                    <div className="contextual-content">
                      {getContextualHelp().content.map((line, index) => (
                        <p key={index} className={line === '' ? 'spacer' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                    {getContextualHelp().tips && (
                      <div className="contextual-tips">
                        {getContextualHelp().tips.map((tip, index) => (
                          <p key={index}>{tip}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="suggestion-buttons">
                    {getContextualHelp().showOnlyRelevant ? (
                      // Show only relevant buttons based on context
                      <>
                        {getContextualHelp().relevantButtons?.includes('register') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to register as new user")}
                          >
                            📝 How to register as new user
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('login') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to login")}
                          >
                            🔐 How to login
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('forgot_password') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("Forgot password")}
                          >
                            🔑 Forgot password
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('wrong_password') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("Wrong password")}
                          >
                            ❌ Wrong password
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('account_exists') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("Account already exists")}
                          >
                            ⚠️ Account already exists
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('upload') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to upload Excel file")}
                          >
                            📁 How to upload Excel file
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('email_alerts') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to set up email alerts")}
                          >
                            📧 How to set up email alerts
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('expiration_date') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("Expiration date")}
                          >
                            📅 Expiration date
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('add_crane') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to add crane")}
                          >
                            ➕ Add crane
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('edit_crane') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to edit crane")}
                          >
                            ✏️ Edit crane
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('delete_crane') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to delete crane")}
                          >
                            🗑️ Delete crane
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('search_crane') && (
                          <button 
                            className="suggestion-btn"
                            onClick={() => handleSendMessage("How to search crane")}
                          >
                            🔍 Search crane
                          </button>
                        )}
                        {getContextualHelp().relevantButtons?.includes('live_chat') && (
                          <button 
                            className="suggestion-btn live-chat-btn"
                            onClick={handleLiveChatRequest}
                          >
                            👨‍💼 Talk to Human Support
                          </button>
                        )}
                      </>
                    ) : (
                      // Show all buttons for general pages
                      <>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to register as new user")}
                        >
                          📝 How to register as new user
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to login")}
                        >
                          🔐 How to login
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("Forgot password")}
                        >
                          🔑 Forgot password
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("Wrong password")}
                        >
                          ❌ Wrong password
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("Account already exists")}
                        >
                          ⚠️ Account already exists
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to upload Excel file")}
                        >
                          📁 How to upload Excel file
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to set up email alerts")}
                        >
                          📧 How to set up email alerts
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("Expiration date")}
                        >
                          📅 Expiration date
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to add crane")}
                        >
                          ➕ Add crane
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to edit crane")}
                        >
                          ✏️ Edit crane
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to delete crane")}
                        >
                          🗑️ Delete crane
                        </button>
                        <button 
                          className="suggestion-btn"
                          onClick={() => handleSendMessage("How to search crane")}
                        >
                          🔍 Search crane
                        </button>
                        <button 
                          className="suggestion-btn live-chat-btn"
                          onClick={handleLiveChatRequest}
                        >
                          👨‍💼 Talk to Human Support
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {chatHistory.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  {message.type === 'user' ? (
                    <div className="user-message">
                      <span className="message-text">{message.text}</span>
                    </div>
                  ) : (
                    <div className="bot-message">
                      <div className="bot-avatar">🤖</div>
                      <div className="bot-content">
                        <h4>{message.response.title}</h4>
                        {message.response.type === 'steps' && (
                          <ol className="steps-list">
                            {message.response.content.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        )}
                        {message.response.type === 'info' && (
                          <ul className="info-list">
                            {message.response.content.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {message.response.type === 'direct' && (
                          <ul className="direct-list">
                            {message.response.content.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {message.response.type === 'live-chat' && (
                          <div className="live-chat-response">
                            <ul className="direct-list">
                              {message.response.content.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                            <button 
                              className="connect-live-chat-btn"
                              onClick={openLiveChat}
                            >
                              🔗 Connect to Live Chat Now
                            </button>
                          </div>
                        )}
                        {message.response.type === 'suggestions' && (
                          <ul className="suggestions-list">
                            {message.response.content.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        )}
                        {message.response.tips && (
                          <div className="tips-section">
                            <h5>💡 Tips:</h5>
                            <ul>
                              {message.response.tips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="message bot">
                  <div className="bot-message">
                    <div className="bot-avatar">🤖</div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything... (e.g., 'How to register as new user?')"
                className="message-input"
              />
              <button onClick={handleSendMessage} className="send-btn" disabled={!userInput.trim()}>
                📤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
