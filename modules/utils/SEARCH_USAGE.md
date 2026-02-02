# Función de Búsqueda Normalizada - Guía de Uso

La función `normalizeSearchText` permite realizar búsquedas flexibles que no distinguen entre:
- Acentos y no acentos (á = a, é = e, etc.)
- Mayúsculas y minúsculas
- ñ y n
- b y v (Barcelona = Varcelona)
- z, c (antes de e/i) y s (casa ≈ kasa, zapato ≈ sapato)
- y y ll (llave = yave)

## Uso Básico

### Desde NRDCommon (CDN)

```javascript
// La función está disponible globalmente después de cargar NRDCommon
const normalized = normalizeSearchText('José Muñoz');
// Resultado: "jose munoz"

// O desde el objeto NRDCommon
const normalized = window.NRDCommon.normalizeSearchText('José Muñoz');
```

### Ejemplo de Filtrado en un Módulo

```javascript
// Ejemplo: Filtrar productos
function filterProducts(products, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return products;
  
  const normalizedTerm = normalizeSearchText(searchTerm.trim());
  
  return products.filter(product => {
    const name = normalizeSearchText(product.name || '');
    const sku = normalizeSearchText(product.sku || '');
    
    return name.includes(normalizedTerm) || sku.includes(normalizedTerm);
  });
}
```

### Ejemplo Completo: Reemplazar búsqueda existente

**Antes:**
```javascript
if (productsSearchTerm.trim()) {
  const searchLower = productsSearchTerm.toLowerCase().trim();
  productsToShow = productsToShow.filter(([id, product]) => {
    const name = (product.name || '').toLowerCase();
    return name.includes(searchLower);
  });
}
```

**Después:**
```javascript
if (productsSearchTerm.trim()) {
  const normalizedTerm = normalizeSearchText(productsSearchTerm.trim());
  productsToShow = productsToShow.filter(([id, product]) => {
    const name = normalizeSearchText(product.name || '');
    return name.includes(normalizedTerm);
  });
}
```

## Funciones Disponibles

### `normalizeSearchText(text)`
Normaliza un texto para búsqueda flexible.

**Parámetros:**
- `text` (string): Texto a normalizar

**Retorna:**
- `string`: Texto normalizado

**Ejemplos:**
```javascript
normalizeSearchText('José') === normalizeSearchText('jose') // true
normalizeSearchText('Muñoz') === normalizeSearchText('munoz') // true
normalizeSearchText('Barcelona') === normalizeSearchText('Varcelona') // true
normalizeSearchText('llave') === normalizeSearchText('yave') // true
```

### `matchesSearch(text, searchTerm)`
Verifica si un texto coincide con un término de búsqueda.

**Parámetros:**
- `text` (string): Texto en el que buscar
- `searchTerm` (string): Término de búsqueda

**Retorna:**
- `boolean`: `true` si el texto contiene el término

**Ejemplos:**
```javascript
matchesSearch('José Muñoz', 'jose') // true
matchesSearch('Barcelona', 'Varcelona') // true
matchesSearch('llave', 'yave') // true
```

### `filterBySearch(items, searchTerm, fields)`
Filtra un array de items por un término de búsqueda.

**Parámetros:**
- `items` (Array): Array de items a filtrar
- `searchTerm` (string): Término de búsqueda
- `fields` (Array<string>|Function): Campos a buscar o función que retorna texto buscable

**Retorna:**
- `Array`: Array filtrado

**Ejemplos:**
```javascript
// Buscar en campos específicos
const filtered = filterBySearch(products, 'jose', ['name', 'sku']);

// Usar función personalizada
const filtered = filterBySearch(products, 'jose', (item) => {
  return `${item.name} ${item.description}`;
});
```

## Migración de Código Existente

Para migrar código existente que usa `toLowerCase()`:

1. **Reemplazar `toLowerCase()` por `normalizeSearchText()`**:
   ```javascript
   // Antes
   const searchLower = searchTerm.toLowerCase();
   const name = product.name.toLowerCase();
   
   // Después
   const normalizedTerm = normalizeSearchText(searchTerm);
   const name = normalizeSearchText(product.name);
   ```

2. **Actualizar comparaciones**:
   ```javascript
   // Antes
   if (name.includes(searchLower)) { ... }
   
   // Después
   if (name.includes(normalizedTerm)) { ... }
   ```

3. **Para múltiples campos**:
   ```javascript
   // Antes
   const searchLower = searchTerm.toLowerCase();
   return name.toLowerCase().includes(searchLower) || 
          sku.toLowerCase().includes(searchLower);
   
   // Después
   const normalizedTerm = normalizeSearchText(searchTerm);
   return normalizeSearchText(name).includes(normalizedTerm) || 
          normalizeSearchText(sku).includes(normalizedTerm);
   ```

## Casos de Uso Específicos

### Búsqueda en Tablas/Listas
```javascript
function filterTable(items, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return items;
  
  const normalizedTerm = normalizeSearchText(searchTerm.trim());
  
  return items.filter(item => {
    // Buscar en múltiples campos
    const fields = ['name', 'description', 'sku', 'email'];
    return fields.some(field => {
      const value = normalizeSearchText(String(item[field] || ''));
      return value.includes(normalizedTerm);
    });
  });
}
```

### Búsqueda con Múltiples Términos
```javascript
function filterByMultipleTerms(items, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return items;
  
  const terms = searchTerm.trim().split(/\s+/).map(term => 
    normalizeSearchText(term)
  );
  
  return items.filter(item => {
    const searchableText = normalizeSearchText(
      `${item.name} ${item.description}`
    );
    
    return terms.every(term => searchableText.includes(term));
  });
}
```

## Notas Importantes

1. **Rendimiento**: La normalización es rápida, pero para listas muy grandes (>1000 items), considera usar índices o debounce en el input de búsqueda.

2. **Consistencia**: Usa siempre `normalizeSearchText()` tanto para el término de búsqueda como para los textos a comparar.

3. **Espacios**: La función normaliza espacios múltiples a uno solo y recorta espacios al inicio/final.

4. **Valores nulos/undefined**: La función retorna string vacío para valores nulos o undefined, por lo que es seguro usarla directamente.
