module.exports = {
  testPathIgnorePatterns: ["/node_modules/", "/.next/"], // ignorar esses diretórios ao realizar testes
  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.ts"], // arquivos que queremos executar antes de executar os testes
  transform: { // converter arquivos de teste para uma maneira entendível pelo jest com babel
    "^.+\\.(js|jsx|ts|tsx)$": "<rootDir>/node_modules/babel-jest",
    // rootDir simboliza o diretório root do projeto
  },
  moduleNameMapper: {"\\.(scss|css|sass)$": 'identity-obj-proxy'}, // biblioteca que traduz scss, css e sass
  testEnvironment: "jsdom", // em que ambiente estamos executando os testes para saber como o jest deve se comportar
};
