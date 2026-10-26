import { images } from "@/lib/images"

export type Category = "women" | "men" | "accessories" | "best-sellers"

export type Product = {
  id: string
  name: string
  price: number
  description: string
  /** Short material / edition tag shown on the card image. */
  badge?: string
  badgeTone?: "gold" | "neutral"
  /** Workshop label used on "complete the look" cards. */
  atelier: string
  categories: Category[]
  images: string[]
  /** Pieces left in the current serialized cut. */
  stock: number
}

export const categories: { value: "all" | Category; label: string }[] = [
  { value: "all", label: "ទាំងអស់" },
  { value: "women", label: "នារី" },
  { value: "men", label: "បុរស" },
  { value: "accessories", label: "គ្រឿងបន្លាស់" },
  { value: "best-sellers", label: "លក់ដាច់បំផុត" },
]

export const sortOptions = [
  { value: "curated", label: "ជ្រើសរើសពិសេស" },
  { value: "price-asc", label: "តម្លៃ៖ ទាបទៅខ្ពស់" },
  { value: "price-desc", label: "តម្លៃ៖ ខ្ពស់ទៅទាប" },
] as const

export type SortValue = (typeof sortOptions)[number]["value"]

export const sizes = [
  { value: "S", hint: "ទំហំ ៣៨–៤០" },
  { value: "M", hint: "ទំហំ ៤២–៤៤" },
  { value: "L", hint: "ទំហំ ៤៦–៤៨" },
  { value: "XL", hint: "ទំហំ ៥០" },
] as const

export type Size = (typeof sizes)[number]["value"]

const { home, cat, pdp } = images

