// WebSocket сервер для синхронизации между оператором и зрителями
"use server"

interface WebSocketConnection {
  id: string
  type: "operator" | "viewer"
  socket: WebSocket
  lastActivity: Date
}

interface TournamentState {
  tournament: any
  fights: any[]
  liveData: { [tatami: number]: any }
  lastUpdate: string
}

class TournamentWebSocketServer {
  private connections: Map<string, WebSocketConnection> = new Map()
  private tournamentState: TournamentState | null = null
  private server: any = null

  constructor() {
    this.initializeServer()
  }

  private initializeServer() {
    // В реальном приложении здесь будет настройка WebSocket сервера
    console.log("WebSocket сервер инициализирован")
  }

  // Подключение нового клиента
  public handleConnection(socket: WebSocket, clientType: "operator" | "viewer") {
    const connectionId = this.generateConnectionId()

    const connection: WebSocketConnection = {
      id: connectionId,
      type: clientType,
      socket,
      lastActivity: new Date(),
    }

    this.connections.set(connectionId, connection)

    // Отправляем начальные данные
    if (this.tournamentState && clientType === "viewer") {
      this.sendToClient(connectionId, {
        type: "live_update",
        payload: this.tournamentState,
      })
    }

    // Уведомляем о количестве зрителей
    this.broadcastViewerCount()

    // Обработка сообщений
    socket.onmessage = (event) => {
      this.handleMessage(connectionId, JSON.parse(event.data))
    }

    // Обработка отключения
    socket.onclose = () => {
      this.handleDisconnection(connectionId)
    }

    console.log(`${clientType} подключен: ${connectionId}`)
  }

  // Обработка сообщений от клиентов
  private handleMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.lastActivity = new Date()

    switch (message.type) {
      case "operator_update":
        if (connection.type === "operator") {
          this.handleOperatorUpdate(message.payload)
        }
        break

      case "request_initial_data":
        if (this.tournamentState) {
          this.sendToClient(connectionId, {
            type: "live_update",
            payload: this.tournamentState,
          })
        }
        break

      case "fight_result":
        if (connection.type === "operator") {
          this.broadcastToViewers({
            type: "fight_result",
            fightId: message.fightId,
            result: message.result,
          })
        }
        break

      case "fight_status":
        if (connection.type === "operator") {
          this.broadcastToViewers({
            type: "fight_status",
            fightId: message.fightId,
            status: message.status,
          })
        }
        break

      case "tatami_update":
        if (connection.type === "operator") {
          this.handleTatamiUpdate(message.tatami, message.data)
        }
        break

      default:
        console.log("Неизвестный тип сообщения:", message.type)
    }
  }

  // Обработка обновлений от оператора
  private handleOperatorUpdate(payload: TournamentState) {
    this.tournamentState = {
      ...payload,
      lastUpdate: new Date().toISOString(),
    }

    // Рассылаем обновления всем зрителям
    this.broadcastToViewers({
      type: "live_update",
      payload: this.tournamentState,
    })
  }

  // Обработка обновлений татами
  private handleTatamiUpdate(tatami: number, data: any) {
    if (this.tournamentState) {
      this.tournamentState.liveData[tatami] = data
      this.tournamentState.lastUpdate = new Date().toISOString()

      // Рассылаем обновление татами
      this.broadcastToViewers({
        type: "tatami_update",
        tatami,
        data,
      })
    }
  }

  // Отправка сообщения конкретному клиенту
  private sendToClient(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId)
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message))
    }
  }

  // Рассылка сообщения всем зрителям
  private broadcastToViewers(message: any) {
    this.connections.forEach((connection) => {
      if (connection.type === "viewer" && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify(message))
      }
    })
  }

  // Рассылка количества зрителей
  private broadcastViewerCount() {
    const viewerCount = Array.from(this.connections.values()).filter((conn) => conn.type === "viewer").length

    // Отправляем операторам
    this.connections.forEach((connection) => {
      if (connection.type === "operator" && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(
          JSON.stringify({
            type: "viewer_count",
            count: viewerCount,
          }),
        )
      }
    })
  }

  // Обработка отключения клиента
  private handleDisconnection(connectionId: string) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      console.log(`${connection.type} отключен: ${connectionId}`)
      this.connections.delete(connectionId)

      // Обновляем количество зрителей
      if (connection.type === "viewer") {
        this.broadcastViewerCount()
      }
    }
  }

  // Генерация ID подключения
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Очистка неактивных подключений
  public cleanupInactiveConnections() {
    const now = new Date()
    const timeout = 5 * 60 * 1000 // 5 минут

    this.connections.forEach((connection, id) => {
      if (now.getTime() - connection.lastActivity.getTime() > timeout) {
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.close()
        }
        this.connections.delete(id)
      }
    })
  }

  // Получение статистики сервера
  public getServerStats() {
    const operators = Array.from(this.connections.values()).filter((conn) => conn.type === "operator").length
    const viewers = Array.from(this.connections.values()).filter((conn) => conn.type === "viewer").length

    return {
      totalConnections: this.connections.size,
      operators,
      viewers,
      lastUpdate: this.tournamentState?.lastUpdate || null,
    }
  }
}

// Экспорт singleton экземпляра
export const tournamentWebSocketServer = new TournamentWebSocketServer()

// Функция для инициализации сервера
export function initializeWebSocketServer() {
  // Очистка неактивных подключений каждые 2 минуты
  setInterval(
    () => {
      tournamentWebSocketServer.cleanupInactiveConnections()
    },
    2 * 60 * 1000,
  )

  return tournamentWebSocketServer
}
