import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'add-routing-script',
      transformIndexHtml(html) {
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
      // Fallback error handler
      window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        const root = document.getElementById('root');
        if (root && !root.innerHTML.includes('Error')) {
          root.innerHTML = '<div style="padding: 20px; color: red;">Error loading app. Please check console for details.</div>';
        }
      });
    </script>`
        
        html = html.replace('</head>', routingScript + '\n  </head>')
        html = html.replace('</body>', errorScript + '\n  </body>')
        return html
      }
    }
  ],
  base: '/OET-verlof/',
})

