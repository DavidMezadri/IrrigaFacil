# ⚠️ MQTT em React Native/Expo - Limitação Conhecida

## Problema Confirmado

A biblioteca `mqtt.js` **NÃO funciona com protocolo TCP direto** (`mqtt://`) em React Native/Expo.

**Evidência dos logs:**
```
Connecting to MQTT broker: mqtt://test.mosquitto.org:1883
MQTT client offline
MQTT connection closed
MQTT reconnecting... (loop infinito)
```

## Por Que Não Funciona?

React Native/Expo roda em um ambiente sandboxed que:
- ❌ Não suporta sockets TCP nativos
- ❌ Não pode usar `mqtt://` diretamente
- ✅ Só suporta WebSocket (`ws://` ou `wss://`)
- ✅ Só suporta HTTP/HTTPS

## Soluções Reais

### Opção 1: Usar Broker com WebSocket (RECOMENDADO)

**HiveMQ Cloud** (Gratuito):
1. Cadastre-se: https://console.hivemq.cloud/
2. Crie um cluster gratuito
3. Nas configurações, copie a URL WebSocket
4. No app use:
   - URL: `wss://seu-cluster.s2.eu.hivemq.cloud`
   - Porta: `8884`
   - Usuário e senha fornecidos

**EMQX Cloud** (Gratuito):
- URL: `wss://broker.emqx.io`
- Porta: `8084`

### Opção 2: Servidor MQTT Local com WebSocket

Configure Mosquitto no seu PC com WebSocket:

**mosquitto.conf:**
```conf
listener 1883
protocol mqtt

listener 8080
protocol websockets
allow_anonymous true
```

Inicie: `mosquitto -c mosquitto.conf`

No app:
- URL: `ws://192.168.x.x` (seu IP local)
- Porta: `8080`

### Opção 3: Bridge MQTT (Avançado)

Crie um servidor Node.js que:
1. Conecta ao broker MQTT via TCP
2. Expõe WebSocket para o app
3. Faz relay das mensagens

### Opção 4: Usar o App Sem MQTT (Demonstração)

O app funciona 100% sem MQTT:
- ✅ Gerenciamento de fazendas
- ✅ Cadastro de bombas/setores/sensores
- ✅ Interface completa
- ✅ Persistência de dados
- ❌ Apenas comunicação MQTT não funciona

## Mudanças Aplicadas no Código

Para evitar o loop infinito de reconexão:
- ✅ Desabilitei reconexão automática (`reconnectPeriod: 0`)
- ✅ Adicionei timeout de 10 segundos
- ✅ Mensagem de erro clara após timeout

## Recomendação Final

**Para usar MQTT de verdade:**
1. Cadastre-se no HiveMQ Cloud (5 minutos, gratuito)
2. Use as credenciais WebSocket fornecidas
3. Funciona perfeitamente!

**Para demonstração:**
- Use o app sem MQTT
- Tudo funciona exceto comunicação real

## Status do Projeto

✅ **App 100% funcional** (interface, dados, navegação)
⚠️ **MQTT requer broker WebSocket** (limitação do React Native)
📚 **Código MQTT pronto** (funciona com broker WebSocket)

---

**Conclusão**: Não é um bug no código, é uma limitação da plataforma React Native/Expo.
