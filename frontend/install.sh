#!/bin/bash

# Frontend Installation Script
echo "🎨 Instalando dependências do Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."

    # Install Node.js based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    else
        echo "❌ OS não suportado. Instale Node.js manualmente."
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Install dependencies
echo "📦 Instalando dependências..."
npm install

# Install additional dependencies if needed
echo "🔧 Instalando dependências adicionais..."
npm install @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_ENV=development
VITE_APP_NAME=ChatBot Platform
EOF
fi

# Build Tailwind CSS
echo "🎨 Configurando Tailwind CSS..."
npx tailwindcss init -p

echo "✅ Frontend configurado com sucesso!"
echo ""
echo "🚀 Para iniciar o desenvolvimento:"
echo "   npm run dev"
echo ""
echo "🏗️ Para fazer build de produção:"
echo "   npm run build"
