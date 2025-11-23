"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { StoreName } from "@/types"
import { formatCurrency } from "@/utils/cartUtils"
import { useMutation, useQuery } from "convex/react"
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShoppingBag,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function SectionHeader({
  title,
  icon: Icon,
}: {
  title: string
  icon?: React.ElementType
}) {
  return (
    <div className="relative -mx-2 mb-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50/80 to-white/50 px-4 py-3 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-primary/5 to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300/60 to-gray-300/60" />
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent-primary/20 blur-sm" />
                <div className="relative rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-primary/8 p-1.5 ring-1 ring-accent-primary/10">
                  <Icon className="h-3 w-3 text-accent-primary" />
                </div>
              </div>
            )}
            <h3 className="text-xs font-bold tracking-[0.15em] text-text-main uppercase">
              {title}
            </h3>
            {Icon && (
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent-primary/20 blur-sm" />
                <div className="relative rounded-full bg-gradient-to-br from-accent-primary/15 to-accent-primary/8 p-1.5 ring-1 ring-accent-primary/10">
                  <Icon className="h-3 w-3 text-accent-primary" />
                </div>
              </div>
            )}
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-gray-300/60 via-gray-300/60 to-transparent" />
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [cartId, setCartId] = useState<Id<"carts"> | null>(null)
  const [isCreatingCart, setIsCreatingCart] = useState(false)
  const createCart = useMutation(api.carts.createCart)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCartId = sessionStorage.getItem("checkoutCartId")
      if (storedCartId) {
        setCartId(storedCartId as Id<"carts">)
      } else {
        const pendingCheckout = sessionStorage.getItem("pendingCheckout")
        if (pendingCheckout) {
          const createPendingCart = async () => {
            try {
              setIsCreatingCart(true)
              const { storeName, items } = JSON.parse(pendingCheckout)
              const result = await createCart({
                storeName,
                items,
              })
              if (result?.cartId) {
                sessionStorage.removeItem("pendingCheckout")
                sessionStorage.setItem("checkoutCartId", result.cartId)
                setCartId(result.cartId)
              }
            } catch (error) {
              console.error("Error creating cart from pending checkout:", error)
            } finally {
              setIsCreatingCart(false)
            }
          }
          createPendingCart()
        }
      }
    }
  }, [createCart])

  const cart = useQuery(api.carts.getCartById, cartId ? { cartId } : "skip")

  if (isCreatingCart) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <p className="text-text-muted">Creando tu carrito...</p>
        </div>
      </div>
    )
  }

  if (!cartId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-text-main">
            No hay carrito seleccionado
          </h1>
          <p className="text-text-muted">
            Por favor, selecciona productos y haz clic en "Ir a pagar"
          </p>
        </div>
      </div>
    )
  }

  if (cart === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <p className="text-text-muted">Cargando carrito...</p>
        </div>
      </div>
    )
  }

  if (cart === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-text-main">
            Carrito no encontrado
          </h1>
          <p className="text-text-muted">
            El carrito que buscas no existe o ha expirado
          </p>
        </div>
      </div>
    )
  }

  const cartItems = cart.items.map((item) => ({
    name: item.name,
    sku: item.externalSku,
    url: "#",
    price: item.price,
    imageUrl: item.imageUrl || "https://via.placeholder.com/80",
    category: item.category || "Otros",
    store: cart.storeName as StoreName,
    date: new Date(cart.createdAt).toISOString(),
    quantity: item.quantity,
  }))

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const shipping = 0
  const total = subtotal + shipping

  const handleGoBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-4 -ml-2 flex items-center gap-2 text-text-muted hover:text-text-main"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al chat
          </Button>
          <h1 className="text-4xl font-bold tracking-tight text-text-main">
            Finalizar compra
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Completa la información para procesar tu pedido
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left Column - Forms */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <SectionHeader title="Información de contacto" icon={Mail} />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label variant="required" htmlFor="email">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Teléfono (opcional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <SectionHeader title="Dirección de envío" icon={MapPin} />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label variant="required" htmlFor="fullName">
                    Nombre completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label variant="required" htmlFor="address1">
                    Dirección
                  </Label>
                  <Input
                    id="address1"
                    type="text"
                    placeholder="Calle y número"
                    className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address2">
                    Departamento, oficina, etc. (opcional)
                  </Label>
                  <Input
                    id="address2"
                    type="text"
                    placeholder="Depto 101"
                    className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label variant="required" htmlFor="city">
                      Ciudad
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Santiago"
                      className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label variant="required" htmlFor="postalCode">
                      Código postal
                    </Label>
                    <Input
                      id="postalCode"
                      type="text"
                      placeholder="8320000"
                      className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label variant="required" htmlFor="region">
                    Región
                  </Label>
                  <Input
                    id="region"
                    type="text"
                    placeholder="Región Metropolitana"
                    className="rounded-lg border-gray-200 bg-white transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <SectionHeader title="Método de pago" icon={CreditCard} />
              <div className="space-y-3">
                <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-accent-primary/50 hover:bg-accent-primary/5 has-[:checked]:border-accent-primary has-[:checked]:bg-accent-primary/10 has-[:checked]:shadow-md">
                  <input
                    type="radio"
                    name="payment"
                    value="credit-card"
                    checked={paymentMethod === "credit-card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 cursor-pointer text-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-offset-2"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-text-main">
                      Tarjeta de crédito
                    </div>
                    <div className="mt-1 text-sm text-text-muted">
                      Visa, Mastercard, American Express
                    </div>
                  </div>
                </label>

                <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-accent-primary/50 hover:bg-accent-primary/5 has-[:checked]:border-accent-primary has-[:checked]:bg-accent-primary/10 has-[:checked]:shadow-md">
                  <input
                    type="radio"
                    name="payment"
                    value="debit-card"
                    checked={paymentMethod === "debit-card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 cursor-pointer text-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-offset-2"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-text-main">
                      Tarjeta de débito
                    </div>
                    <div className="mt-1 text-sm text-text-muted">
                      Redcompra, Maestro
                    </div>
                  </div>
                </label>

                <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-accent-primary/50 hover:bg-accent-primary/5 has-[:checked]:border-accent-primary has-[:checked]:bg-accent-primary/10 has-[:checked]:shadow-md">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === "transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 cursor-pointer text-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-offset-2"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-text-main">
                      Transferencia bancaria
                    </div>
                    <div className="mt-1 text-sm text-text-muted">
                      Pago directo desde tu banco
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Place Order Button */}
            <div className="sticky bottom-4 lg:static">
              <Button
                size="lg"
                className="w-full rounded-xl bg-black py-4 text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95"
              >
                Realizar pedido
              </Button>
              <p className="mt-3 text-center text-xs text-text-muted">
                Al continuar, aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-lg backdrop-blur-sm">
              <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50/80 to-white/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/10">
                      <ShoppingBag className="h-5 w-5 text-accent-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-text-main">
                      Resumen del pedido
                    </h2>
                  </div>
                  <div className="rounded-full bg-accent-primary/10 px-3 py-1.5 text-xs font-bold text-accent-primary">
                    {cart.storeName}
                  </div>
                </div>
              </div>

              <div className="p-0">
                {/* Items List */}
                <div className="max-h-[400px] space-y-4 overflow-y-auto p-6">
                  {cartItems.map((item, index) => (
                    <div
                      key={item.sku}
                      className={`group flex gap-4 rounded-xl border p-3 transition-all ${
                        index < cartItems.length - 1
                          ? "border-b border-gray-100 pb-4"
                          : "border-transparent"
                      } hover:border-gray-200 hover:bg-gray-50/50`}
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white p-1 shadow-sm">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-text-main">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          Cantidad: {item.quantity}
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-text-main">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50/80 to-white/50 p-6 backdrop-blur-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Subtotal</span>
                      <span className="font-semibold text-text-main">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Envío</span>
                      <span className="font-semibold text-accent-success">
                        Gratis
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-end justify-between">
                        <span className="text-lg font-bold text-text-main">
                          Total
                        </span>
                        <span className="text-3xl font-bold text-text-main">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Badges */}
                  <div className="mt-6 flex items-center justify-center gap-6 text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-success/10">
                        <Lock className="h-3 w-3 text-accent-success" />
                      </div>
                      <span>Pago seguro</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/10">
                        <Shield className="h-3 w-3 text-accent-primary" />
                      </div>
                      <span>SSL encriptado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
