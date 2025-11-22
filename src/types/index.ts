export interface LiderProduct {
  name: string
  sku: string
  url: string
  price: number
  imageUrl: string
  category: string
  store: string
  date: string
}

export type CartItem = LiderProduct & {
  quantity: number
}
