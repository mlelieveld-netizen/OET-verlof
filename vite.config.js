import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-logo',
      writeBundle() {
        // This ensures logo.jpg is copied to dist during build
        // Vite automatically copies public folder contents, but we ensure it's there
        const logoSource = resolve(__dirname, 'public/logo.jpg');
        const logoDest = resolve(__dirname, 'dist/logo.jpg');
        if (existsSync(logoSource)) {
          copyFileSync(logoSource, logoDest);
        }
      }
    },
    {
      name: 'add-csp-and-scripts',
      // Don't use enforce: 'pre' - run after Vite's HTML processing
      transformIndexHtml: {
        enforce: 'post', // Run after Vite processes the HTML
        transform(html, ctx) {
        // Always ensure CSP meta tag is present with unsafe-eval
        // Remove any existing CSP tags first
        html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
        
        // Add CSP meta tag - MUST include unsafe-eval for Vite/React
        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://api.emailjs.com https://*.emailjs.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.emailjs.com https://*.emailjs.com; frame-src 'self' https://api.emailjs.com;" />`;
        
        // Insert CSP tag right after charset tag (most reliable location)
        // Use a more specific pattern to match the charset tag
        html = html.replace(/(<meta\s+charset=["']UTF-8["'][^>]*>)/i, '$1\n    ' + cspMeta);
        
        // If charset pattern didn't match, try after viewport
        if (!html.includes('Content-Security-Policy')) {
          html = html.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i, '$1\n    ' + cspMeta);
        }
        
        // Final fallback: insert after head tag
        if (!html.includes('Content-Security-Policy')) {
          html = html.replace(/(<head[^>]*>)/i, '$1\n    ' + cspMeta);
        }
        
        // Add routing script to built index.html
        const routingScript = `
    <script>
      // Single Page Apps for GitHub Pages
      (function(l) {
        if (l.search[1] === '/' ) {
          var decoded = l.search.slice(1).split('&').map(function(s) { 
            return s.replace(/~and~/g, '&')
          }).join('?');
          window.history.replaceState(null, null,
              l.pathname.slice(0, -1) + decoded + l.hash
          );
        }
      }(window.location))
    </script>`
        
        // Add error handling script
        const errorScript = `
    <script>
      // Loading indicator
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = '<div style="padding: 20px; text-align: center;"><div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #2C3E50; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="margin-top: 10px; color: #666;">Laden...</p></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';
      }
      
      // Fallback error handler
      window.addEventListener('error', function(e) {
        console.error('Global error:', e.error, e.filename, e.lineno, e.colno);
        const root = document.getElementById('root');
        if (root && !root.innerHTML.includes('Error') && !root.innerHTML.includes('Laden...')) {
          let errorMsg = e.error ? e.error.message : e.message;
          let fileName = e.filename || e.target?.src || 'unknown';
          
          // Check if it's a 404 for a resource
          if (e.target && e.target.tagName) {
            if (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK' || e.target.tagName === 'IMG') {
              errorMsg = '404 Error: Resource not found: ' + fileName;
              if (fileName.includes('logo.jpg')) {
                errorMsg += '\\n\\nLogo bestand niet gevonden. Dit is meestal een cache probleem.';
              }
              errorMsg += '\\n\\nThis usually means:\\n1. The page is cached (try Ctrl+Shift+R)\\n2. GitHub Pages build is not ready yet\\n3. Open in incognito mode to bypass cache';
            }
          } else if (fileName.includes('main.jsx') || fileName.includes('.js')) {
            errorMsg = '404 Error: JavaScript file not found: ' + fileName;
            errorMsg += '\\n\\nThis usually means the page is cached. Try:\\n1. Ctrl+Shift+R (hard refresh)\\n2. Open in incognito mode\\n3. Wait for GitHub Actions build to complete';
          }
          
          root.innerHTML = '<div style="padding: 20px; color: red; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;"><h2 style="color: red; margin-bottom: 15px;">Error loading app</h2><p style="margin-bottom: 10px;">Please check the browser console (F12) for details.</p><p style="font-size: 12px; margin-top: 10px; white-space: pre-line; background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">Error: ' + errorMsg + '</p><p style="font-size: 12px; margin-top: 10px; color: #666;">File: ' + fileName + '</p><div style="margin-top: 15px; display: flex; gap: 10px;"><button onclick="window.location.reload(true)" style="flex: 1; padding: 10px 20px; background: #2C3E50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Hard Refresh</button><button onclick="window.open(window.location.href, \\'_blank\\')" style="flex: 1; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Open in New Tab</button></div></div>';
        }
      });
      
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        const root = document.getElementById('root');
        if (root && !root.innerHTML.includes('Error')) {
          root.innerHTML = '<div style="padding: 20px; color: red; max-width: 600px; margin: 0 auto;"><h2 style="color: red;">Error loading app</h2><p>Unhandled promise rejection. Please check the browser console (F12) for details.</p></div>';
        }
      });
      
      // Check if modules loaded after 5 seconds
      setTimeout(function() {
        const root = document.getElementById('root');
        if (root && root.innerHTML.includes('Laden...')) {
          console.error('App did not load within 5 seconds');
          root.innerHTML = '<div style="padding: 20px; color: red; max-width: 600px; margin: 0 auto;"><h2 style="color: red;">Loading timeout</h2><p>The app did not load within 5 seconds. Please check:</p><ul style="text-align: left; margin-top: 10px;"><li>Browser console (F12) for errors</li><li>Network tab to see if files are loading</li><li>Try refreshing the page</li></ul></div>';
        }
      }, 5000);
    </script>`
        
        html = html.replace('</head>', routingScript + '\n  </head>')
        html = html.replace('</body>', errorScript + '\n  </body>')
        return html
      }
    }
  ],
  base: '/OET-verlof/',
})

