import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// چون ستون tags تو دیتابیس رشته‌ی جداشده با کاماست (نه آرایه‌ی واقعی)، هر بار قبل از
// فرستادن به فرانت به آرایه تبدیلش می‌کنیم - همون شکلی که فرانت از قبل (با mock data) انتظار داره
function sanitizeCategory(category) {
  return {
    ...category,
    tags: category.tags.split(',').filter(Boolean),
  }
}

router.get('/', async (req, res) => {
  // orderBy: id تا ترتیب همیشه ثابت و قابل پیش‌بینی باشه (همون ترتیبی که تو seed ساخته شدن)
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } })
  res.json({ categories: categories.map(sanitizeCategory) })
})

router.get('/:id', async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } })
  if (!category) {
    return res.status(404).json({ error: 'Category not found' })
  }
  res.json({ category: sanitizeCategory(category) })
})

export default router
