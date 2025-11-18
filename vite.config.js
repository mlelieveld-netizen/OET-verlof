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
        return html.replace('</head>', routingScript + '\n  </head>')
      }
    }
  ],
  base: '/OET-verlof/',
})

