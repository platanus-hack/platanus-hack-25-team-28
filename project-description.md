# 🛒 SuperTracker
### Scraper + RAG + Agente Claude para generar carros de compras

## 📌 Resumen del Proyecto
Este proyecto desarrolla un sistema que **scrapea productos desde 3 supermercados chilenos** y permite que un **agente LLM (Claude)**, apoyado por un sistema **RAG**, genere carritos de compra optimizados basados en *prompts escritos en lenguaje natural*.

Ejemplo de prompt:  
> *"Quiero hacer un asado con 5 amigos y un presupuesto de alrededor de 50.000."*

El agente interpreta la intención, sugiere categorías relevantes, busca productos reales en la base de datos y construye un carrito **personalizado por supermercado**.

---

## 🧠 Arquitectura del Sistema

### 1. Scrapers de Supermercados
El sistema integra scrapers de:

- **Jumbo**
- **Unimarc**
- **Lider**

Cada scraper extrae:

- Nombre del producto  
- Categoría  
- Marca  
- Precio actual  
- Unidad y tamaño  
- Descripción  
- SKU  
- Disponibilidad  
- Imagen  
- URL  
- Fecha de scraping  

---

### 2. Indexación con Embeddings (RAG)
Todos los productos scrapings se convierten en embeddings vectoriales, lo que permite:

- Búsqueda por similitud
- Filtrado por categoría inferida  
- Recomendaciones según intención del usuario  
- Uso de datos reales y actualizados

RAG conecta los prompts con productos concretos disponibles en cada supermercado.

---

### 3. Agente Inteligente (Claude + RAG)
Claude ejecuta:

1. **Interpretación del prompt** (intención, contexto, restricciones, dieta, presupuesto)
2. **Detección de categorías necesarias** (ej. asado → carnes, carbón, pan, bebidas)
3. **Consultas vectoriales** a la base de productos
4. **Optimización por precio/cantidad**
5. **Generación del carrito separado por supermercado**

El resultado es un carrito ajustado al presupuesto, basado en productos reales y específicos.

---

## 🛍️ Ejemplo de Flujo

Prompt:  
> **"Quiero hacer un asado con 5 amigos y un presupuesto de alrededor de 50.000"**

### 🛒 Carrito recomendado — Jumbo
| Producto | Cantidad | Precio unitario | Total |
|----------|----------|-----------------|--------|
| Asado de tira 1kg | 1 | $12.990 | $12.990 |
| Longanizas | 2 | $3.290 | $6.580 |
| Pan frica | 2 | $1.890 | $3.780 |
| Bebidas 2L | 3 | $1.600 | $4.800 |
| Carbón 3kg | 1 | $3.990 | $3.990 |
| **Total** | | | **$32.140** |

Se generan carritos similares para **Unimarc** y **Lider**.

---

## 🎯 Objetivo del Proyecto
Crear un asistente inteligente capaz de:

- Cotizador de supermercados
- Generar carros de supermercados inteligentes con lenguaje natural

---