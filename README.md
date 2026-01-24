# IrrigaFacil - Sistema de Controle de Irrigação

Aplicativo React Native para controle e monitoramento de sistemas de irrigação de fazendas via MQTT.

## 🚀 Funcionalidades

- **Gerenciamento de Fazendas**: Cadastre múltiplas fazendas com configurações MQTT independentes
- **Controle de Bombas**: Adicione e controle bombas de irrigação remotamente via MQTT
- **Gestão de Setores**: Organize e controle setores de irrigação
- **Monitoramento de Sensores**: Visualize dados em tempo real de sensores de:
  - Umidade do ar e do solo
  - Temperatura
  - Vento
  - Chuva
  - Pressão atmosférica
  - Sensores personalizados
- **Comunicação MQTT**: Publicação e subscrição de mensagens em formato JSON
- **Persistência de Dados**: Todos os dados são salvos localmente
- **Interface Moderna**: Design dark mode com cores vibrantes

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- npm ou yarn
- Expo CLI
- Expo Go app (para testar no celular) ou emulador Android/iOS

## 🔧 Instalação

1. Clone o repositório ou navegue até a pasta do projeto:
```bash
cd IrrigaFacil
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npx expo start
```

4. Escaneie o QR code com o Expo Go app ou pressione:
   - `a` para abrir no Android
   - `i` para abrir no iOS
   - `w` para abrir no navegador

## 📱 Como Usar

### 1. Configurar uma Fazenda

1. Na tela inicial, clique em "➕ Adicionar Fazenda"
2. Preencha as informações:
   - Nome da fazenda
   - Localização (opcional)
   - **URL do broker MQTT**: `mqtt://broker.hivemq.com` ou `broker.hivemq.com`
   - **Porta**: `1883`
   - Usuário e senha (se necessário)
3. Clique em "Criar Fazenda"

### 2. Adicionar Bombas

1. Selecione uma fazenda
2. Navegue até a aba "Bombas"
3. Clique em "➕ Adicionar Bomba"
4. Configure:
   - Nome da bomba
   - Descrição (opcional)
   - Tópico MQTT para comandos (ex: `fazenda1/bomba/1/comando`)
5. Use o switch para ligar/desligar a bomba

### 3. Adicionar Setores

1. Na aba "Setores", clique em "➕ Adicionar Setor"
2. Configure:
   - Nome do setor
   - Descrição e área em hectares (opcional)
   - Tópico MQTT para comandos (ex: `fazenda1/setor/1/comando`)
3. Controle o setor com o switch

### 4. Adicionar Sensores

1. Na aba "Sensores", clique em "➕ Adicionar Sensor"
2. Configure:
   - Nome do sensor
   - Tipo (umidade, temperatura, vento, etc.)
   - Unidade de medida
   - Tópico MQTT para receber dados (ex: `fazenda1/sensor/umidade/1/dados`)
3. Os dados aparecerão automaticamente quando publicados no tópico

## 📡 Formato das Mensagens MQTT

### Comandos (Publicados pelo App)

```json
{
  "farmId": "fazenda-123",
  "type": "pump",
  "id": "bomba-1",
  "action": "on",
  "timestamp": "2026-01-23T21:00:00.000Z"
}
```

### Dados de Sensores (Recebidos pelo App)

```json
{
  "farmId": "fazenda-123",
  "sensorType": "humidity",
  "sensorId": "sensor-1",
  "value": 65.5,
  "unit": "%",
  "timestamp": "2026-01-23T21:00:00.000Z"
}
```

### Resposta de Status (Opcional - Recebida pelo App)

```json
{
  "id": "bomba-1",
  "status": "on"
}
```

## 🧪 Testando com Broker MQTT

### Opção 1: Broker Público (para testes)

**HiveMQ:**
- URL: `mqtt://broker.hivemq.com` ou `broker.hivemq.com`
- Porta: `1883`

**Mosquitto:**
- URL: `mqtt://test.mosquitto.org` ou `test.mosquitto.org`
- Porta: `1883`

> **Nota**: Estes são brokers públicos. Qualquer pessoa pode ver suas mensagens. Use apenas para testes!

### Opção 2: Broker Local (Mosquitto)

1. Instale o Mosquitto:
```bash
# Windows (com Chocolatey)
choco install mosquitto

# macOS
brew install mosquitto

# Linux
sudo apt-get install mosquitto mosquitto-clients
```

2. Inicie o broker:
```bash
mosquitto -v
```

3. Use `mqtt://localhost:1883` no app

### Testando com MQTT Explorer

1. Baixe o [MQTT Explorer](http://mqtt-explorer.com/)
2. Conecte ao mesmo broker configurado no app
3. Publique mensagens de teste nos tópicos dos sensores
4. Monitore os comandos publicados pelo app

## 🏗️ Estrutura do Projeto

```
IrrigaFacil/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── PumpControl.tsx
│   │   ├── SectorControl.tsx
│   │   ├── SensorCard.tsx
│   │   └── StatusIndicator.tsx
│   ├── context/          # Gerenciamento de estado
│   │   ├── AppContext.tsx
│   │   └── MQTTContext.tsx
│   ├── navigation/       # Configuração de navegação
│   │   └── AppNavigator.tsx
│   ├── screens/          # Telas do aplicativo
│   │   ├── DashboardScreen.tsx
│   │   ├── FarmListScreen.tsx
│   │   ├── FarmFormScreen.tsx
│   │   ├── PumpsScreen.tsx
│   │   ├── PumpFormScreen.tsx
│   │   ├── SectorsScreen.tsx
│   │   ├── SectorFormScreen.tsx
│   │   ├── SensorsScreen.tsx
│   │   └── SensorFormScreen.tsx
│   ├── services/         # Serviços
│   │   ├── mqttService.ts
│   │   └── storageService.ts
│   ├── styles/           # Temas e estilos
│   │   └── theme.ts
│   ├── types/            # Definições TypeScript
│   │   └── index.ts
│   └── utils/            # Utilitários
│       └── messageFormatter.ts
├── App.tsx               # Componente principal
└── package.json
```

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas
- **MQTT.js** - Cliente MQTT
- **AsyncStorage** - Persistência de dados
- **Context API** - Gerenciamento de estado

## 📝 Notas Importantes

- O app mantém conexão MQTT apenas quando uma fazenda está selecionada
- Os dados dos sensores são limitados aos últimos 100 registros por sensor
- Todas as configurações são salvas localmente no dispositivo
- A reconexão MQTT é automática em caso de perda de conexão

## 🤝 Contribuindo

Sinta-se à vontade para abrir issues e pull requests para melhorias!

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.
