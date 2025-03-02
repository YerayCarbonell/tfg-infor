# Cambiar al directorio "backend"
cd "C:\Users\yeray\OneDrive\Escritorio\2024-2025\TFG INFORMATICA\Primer intento\backend"

# Abrir un nuevo cmd y ejecutar "npm start"
start cmd /k "npm start"

# Cambiar al directorio "frontend"
cd "C:\Users\yeray\OneDrive\Escritorio\2024-2025\TFG INFORMATICA\Primer intento\frontend"

# Abrir un nuevo cmd y ejecutar "npx expo" y automáticamente simular presionar "w"
start cmd /k "npx expo start && timeout /t 2 && echo w | npx expo start"
