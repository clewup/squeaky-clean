'use client'

import Button from '@/components/Button/Button'
import { useCart } from '@/contexts/CartContext/CartContext'
import { type ProductType } from '@/types/productTypes'
import React, { type FC } from 'react'
import { Trash2 as RemoveIcon } from 'react-feather'

interface CartProductCardProps {
  product: ProductType
  quantity: number
}

const CartProductCard: FC<CartProductCardProps> = ({ product, quantity }) => {
  const { removeFromCart } = useCart()

  const { image, name, price } = product

  return (
    <div className="flex justify-between">
      <div className="flex gap-5">
        <span className="w-1/4 aspect-square">
          <img src={image} alt={name} className="rounded-md" />
        </span>
        <span>
            <h1 className="text-xl">{name}</h1>
            <p className="text-xl">£{Number(price).toFixed(2)}</p>
            <p className="text-xl">x{quantity}</p>
        </span>
      </div>

        <Button
            type="button"
            className="h-fit bg-transparent text-black hover:border-transparent"
            onClick={() => {
              void removeFromCart(product)
            }}
        >
            <RemoveIcon size={20} />
        </Button>
    </div>
  )
}

export default CartProductCard
