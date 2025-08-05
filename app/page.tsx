"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Eye, Settings, Users, Trophy } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-600" />
            Система управления турнирами по Киокушинкай каратэ
          </h1>
          <p className="text-xl text-gray-600">
            Выберите режим работы с системой
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Полная система управления */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl mb-2">Полная система управления</CardTitle>
              <Badge variant="outline" className="w-fit mx-auto">
                Для администраторов
              </Badge>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Полный доступ ко всем функциям: регистрация участников, управление судьями, 
                жеребьёвка, управление боями, отчёты и статистика.
              </p>
              <Link href="/management">
                <Button className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Открыть систему управления
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Операторская панель */}
          <Card className="hover:shadow-lg transition-shadow border-2 border-blue-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Monitor className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-2">Операторская панель</CardTitle>
              <Badge className="w-fit mx-auto bg-green-100 text-green-800">
                Для операторов татами
              </Badge>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Упрощенный интерфейс для управления боями на татами и 
                трансляции для зрителей. Оптимизирован для работы на татами.
              </p>
              <Link href="/desktop">
                <Button className="w-full">
                  <Monitor className="h-4 w-4 mr-2" />
                  Открыть операторскую панель
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Просмотр для зрителей */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl mb-2">Просмотр для зрителей</CardTitle>
              <Badge variant="outline" className="w-fit mx-auto">
                Публичный доступ
              </Badge>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Онлайн трансляция турнира для зрителей. Показывает текущие бои, 
                результаты, расписание и статистику в реальном времени.
              </p>
              <Link href="/viewer">
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Смотреть турнир онлайн
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Инструкция по использованию */}
        <Card className="mt-12 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">
              📋 Как использовать систему
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-3 text-green-700">
                  👨‍💼 Для оператора (вы):
                </h3>
                <ol className="space-y-2 list-decimal list-inside text-sm">
                  <li>Откройте <strong>"Операторскую панель"</strong> на своем компьютере</li>
                  <li>Сначала зарегистрируйте участников через <strong>"Полную систему управления"</strong></li>
                  <li>Проведите жеребьёвку и создайте расписание боев</li>
                  <li>В операторской панели включите трансляцию</li>
                  <li>Управляйте боями на татами в реальном времени</li>
                </ol>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-purple-700">
                  👥 Для зрителей:
                </h3>
                <ol className="space-y-2 list-decimal list-inside text-sm">
                  <li>Поделитесь ссылкой на <strong>"Просмотр для зрителей"</strong></li>
                  <li>Зрители смогут видеть текущие бои в режиме Live</li>
                  <li>Доступны результаты, расписание и статистика</li>
                  <li>Автоматическое обновление данных от оператора</li>
                  <li>Возможность добавления боев в избранное</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}