"use client"
import XLSX from "xlsx"
import { format } from "date-fns"

const ExportDialog = ({ participants }) => {
  const exportToExcel = () => {
    const exportData = participants.map((participant, index) => ({
      "№": index + 1,
      Фамилия: participant.lastName || "",
      Имя: participant.firstName || "",
      Отчество: participant.middleName || "",
      Пол: participant.gender,
      "Дата рождения": participant.birthDate || "",
      Разряд: participant.rank || "",
      "Дан/Кю": participant.danKyu || "",
      Вес: participant.weight,
      Купите: participant.purchase || "",
      Ката: participant.kata || "",
      "Номер карт-группы": participant.cardGroupNumber || "",
      Фаворит: participant.favorite || "",
      Тренер: participant.trainer || "",
      Организация: participant.organization || "",
      "Код страны": participant.countryCode || "",
      Территория: participant.territory || "",
      Город: participant.city || "",
      ФИО: participant.fullName,
      Возраст: participant.age,
      Пояс: participant.belt,
      Уровень: participant.level,
      Дисциплины: participant.disciplines.join(", "),
      Клуб: participant.club,
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Участники")

    const fileName = `participants_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div>
      <button onClick={exportToExcel}>Экспортировать в Excel</button>
    </div>
  )
}

export default ExportDialog
