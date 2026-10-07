#!/bin/bash

# Script de Instalación - Agroforestal Monte Redondo SPA
# Este script automatiza la instalación del proyecto

echo "=================================="
echo "🚀 Agroforestal Monte Redondo SPA - Instalación"
echo "=================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Verificar Node.js
echo "Verificando requisitos previos..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "Descárgalo desde: https://nodejs.org/"
    exit 1
fi
print_success "Node.js instalado: $(node -v)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm instalado: $(npm -v)"

# Verificar Docker (solo advertencia, se usa para levantar PostgreSQL)
if ! command -v docker &> /dev/null; then
    print_info "Docker no se detectó en PATH"
    print_info "Necesitás Docker (o un PostgreSQL propio) para levantar la base de datos"
fi

echo ""
echo "=================================="
echo "Instalando dependencias..."
echo "=================================="
echo ""

# Instalar backend
print_info "Instalando backend..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_success "Backend instalado"
else
    print_error "Error instalando backend"
    exit 1
fi

cd ..

# Instalar frontend
print_info "Instalando frontend..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend instalado"
else
    print_error "Error instalando frontend"
    exit 1
fi

cd ..

echo ""
echo "=================================="
echo "✅ Instalación completada"
echo "=================================="
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Levanta PostgreSQL con Docker:"
echo "   cd backend && docker compose up -d"
echo ""
echo "2. (Opcional) Inicializa la base de datos con datos de ejemplo:"
echo "   cd backend && npm run seed"
echo ""
echo "3. Abre dos terminales más:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Abre tu navegador:"
echo "   http://localhost:8000"
echo ""
echo "Credenciales de prueba (después de ejecutar seed):"
echo "  Admin: admin@example.com / admin123"
echo "  Cliente: cliente@example.com / cliente123"
echo ""
