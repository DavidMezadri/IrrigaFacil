# IrrigaFacil ESP — Documentação de Comandos MQTT

**Broker:** `test.mosquitto.org:1883`  
**Tópico:** `<user>/<device>` (ex: `davidjordana/testerele`)

---

## Campos do Payload — `type: command`

| Campo | Tipo | Descrição |
|---|---|---|
| `nodeId` | `int` | ID do nó de destino (1 = master) |
| `type` | `string` | Tipo do equipamento: `pump` ou `sector` |
| `equipament` | `string` | Nome/ID do equipamento |
| `state` | `string` | Estado desejado: [on](file:///c:/ProjetosPessoais/IrrigaFacil_ESP/src/Models/MqttMessage.cpp#295-322) ou `off` |
| `start` | `string` | Pin GPIO (para create/update) |
| `stop` | `string` | Hora `HH:MM` ou segundos para desligamento automático (para controle com timer); novo nome (para update) |

---

## 🔌 Controle de Equipamentos

### Ligar/Desligar Pump (sem timer)

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "pump",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "",
    "equipament": "TESTE",
    "state": "on",
    "start": "",
    "stop": ""
  }
}'
```

> Substitua `"state": "on"` por `"off"` para desligar.

---

### Ligar Pump com timer (desliga automaticamente)

`stop` aceita horário `HH:MM` **ou** duração em segundos.

```bash
# Desliga às 00:10
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "pump",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "",
    "equipament": "TESTE",
    "state": "on",
    "start": "",
    "stop": "00:10"
  }
}'
```

```bash
# Desliga após 120 segundos
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "pump",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "",
    "equipament": "TESTE",
    "state": "on",
    "start": "",
    "stop": "120"
  }
}'
```

---

### Ligar/Desligar Sector — legado (`action: sector`)

Mesmo comportamento do `pump`, inclusive suporta timer via `stop`.

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "sector",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "",
    "equipament": "SETOR1",
    "state": "on",
    "start": "",
    "stop": ""
  }
}'
```

---

## 🔧 CRUD de GPIOs

### Criar GPIO

`start` = número do pino GPIO. `type` = `pump` ou `sector`.

```bash
# Criar pump no pino 11
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "create",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "pump",
    "equipament": "TESTE3",
    "state": "",
    "start": "11",
    "stop": ""
  }
}'
```

```bash
# Criar sector no pino 12
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "create",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "sector",
    "equipament": "SETOR1",
    "state": "",
    "start": "12",
    "stop": ""
  }
}'
```

---

### Atualizar GPIO

| Campo | Valor |
|---|---|
| `equipament` | Nome **atual** do equipamento |
| `start` | Novo pino GPIO |
| `stop` | Novo nome do equipamento |
| `nodeId` | Novo nodeId |

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "update",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 2,
    "type": "pump",
    "equipament": "TESTE3",
    "state": "",
    "start": "13",
    "stop": "TESTE3_NOVO"
  }
}'
```

---

### Remover GPIO

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "delete",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "pump",
    "equipament": "TESTE3",
    "state": "",
    "start": "",
    "stop": ""
  }
}'
```

---

### Listar todos os GPIOs

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "getAll",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "",
    "equipament": "",
    "state": "",
    "start": "",
    "stop": ""
  }
}'
```

---

### Remover todos os GPIOs

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "command",
  "action": "deleteAll",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "nodeId": 1,
    "type": "",
    "equipament": "",
    "state": "",
    "start": "",
    "stop": ""
  }
}'
```

---

## 📅 Schedules

### Criar / Atualizar Schedule

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "create",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "scheduleId": "sched_001",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "pump",
        "equipament": "TESTE",
        "state": "on",
        "start": "06:00",
        "stop": "06:30"
      }
    ]
  }
}'
```

> `action: "update"` usa a mesma estrutura e o mesmo método internamente.

---

### Remover Schedule

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "delete",
  "timestamp": "10-02-2026T21:40",
  "payload": {
    "scheduleId": "sched_001"
  }
}'
```

## 🧪 Exemplos de Teste — Schedule Completos

> Todos os exemplos abaixo usam a bomba `TESTE` no pino 18, que já está configurada no `setup()`.

---

### ✅ Criar Schedule simples — Pump com 1 action (stop em segundos)

`stop` em segundos → desliga automaticamente após X segundos de execução.

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "create",
  "timestamp": "21-02-2026T14:00",
  "payload": {
    "scheduleId": "sched_teste_01",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "pump",
        "equipament": "TESTE",
        "state": "on",
        "start": "07:00",
        "stop": "300"
      }
    ]
  }
}'
```

> Vai ligar `TESTE` às **07:00** e desligar após **300 segundos (5 min)**.

---

### ✅ Criar Schedule simples — Pump com 1 action (stop em horário HH:MM)

`stop` como horário → calcula duração como diferença entre `start` e `stop`.

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "create",
  "timestamp": "21-02-2026T14:00",
  "payload": {
    "scheduleId": "sched_teste_02",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "pump",
        "equipament": "TESTE",
        "state": "on",
        "start": "06:00",
        "stop": "06:30"
      }
    ]
  }
}'
```

> Vai ligar `TESTE` às **06:00** e desligar às **06:30** (30 min).

---

### ✅ Criar Schedule com múltiplas actions

