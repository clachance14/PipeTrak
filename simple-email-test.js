#!/usr/bin/env node

// Simple email test without external dependencies
const https = require('https');
const fs = require('fs');

// Read environment variables from .env.local
function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const lines = envContent.split('\n');
        const env = {};
        
        lines.forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    // Handle values with quotes
                    let value = valueParts.join('=').trim();
                    if ((value.startsWith('"') && value.endsWith('"')) || 
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    env[key.trim()] = value;
                }
            }
        });
        
        return env;
    } catch (error) {
        console.error('❌ Could not read .env.local:', error.message);
        return {};
    }
}

function sendTestEmail(apiKey, toEmail) {
    return new Promise((resolve, reject) => {
        const emailData = JSON.stringify({
            from: "onboarding@resend.dev",
            to: toEmail,
            subject: "PipeTrak Email Delivery Test",
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333;">🔧 PipeTrak Email Delivery Test</h2>
                    <p>This is a test email to verify email delivery is working correctly.</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <strong>Test Details:</strong><br>
                        📧 From: onboarding@resend.dev<br>
                        📧 To: ${toEmail}<br>
                        🕒 Time: ${new Date().toISOString()}<br>
                        🔧 App: PipeTrak
                    </div>
                    <p style="color: #666;">If you receive this email, delivery is working correctly!</p>
                    <p style="color: #666; font-size: 12px;">This is an automated test email.</p>
                </div>
            `
        });

        const options = {
            hostname: 'api.resend.com',
            port: 443,
            path: '/emails',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(emailData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const responseData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(emailData);
        req.end();
    });
}

async function checkEmailStatus(apiKey, emailId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.resend.com',
            port: 443,
            path: `/emails/${emailId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const responseData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: responseData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function main() {
    console.log('🔍 PipeTrak Email Delivery Test');
    console.log('================================\n');

    const testEmail = process.argv[2];
    
    if (!testEmail) {
        console.log('❌ Usage: node simple-email-test.js <email-address>');
        console.log('Example: node simple-email-test.js test@gmail.com');
        process.exit(1);
    }

    // Load environment variables
    const env = loadEnv();
    const apiKey = env.RESEND_API_KEY;

    if (!apiKey) {
        console.error('❌ RESEND_API_KEY not found in .env.local');
        console.log('\nPlease make sure your .env.local file contains:');
        console.log('RESEND_API_KEY="your-api-key-here"');
        process.exit(1);
    }

    console.log('📧 Configuration:');
    console.log(`   From: onboarding@resend.dev`);
    console.log(`   To: ${testEmail}`);
    console.log(`   API Key: ${apiKey.substring(0, 10)}...`);
    console.log('');

    try {
        console.log('🚀 Sending test email...');
        const response = await sendTestEmail(apiKey, testEmail);
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data.id) {
            console.log('\n✅ Email sent successfully!');
            console.log(`📧 Email ID: ${response.data.id}`);
            
            // Wait and check status
            console.log('\n⏳ Waiting 3 seconds before checking status...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
                const statusResponse = await checkEmailStatus(apiKey, response.data.id);
                console.log('\n📊 Email Status Check:');
                console.log(`   Status Code: ${statusResponse.status}`);
                console.log('   Status Data:', JSON.stringify(statusResponse.data, null, 2));
            } catch (statusError) {
                console.log('\n⚠️  Could not check email status:', statusError.message);
            }
            
            console.log('\n🎯 Next Steps:');
            console.log('1. Check your email inbox (including spam folder)');
            console.log('2. Visit Resend dashboard: https://resend.com/emails');
            console.log('3. Look for the email ID above in your dashboard');
            console.log('4. Check delivery logs for any bounce or failure messages');
            
        } else {
            console.log('\n❌ Email sending failed!');
            console.log('Check the response above for error details.');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();