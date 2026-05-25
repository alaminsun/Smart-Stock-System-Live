export interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string;
    quantity: number;
    costPrice: number;
    salePrice: number;
    minStockLevel: number;
    categoryId: number;
    categoryName?: string;
    createdAt: Date;
}