Múltiplos equipamentos no mesmo schedule, cada um com seu horário.

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "create",
  "timestamp": "21-02-2026T14:00",
  "payload": {
    "scheduleId": "sched_manha_completo",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "pump",
        "equipament": "TESTE",
        "state": "on",
        "start": "06:00",
        "stop": "600"
      },
      {
        "nodeId": 1,
        "type": "sector",
        "equipament": "SETOR1",
        "state": "on",
        "start": "06:15",
        "stop": "300"
      }
    ]
  }
}'
```

---

### ✅ Criar Schedule desabilitado (salvo mas não executado)

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "create",
  "timestamp": "21-02-2026T14:00",
  "payload": {
    "scheduleId": "sched_desabilitado",
    "enabled": false,
    "actions": [
      {
        "nodeId": 1,
        "type": "pump",
        "equipament": "TESTE",
        "state": "on",
        "start": "08:00",
        "stop": "120"
      }
    ]
  }
}'
```

---

### ✏️ Atualizar Schedule existente

Usa `action: "update"` com o mesmo `scheduleId` — internamente chama `addOrUpdateSchedule`.

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "update",
  "timestamp": "21-02-2026T14:00",
  "payload": {
    "scheduleId": "sched_teste_01",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "pump",
        "equipament": "TESTE",
        "state": "on",
        "start": "07:30",
        "stop": "180"
      }
    ]
  }
}'
```

> Atualiza o horário de `07:00` para `07:30` e duração de 300s para 180s.

---

### 🗑️ Remover Schedule específico (payload mínimo)

Só precisa do `scheduleId` no payload.

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "delete",
  "timestamp": "21-02-2026T14:00",
  "payload": "scheduleId": "sched_teste_01",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "",
        "equipament": "",
        "state": "",
        "start": "",
        "stop": ""
      }
    ]
  }
}'
```

---

### 📋 Listar todos os Schedules (payload mínimo)

Imprime via `Serial` — não retorna via MQTT (ESP32 não publica resposta ainda).

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "getAll",
  "timestamp": "21-02-2026T14:00",
  "payload": {
    "scheduleId": "",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "",
        "equipament": "",
        "state": "",
        "start": "",
        "stop": ""
      }
    ]
  }
}'
```

---

### 🗑️ Remover todos os Schedules (payload mínimo)

```bash
mosquitto_pub -h test.mosquitto.org -p 1883 -t "davidjordana/testerele" -m '{
  "farmId": "fazendinha",
  "type": "schedule",
  "action": "deleteAll",
  "timestamp": "21-02-2026T14:00",
  "payload": {
    "scheduleId": "",
    "enabled": true,
    "actions": [
      {
        "nodeId": 1,
        "type": "",
        "equipament": "",
        "state": "",
        "start": "",
        "stop": ""
      }
    ]
  }
}'
```

---

## ⚠️ Observações do Handler de Schedule

| Ponto | Detalhe |
|---|---|
| `create` e `update` | Idênticos internamente — ambos chamam `addOrUpdateSchedule()`. Se o `scheduleId` já existe, atualiza; se não, cria. |
| `stop` em segundos | `"stop": "300"` → desliga após 300 segundos do horário `start` |
| `stop` em horário | `"stop": "06:30"` → calcula diferença com `start` em segundos |
| `enabled: false` | Schedule é salvo na NVS mas ignorado na execução |
| `getAll` / `deleteAll` | O `payload` pode ser mínimo `{"scheduleId": ""}` — campos extras são ignorados |
| `getAll` / `deleteAll` | O `payload` pode ser mínimo `{\"scheduleId\": \"\"}` — campos extras são ignorados |
| Persistência | Todo `create`/`update`/`delete` salva automaticamente na NVS (Preferences) |

---

## 📥 Resposta do Nó — `getAll`

> O ESP32 **deve publicar** este JSON no mesmo tópico (`user/device`) ao receber qualquer comando `action: "getAll"` (GPIO ou schedule).  
> O app escuta este formato e importa automaticamente as bombas, setores e schedules.

```json
{
  "farmId": "fazendinha",
  "type": "response",
  "action": "getAll",
  "timestamp": "01-03-2026T14:48",
  "payload": {
    "gpios": [
      { "nodeId": 1, "type": "pump",   "equipament": "TESTE",  "pin": 18 },
      { "nodeId": 1, "type": "sector", "equipament": "SETOR1", "pin": 12 },
      { "nodeId": 2, "type": "pump",   "equipament": "BOMBA2", "pin": 5  }
    ],
    "schedules": [
      {
        "scheduleId": "sched_001",
        "enabled": true,
        "actions": [
          {
            "nodeId": 1,
            "type": "pump",
            "equipament": "TESTE",
            "state": "on",
            "start": "06:00",
            "stop": "300"
          }
        ]
      }
    ]
  }
}
```

| Campo | Descrição |
|---|---|
| `farmId` | Nome da fazenda (igual ao `farmId` do comando) |
| `type` | Sempre `"response"` |
| `action` | Sempre `"getAll"` |
| `payload.gpios` | Lista de todos os GPIOs cadastrados no nó |
| `payload.gpios[].pin` | Número do pino GPIO |
| `payload.schedules` | Lista de todos os schedules ativos |

