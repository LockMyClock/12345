"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@chakra-ui/react"
import { Edit } from "react-feather"
import type { Participant } from "./types" // Assuming Participant type is defined elsewhere

const ParticipantsTable: React.FC<{ participants: Participant[] }> = ({ participants }) => {
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleEdit = (participant: Participant) => {
    setEditingParticipant({
      ...participant,
      lastName: participant.lastName || "",
      firstName: participant.firstName || "",
      middleName: participant.middleName || "",
      birthDate: participant.birthDate || "",
      rank: participant.rank || "",
      danKyu: participant.danKyu || "",
      purchase: participant.purchase || "",
      kata: participant.kata || "",
      cardGroupNumber: participant.cardGroupNumber || "",
      favorite: participant.favorite || "",
      trainer: participant.trainer || "",
      organization: participant.organization || "",
      countryCode: participant.countryCode || "",
      territory: participant.territory || "",
      city: participant.city || "",
    })
    setIsFormOpen(true)
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Last Name</th>
          <th>First Name</th>
          <th>Middle Name</th>
          <th>Birth Date</th>
          <th>Rank</th>
          <th>Dan Kyu</th>
          <th>Purchase</th>
          <th>Kata</th>
          <th>Card Group Number</th>
          <th>Favorite</th>
          <th>Trainer</th>
          <th>Organization</th>
          <th>Country Code</th>
          <th>Territory</th>
          <th>City</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {participants.map((participant) => (
          <tr key={participant.id}>
            <td>{participant.lastName}</td>
            <td>{participant.firstName}</td>
            <td>{participant.middleName}</td>
            <td>{participant.birthDate}</td>
            <td>{participant.rank}</td>
            <td>{participant.danKyu}</td>
            <td>{participant.purchase}</td>
            <td>{participant.kata}</td>
            <td>{participant.cardGroupNumber}</td>
            <td>{participant.favorite}</td>
            <td>{participant.trainer}</td>
            <td>{participant.organization}</td>
            <td>{participant.countryCode}</td>
            <td>{participant.territory}</td>
            <td>{participant.city}</td>
            <td>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(participant)}>
                <Edit className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ParticipantsTable
