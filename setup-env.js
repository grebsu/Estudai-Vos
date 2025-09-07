
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

// Verifica se o diretório 'data' existe, se não, cria
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Diretório "data" criado com sucesso.');
}

// Verifica se o arquivo 'users.json' existe, se não, cria com um array vazio
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, '[]', 'utf8');
  console.log('Arquivo "users.json" criado com sucesso.');
}
