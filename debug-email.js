#!/usr/bin/env node

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testResendAPI(toEmail) {
    console.log('🔍 Testing Resend API...');
    console.log(`📧 From: onboarding@resend.dev`);
    console.log(`📧 To: ${toEmail}`);
    console.log(`🔑 API Key: ${process.env.RESEND_API_KEY ? 'Set' : 'Missing'}`);
    console.log('');

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "onboarding@resend.dev",
                to: toEmail,
                subject: "PipeTrak Email Delivery Test",
                html: `
                    <h2>Email Delivery Test</h2>
                    <p>This is a test email from PipeTrak to verify email delivery.</p>
                    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                    <p><strong>From:</strong> onboarding@resend.dev</p>
                    <p><strong>To:</strong> ${toEmail}</p>
                    <p>If you receive this email, delivery is working correctly.</p>
                `,
                text: `Email Delivery Test\n\nThis is a test email from PipeTrak to verify email delivery.\nTime: ${new Date().toISOString()}\nFrom: onboarding@resend.dev\nTo: ${toEmail}\n\nIf you receive this email, delivery is working correctly.`
            }),
        });

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Headers:', Object.fromEntries(response.headers));
        
        const responseData = await response.json();
        console.log('📊 Response Data:', JSON.stringify(responseData, null, 2));

        if (response.ok) {
            console.log('✅ Email sent successfully!');
            console.log(`📧 Email ID: ${responseData.id}`);
            console.log('');
            console.log('🔍 Next steps:');
            console.log('1. Check your inbox (and spam folder)');
            console.log('2. Check Resend dashboard: https://resend.com/emails');
            console.log('3. Look for delivery logs in Resend dashboard');
            
            return responseData;
        } else {
            console.log('❌ Email sending failed!');
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

async function checkResendStatus(emailId) {
    console.log(`\n🔍 Checking email status for ID: ${emailId}`);
    
    try {
        const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
        });

        const statusData = await response.json();
        console.log('📊 Email Status:', JSON.stringify(statusData, null, 2));
        
        return statusData;
    } catch (error) {
        console.error('❌ Status check failed:', error.message);
    }
}

// Main execution
async function main() {
    const testEmail = process.argv[2];
    
    if (!testEmail) {
        console.log('Usage: node debug-email.js <email-address>');
        console.log('Example: node debug-email.js test@gmail.com');
        process.exit(1);
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not found in environment variables');
        process.exit(1);
    }

    try {
        const result = await testResendAPI(testEmail);
        
        // Wait a moment then check status
        if (result && result.id) {
            console.log('\n⏳ Waiting 3 seconds before checking status...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await checkResendStatus(result.id);
        }
        
        console.log('\n🎯 Debugging Tips:');
        console.log('1. Check your email spam/junk folder');
        console.log('2. Try a different email provider (Gmail, Yahoo, Outlook)');
        console.log('3. Check Resend dashboard for bounce/delivery logs');
        console.log('4. Verify the recipient email is valid');
        console.log('5. Consider domain reputation issues');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();