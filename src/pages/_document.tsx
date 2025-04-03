import { Html, Head, Main, NextScript } from 'next/document';
import Document from 'next/document';

// Theme initialization script to prevent flicker by reading cookie
const themeInitializerScript = `
(function() {
  try {
    const themeCookieKey = 'app-theme='; // Key to look for in document.cookie
    const themeValues = ['light', 'dark', 'system'];
    let theme = 'system'; // Default theme for new users or if cookie is invalid

    // Function to parse cookies
    const cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.startsWith(themeCookieKey)) {
        const cookieValue = cookie.substring(themeCookieKey.length, cookie.length);
        // Validate the cookie value
        if (themeValues.includes(cookieValue)) {
          theme = cookieValue;
        }
        break; // Found the cookie, no need to check further
      }
    }

    // Determine the actual class based on the resolved theme
    let className = '';
    if (theme === 'system') {
      // Check system preference if theme is 'system' or default
      className = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      // Use the explicit theme from the cookie ('light' or 'dark')
      className = theme;
    }

    // Apply the class to the root element
    document.documentElement.classList.add(className);
  } catch (e) {
    // Ignore errors in case cookies/matchMedia is unavailable/errors
    console.error('Error applying initial theme from cookie:', e);
  }
})();
`;

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Inject the theme initializer script */}
          <script dangerouslySetInnerHTML={{ __html: themeInitializerScript }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
