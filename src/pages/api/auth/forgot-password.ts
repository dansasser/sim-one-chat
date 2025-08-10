import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const formData = await request.formData();
    const email = formData.get('email') as string;

    // Validate input
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email address is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Please enter a valid email address'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if user exists
    const userExists = await checkUserExists(email);
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!userExists) {
      console.log(`Password reset requested for non-existent email: ${email}`);
    } else {
      // Generate reset token and send email
      const resetToken = await generateResetToken(email);
      await sendPasswordResetEmail(email, resetToken);
    }

    // Always return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// TODO: Replace with actual user service
async function checkUserExists(email: string): Promise<boolean> {
  // This would normally check your user database
  // For development, simulate that some users exist
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // For demo purposes, assume user exists if email contains "test"
  return email.toLowerCase().includes('test');
}

// TODO: Replace with actual token service
async function generateResetToken(email: string): Promise<string> {
  // This would normally:
  // 1. Generate a secure random token
  // 2. Store it in the database with expiration (1 hour)
  // 3. Associate it with the user's email
  
  const tokenData = {
    email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    used: false
  };
  
  // For development, create a simple token
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  
  console.log(`Reset token generated for ${email}: ${token}`);
  
  return token;
}

// TODO: Replace with actual email service
async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  // This would normally send an email via your email service
  // with a link like: https://yourapp.com/reset-password?token=${token}
  
  const resetLink = `${process.env.SITE_URL || 'http://localhost:4321'}/reset-password?token=${encodeURIComponent(token)}`;
  
  console.log(`Password reset email would be sent to ${email}`);
  console.log(`Reset link: ${resetLink}`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In production, you would use a service like:
  // - SendGrid
  // - AWS SES
  // - Mailgun
  // - Resend
  // etc.
}

