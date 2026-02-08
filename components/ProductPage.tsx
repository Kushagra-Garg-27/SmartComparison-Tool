import React from 'react';
import { Product } from '../types';
import { Star, ShieldCheck, Truck, ShoppingCart } from 'lucide-react';

interface ProductPageProps {
  product: Product;
}

export const ProductPage: React.FC<ProductPageProps> = ({ product }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        Electronics &gt; Mobile &gt; Smartphones &gt; <span className="text-gray-900 font-medium">iPhone</span>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
        {/* Image Gallery */}
        <div className="flex flex-col-reverse">
          <div className="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative h-24 bg-white rounded-md flex items-center justify-center border border-gray-200 cursor-pointer hover:border-blue-500">
                  <img src={product.image} alt="Thumbnail" className="h-20 w-auto object-contain opacity-75 hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-full aspect-w-1 aspect-h-1 rounded-lg bg-gray-100 overflow-hidden sm:aspect-w-2 sm:aspect-h-3 flex items-center justify-center p-8">
             <img src={product.image} alt={product.title} className="w-full h-full object-contain object-center sm:rounded-lg" />
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <div className="flex justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.title}</h1>
          </div>

          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl text-gray-900">${product.price.toFixed(2)}</p>
          </div>

          {/* Ratings */}
          <div className="mt-3">
            <div className="flex items-center">
              <div className="flex items-center">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <Star
                    key={rating}
                    className={`${
                      product.rating > rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    } h-5 w-5 flex-shrink-0`}
                  />
                ))}
              </div>
              <p className="sr-only">{product.rating} out of 5 stars</p>
              <a href="#" className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                {product.reviewCount} reviews
              </a>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="text-base text-gray-700 space-y-4">
              <p>Introducing iPhone 16. Featuring the all-new Camera Control. 48MP Fusion camera. Five vibrant colors. And the A18 chip. It's built for Apple Intelligence, the personal intelligence system that helps you write, express yourself, and get things done effortlessly.</p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center space-x-2 text-green-600 mb-4">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Sold by {product.vendor} ({product.sellerTrustScore}% Positive)</span>
            </div>
             <div className="flex items-center space-x-2 text-gray-600 mb-6">
              <Truck className="h-5 w-5" />
              <span className="text-sm">{product.shipping}</span>
            </div>

            <button
              type="button"
              className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Bag
            </button>
            <button
              type="button"
              className="mt-4 w-full bg-gray-100 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-gray-900 hover:bg-gray-200"
            >
              Buy with Apple Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};