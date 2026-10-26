import { images } from "@/lib/images"

export type Settings = {
  shopName: string
  announcement: string
  heroTitle: string
  heroSubtitle: string
  /** Hero background image: a remote URL or an uploaded `/uploads/...` path. */
  heroImage: string
  /** Page background colour as a hex value. */
  backgroundColor: string
  aboutTitle: string
  aboutMe: string
  telegram: string
}

export type Profile = {
  name: string
  title: string
  email: string
  phone: string
  avatar: string
}

export const defaultSettings: Settings = {
  shopName: "AURA Studio",
  announcement: "ដឹកជញ្ជូនរហ័សឥតគិតថ្លៃ សម្រាប់ការបញ្ជាទិញលើស $២៥០ • កម្រងរដូវ ២០២៥ បានដាក់លក់ហើយ",
  heroTitle: "តុល្យភាពដ៏អស់កល្ប",
  heroSubtitle:
    "ការកាត់ដេររាងចម្លាក់ ជួបនឹងក្រណាត់ធម្មជាតិដ៏ទន់រលោង ផលិតនៅរោងត្បាញដៃគូឯកជនរបស់យើងក្នុងទីក្រុងប៊ីយ៉ែឡា និងក្យូតូ។",
  heroImage: images.home[0],
  backgroundColor: "#f8f9fa",
  aboutTitle: "អំពីយើង",
  aboutMe:
    "ឧទ្ទិសដល់ភាពប្រណីតបែបស្ថាបត្យកម្មដ៏ស្ងប់ស្ងាត់ ទម្រង់មានវិន័យ និងភាពទំនើបដែលអាចប៉ះពាល់បាន។ ផលិតដោយក្រមសីលធម៌ នៅអាតេលីយេឯកជនរបស់យើងក្នុងទីក្រុងប៉ារីស និងមីឡាន។",
  telegram: "your_shop_username",
}

export const defaultProfile: Profile = {
  name: "ម្ចាស់ហាង",
  title: "ស្ថាបនិក និងអ្នករចនាម៉ូដ",
  email: "admin@example.com",
  phone: "",
  avatar: "",
}

export const backgroundPresets = [
  { value: "#f8f9fa", label: "សក្រែម" },
  { value: "#ffffff", label: "សសុទ្ធ" },
  { value: "#f5f0ea", label: "កាស្មៀរ" },
  { value: "#eef1f4", label: "ប្រផេះស្រាល" },
  { value: "#f3efe6", label: "ខ្សាច់" },
]
