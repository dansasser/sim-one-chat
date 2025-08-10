import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  try {
    // Clear the session cookie
    cookies.delete('session', {
      path: '/'
    });

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Logged out successfully',
      redirectUrl: '/'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'An unexpected error occurred during logout'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Also support GET requests for simple logout links
export const GET: APIRoute = async ({ cookies, redirect }) => {
  try {
    // Clear the session cookie
    cookies.delete('session', {
      path: '/'
    });

    // Redirect to home page
    return redirect('/', 302);

  } catch (error) {
    console.error('Logout error:', error);
    return redirect('/', 302);
  }
};

