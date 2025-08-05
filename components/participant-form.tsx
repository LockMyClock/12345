"use client"

import type React from "react"
import { useState } from "react"
import crypto from "crypto"
import type { Participant } from "../types/participant"

interface ParticipantFormProps {
  editingParticipant?: Participant
  onSubmit: (participant: Participant) => void
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({ editingParticipant, onSubmit }) => {
  const [formData, setFormData] = useState({
    lastName: editingParticipant?.lastName || "",
    firstName: editingParticipant?.firstName || "",
    middleName: editingParticipant?.middleName || "",
    birthDate: editingParticipant?.birthDate || "",
    gender: editingParticipant?.gender || "М",
    weight: editingParticipant?.weight || 0,
    belt: editingParticipant?.belt || "",
    level: editingParticipant?.level || "",
    disciplines: editingParticipant?.disciplines || [],
    club: editingParticipant?.club || "",
    rank: editingParticipant?.rank || "",
    danKyu: editingParticipant?.danKyu || "",
    purchase: editingParticipant?.purchase || "",
    kata: editingParticipant?.kata || "",
    cardGroupNumber: editingParticipant?.cardGroupNumber || "",
    favorite: editingParticipant?.favorite || "",
    trainer: editingParticipant?.trainer || "",
    organization: editingParticipant?.organization || "",
    countryCode: editingParticipant?.countryCode || "",
    territory: editingParticipant?.territory || "",
    city: editingParticipant?.city || "",
    fullName: "",
    age: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Generate full name from individual name parts if they exist
    const fullName =
      formData.fullName || [formData.lastName, formData.firstName, formData.middleName].filter(Boolean).join(" ")

    // Calculate age from birth date if provided
    let calculatedAge = formData.age || 0
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
    }

    const participantData: Participant = {
      id: editingParticipant?.id || crypto.randomUUID(),
      fullName,
      age: calculatedAge,
      gender: formData.gender || "М",
      weight: formData.weight || 0,
      belt: formData.belt || "",
      level: formData.level || "",
      disciplines: formData.disciplines || [],
      club: formData.club || "",
      lastName: formData.lastName || "",
      firstName: formData.firstName || "",
      middleName: formData.middleName || "",
      birthDate: formData.birthDate || "",
      rank: formData.rank || "",
      danKyu: formData.danKyu || "",
      purchase: formData.purchase || "",
      kata: formData.kata || "",
      cardGroupNumber: formData.cardGroupNumber || "",
      favorite: formData.favorite || "",
      trainer: formData.trainer || "",
      organization: formData.organization || "",
      countryCode: formData.countryCode || "",
      territory: formData.territory || "",
      city: formData.city || "",
      createdAt: editingParticipant?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSubmit(participantData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields here */}
      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
      <input
        type="text"
        name="middleName"
        value={formData.middleName}
        onChange={handleChange}
        placeholder="Middle Name"
      />
      <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} placeholder="Birth Date" />
      <select name="gender" value={formData.gender} onChange={handleChange}>
        <option value="М">Male</option>
        <option value="Ж">Female</option>
      </select>
      <input
        type="number"
        name="weight"
        value={formData.weight.toString()}
        onChange={handleChange}
        placeholder="Weight"
      />
      <input type="text" name="belt" value={formData.belt} onChange={handleChange} placeholder="Belt" />
      <input type="text" name="level" value={formData.level} onChange={handleChange} placeholder="Level" />
      <input type="text" name="club" value={formData.club} onChange={handleChange} placeholder="Club" />
      <input type="text" name="rank" value={formData.rank} onChange={handleChange} placeholder="Rank" />
      <input type="text" name="danKyu" value={formData.danKyu} onChange={handleChange} placeholder="Dan/Kyu" />
      <input type="text" name="purchase" value={formData.purchase} onChange={handleChange} placeholder="Purchase" />
      <input type="text" name="kata" value={formData.kata} onChange={handleChange} placeholder="Kata" />
      <input
        type="text"
        name="cardGroupNumber"
        value={formData.cardGroupNumber}
        onChange={handleChange}
        placeholder="Card Group Number"
      />
      <input type="text" name="favorite" value={formData.favorite} onChange={handleChange} placeholder="Favorite" />
      <input type="text" name="trainer" value={formData.trainer} onChange={handleChange} placeholder="Trainer" />
      <input
        type="text"
        name="organization"
        value={formData.organization}
        onChange={handleChange}
        placeholder="Organization"
      />
      <input
        type="text"
        name="countryCode"
        value={formData.countryCode}
        onChange={handleChange}
        placeholder="Country Code"
      />
      <input type="text" name="territory" value={formData.territory} onChange={handleChange} placeholder="Territory" />
      <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
      <button type="submit">Submit</button>
    </form>
  )
}

export default ParticipantForm