export const defaultProducts: Product[] = [
  {
    id: "atelier-belted-cashmere-coat",
    name: "អាវធំកាស្មៀរមានខ្សែក្រវាត់",
    price: 890,
    description:
      "ត្បាញពីកាស្មៀរម៉ុងហ្គោលីថ្នាក់ A ជាមួយផ្ទាំងការពារភ្លៀងបែបស្ថាបត្យកម្ម និងឡេវស្នែងធម្មជាតិ គ្មានស្រទាប់ក្នុង។",
    badge: "កាស្មៀរសុទ្ធ",
    badgeTone: "gold",
    atelier: "អាតេលីយេ ប៊ីយ៉ែឡា",
    categories: ["women", "best-sellers"],
    images: [pdp[0], pdp[1], pdp[2], pdp[3], pdp[4], home[1]],
    stock: 3,
  },
  {
    id: "sculpted-hourglass-overcoat",
    name: "អាវធំរាងនាឡិកាខ្សាច់",
    price: 680,
    description:
      "រោមចៀមអ៊ីតាលីបរិសុទ្ធ កាត់ដេរយ៉ាងល្អិតល្អន់ ចង្កេះរួម និងស្រទាប់ដៃអាវសូត្ររលោង។",
    badge: "កម្រង រដូវ២០២៥",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោមីឡាន",
    categories: ["women"],
    images: [home[2]],
    stock: 6,
  },
  {
    id: "kyoto-bias-cut-silk-gown",
    name: "រ៉ូបសូត្រកាត់ទ្រេតក្យូតូ",
    price: 420,
    description:
      "សូត្រ សាម៉ឺស ក្រាស់ ២២ មីលីម៉ែត្រ ធ្លាក់ទន់តាមរាងកាយធម្មជាតិ ដេរថ្នេរបែបបារាំង។",
    badge: "សូត្រមន ១០០%",
    badgeTone: "gold",
    atelier: "ស្ទូឌីយោក្យូតូ",
    categories: ["women", "best-sellers"],
    images: [home[3], pdp[5]],
    stock: 8,
  },
  {
    id: "architectural-wool-blazer",
    name: "អាវក្រៅរោមចៀមបែបស្ថាបត្យកម្ម",
    price: 750,
    description:
      "រោមចៀម វ៉ូស្ទេត ត្បាញពិសេសពី ប៊ីយ៉ែឡា រៀបរចនាសម្ព័ន្ធដោយក្រណាត់សក់សេះស្រាលនៅផ្នែកទ្រូង។",
    badge: "ផលិតចំនួនកំណត់",
    badgeTone: "neutral",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["men", "best-sellers"],
    images: [home[4]],
    stock: 4,
  },
  {
    id: "pleated-studio-trouser",
    name: "ខោជីបស្ទូឌីយោ",
    price: 380,
    description:
      "ខោចង្កេះខ្ពស់ មានជីបពីរជាន់ខាងមុខ ផលិតពីកប្បាស ហ្គាបាឌីន ក្រាស់ ធ្លាក់ស្អាត។",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["men"],
    images: [home[5], pdp[7]],
    stock: 10,
  },
  {
    id: "architectural-leather-tote",
    name: "កាបូបស្បែកបែបស្ថាបត្យកម្ម",
    price: 540,
    description:
      "ស្បែកកូនគោពេញគ្រាប់ សម្លាប់ដោយរុក្ខជាតិ គែមលាបដោយដៃដោយសិប្បករជំនាញនៅ ផ្លរ៉ង់។",
    badge: "ស្បែកតូស្កានី",
    badgeTone: "gold",
    atelier: "អាតេលីយេស្បែក",
    categories: ["accessories", "best-sellers"],
    images: [home[6], pdp[6]],
    stock: 5,
  },
  {
    id: "chunky-alpaca-rib-pullover",
    name: "អាវយឺតអាល់ប៉ាកាក្រាស់",
    price: 490,
    description:
      "អំបោះអាល់ប៉ាកាកូនពីប៉េរូ រវៃដោយដៃ ស្មាធ្លាក់ និងកអាវក្រាស់បែបអ្នកនេសាទ។",
    atelier: "ស្ទូឌីយោត្បាញ",
    categories: ["women"],
    images: [home[7], cat[5]],
    stock: 7,
  },
  {
    id: "raw-fringe-cashmere-scarf",
    name: "កន្សែងកាស្មៀររំយោល",
    price: 310,
    description:
      "កាស្មៀរម៉ុងហ្គោលីត្បាញស្តើងស្រាល ព័ទ្ធជុំវិញដោយរំយោលធម្មជាតិទាញដោយដៃ។",
    atelier: "ស្ទូឌីយោត្បាញ",
    categories: ["accessories"],
    images: [home[8], cat[11]],
    stock: 12,
  },
  {
    id: "brutalist-blazer",
    name: "អាវក្រៅ ប្រ៊ូតាលីស្ត",
    price: 1120,
    description:
      "អាវក្រៅពណ៌ធ្យូងងងឹត ឡេវមួយជួរ ស្មាមុតស្រួចបែបប៉ាហ្គោដា សម្រាប់រូបរាងរឹងមាំ។",
    badge: "រោមចៀមវ៉ូស្ទេត",
    badgeTone: "neutral",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["men"],
    images: [cat[1]],
    stock: 4,
  },
  {
    id: "hourglass-melange-coat",
    name: "អាវធំ មេឡង់ ចង្កេះរួម",
    price: 1620,
    description:
      "រោមចៀម មែលតុន ពណ៌កាហ្វេ ចង្កេះរួមបែបចម្លាក់ សម្រាប់រដូវត្រជាក់ដ៏ប្រណីត។",
    badge: "នៅសល់ ៣",
    badgeTone: "gold",
    atelier: "ស្ទូឌីយោមីឡាន",
    categories: ["women", "best-sellers"],
    images: [cat[2]],
    stock: 3,
  },
  {
    id: "monolith-vachetta-tote",
    name: "កាបូប វ៉ាឆេតា ម៉ូណូលីត",
    price: 1420,
    description:
      "ស្បែកតូស្កានីពណ៌ កូញ៉ាក់ ងងឹត សម្លាប់ដោយរុក្ខជាតិ គែមកាត់ឆៅ រាងស្អាតសាមញ្ញ។",
    badge: "ស្បែកតូស្កានី",
    badgeTone: "gold",
    atelier: "អាតេលីយេស្បែក",
    categories: ["accessories"],
    images: [cat[6]],
    stock: 2,
  },
  {
    id: "funnel-collar-tunic",
    name: "អាវវែងកខ្ពស់",
    price: 790,
    description:
      "កាស្មៀរពណ៌ប្រផេះថ្ម កខ្ពស់ មានចំហៀងបើកតិចៗ រចនាបែបស្ថាបត្យកម្មសាមញ្ញ។",
    badge: "កាស្មៀរម៉ុងហ្គោលី",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោត្បាញ",
    categories: ["women"],
    images: [cat[7]],
    stock: 6,
  },
  {
    id: "monastic-gabardine-trench",
    name: "អាវធំការពារភ្លៀង ហ្គាបាឌីន",
    price: 1380,
    description:
      "កប្បាស ហ្គាបាឌីន ការពារទឹក ពណ៌អូលីវថ្ម ខ្សែបន្ទាត់ស្អាត និងឡេវស្នែង។",
    badge: "កប្បាស ហ្គាបាឌីន",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោមីឡាន",
    categories: ["men", "best-sellers"],
    images: [cat[8]],
    stock: 5,
  },
  {
    id: "calico-sculpted-shirt",
    name: "អាវសឺមីកប្បាសរាងចម្លាក់",
    price: 380,
    description:
      "កប្បាសក្រាស់ដូចក្រដាស ពណ៌សដីស ឡេវលាក់ និងស្មាធ្លាក់បែបទំនើប។",
    badge: "កប្បាសស្វីស",
    badgeTone: "neutral",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["women"],
    images: [cat[9]],
    stock: 9,
  },
  {
    id: "crepe-cigarette-trouser",
    name: "ខោជើងតូច ក្រេប",
    price: 460,
    description:
      "រោមចៀម ក្រេប ខ្មៅក្រាស់ ជើងខោតូចត្រឹមកជើង សមនឹងស្បែកជើងស្បែកសាមញ្ញ។",
    badge: "នៅសល់ ២",
    badgeTone: "gold",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["women"],
    images: [cat[10]],
    stock: 2,
  },
  {
    id: "folded-envelope-folio",
    name: "កាបូបឯកសារស្បែករាងស្រោមសំបុត្រ",
    price: 420,
    description:
      "ស្បែកខ្មៅរលោង ចុះលេខស៊េរីតិចៗ គែមខាត់ដោយដៃ សម្រាប់ឯកសារសំខាន់ៗ។",
    badge: "ស្បែកតូស្កានី",
    badgeTone: "neutral",
    atelier: "អាតេលីយេស្បែក",
    categories: ["accessories"],
    images: [cat[12]],
    stock: 8,
  },
  {
    id: "habotai-atelier-shirt",
    name: "អាវសឺមីសូត្រ ហាបូតៃ",
    price: 510,
    description:
      "សូត្រឆៅពណ៌ក្រែម ភ្លឺរលោងតិចៗ ស្មាធូររលុង ស្រាលស្រួលពាក់គ្រប់រដូវ។",
    badge: "សូត្រ ហាបូតៃ",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោក្យូតូ",
    categories: ["women"],
    images: [cat[13]],
    stock: 7,
  },
  {
    id: "wide-palazzo-pant",
    name: "ខោជើងធំ ប៉ាឡាហ្សូ",
    price: 620,
    description:
      "រោមចៀមពណ៌អូដ្ឋងងឹត ជើងខោធំខ្លាំង ជីបមុតស្រួច ធ្លាក់ស្អាតពេលដើរ។",
    badge: "រោមចៀមបរិសុទ្ធ",
    badgeTone: "neutral",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["women", "best-sellers"],
    images: [cat[14]],
    stock: 5,
  },
  {
    id: "monolith-db-jacket",
    name: "អាវក្រៅឡេវពីរជួរ ម៉ូណូលីត",
    price: 1290,
    description:
      "ពណ៌ខៀវកណ្ដាលអធ្រាត្រ កអាវស្រួច ឡេវពីរជួរ រាងមុតស្រួចសម្រាប់ពិធីផ្លូវការ។",
    badge: "រោមចៀម ប៊ីយ៉ែឡា",
    badgeTone: "neutral",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["men"],
    images: [cat[15]],
    stock: 4,
  },
  {
    id: "18-gauge-mockneck",
    name: "អាវយឺតកខ្លី ១៨ ហ្គេច",
    price: 440,
    description:
      "កាស្មៀរខ្មៅល្អិត ត្បាញក្រាស់ ១៨ ហ្គេច សមរាងកាយ ពាក់តែឯង ឬពាក់ក្រោមអាវក្រៅ។",
    badge: "កាស្មៀរល្អិត",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោត្បាញ",
    categories: ["men"],
    images: [cat[16]],
    stock: 10,
  },
  {
    id: "kakishibu-linen-overshirt",
    name: "អាវសឺមីក្រៅក្រណាត់ទេសឯក កាគីស៊ីប៊ូ",
    price: 690,
    description:
      "ក្រណាត់ទេសឯកសរីរាង្គក្រាស់ ជ្រលក់ពណ៌ដោយដៃពីផ្លែទន្លាប់ជប៉ុន ផ្ដល់ពណ៌ដីក្រហមស្រទន់។",
    badge: "ជ្រលក់ពណ៌រុក្ខជាតិ",
    badgeTone: "gold",
    atelier: "ស្ទូឌីយោក្យូតូ",
    categories: ["men"],
    images: [cat[17]],
    stock: 6,
  },
  {
    id: "column-architectural-skirt",
    name: "សំពត់វែងរាងសសរ",
    price: 480,
    description:
      "សំពត់ចង្កេះខ្ពស់ វែងដល់ដី ពីរោមចៀមពណ៌ធ្យូង ថ្នេរបញ្ឈរមុតស្រួច។",
    badge: "រោមចៀមរឹង",
    badgeTone: "neutral",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["women"],
    images: [cat[18]],
    stock: 7,
  },
  {
    id: "shearling-cocoon-vest",
    name: "អាវកាក់រោមចៀមរាងដូង",
    price: 1550,
    description:
      "រោមចៀមរួញអេស្ប៉ាញពណ៌ក្រែម ផ្នែកខាងក្រោយស្បែក ស្វេដ កអាវរាងចម្លាក់។",
    badge: "នៅសល់ ១",
    badgeTone: "gold",
    atelier: "អាតេលីយេស្បែក",
    categories: ["women"],
    images: [cat[19]],
    stock: 1,
  },
  {
    id: "asymmetric-silk-tunic",
    name: "អាវវែងសូត្រមិនស៊ីមេទ្រី",
    price: 530,
    description:
      "សូត្រ ចចជីត ខ្មៅ ដៃអាវម្ខាងធ្លាក់ទន់ដូចស្លាប រចនាប្រណីតស្ងប់ស្ងាត់។",
    badge: "សូត្រ ចចជីត",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោក្យូតូ",
    categories: ["women"],
    images: [cat[20]],
    stock: 6,
  },
  {
    id: "two-tone-split-scarf",
    name: "កន្សែងកាស្មៀរពីរពណ៌",
    price: 350,
    description:
      "កាស្មៀរពាក់បានទាំងពីរមុខ ពណ៌ប្រផេះ ក្រាហ្វីត និងពណ៌ខ្សាច់ គែមបត់ស្អាត។",
    badge: "កាស្មៀរ",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោត្បាញ",
    categories: ["accessories"],
    images: [cat[21]],
    stock: 11,
  },
  {
    id: "selvedge-loom-trouser",
    name: "ខោរោមចៀម សែលវេជ",
    price: 580,
    description:
      "រោមចៀមធម្មជាតិមិនជ្រលក់ពណ៌ ក្រាស់ វាយនភាពឆៅតិចៗ ជើងខោតូចចុះក្រោម។",
    badge: "រោមចៀម សែលវេជ",
    badgeTone: "neutral",
    atelier: "សាឡុងកាត់ដេរ",
    categories: ["men"],
    images: [cat[22]],
    stock: 8,
  },
  {
    id: "collarless-boiled-cardigan",
    name: "អាវរងាគ្មានក រោមចៀមស្ងោរ",
    price: 640,
    description:
      "រោមចៀមស្ងោរពណ៌ធ្យូងប្រផេះ ត្បាញក្រាស់ គ្មានក និងឡេវស្នែងធម្មជាតិ។",
    badge: "រោមចៀមស្ងោរ",
    badgeTone: "neutral",
    atelier: "ស្ទូឌីយោត្បាញ",
    categories: ["men"],
    images: [cat[23]],
    stock: 6,
  },
]

export function filterAndSort(
  list: Product[],
  category: "all" | Category,
  sort: SortValue
) {
  const filtered =
    category === "all"
      ? list
      : list.filter((p) => p.categories.includes(category))
  if (sort === "price-asc") return [...filtered].sort((a, b) => a.price - b.price)
  if (sort === "price-desc") return [...filtered].sort((a, b) => b.price - a.price)
  return filtered
}

export const editorialImages = {
  fiber: home[9],
  cutting: home[10],
}
