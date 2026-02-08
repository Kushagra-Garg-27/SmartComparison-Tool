import { Product, Review } from './types';

export const CURRENT_PRODUCT: Product = {
  id: 'iphone16-base',
  externalId: 'IP16-128-BLK',
  title: 'Apple iPhone 16 (128GB) - Black',
  price: 799.00,
  currency: 'USD',
  vendor: 'Apple Store',
  // Using a stable placeholder or official-style image source
  image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-black-select-202409?wid=512&hei=512&fmt=jpeg&qlt=90&.v=1725578563964',
  rating: 4.8,
  reviewCount: 850,
  condition: 'New',
  shipping: 'Free Next Day',
  sellerTrustScore: 99,
  url: 'https://www.apple.com/shop/buy-iphone/iphone-16',
  platform: 'Direct',
  priceTrend: 'stable',
  averagePrice: 799.00
};

export const COMPETITOR_PRODUCTS: Product[] = [
  {
    id: 'c1-amz',
    externalId: 'B0DGJ9XXXX', 
    title: 'Apple iPhone 16, 128GB, Black - Unlocked',
    price: 799.00,
    currency: 'USD',
    vendor: 'Amazon',
    image: 'https://m.media-amazon.com/images/I/61gC+C2fMBL._AC_SL1500_.jpg',
    rating: 4.7,
    reviewCount: 120,
    condition: 'New',
    shipping: 'Prime One-Day',
    sellerTrustScore: 96,
    url: 'https://www.amazon.com/s?k=Apple+iPhone+16+128GB+Black',
    platform: 'Amazon',
    priceTrend: 'stable',
    averagePrice: 799.00
  },
  {
    id: 'c2-bb',
    externalId: '6525421',
    title: 'Apple - iPhone 16 128GB - Black (Verizon)',
    price: 829.99, // Carrier pricing often varies
    currency: 'USD',
    vendor: 'BestBuy',
    image: 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6525/6525421_sd.jpg',
    rating: 4.9,
    reviewCount: 45,
    condition: 'New',
    shipping: 'Pickup Available',
    sellerTrustScore: 98,
    url: 'https://www.bestbuy.com/site/searchpage.jsp?st=iPhone+16+128GB',
    platform: 'BestBuy',
    priceTrend: 'up',
    averagePrice: 799.00
  },
  {
    id: 'c3-wm',
    externalId: '11223344',
    title: 'Apple iPhone 16 128GB Black',
    price: 779.00, // Slight discount example
    currency: 'USD',
    vendor: 'Walmart',
    image: 'https://i5.walmartimages.com/asr/1f1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e1e_1.1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e.jpeg',
    rating: 4.5,
    reviewCount: 300,
    condition: 'New',
    shipping: 'Free Shipping',
    sellerTrustScore: 94,
    url: 'https://www.walmart.com/search?q=iPhone+16+128GB+Black',
    platform: 'Walmart',
    priceTrend: 'down',
    averagePrice: 799.00
  }
];

export const MOCK_REVIEWS: Review[] = [
  { id: 'r1', user: 'TechFan2024', rating: 5, text: "The new Camera Control button is a game changer for photography!", date: '2024-09-22' },
  { id: 'r2', user: 'AppleUser1', rating: 4, text: "Great battery life, easily lasts all day. The A18 chip is blazing fast.", date: '2024-09-25' },
  { id: 'r3', user: 'SwitchingFromAndroid', rating: 5, text: "Smooth transition. iOS 18 feels very polished on this hardware.", date: '2024-10-01' },
  { id: 'r4', user: 'BudgetBuyer', rating: 3, text: "Screen is still 60Hz. Disappointing for the price in 2024, but the colors are nice.", date: '2024-09-21' },
  { id: 'r5', user: 'PhotoLover', rating: 5, text: "The macro mode on the base model is finally here and it's amazing.", date: '2024-09-28' }
];