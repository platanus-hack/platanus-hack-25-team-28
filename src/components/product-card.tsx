import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Doc } from "@/convex/_generated/dataModel"
import { ShoppingCart } from "lucide-react"
import Image from "next/image"

interface ProductCardProps {
  product: Doc<"products">
  // In a real app, we might pass the best price or user-specific data here
  bestPrice?: number
  currency?: string
}

export function ProductCard({
  product,
  bestPrice,
  currency = "$",
}: ProductCardProps) {
  return (
    <Card className="w-full max-w-sm overflow-hidden transition-all hover:shadow-lg">
      <div className="bg-muted/20 relative aspect-square overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="text-muted-foreground/20 absolute inset-0 flex items-center justify-center text-4xl font-bold select-none">
            {product.name.charAt(0)}
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {product.brand && (
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {product.brand}
              </p>
            )}
            <CardTitle className="text-lg leading-tight font-semibold">
              {product.name}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {product.quantity} {product.unit}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="mb-3 flex flex-wrap gap-1">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="h-5 px-2 text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
        {product.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {product.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="bg-muted/5 flex items-center justify-between border-t p-4">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs">Best Price</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">
              {bestPrice ? `${currency}${bestPrice.toFixed(2)}` : "N/A"}
            </span>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add
        </Button>
      </CardFooter>
    </Card>
  )
}
