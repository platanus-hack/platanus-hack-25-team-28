import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Doc } from "@/src/convex/_generated/dataModel"
import { ShoppingCart } from "lucide-react"

interface ProductCardProps {
  product: Doc<"products">
  // In a real app, we might pass the best price or user-specific data here
  bestPrice?: number 
  currency?: string
}

export function ProductCard({ product, bestPrice, currency = "$" }: ProductCardProps) {
  return (
    <Card className="w-full max-w-sm overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-square relative bg-muted/20">
        {/* Placeholder for image since we don't have real storage URLs yet */}
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 text-4xl font-bold select-none">
          {product.name.charAt(0)}
        </div>
        {product.imageId && (
          // Ideally use Next.js Image or a storage URL component here
          // <img src={url} alt={product.name} className="object-cover w-full h-full" />
          <span className="sr-only">Image available</span>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            {product.brand && (
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {product.brand}
              </p>
            )}
            <CardTitle className="text-lg font-semibold leading-tight">
              {product.name}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {product.quantity} {product.unit}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] px-2 h-5">
              {tag}
            </Badge>
          ))}
        </div>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t bg-muted/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Best Price</span>
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

