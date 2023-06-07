import { type NextRequest, NextResponse as response } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET (request: NextRequest) {
  const user = request.headers.get('x-user')
  if (!user) return response.json({ error: 'Missing user' }, { status: 400 })

  const cart = await prisma.cart.findFirst({
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    where: { user }
  })
  if (cart == null) return response.json({}, { status: 404 })

  return response.json(cart)
}

export async function PATCH (request: NextRequest) {
  const body = await request.json()

  const { isValid, errors } = validate(body)
  if (!isValid) {
    return response.json(
      { error: `Invalid ${errors.join(', ')}` },
      { status: 400 }
    )
  }

  const user = request.headers.get('x-user')
  if (!user) return response.json({ error: 'Missing user' }, { status: 400 })

  const action = body.action
  const product = body.product

  const validProduct = await prisma.product.findUnique({ where: { id: product.id } })
  if (!validProduct) return response.json({ error: 'Invalid product' }, { status: 400 })

  const cart = await prisma.cart.findUnique({
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    where: { user }
  })

  // create a new cart if one does not exist
  if (!cart) {
    const cart = await prisma.cart.create({
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      data: {
        createdBy: user,
        updatedBy: user,
        user,
        items: {
          create: {
            createdBy: user,
            updatedBy: user,
            product: {
              connect: { id: product.id }
            },
            quantity: 1
          }
        },
        total: validProduct.price
      }
    })

    return response.json(cart)
  }

  // check to see if the actioned product exists in the cart
  const existingItem = cart.items.find((item) => item.product.id === product.id)

  if (action === 'add') {
    // add to the quantity if product already exists in the cart, otherwise create it
    if (existingItem) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            update: {
              where: {
                id: existingItem.id
              },
              data: {
                quantity: existingItem.quantity + 1
              }
            }
          }
        }
      })
    } else {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            create: {
              createdBy: user,
              updatedBy: user,
              product: {
                connect: { id: product.id }
              },
              quantity: 1
            }
          }
        }
      })
    }
  }

  if (action === 'remove') {
    // deduct a quantity from the item if more than one, otherwise remove it
    if (existingItem && existingItem.quantity > 1) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            update: {
              where: {
                id: existingItem.id
              },
              data: {
                quantity: existingItem.quantity - 1
              }
            }
          }
        }
      })
    } else {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            delete: {
              id: existingItem?.id
            }
          }
        }
      })
    }
  }

  if (action === 'clear') {
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: {
          deleteMany: {}
        }
      }
    })
  }

  const actionedCart = await prisma.cart.findUnique({
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    where: { id: cart.id }
  })
  return response.json(actionedCart)
}

function validate (body: any) {
  const errors: string[] = []

  if (!body.action) errors.push('action')
  if (!body.product && body.action !== 'clear') errors.push('product')

  return {
    isValid: errors.length === 0,
    errors
  }
}
