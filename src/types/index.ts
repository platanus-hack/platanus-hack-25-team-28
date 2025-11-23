export type StoreName = "Lider" | "Unimarc" | "Jumbo"

export interface LiderProduct {
  name: string
  sku: string
  url: string
  price: number
  imageUrl: string
  category: string
  store: StoreName
  date: string
}

export type CartItem = LiderProduct & {
  quantity: number
}
