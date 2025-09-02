const cron = require('node-cron');
const Crane = require('../models/Crane');
const nodemailer = require('nodemailer');

// Helper function to convert Excel date
const convertExcelDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    let date;
    if (typeof dateValue === 'number' && dateValue > 1000) {
      // Excel serial number
      date = new Date((dateValue - 25569) * 86400 * 1000);
    } else if (typeof dateValue === 'string') {
      if (/^\d{5,}$/.test(dateValue)) {
        // String Excel serial number
        date = new Date((parseInt(dateValue) - 25569) * 86400 * 1000);
      } else if (dateValue.includes('/')) {
        // DD/MM/YYYY format
        const parts = dateValue.split('/');
        if (parts.length === 3) {
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }
    
    return date;
  } catch (error) {
    console.error("Date conversion error:", error);
    return null;
  }
};

// Function to send email alert
const sendEmailAlert = async (crane, alertType, urgency, diffDays) => {
  try {
    // Create email transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Create email content
    const subject = `🚨 CRANE ALERT: ${alertType} - ${crane["Unit #"]}`;
    
    let urgencyEmoji = '';
    switch (urgency) {
      case 'URGENT': urgencyEmoji = '🔴'; break;
      case 'HIGH': urgencyEmoji = '🟠'; break;
      case 'MEDIUM': urgencyEmoji = '🟡'; break;
      case 'LOW': urgencyEmoji = '🟢'; break;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #e74c3c; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${urgencyEmoji} CRANE EXPIRATION ALERT</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #2c3e50; margin-top: 0;">Alert Details</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #e74c3c;">
            <h3 style="margin: 0 0 10px 0; color: #e74c3c;">${alertType}</h3>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Priority:</strong> ${urgency}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Days until expiration:</strong> ${diffDays}</p>
          </div>
          
          <h3 style="color: #2c3e50;">Crane Information</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background: #ecf0f1;">
              <td style="padding: 10px; border: 1px solid #bdc3c7; font-weight: bold;">Unit #</td>
              <td style="padding: 10px; border: 1px solid #bdc3c7;">${crane["Unit #"]}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #bdc3c7; font-weight: bold;">Make & Model</td>
              <td style="padding: 10px; border: 1px solid #bdc3c7;">${crane["Make and Model"]}</td>
            </tr>
            <tr style="background: #ecf0f1;">
              <td style="padding: 10px; border: 1px solid #bdc3c7; font-weight: bold;">Serial #</td>
              <td style="padding: 10px; border: 1px solid #bdc3c7;">${crane["Serial #"] || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #bdc3c7; font-weight: bold;">Year</td>
              <td style="padding: 10px; border: 1px solid #bdc3c7;">${crane["Year"] || 'N/A'}</td>
            </tr>
            <tr style="background: #ecf0f1;">
              <td style="padding: 10px; border: 1px solid #bdc3c7; font-weight: bold;">Expiration Date</td>
              <td style="padding: 10px; border: 1px solid #bdc3c7; color: #e74c3c; font-weight: bold;">${crane["Expiration"]}</td>
            </tr>
          </table>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Action Required</h4>
            <p style="margin: 0; color: #856404;">
              This crane requires immediate attention. Please review the expiration status and take necessary action.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #7f8c8d; font-size: 14px;">
              This is an automated alert from the Crane Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
CRANE EXPIRATION ALERT
======================

Alert Type: ${alertType}
Priority: ${urgency}
Days until expiration: ${diffDays}

Crane Information:
- Unit #: ${crane["Unit #"]}
- Make & Model: ${crane["Make and Model"]}
- Serial #: ${crane["Serial #"] || 'N/A'}
- Year: ${crane["Year"] || 'N/A'}
- Expiration Date: ${crane["Expiration"]}

⚠️ ACTION REQUIRED: This crane requires immediate attention. Please review the expiration status and take necessary action.

This is an automated alert from the Crane Management System.
Please do not reply to this email.
    `;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: crane.alertEmail,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${crane.alertEmail}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${crane.alertEmail}:`, error);
    return false;
  }
};

// Function to check expiration and send alerts
const checkExpirationsAndSendAlerts = async () => {
  try {
    console.log('🔍 Auto-email service: Checking crane expirations...');
    
    // Get all cranes with configured emails
    console.log('🔍 Auto-email service: Querying database for cranes with emails...');
    
    const cranesWithEmails = await Crane.find({ 
      alertEmail: { $exists: true, $ne: "" },
      active: true 
    });
    
    console.log(`📊 Auto-email service: Found ${cranesWithEmails.length} cranes with emails`);
    
    if (cranesWithEmails.length === 0) {
      console.log('📧 Auto-email service: No cranes with configured emails found');
      
      // Debug: Check what's in the database
      const allCranes = await Crane.find({ active: true }).limit(5);
      console.log('🔍 Sample cranes from database:');
      allCranes.forEach(crane => {
        console.log(`   Unit #: ${crane["Unit #"]}, alertEmail: ${crane.alertEmail || 'undefined'}`);
      });
      
      return;
    }
    
    // Debug: Show found cranes with emails
    console.log('📧 Cranes with configured emails:');
    cranesWithEmails.forEach(crane => {
      console.log(`   Unit #: ${crane["Unit #"]}, Email: ${crane.alertEmail}`);
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let alertsSent = 0;
    let errors = 0;
    
    for (const crane of cranesWithEmails) {
      try {
        const expirationDate = convertExcelDate(crane["Expiration"]);
        if (!expirationDate || isNaN(expirationDate.getTime())) {
          console.log(`⚠️ Auto-email service: Invalid expiration date for crane ${crane["Unit #"]}`);
          continue;
        }
        
        expirationDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send alerts for expired or expiring soon cranes
        if (diffDays <= 30) {
          let alertType = '';
          let urgency = '';
          
          if (diffDays < 0) {
            alertType = 'EXPIRED';
            urgency = 'URGENT';
          } else if (diffDays <= 7) {
            alertType = 'EXPIRING THIS WEEK';
            urgency = 'HIGH';
          } else if (diffDays <= 14) {
            alertType = 'EXPIRING IN 2 WEEKS';
            urgency = 'MEDIUM';
          } else {
            alertType = 'EXPIRING THIS MONTH';
            urgency = 'LOW';
          }
          
          // Send actual email alert
          console.log(`📧 Auto-email service: Sending ${alertType} alert to ${crane.alertEmail} for crane ${crane["Unit #"]}`);
          console.log(`   Days until expiration: ${diffDays}`);
          console.log(`   Make & Model: ${crane["Make and Model"]}`);
          console.log(`   Expiration Date: ${crane["Expiration"]}`);
          
          const emailSent = await sendEmailAlert(crane, alertType, urgency, diffDays);
          if (emailSent) {
            alertsSent++;
          } else {
            errors++;
          }
        }
      } catch (error) {
        console.error(`❌ Auto-email service: Error processing crane ${crane["Unit #"]}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Auto-email service: Completed! Alerts sent: ${alertsSent}, Errors: ${errors}`);
    
    return {
      success: true,
      alertsSent: alertsSent,
      errors: errors,
      totalProcessed: cranesWithEmails.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Auto-email service: Critical error:', error);
    return {
      success: false,
      error: error.message,
      alertsSent: 0,
      errors: 1,
      totalProcessed: 0,
      timestamp: new Date().toISOString()
    };
  }
};

// Start the auto-email service
const startAutoEmailService = () => {
  console.log('🚀 Starting auto-email service...');
  
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Auto-email service: Daily check triggered');
    checkExpirationsAndSendAlerts();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  // Also run every hour for critical alerts (optional)
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Auto-email service: Hourly check triggered');
    checkExpirationsAndSendAlerts();
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('✅ Auto-email service: Scheduled tasks created');
  console.log('   - Daily check: 9:00 AM UTC');
  console.log('   - Hourly check: Every hour');
};

// Manual trigger function (for testing)
const triggerManualCheck = async () => {
  console.log('🔧 Auto-email service: Manual check triggered');
  const result = await checkExpirationsAndSendAlerts();
  return result;
};

module.exports = {
  startAutoEmailService,
  triggerManualCheck,
  checkExpirationsAndSendAlerts
};
