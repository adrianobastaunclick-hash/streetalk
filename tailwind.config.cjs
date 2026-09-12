module.exports = {
        content: ['./public/index.html', './frontend/app.js'],
        theme: {
          extend: {
            colors: {
              street: {
                asphalt: '#0b0d10',
                concrete: '#15191f',
                surface: 'rgba(21, 25, 31, 0.88)',
                card: '#202630',
                zinc: '#202630',
                border: '#343d49',
                borderGlow: 'rgba(255, 101, 47, 0.3)',
                orange: '#ff652f',
                orangeHover: '#ff8155',
                orangeGlow: 'rgba(255, 101, 47, 0.45)',
                cement: '#aab4c2',
                steel: '#aab4c2'
              }
            },
            fontFamily: {
              street: ['Syne', 'sans-serif'],
              sans: ['Plus Jakarta Sans', 'sans-serif'],
              mono: ['JetBrains Mono', 'monospace']
            },
            animation: {
              'radar-pulse': 'radarPulse 2.8s cubic-bezier(0, 0, 0.2, 1) infinite',
              'radar-sweep': 'radarSweep 3.6s linear infinite'
            },
            keyframes: {
              radarPulse: {
                '0%': { transform: 'scale(0.35)', opacity: '0.9' },
                '100%': { transform: 'scale(2.2)', opacity: '0' }
              },
              radarSweep: {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }
          }
        }
      };
